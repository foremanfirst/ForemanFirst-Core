import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolvePlanningApprovalRouting,
} from "@/lib/planning/approval-routing";
import {
  resolveApplicablePlanningRequirements,
} from "@/lib/planning/requirement-resolver";
import {
  evaluatePlanningCompliance,
} from "@/lib/planning/compliance-evaluator";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type SignatureInput = {
  role?: string;
  signerId?: string | null;
  signerName?: string;
  signerEmail?: string | null;
  isRequired?: boolean;
  sortOrder?: number;
  status?: string;
  signatureType?: string;
  signatureDataUrl?: string | null;
  signedAt?: string | null;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function toPositiveInt(
  value: unknown,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function toNonNegativeInt(
  value: unknown,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return parsed;
}

function toNullableDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
}

function isPngDataUrl(
  value: string,
) {
  return value.startsWith(
    "data:image/png;base64,",
  );
}


function normalizeRoleLabel(
  value: unknown,
) {
  const normalized =
    toNullableString(value);

  return normalized
    ? normalized
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
    : null;
}


function isRequiredSignature(
  signature: SignatureInput,
  requiredRoleLabels?: Set<string>,
) {
  const normalizedRole =
    normalizeRoleLabel(
      signature.role,
    );

  if (
    normalizedRole &&
    requiredRoleLabels?.has(
      normalizedRole,
    )
  ) {
    return true;
  }

  return signature.isRequired !== false;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const body =
      await request.json();

    if (body.acknowledged !== true) {
      return NextResponse.json(
        {
          message:
            "Final submission acknowledgement is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },
        select: {
          id: true,
          tenantId: true,
          status: true,
          revisionNumber: true,
          submittedAt: true,

          questionResponses: {
            select: {
              questionId: true,
              responseValue: true,
            },
          },
        },
      });

    if (!existingRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingRecord.status ===
      "Submitted"
    ) {
      const record =
        await prisma.planningRecord.findUnique({
          where: {
            id: planningRecordId,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        });

      return NextResponse.json({
        record,
        saved: {
          signatures:
            await prisma.planningSignature.count({
              where: {
                planningRecordId,
                revisionNumber:
                  existingRecord.revisionNumber,
              },
            }),
        },
      });
    }

    if (
      existingRecord.status !== "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft planning records can be submitted.",
        },
        {
          status: 409,
        },
      );
    }

    const revisionNumber =
      toPositiveInt(
        body.revisionNumber,
        existingRecord.revisionNumber,
      );

    if (
      revisionNumber !==
      existingRecord.revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "Submission revision does not match the planning record's active revision.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Submission compliance is recalculated from
     * persisted server-side Planning data.
     *
     * The browser may display live compliance
     * feedback while the user edits a Draft, but
     * client-provided compliance state is never
     * trusted for the official submission gate.
     */
    const requirementResolution =
      await resolveApplicablePlanningRequirements(
        planningRecordId,
      );

    /*
     * PlanningQuestionResponse.questionId may
     * contain either the stable questionCode or
     * the PlanningQuestionDefinition database ID.
     *
     * Normalize persisted responses to
     * questionCode before deterministic
     * compliance evaluation.
     */
    const responseIdentifiers =
      Array.from(
        new Set(
          existingRecord
            .questionResponses
            .map(
              (response) =>
                response.questionId
                  .trim(),
            )
            .filter(Boolean),
        ),
      );

    const questionDefinitions =
      responseIdentifiers.length > 0
        ? await prisma
            .planningQuestionDefinition
            .findMany({
              where: {
                tenantId: {
                  in: [
                    "QOREVA",
                    existingRecord
                      .tenantId,
                  ],
                },

                isActive:
                  true,

                isArchived:
                  false,

                OR: [
                  {
                    id: {
                      in:
                        responseIdentifiers,
                    },
                  },

                  {
                    questionCode: {
                      in:
                        responseIdentifiers,
                    },
                  },
                ],
              },

              select: {
                id: true,
                questionCode: true,
                version: true,
              },

              orderBy: {
                version:
                  "desc",
              },
            })
        : [];

    const definitionById =
      new Map(
        questionDefinitions.map(
          (definition) => [
            definition.id,
            definition,
          ],
        ),
      );

    const definitionByCode =
      new Map<
        string,
        (typeof questionDefinitions)[number]
      >();

    for (
      const definition of
      questionDefinitions
    ) {
      if (
        !definitionByCode.has(
          definition.questionCode,
        )
      ) {
        definitionByCode.set(
          definition.questionCode,
          definition,
        );
      }
    }

    const persistedAnswers:
      Record<
        string,
        string | null
      > = {};

    for (
      const response of
      existingRecord.questionResponses
    ) {
      const definition =
        definitionById.get(
          response.questionId,
        ) ??
        definitionByCode.get(
          response.questionId,
        );

      const questionCode =
        definition?.questionCode ??
        response.questionId;

      persistedAnswers[
        questionCode
      ] =
        response.responseValue;
    }

    const compliance =
      await evaluatePlanningCompliance({
        tenantId:
          existingRecord.tenantId,

        requirementRuleCodes:
          requirementResolution.rules.map(
            (rule) =>
              rule.ruleCode,
          ),

        answers:
          persistedAnswers,
      });

    /*
     * Submission validations fail closed.
     *
     * The server must be able to prove that every
     * explicit Submission-level requirement is
     * Satisfied. Both Unresolved and NotEvaluated
     * therefore remain blocking conditions.
     */
    const submissionBlockers =
      compliance.results.filter(
        (result) =>
          result.status !==
            "Satisfied" &&
          result.blockingLevel
            ?.trim()
            .toLowerCase() ===
            "submission",
      );

    if (
      submissionBlockers.length >
      0
    ) {
      return NextResponse.json(
        {
          message:
            "Resolve all submission-blocking requirements before submitting this planning record.",

          code:
            "PLANNING_COMPLIANCE_BLOCKED",

          compliance: {
            summary:
              compliance.summary,

            blockers:
              submissionBlockers.map(
                (result) => ({
                  requirementRuleCode:
                    result.requirementRuleCode,

                  requirementTitle:
                    result.requirementTitle,

                  requirementPackName:
                    result.requirementPackName,

                  packType:
                    result.packType,

                  organizationName:
                    result.organizationName,

                  questionCode:
                    result.questionCode,

                  questionText:
                    result.questionText,

                  status:
                    result.status,

                  blockingLevel:
                    result.blockingLevel,

                  message:
                    result.message,
                }),
              ),
          },
        },
        {
          status: 409,
        },
      );
    }

    const approvalRouting =
      await resolvePlanningApprovalRouting(
        planningRecordId,
      );

    if (
      approvalRouting.revisionNumber !==
      revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "Resolved approval routing does not match the active planning revision.",
        },
        {
          status: 409,
        },
      );
    }

    const requiredApprovalRoles =
      approvalRouting.roles.filter(
        (role) =>
          role.required,
      );

    const requiredRoleLabels =
      new Set(
        requiredApprovalRoles.map(
          (role) =>
            normalizeRoleLabel(
              role.label,
            )!,
        ),
      );

    const [
      revision,
      completedReview,
    ] = await Promise.all([
      prisma.planningRevision.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
        },
        select: {
          id: true,
        },
      }),

      prisma.planningReview.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
          status: "Completed",
        },
        orderBy: {
          completedAt: "desc",
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!revision) {
      return NextResponse.json(
        {
          message:
            "A saved draft revision is required before submission.",
        },
        {
          status: 409,
        },
      );
    }

    if (!completedReview) {
      return NextResponse.json(
        {
          message:
            "A completed qualified review is required before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const openCommentCount =
      await prisma.planningReviewComment.count({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
          status: "Open",
        },
      });

    if (openCommentCount > 0) {
      return NextResponse.json(
        {
          message:
            "Resolve all open review comments before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const signatures =
      Array.isArray(body.signatures)
        ? (body.signatures as SignatureInput[])
        : [];

    if (signatures.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one signature is required.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedSignatureRoles =
      signatures.map(
        (signature) =>
          normalizeRoleLabel(
            signature.role,
          ),
      );

    const duplicateRole =
      normalizedSignatureRoles.find(
        (role, index) =>
          Boolean(role) &&
          normalizedSignatureRoles.indexOf(
            role,
          ) !== index,
      );

    if (duplicateRole) {
      return NextResponse.json(
        {
          message:
            "Duplicate signature roles are not allowed in the submission package.",
        },
        {
          status: 400,
        },
      );
    }

    const missingRequiredApprovalRole =
      requiredApprovalRoles.find(
        (requiredRole) => {
          const requiredLabel =
            normalizeRoleLabel(
              requiredRole.label,
            );

          return !signatures.some(
            (signature) =>
              normalizeRoleLabel(
                signature.role,
              ) === requiredLabel,
          );
        },
      );

    if (missingRequiredApprovalRole) {
      return NextResponse.json(
        {
          message:
            `${missingRequiredApprovalRole.label} is required by the resolved approval routing and cannot be omitted from submission.`,
        },
        {
          status: 409,
        },
      );
    }

    const unsignedRequiredApprovalRole =
      requiredApprovalRoles.find(
        (requiredRole) => {
          const requiredLabel =
            normalizeRoleLabel(
              requiredRole.label,
            );

          const signature =
            signatures.find(
              (candidate) =>
                normalizeRoleLabel(
                  candidate.role,
                ) ===
                requiredLabel,
            );

          return (
            !signature ||
            (
              toNullableString(
                signature.status,
              ) ?? "Pending"
            ) !== "Signed"
          );
        },
      );

    if (unsignedRequiredApprovalRole) {
      return NextResponse.json(
        {
          message:
            `${unsignedRequiredApprovalRole.label} must be signed before submission.`,
        },
        {
          status: 409,
        },
      );
    }

    const invalidSignature =
      signatures.find(
        (signature) => {
          const role =
            toNullableString(
              signature.role,
            );
          const signerName =
            toNullableString(
              signature.signerName,
            );
          const status =
            toNullableString(
              signature.status,
            ) ?? "Pending";

          if (
            !role ||
            !signerName
          ) {
            return true;
          }

          if (
            ![
              "Pending",
              "Signed",
            ].includes(status)
          ) {
            return true;
          }

          if (
            status === "Signed"
          ) {
            const image =
              toNullableString(
                signature.signatureDataUrl,
              );

            if (
              !image ||
              !isPngDataUrl(image)
            ) {
              return true;
            }

            // Keep inline signature payloads bounded for MVP.
            if (
              image.length >
              1_500_000
            ) {
              return true;
            }
          }

          return false;
        },
      );

    if (invalidSignature) {
      return NextResponse.json(
        {
          message:
            "One or more signature records are incomplete or invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const pendingRequired =
      signatures.filter(
        (signature) =>
          isRequiredSignature(
            signature,
            requiredRoleLabels,
          ) &&
          (
            toNullableString(
              signature.status,
            ) ?? "Pending"
          ) !== "Signed",
      );

    if (
      pendingRequired.length > 0
    ) {
      return NextResponse.json(
        {
          message:
            "All required signatures must be completed before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const submittedAt =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          await tx.planningSignature.deleteMany({
            where: {
              planningRecordId,
              tenantId:
                existingRecord.tenantId,
              revisionNumber,
            },
          });

          await tx.planningSignature.createMany({
            data:
              signatures.map(
                (
                  signature,
                  index,
                ) => {
                  const status =
                    toNullableString(
                      signature.status,
                    ) ?? "Pending";

                  return {
                    tenantId:
                      existingRecord.tenantId,
                    planningRecordId,
                    revisionNumber,

                    role:
                      toNullableString(
                        signature.role,
                      )!,
                    signerId:
                      toNullableString(
                        signature.signerId,
                      ),
                    signerName:
                      toNullableString(
                        signature.signerName,
                      )!,
                    signerEmail:
                      toNullableString(
                        signature.signerEmail,
                      ),

                    isRequired:
                      isRequiredSignature(
                        signature,
                        requiredRoleLabels,
                      ),
                    sortOrder:
                      toNonNegativeInt(
                        signature.sortOrder,
                        index,
                      ),

                    status,
                    signatureType:
                      toNullableString(
                        signature.signatureType,
                      ) ??
                      "Drawn",

                    // MVP persistence: store the PNG data URL directly in the
                    // URL field. Move this to S3/Azure Blob before broad rollout.
                    signatureStorageProvider:
                      status === "Signed"
                        ? "inline-data-url"
                        : null,
                    signatureStorageKey:
                      null,
                    signatureStorageUrl:
                      status === "Signed"
                        ? toNullableString(
                            signature.signatureDataUrl,
                          )
                        : null,

                    signedAt:
                      status === "Signed"
                        ? toNullableDate(
                            signature.signedAt,
                          ) ??
                          submittedAt
                        : null,

                    userAgent:
                      request.headers.get(
                        "user-agent",
                      ),
                  };
                },
              ),
          });

          const transition =
            await tx.planningRecord.updateMany({
              where: {
                id: planningRecordId,
                tenantId:
                  existingRecord.tenantId,
                revisionNumber,
                status: "Draft",
                isArchived: false,
              },
              data: {
                status:
                  "Submitted",
                submittedAt,
              },
            });

          if (transition.count !== 1) {
            throw new Error(
              "SUBMISSION_STATE_CONFLICT",
            );
          }

          const record =
            await tx.planningRecord.findUnique({
              where: {
                id: planningRecordId,
              },
              select: {
                id: true,
                status: true,
                submittedAt: true,
                revisionNumber: true,
              },
            });

          if (!record) {
            throw new Error(
              "SUBMISSION_RECORD_NOT_FOUND",
            );
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,
              planningRecordId,
              eventType:
                "Planning Record Submitted",
              previousStatus:
                existingRecord.status,
              newStatus:
                "Submitted",
              revisionNumber,
              actorName:
                toNullableString(
                  body.submittedByName,
                ),
              actorRole:
                toNullableString(
                  body.submittedByRole,
                ),
              comment:
                "Planning record submitted after completed qualified review and required signatures.",
              metadata: {
                planningRevisionId:
                  revision.id,
                planningReviewId:
                  completedReview.id,
                signatureCount:
                  signatures.length,
                requiredSignatureCount:
                  signatures.filter(
                    (signature) =>
                      isRequiredSignature(
                        signature,
                        requiredRoleLabels,
                      ),
                  ).length,
                signedSignatureCount:
                  signatures.filter(
                    (signature) =>
                      (
                        toNullableString(
                          signature.status,
                        ) ?? "Pending"
                      ) === "Signed",
                  ).length,
                optionalSignatureCount:
                  signatures.filter(
                    (signature) =>
                      !isRequiredSignature(
                        signature,
                        requiredRoleLabels,
                      ),
                  ).length,
                resolvedApprovalRoleCount:
                  approvalRouting.roles.length,
                resolvedRequiredRoleCount:
                  requiredApprovalRoles.length,
                applicableRequirementPackCount:
                  approvalRouting.applicablePacks.length,
                approvalRoutingResolverVersion:
                  approvalRouting.metadata.resolverVersion,
                resolvedApprovalRoles:
                  approvalRouting.roles.map(
                    (role) => ({
                      code:
                        role.code,
                      label:
                        role.label,
                      required:
                        role.required,
                      sourceType:
                        role.sourceType,
                      sourcePackIds:
                        role.sources
                          .map(
                            (source) =>
                              source.requirementPackId,
                          )
                          .filter(Boolean),
                    }),
                  ),
                acknowledgement:
                  true,
                signatureStorageMode:
                  "inline-data-url",
              },
            },
          });

          return record;
        },
      );

    return NextResponse.json({
      record: result,
      saved: {
        signatures:
          signatures.length,
      },
    });
  } catch (error) {
    console.error(
      "Unable to submit planning record:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to submit planning record.",
      },
      {
        status: 500,
      },
    );
  }
}