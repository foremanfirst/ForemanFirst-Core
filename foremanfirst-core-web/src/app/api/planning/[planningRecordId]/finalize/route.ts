import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  PlanningFinalizerAuthorizationError,
  requireAuthorizedPlanningFinalizer,
} from "@/lib/planning/planning-finalizer-authorization";

import {
  evaluatePlanningFinalizationReadiness,
} from "@/lib/planning/finalization-readiness";

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
           * Evaluate the exact current revision
           * using the canonical server-side
           * finalization readiness service.
           *
           * Passing tx keeps every readiness
           * query inside this same transaction.
           *
           * Authorization and revision-race
           * protection remain separate above.
           */
          const finalizationReadiness =
            await evaluatePlanningFinalizationReadiness(
              currentRecord.id,
              tx,
            );

          if (
            !finalizationReadiness.ready
          ) {
            const blocker =
              finalizationReadiness
                .blockers[0];

            return finalizationError(
              409,
              blocker?.message ??
                "This PTP is not ready for finalization.",
            );
          }

          /*
           * Readiness guarantees both effective
           * dates exist. Keep a local invariant
           * assertion so TypeScript and future
           * refactors cannot accidentally use
           * nullable dates in the success path.
           */
          const effectiveStartDate =
            currentRecord
              .effectiveStartDate;

          const effectiveEndDate =
            currentRecord
              .effectiveEndDate;

          if (
            !effectiveStartDate ||
            !effectiveEndDate
          ) {
            throw new Error(
              "Finalization readiness invariant failed: effective dates are missing.",
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
          const recordTransition =
            await tx.planningRecord.updateMany(
              {
                where: {
                  id:
                    currentRecord.id,

                  tenantId:
                    currentRecord.tenantId,

                  revisionNumber:
                    currentRecord.revisionNumber,

                  status:
                    "Submitted",
                },

                data: {
                  status:
                    "Approved",

                  approvedAt:
                    finalizedAt,

                  updatedBy:
                    authorization.user.id,
                },
              },
            );

          if (
            recordTransition.count !== 1
          ) {
            throw new Error(
              "FINALIZATION_RECORD_STATE_CONFLICT",
            );
          }

          const updatedRecord =
            await tx.planningRecord.findUniqueOrThrow(
              {
                where: {
                  id:
                    currentRecord.id,
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
          const revisionTransition =
            await tx.planningRevision.updateMany(
              {
                where: {
                  planningRecordId:
                    currentRecord.id,

                  tenantId:
                    currentRecord.tenantId,

                  revisionNumber:
                    currentRecord.revisionNumber,

                  status:
                    "Submitted",
                },

                data: {
                  status:
                    "Approved",
                },
              },
            );

          if (
            revisionTransition.count !== 1
          ) {
            throw new Error(
              "FINALIZATION_REVISION_STATE_CONFLICT",
            );
          }

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
                    finalizationReadiness
                      .approvals
                      .requiredCount,

                  approvedRequiredCount:
                    finalizationReadiness
                      .approvals
                      .approvedRequiredCount,

                  requiredSignatureCount:
                    finalizationReadiness
                      .signatures
                      .requiredCount,

                  verifiedSignatureCount:
                    finalizationReadiness
                      .signatures
                      .verifiedCount,

                  openReviewCommentCount:
                    finalizationReadiness
                      .openReviewCommentCount,

                  finalizedAt:
                    finalizedAt.toISOString(),

                  effectiveStartDate:
                    effectiveStartDate
                      .toISOString(),

                  effectiveEndDate:
                    effectiveEndDate
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
                finalizationReadiness
                  .approvals
                  .requiredCount,

              requiredSignatureCount:
                finalizationReadiness
                  .signatures
                  .requiredCount,

              verifiedSignatureCount:
                finalizationReadiness
                  .signatures
                  .verifiedCount,

              openReviewCommentCount:
                finalizationReadiness
                  .openReviewCommentCount,

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