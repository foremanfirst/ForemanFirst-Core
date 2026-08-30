import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  PlanningFinalizerAuthorizationError,
  requireAuthorizedPlanningFinalizer,
} from "@/lib/planning/planning-finalizer-authorization";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type FinalizePlanningBody = {
  finalizationComment?:
    | string
    | null;
};

type FinalizationError = {
  error: {
    status: number;
    message: string;
  };
};

function finalizationError(
  status: number,
  message: string,
): FinalizationError {
  return {
    error: {
      status,
      message,
    },
  };
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    let body: FinalizePlanningBody =
      {};

    try {
      body =
        (await request.json()) as FinalizePlanningBody;
    } catch {
      // The finalization comment is optional,
      // so an empty request body is valid.
    }

    const authorization =
      await requireAuthorizedPlanningFinalizer(
        planningRecordId,
      );

    const finalizationComment =
      body.finalizationComment?.trim() ||
      null;

    const finalizedAt =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-read the planning record inside
           * the transaction.
           *
           * Authorization happened before the
           * transaction, but lifecycle state
           * must be validated again immediately
           * before finalization.
           */
          const currentRecord =
            await tx.planningRecord.findFirst(
              {
                where: {
                  id:
                    authorization
                      .planningRecord.id,

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

                  title: true,
                  planType: true,

                  status: true,
                  revisionNumber:
                    true,

                  submittedAt: true,
                  approvedAt: true,
                  activeAt: true,

                  effectiveStartDate:
                    true,

                  effectiveEndDate:
                    true,
                },
              },
            );

          if (!currentRecord) {
            return finalizationError(
              404,
              "Planning record was not found.",
            );
          }

          if (
            currentRecord.status !==
            "Submitted"
          ) {
            return finalizationError(
              409,
              "Only a submitted planning revision can be finalized.",
            );
          }

          if (
            currentRecord
              .revisionNumber !==
            authorization
              .planningRecord
              .revisionNumber
          ) {
            return finalizationError(
              409,
              "The planning revision changed before finalization could be completed.",
            );
          }

          /*
           * Confirm the formal revision record
           * exists for the exact revision being
           * finalized.
           */
          const revision =
            await tx.planningRevision.findUnique(
              {
                where: {
                  planningRecordId_revisionNumber:
                    {
                      planningRecordId:
                        currentRecord.id,

                      revisionNumber:
                        currentRecord
                          .revisionNumber,
                    },
                },

                select: {
                  id: true,
                  tenantId: true,
                  planningRecordId:
                    true,
                  revisionNumber:
                    true,
                  status: true,
                },
              },
            );

          if (!revision) {
            return finalizationError(
              409,
              "The current planning revision snapshot could not be found.",
            );
          }

          if (
            revision.tenantId !==
            currentRecord.tenantId
          ) {
            return finalizationError(
              409,
              "The planning revision does not belong to the current tenant.",
            );
          }

          /*
           * Effective dates are part of the
           * controlled planning record.
           *
           * A finalized PTP must have both
           * boundaries defined.
           */
          if (
            !currentRecord
              .effectiveStartDate ||
            !currentRecord
              .effectiveEndDate
          ) {
            return finalizationError(
              409,
              "Effective start and end dates are required before this PTP can be finalized.",
            );
          }

          if (
            currentRecord
              .effectiveEndDate <
            currentRecord
              .effectiveStartDate
          ) {
            return finalizationError(
              409,
              "The effective end date cannot be earlier than the effective start date.",
            );
          }

          /*
           * Load every approval belonging to
           * this exact submitted revision.
           */
          const approvals =
            await tx.planningApproval.findMany(
              {
                where: {
                  tenantId:
                    currentRecord
                      .tenantId,

                  planningRecordId:
                    currentRecord.id,

                  revisionNumber:
                    currentRecord
                      .revisionNumber,
                },

                orderBy: [
                  {
                    sortOrder:
                      "asc",
                  },
                  {
                    createdAt:
                      "asc",
                  },
                ],
              },
            );

          const requiredApprovals =
            approvals.filter(
              (approval) =>
                approval.isRequired,
            );

          if (
            requiredApprovals.length ===
            0
          ) {
            return finalizationError(
              409,
              "At least one required approval must exist before this PTP can be finalized.",
            );
          }

          /*
           * Any blocking decision on the
           * current revision prevents
           * finalization.
           */
          const blockingApproval =
            approvals.find(
              (approval) =>
                approval.status ===
                  "RevisionRequired" ||
                approval.status ===
                  "Rejected",
            );

          if (blockingApproval) {
            return finalizationError(
              409,
              `This PTP cannot be finalized because ${blockingApproval.roleLabel} has a blocking review decision.`,
            );
          }

          const incompleteApproval =
            requiredApprovals.find(
              (approval) =>
                approval.status !==
                "Approved",
            );

          if (incompleteApproval) {
            return finalizationError(
              409,
              `Required approval from ${incompleteApproval.roleLabel} is not complete.`,
            );
          }

          /*
           * Every approval that requires a
           * signature must reference captured
           * signature evidence.
           */
          const missingSignatureLink =
            requiredApprovals.find(
              (approval) =>
                approval
                  .signatureRequired &&
                !approval
                  .planningSignatureId,
            );

          if (missingSignatureLink) {
            return finalizationError(
              409,
              `Required signature evidence is missing for ${missingSignatureLink.roleLabel}.`,
            );
          }

          const signatureIds =
            requiredApprovals
              .filter(
                (approval) =>
                  approval
                    .signatureRequired,
              )
              .map(
                (approval) =>
                  approval
                    .planningSignatureId,
              )
              .filter(
                (
                  signatureId,
                ): signatureId is string =>
                  Boolean(
                    signatureId,
                  ),
              );

          /*
           * Validate the actual signature rows,
           * not merely the foreign-key-like ID
           * stored on PlanningApproval.
           */
          const signatures =
            signatureIds.length > 0
              ? await tx.planningSignature.findMany(
                  {
                    where: {
                      id: {
                        in:
                          signatureIds,
                      },

                      tenantId:
                        currentRecord
                          .tenantId,

                      planningRecordId:
                        currentRecord.id,

                      revisionNumber:
                        currentRecord
                          .revisionNumber,
                    },

                    select: {
                      id: true,
                      status: true,
                      signedAt: true,
                      signerId: true,
                      signerName: true,
                      role: true,
                      revisionNumber:
                        true,
                    },
                  },
                )
              : [];

          const signatureById =
            new Map(
              signatures.map(
                (signature) => [
                  signature.id,
                  signature,
                ],
              ),
            );

          for (
            const approval of
            requiredApprovals
          ) {
            if (
              !approval
                .signatureRequired
            ) {
              continue;
            }

            const signatureId =
              approval
                .planningSignatureId;

            if (!signatureId) {
              return finalizationError(
                409,
                `Required signature evidence is missing for ${approval.roleLabel}.`,
              );
            }

            const signature =
              signatureById.get(
                signatureId,
              );

            if (!signature) {
              return finalizationError(
                409,
                `The linked signature for ${approval.roleLabel} could not be verified.`,
              );
            }

            if (
              signature.status !==
                "Signed" ||
              !signature.signedAt
            ) {
              return finalizationError(
                409,
                `The signature for ${approval.roleLabel} is not complete.`,
              );
            }

            /*
             * When both sides contain a user
             * identity, they must agree.
             */
            if (
              approval.approverId &&
              signature.signerId &&
              approval.approverId !==
                signature.signerId
            ) {
              return finalizationError(
                409,
                `The signature identity for ${approval.roleLabel} does not match the assigned approver.`,
              );
            }
          }

          /*
           * No unresolved reviewer comments
           * may remain on the current revision.
           */
          const openReviewCommentCount =
            await tx.planningReviewComment.count(
              {
                where: {
                  tenantId:
                    currentRecord
                      .tenantId,

                  planningRecordId:
                    currentRecord.id,

                  revisionNumber:
                    currentRecord
                      .revisionNumber,

                  status:
                    "Open",
                },
              },
            );

          if (
            openReviewCommentCount >
            0
          ) {
            return finalizationError(
              409,
              `${openReviewCommentCount} open review comment${openReviewCommentCount === 1 ? "" : "s"} must be resolved before this PTP can be finalized.`,
            );
          }

          /*
           * All gates have passed.
           *
           * Finalization makes the submitted
           * revision an Approved controlled
           * record.
           *
           * It intentionally does NOT set
           * activeAt. Approval and field
           * effectiveness remain separate
           * lifecycle concepts.
           */
          const updatedRecord =
            await tx.planningRecord.update(
              {
                where: {
                  id:
                    currentRecord.id,
                },

                data: {
                  status:
                    "Approved",

                  approvedAt:
                    finalizedAt,

                  updatedBy:
                    authorization
                      .user.id,
                },

                select: {
                  id: true,
                  title: true,
                  planType: true,

                  status: true,
                  revisionNumber:
                    true,

                  submittedAt: true,
                  approvedAt: true,
                  activeAt: true,

                  effectiveStartDate:
                    true,

                  effectiveEndDate:
                    true,
                },
              },
            );

          /*
           * Update only the lifecycle status
           * of the immutable revision record.
           *
           * Do not replace or mutate its
           * submitted snapshot.
           */
          await tx.planningRevision.update(
            {
              where: {
                id:
                  revision.id,
              },

              data: {
                status:
                  "Approved",
              },
            },
          );

          await tx.planningEvent.create(
            {
              data: {
                tenantId:
                  currentRecord
                    .tenantId,

                planningRecordId:
                  currentRecord.id,

                eventType:
                  "Planning Finalized",

                previousStatus:
                  currentRecord.status,

                newStatus:
                  "Approved",

                revisionNumber:
                  currentRecord
                    .revisionNumber,

                actorId:
                  authorization
                    .user.id,

                actorName:
                  authorization
                    .user.displayName,

                actorRole:
                  authorization
                    .membership
                    .roleCodes[0] ??
                  "Planning Manager",

                comment:
                  finalizationComment,

                metadata: {
                  workflowVersion:
                    "qoreva-planning-finalization-v1",

                  requiredApprovalCount:
                    requiredApprovals.length,

                  approvedRequiredCount:
                    requiredApprovals.length,

                  requiredSignatureCount:
                    signatureIds.length,

                  verifiedSignatureCount:
                    signatures.length,

                  openReviewCommentCount:
                    0,

                  finalizedAt:
                    finalizedAt.toISOString(),

                  effectiveStartDate:
                    currentRecord
                      .effectiveStartDate
                      .toISOString(),

                  effectiveEndDate:
                    currentRecord
                      .effectiveEndDate
                      .toISOString(),

                  activeAtSet:
                    false,

                  finalizationAuthority:
                    "canManagePlanning",
                },
              },
            },
          );

          return {
            record: {
              id:
                updatedRecord.id,

              title:
                updatedRecord.title,

              planType:
                updatedRecord
                  .planType,

              status:
                updatedRecord.status,

              revisionNumber:
                updatedRecord
                  .revisionNumber,

              submittedAt:
                updatedRecord
                  .submittedAt,

              approvedAt:
                updatedRecord
                  .approvedAt,

              activeAt:
                updatedRecord.activeAt,

              effectiveStartDate:
                updatedRecord
                  .effectiveStartDate,

              effectiveEndDate:
                updatedRecord
                  .effectiveEndDate,
            },

            finalization: {
              finalized:
                true,

              finalizedAt,

              finalizedBy: {
                id:
                  authorization
                    .user.id,

                name:
                  authorization
                    .user.displayName,

                email:
                  authorization
                    .user.email,
              },

              requiredApprovalCount:
                requiredApprovals.length,

              requiredSignatureCount:
                signatureIds.length,

              verifiedSignatureCount:
                signatures.length,

              openReviewCommentCount:
                0,

              readyForFieldEffectiveness:
                true,

              active:
                false,
            },

            workflow: {
              version:
                "qoreva-planning-finalization-v1",

              previousStatus:
                currentRecord.status,

              newStatus:
                "Approved",

              revisionNumber:
                currentRecord
                  .revisionNumber,
            },
          };
        },
      );

    if (
      "error" in result &&
      result.error
    ) {
      return NextResponse.json(
        {
          message:
            result.error.message,
        },
        {
          status:
            result.error.status,
        },
      );
    }

    return NextResponse.json(
      result,
      {
        status: 200,
      },
    );
  } catch (error) {
    if (
      error instanceof
      PlanningFinalizerAuthorizationError
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

    console.error(
      "Planning finalization failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to finalize this planning record.",
      },
      {
        status: 500,
      },
    );
  }
}