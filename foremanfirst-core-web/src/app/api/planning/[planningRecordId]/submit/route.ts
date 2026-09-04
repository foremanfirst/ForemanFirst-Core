import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolvePlanningApprovalRouting } from "@/lib/planning/approval-routing";
import { evaluatePlanningSubmissionReadiness } from "@/lib/planning/submission-readiness";
import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type SubmittedApprovalAssignment = {
  roleCode: string;
  userId: string;
};

type ValidatedApprovalAssignment = {
  roleCode: string;

  userId: string;
  userName: string;
  userEmail: string;

  tenantMembershipId: string;
  projectMembershipId: string;
};

function toNullableString(
  value: unknown,
) {
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

function normalizeRoleCode(
  value: unknown,
) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function parseApprovalAssignments(
  value: unknown,
):
  | {
      ok: true;
      assignments: SubmittedApprovalAssignment[];
    }
  | {
      ok: false;
      message: string;
    } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      message:
        "Approval assignments are required before this planning record can be submitted for review.",
    };
  }

  const assignments:
    SubmittedApprovalAssignment[] = [];

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    const item = value[index];

    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      return {
        ok: false,
        message:
          "One or more approval assignments are invalid.",
      };
    }

    const record =
      item as Record<
        string,
        unknown
      >;

    const roleCode =
      normalizeRoleCode(
        record.roleCode,
      );

    const userId =
      toNullableString(
        record.userId,
      );

    if (
      !roleCode ||
      !userId
    ) {
      return {
        ok: false,
        message:
          "Every approval assignment must include a role and an eligible Qoreva user.",
      };
    }

    assignments.push({
      roleCode,
      userId,
    });
  }

  const duplicateRole =
    assignments.find(
      (
        assignment,
        index,
      ) =>
        assignments.findIndex(
          (candidate) =>
            candidate.roleCode ===
            assignment.roleCode,
        ) !== index,
    );

  if (duplicateRole) {
    return {
      ok: false,
      message:
        `Approval role ${duplicateRole.roleCode} was assigned more than once.`,
    };
  }

  return {
    ok: true,
    assignments,
  };
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    /*
     * Submission is an authoring/lifecycle action.
     *
     * The submitter must be an authenticated active project
     * member with either Planning creation or management
     * permission.
     *
     * Authenticate before parsing or trusting request data.
     */
    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    if (
      body.acknowledged !==
      true
    ) {
      return NextResponse.json(
        {
          message:
            "Submission acknowledgement is required before sending this planning record for review.",
        },
        {
          status: 400,
        },
      );
    }

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id:
            planningRecordId,

          tenantId:
            authorization
              .planningRecord
              .tenantId,

          projectId:
            authorization
              .planningRecord
              .projectId,

          isArchived:
            false,
        },

        select: {
          id: true,
          tenantId: true,
          projectId: true,
          status: true,
          revisionNumber: true,
          submittedAt: true,
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

    /*
     * Idempotent retry behavior.
     *
     * Once this revision is Submitted, return its persisted
     * approval workflow rather than creating another one.
     */
    if (
      existingRecord.status ===
      "Submitted"
    ) {
      const [
        record,
        approvals,
      ] = await Promise.all([
        prisma.planningRecord.findUnique({
          where: {
            id:
              planningRecordId,
          },

          select: {
            id: true,
            status: true,
            submittedAt: true,
            revisionNumber: true,
          },
        }),

        prisma.planningApproval.findMany({
          where: {
            planningRecordId,

            tenantId:
              existingRecord
                .tenantId,

            revisionNumber:
              existingRecord
                .revisionNumber,
          },

          orderBy: [
            {
              sortOrder:
                "asc",
            },
            {
              roleLabel:
                "asc",
            },
          ],

          select: {
            id: true,
            roleCode: true,
            roleLabel: true,
            isRequired: true,
            sortOrder: true,

            approverId: true,
            approverName: true,
            approverEmail: true,

            status: true,
            signatureRequired: true,
            notificationStatus: true,
          },
        }),
      ]);

      return NextResponse.json({
        record,

        workflow: {
          status:
            "SubmittedForReview",

          approvals,
        },

        saved: {
          approvals:
            approvals.length,
        },
      });
    }

    if (
      existingRecord.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft planning records can be submitted for review.",
        },
        {
          status: 409,
        },
      );
    }

    const revisionNumber =
      toPositiveInt(
        body.revisionNumber,
        existingRecord
          .revisionNumber,
      );

    if (
      revisionNumber !==
      existingRecord
        .revisionNumber
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
     * Recalculate submission readiness from persisted
     * server-side Planning data.
     */
    const submissionReadiness =
      await evaluatePlanningSubmissionReadiness(
        planningRecordId,
      );

    if (
      !submissionReadiness.ready
    ) {
      return NextResponse.json(
        {
          message:
            "Resolve all submission-blocking requirements before submitting this planning record for review.",

          code:
            "PLANNING_COMPLIANCE_BLOCKED",

          compliance: {
            summary:
              submissionReadiness
                .compliance
                .summary,

            blockers:
              submissionReadiness
                .blockers
                .map(
                  (
                    result,
                  ) => ({
                    requirementRuleCode:
                      result
                        .requirementRuleCode,

                    requirementTitle:
                      result
                        .requirementTitle,

                    requirementPackName:
                      result
                        .requirementPackName,

                    packType:
                      result
                        .packType,

                    organizationName:
                      result
                        .organizationName,

                    questionCode:
                      result
                        .questionCode,

                    questionText:
                      result
                        .questionText,

                    status:
                      result.status,

                    blockingLevel:
                      result
                        .blockingLevel,

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

    /*
     * Resolve routing immediately before submission.
     *
     * Requirement Pack routing determines WHAT approval
     * roles are required.
     *
     * User/project membership determines WHO is eligible
     * to satisfy those roles.
     */
    const approvalRouting =
      await resolvePlanningApprovalRouting(
        planningRecordId,
      );

    if (
      approvalRouting
        .revisionNumber !==
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

    if (
      approvalRouting
        .roles.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "At least one approval role must be resolved before this planning record can be submitted for review.",
        },
        {
          status: 409,
        },
      );
    }

    const [
      revision,
      completedReview,
    ] = await Promise.all([
      prisma.planningRevision.findFirst({
        where: {
          planningRecordId,

          tenantId:
            existingRecord
              .tenantId,

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
            existingRecord
              .tenantId,

          revisionNumber,

          status:
            "Completed",
        },

        orderBy: {
          completedAt:
            "desc",
        },

        select: {
          id: true,
          reviewerId: true,
          reviewerName: true,
          reviewerRole: true,
          completedAt: true,
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
            "A completed Pre-Submission Review is required before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const openCommentCount =
      await prisma
        .planningReviewComment
        .count({
          where: {
            planningRecordId,

            tenantId:
              existingRecord
                .tenantId,

            revisionNumber,

            status:
              "Open",
          },
        });

    if (
      openCommentCount > 0
    ) {
      return NextResponse.json(
        {
          message:
            "Resolve all open Pre-Submission Review comments before submission.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Every route requires a stable role code and label.
     */
    const invalidRole =
      approvalRouting.roles.find(
        (role) =>
          !toNullableString(
            role.code,
          ) ||
          !toNullableString(
            role.label,
          ),
      );

    if (invalidRole) {
      return NextResponse.json(
        {
          message:
            "One or more resolved approval roles are invalid.",
        },
        {
          status: 409,
        },
      );
    }

    const normalizedRoleCodes =
      approvalRouting.roles.map(
        (role) =>
          normalizeRoleCode(
            role.code,
          ),
      );

    const duplicateRoleCode =
      normalizedRoleCodes.find(
        (
          roleCode,
          index,
        ) =>
          normalizedRoleCodes
            .indexOf(
              roleCode,
            ) !== index,
      );

    if (duplicateRoleCode) {
      return NextResponse.json(
        {
          message:
            `Duplicate approval role ${duplicateRoleCode} was resolved for this planning record.`,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Parse creator-selected approval assignments.
     *
     * Browser selections are proposals only. They become
     * authoritative only after server-side membership and
     * role eligibility validation below.
     */
    const parsedAssignments =
      parseApprovalAssignments(
        body.approvalAssignments,
      );

    if (!parsedAssignments.ok) {
      return NextResponse.json(
        {
          message:
            parsedAssignments
              .message,

          code:
            "PLANNING_APPROVAL_ASSIGNMENT_REQUIRED",
        },
        {
          status: 409,
        },
      );
    }

    const assignments =
      parsedAssignments.assignments;

    const requiredRoles =
      approvalRouting.roles.filter(
        (role) =>
          role.required,
      );

    /*
     * Every required approval role must have exactly one
     * creator-confirmed assignment.
     */
    const missingRequiredRole =
      requiredRoles.find(
        (role) => {
          const roleCode =
            normalizeRoleCode(
              role.code,
            );

          return !assignments.some(
            (assignment) =>
              assignment.roleCode ===
              roleCode,
          );
        },
      );

    if (missingRequiredRole) {
      return NextResponse.json(
        {
          message:
            `${missingRequiredRole.label} must be assigned to an eligible Qoreva user before submission.`,

          code:
            "PLANNING_APPROVAL_ASSIGNMENT_REQUIRED",

          role: {
            roleCode:
              normalizeRoleCode(
                missingRequiredRole.code,
              ),

            roleLabel:
              missingRequiredRole.label,
          },
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Reject assignments for roles that are not part of
     * the resolved workflow.
     */
    const unknownAssignment =
      assignments.find(
        (assignment) =>
          !normalizedRoleCodes.includes(
            assignment.roleCode,
          ),
      );

    if (unknownAssignment) {
      return NextResponse.json(
        {
          message:
            `Approval role ${unknownAssignment.roleCode} is not part of the resolved workflow for this planning record.`,

          code:
            "PLANNING_APPROVAL_ASSIGNMENT_INVALID",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Validate each proposed person against authoritative
     * Qoreva identity and membership data.
     *
     * Requirements:
     *
     * - same tenant
     * - same project
     * - active User
     * - active TenantMembership
     * - active ProjectMembership
     * - canApprovePlanning
     * - matching approvalRoleCode
     */
    const validatedAssignments:
      ValidatedApprovalAssignment[] =
      [];

    for (
      const assignment
      of assignments
    ) {
      const membership =
        await prisma
          .projectMembership
          .findFirst({
            where: {
              tenantId:
                existingRecord
                  .tenantId,

              projectId:
                existingRecord
                  .projectId,

              isActive:
                true,

              canApprovePlanning:
                true,

              tenantMembership: {
                tenantId:
                  existingRecord
                    .tenantId,

                isActive:
                  true,

                userId:
                  assignment
                    .userId,

                user: {
                  isActive:
                    true,

                  status:
                    "Active",
                },
              },
            },

            select: {
              id: true,
              approvalRoleCodes:
                true,

              tenantMembership: {
                select: {
                  id: true,

                  user: {
                    select: {
                      id: true,
                      displayName:
                        true,
                      email: true,
                    },
                  },
                },
              },
            },
          });

      if (!membership) {
        return NextResponse.json(
          {
            message:
              "One or more selected approvers are not active members of this project with Planning approval permission.",

            code:
              "PLANNING_APPROVAL_ASSIGNMENT_INVALID",

            role: {
              roleCode:
                assignment
                  .roleCode,
            },
          },
          {
            status: 409,
          },
        );
      }

      const eligibleRoleCodes =
        membership
          .approvalRoleCodes
          .map(
            normalizeRoleCode,
          );

      if (
        !eligibleRoleCodes.includes(
          assignment.roleCode,
        )
      ) {
        return NextResponse.json(
          {
            message:
              `${membership.tenantMembership.user.displayName} is not eligible to serve as ${assignment.roleCode} for this project.`,

            code:
              "PLANNING_APPROVAL_ASSIGNMENT_INVALID",

            role: {
              roleCode:
                assignment
                  .roleCode,
            },

            user: {
              id:
                membership
                  .tenantMembership
                  .user.id,

              name:
                membership
                  .tenantMembership
                  .user
                  .displayName,
            },
          },
          {
            status: 409,
          },
        );
      }

      validatedAssignments.push({
        roleCode:
          assignment.roleCode,

        userId:
          membership
            .tenantMembership
            .user.id,

        userName:
          membership
            .tenantMembership
            .user
            .displayName,

        userEmail:
          membership
            .tenantMembership
            .user.email,

        tenantMembershipId:
          membership
            .tenantMembership
            .id,

        projectMembershipId:
          membership.id,
      });
    }

    const submittedAt =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Never delete decided approval history.
           */
          const decidedApprovalCount =
            await tx
              .planningApproval
              .count({
                where: {
                  planningRecordId,

                  tenantId:
                    existingRecord
                      .tenantId,

                  revisionNumber,

                  status: {
                    not:
                      "Pending",
                  },
                },
              });

          if (
            decidedApprovalCount >
            0
          ) {
            throw new Error(
              "SUBMISSION_APPROVAL_HISTORY_CONFLICT",
            );
          }

          /*
           * Pending remnants from an interrupted Draft
           * submission may be safely reconstructed because
           * no formal decision has occurred yet.
           */
          await tx
            .planningApproval
            .deleteMany({
              where: {
                planningRecordId,

                tenantId:
                  existingRecord
                    .tenantId,

                revisionNumber,

                status:
                  "Pending",
              },
            });

          await tx
            .planningApproval
            .createMany({
              data:
                approvalRouting
                  .roles
                  .map(
                    (
                      role,
                      index,
                    ) => {
                      const roleCode =
                        normalizeRoleCode(
                          role.code,
                        );

                      const assignment =
                        validatedAssignments
                          .find(
                            (
                              candidate,
                            ) =>
                              candidate
                                .roleCode ===
                              roleCode,
                          );

                      /*
                       * Required roles were already checked
                       * above. Optional roles may remain
                       * unassigned.
                       */
                      return {
                        tenantId:
                          existingRecord
                            .tenantId,

                        planningRecordId,
                        revisionNumber,

                        roleCode,

                        roleLabel:
                          role.label
                            .trim(),

                        isRequired:
                          role.required,

                        sortOrder:
                          toNonNegativeInt(
                            role.order,
                            index,
                          ),

                        approverId:
                          assignment
                            ?.userId ??
                          null,

                        approverName:
                          assignment
                            ?.userName ??
                          null,

                        approverEmail:
                          assignment
                            ?.userEmail ??
                          null,

                        status:
                          "Pending",

                        signatureRequired:
                          true,

                        planningSignatureId:
                          null,

                        notificationStatus:
                          assignment
                            ? "Pending"
                            : null,

                        notifiedAt:
                          null,

                        reminderSentAt:
                          null,
                      };
                    },
                  ),
            });

          /*
           * Signatures are downstream approval evidence.
           */
          const signedSignatureCount =
            await tx
              .planningSignature
              .count({
                where: {
                  planningRecordId,

                  tenantId:
                    existingRecord
                      .tenantId,

                  revisionNumber,

                  status:
                    "Signed",
                },
              });

          if (
            signedSignatureCount >
            0
          ) {
            throw new Error(
              "SUBMISSION_SIGNATURE_HISTORY_CONFLICT",
            );
          }

          await tx
            .planningSignature
            .deleteMany({
              where: {
                planningRecordId,

                tenantId:
                  existingRecord
                    .tenantId,

                revisionNumber,

                status: {
                  not:
                    "Signed",
                },
              },
            });

          const transition =
            await tx
              .planningRecord
              .updateMany({
                where: {
                  id:
                    planningRecordId,

                  tenantId:
                    existingRecord
                      .tenantId,

                  revisionNumber,

                  status:
                    "Draft",

                  isArchived:
                    false,
                },

                data: {
                  status:
                    "Submitted",

                  submittedAt,
                },
              });

          if (
            transition.count !==
            1
          ) {
            throw new Error(
              "SUBMISSION_STATE_CONFLICT",
            );
          }

          /*
           * Step 8B.8D — Revision & Audit Protection
           *
           * The PlanningRecord has now crossed the controlled
           * Draft -> Submitted boundary inside this transaction.
           *
           * Keep the corresponding PlanningRevision lifecycle
           * aligned with that same boundary.
           */
          const revisionTransition =
            await tx
              .planningRevision
              .updateMany({
                where: {
                  id:
                    revision.id,

                  planningRecordId,

                  tenantId:
                    existingRecord
                      .tenantId,

                  revisionNumber,

                  status:
                    "Draft",
                },

                data: {
                  status:
                    "Submitted",
                },
              });

          if (
            revisionTransition.count !==
            1
          ) {
            throw new Error(
              "SUBMISSION_REVISION_STATE_CONFLICT",
            );
          }

          /*
           * Submitted revision evidence is immutable.
           *
           * A snapshot must never silently be replaced once
           * captured for this controlled revision.
           */
          const existingRevisionEvidenceCount =
            await tx
              .planningRevisionSourceDocument
              .count({
                where: {
                  tenantId:
                    existingRecord
                      .tenantId,

                  planningRecordId,

                  planningRevisionId:
                    revision.id,

                  revisionNumber,
                },
              });

          if (
            existingRevisionEvidenceCount >
            0
          ) {
            throw new Error(
              "SUBMISSION_REVISION_EVIDENCE_CONFLICT",
            );
          }

          /*
           * Read the authoritative selected-source records from
           * the database rather than trusting source metadata
           * supplied by the browser revision snapshot.
           */
          const selectedSourceDocuments =
            await tx
              .planningSourceDocument
              .findMany({
                where: {
                  tenantId:
                    existingRecord
                      .tenantId,

                  planningRecordId,

                  isSelected:
                    true,
                },

                orderBy: {
                  createdAt:
                    "asc",
                },

                select: {
                  id: true,
                  contractorDocumentId:
                    true,

                  sourceType:
                    true,
                  label:
                    true,

                  fileName:
                    true,
                  mimeType:
                    true,
                  fileSize:
                    true,

                  storageProvider:
                    true,
                  storageKey:
                    true,
                  storageUrl:
                    true,

                  isAiReady:
                    true,

                  approvalStatusAtSelection:
                    true,
                  reviewStatusAtSelection:
                    true,
                },
              });

          const storageRoot =
            path.resolve(
              process.cwd(),
              "storage",
            );

          const revisionEvidence =
            await Promise.all(
              selectedSourceDocuments.map(
                async (
                  sourceDocument,
                ) => {
                  let contentSha256:
                    | string
                    | null =
                    null;

                  /*
                   * Local evidence can be cryptographically
                   * verified at submission.
                   *
                   * If a local source claims to have a stored
                   * file, that file must exist and remain inside
                   * the configured storage root. Otherwise the
                   * PTP must not become an official submitted
                   * revision with unverifiable evidence.
                   */
                  if (
                    sourceDocument
                      .storageProvider ===
                    "local"
                  ) {
                    if (
                      !sourceDocument
                        .storageKey
                    ) {
                      throw new Error(
                        "SUBMISSION_SOURCE_DOCUMENT_STORAGE_KEY_MISSING",
                      );
                    }

                    const absoluteFilePath =
                      path.resolve(
                        storageRoot,
                        sourceDocument
                          .storageKey,
                      );

                    const relativePath =
                      path.relative(
                        storageRoot,
                        absoluteFilePath,
                      );

                    const pointsOutsideStorage =
                      relativePath
                        .startsWith(
                          "..",
                        ) ||
                      path.isAbsolute(
                        relativePath,
                      );

                    if (
                      pointsOutsideStorage
                    ) {
                      throw new Error(
                        "SUBMISSION_SOURCE_DOCUMENT_STORAGE_PATH_INVALID",
                      );
                    }

                    let fileBuffer:
                      Buffer;

                    try {
                      fileBuffer =
                        await readFile(
                          absoluteFilePath,
                        );
                    } catch {
                      throw new Error(
                        "SUBMISSION_SOURCE_DOCUMENT_FILE_MISSING",
                      );
                    }

                    contentSha256 =
                      createHash(
                        "sha256",
                      )
                        .update(
                          fileBuffer,
                        )
                        .digest(
                          "hex",
                        );
                  }

                  return {
                    tenantId:
                      existingRecord
                        .tenantId,

                    planningRecordId,

                    planningRevisionId:
                      revision.id,

                    revisionNumber,

                    sourceDocumentId:
                      sourceDocument.id,

                    contractorDocumentId:
                      sourceDocument
                        .contractorDocumentId,

                    sourceType:
                      sourceDocument
                        .sourceType,

                    label:
                      sourceDocument
                        .label,

                    fileName:
                      sourceDocument
                        .fileName,

                    mimeType:
                      sourceDocument
                        .mimeType,

                    fileSize:
                      sourceDocument
                        .fileSize,

                    storageProvider:
                      sourceDocument
                        .storageProvider,

                    storageKey:
                      sourceDocument
                        .storageKey,

                    storageUrl:
                      sourceDocument
                        .storageUrl,

                    contentSha256,

                    isAiReady:
                      sourceDocument
                        .isAiReady,

                    approvalStatusAtSelection:
                      sourceDocument
                        .approvalStatusAtSelection,

                    reviewStatusAtSelection:
                      sourceDocument
                        .reviewStatusAtSelection,

                    capturedAt:
                      submittedAt,
                  };
                },
              ),
            );

          if (
            revisionEvidence.length >
            0
          ) {
            await tx
              .planningRevisionSourceDocument
              .createMany({
                data:
                  revisionEvidence,
              });
          }

          const record =
            await tx
              .planningRecord
              .findUnique({
                where: {
                  id:
                    planningRecordId,
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

          const approvals =
            await tx
              .planningApproval
              .findMany({
                where: {
                  planningRecordId,

                  tenantId:
                    existingRecord
                      .tenantId,

                  revisionNumber,
                },

                orderBy: [
                  {
                    sortOrder:
                      "asc",
                  },
                  {
                    roleLabel:
                      "asc",
                  },
                ],

                select: {
                  id: true,
                  roleCode: true,
                  roleLabel: true,
                  isRequired: true,
                  sortOrder: true,

                  approverId: true,
                  approverName: true,
                  approverEmail: true,

                  status: true,
                  signatureRequired:
                    true,
                  notificationStatus:
                    true,
                },
              });

          await tx
            .planningEvent
            .create({
              data: {
                tenantId:
                  existingRecord
                    .tenantId,

                planningRecordId,

                eventType:
                  "Planning Record Submitted for Review",

                previousStatus:
                  existingRecord
                    .status,

                newStatus:
                  "Submitted",

                revisionNumber,

                actorId:
                  authorization
                    .user.id,

                actorName:
                  authorization
                    .user
                    .displayName,

                actorRole:
                  authorization
                    .membership
                    .roleCodes
                    .length > 0
                    ? authorization
                        .membership
                        .roleCodes
                        .join(", ")
                    : "Planning Editor",

                comment:
                  "Planning record submitted for downstream review and required approval signatures.",

                metadata: {
                  planningRevisionId:
                    revision.id,

                  preSubmissionReviewId:
                    completedReview
                      .id,

                  preSubmissionReviewedBy: {
                    id:
                      completedReview
                        .reviewerId,

                    name:
                      completedReview
                        .reviewerName,

                    role:
                      completedReview
                        .reviewerRole,

                    completedAt:
                      completedReview
                        .completedAt,
                  },

                  approvalCount:
                    approvals.length,

                  requiredApprovalCount:
                    approvals.filter(
                      (
                        approval,
                      ) =>
                        approval
                          .isRequired,
                    ).length,

                  assignedApprovalCount:
                    approvals.filter(
                      (
                        approval,
                      ) =>
                        Boolean(
                          approval
                            .approverId,
                        ),
                    ).length,

                  approvalAssignments:
                    validatedAssignments
                      .map(
                        (
                          assignment,
                        ) => ({
                          roleCode:
                            assignment
                              .roleCode,

                          userId:
                            assignment
                              .userId,

                          userName:
                            assignment
                              .userName,

                          userEmail:
                            assignment
                              .userEmail,

                          tenantMembershipId:
                            assignment
                              .tenantMembershipId,

                          projectMembershipId:
                            assignment
                              .projectMembershipId,
                        }),
                      ),

                  revisionEvidenceCount:
                    revisionEvidence
                      .length,

                  revisionEvidenceCapturedAt:
                    submittedAt,

                  revisionEvidence:
                    revisionEvidence
                      .map(
                        (
                          evidence,
                        ) => ({
                          sourceDocumentId:
                            evidence
                              .sourceDocumentId,

                          contractorDocumentId:
                            evidence
                              .contractorDocumentId,

                          sourceType:
                            evidence
                              .sourceType,

                          label:
                            evidence
                              .label,

                          fileName:
                            evidence
                              .fileName,

                          mimeType:
                            evidence
                              .mimeType,

                          fileSize:
                            evidence
                              .fileSize,

                          storageProvider:
                            evidence
                              .storageProvider,

                          contentSha256:
                            evidence
                              .contentSha256,

                          hasContentHash:
                            Boolean(
                              evidence
                                .contentSha256,
                            ),

                          isAiReady:
                            evidence
                              .isAiReady,

                          approvalStatusAtSelection:
                            evidence
                              .approvalStatusAtSelection,

                          reviewStatusAtSelection:
                            evidence
                              .reviewStatusAtSelection,

                          capturedAt:
                            evidence
                              .capturedAt,
                        }),
                      ),

                  applicableRequirementPackCount:
                    approvalRouting
                      .applicablePacks
                      .length,

                  approvalRoutingResolverVersion:
                    approvalRouting
                      .metadata
                      .resolverVersion,

                  resolvedApprovalRoles:
                    approvalRouting
                      .roles
                      .map(
                        (
                          role,
                        ) => ({
                          code:
                            role.code,

                          label:
                            role.label,

                          required:
                            role.required,

                          order:
                            role.order,

                          sourceType:
                            role.sourceType,

                          sources:
                            role.sources
                              .map(
                                (
                                  source,
                                ) => ({
                                  requirementPackId:
                                    source
                                      .requirementPackId,

                                  requirementPackName:
                                    source
                                      .requirementPackName,

                                  packType:
                                    source
                                      .packType,

                                  organizationName:
                                    source
                                      .organizationName,
                                }),
                              ),
                        }),
                      ),

                  applicableRequirementPacks:
                    approvalRouting
                      .applicablePacks,

                  acknowledgement:
                    true,

                  workflowVersion:
                    "qoreva-planning-submit-for-review-v2-validated-assignments",
                },
              },
            });

          return {
            record,
            approvals,
          };
        },
        {
          maxWait: 5_000,
          timeout: 15_000,
        },
      );

    return NextResponse.json({
      record:
        result.record,

      workflow: {
        status:
          "SubmittedForReview",

        approvals:
          result.approvals,
      },

      saved: {
        approvals:
          result.approvals
            .length,
      },
    });
  } catch (error) {
    console.error(
      "Unable to submit planning record for review:",
      error,
    );

    if (
      error instanceof
        PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SUBMISSION_STATE_CONFLICT"
    ) {
      return NextResponse.json(
        {
          message:
            "The planning record changed while it was being submitted. Refresh and try again.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SUBMISSION_REVISION_STATE_CONFLICT"
    ) {
      return NextResponse.json(
        {
          message:
            "The active planning revision changed while the record was being submitted. Refresh and try again.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SUBMISSION_REVISION_EVIDENCE_CONFLICT"
    ) {
      return NextResponse.json(
        {
          message:
            "Immutable evidence has already been captured for this planning revision.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      [
        "SUBMISSION_SOURCE_DOCUMENT_STORAGE_KEY_MISSING",
        "SUBMISSION_SOURCE_DOCUMENT_STORAGE_PATH_INVALID",
        "SUBMISSION_SOURCE_DOCUMENT_FILE_MISSING",
      ].includes(
        error.message,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "One or more selected planning source documents could not be verified. Confirm the supporting documents are available before submitting.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SUBMISSION_APPROVAL_HISTORY_CONFLICT"
    ) {
      return NextResponse.json(
        {
          message:
            "This revision already contains downstream approval history and cannot be resubmitted as a new Draft workflow.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "SUBMISSION_SIGNATURE_HISTORY_CONFLICT"
    ) {
      return NextResponse.json(
        {
          message:
            "This revision already contains signed approval evidence and cannot be reset during submission.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unable to submit planning record for review.",
      },
      {
        status: 500,
      },
    );
  }
}
