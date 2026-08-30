import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  PlanningReviewerAuthorizationError,
  requireAuthorizedPlanningReviewer,
} from "@/lib/planning/reviewer-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    approvalId: string;
  }>;
};

function toNullableString(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      approvalId,
    } = await context.params;

    /*
     * Identity and authorization are resolved
     * entirely server-side.
     *
     * The browser is never trusted to supply the
     * reviewer identity, reviewer role, tenant,
     * project membership, or approval authority.
     */
    const authorized =
      await requireAuthorizedPlanningReviewer(
        planningRecordId,
        approvalId,
      );

    const body =
      await request.json();

    const decisionComment =
      toNullableString(
        body.decisionComment,
      );

    if (!decisionComment) {
      return NextResponse.json(
        {
          message:
            "A reason is required when returning a planning record for revision.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-read both records inside the transaction.
           *
           * Authorization was already established above,
           * but the workflow state may have changed between
           * authorization and this mutation.
           */
          const record =
            await tx.planningRecord.findFirst({
              where: {
                id:
                  authorized
                    .planningRecord
                    .id,

                tenantId:
                  authorized
                    .planningRecord
                    .tenantId,

                isArchived:
                  false,
              },

              select: {
                id: true,
                tenantId: true,
                projectId: true,
                status: true,
                revisionNumber:
                  true,
              },
            });

          if (!record) {
            throw new PlanningReviewerAuthorizationError(
              "Planning record was not found.",
              404,
            );
          }

          if (
            record.status !==
            "Submitted"
          ) {
            throw new PlanningReviewerAuthorizationError(
              "Only a submitted planning record can be returned for revision.",
              409,
            );
          }

          if (
            record.revisionNumber !==
            authorized
              .planningRecord
              .revisionNumber
          ) {
            throw new PlanningReviewerAuthorizationError(
              "The planning record revision changed before the reviewer decision could be saved.",
              409,
            );
          }

          const approval =
            await tx.planningApproval.findFirst({
              where: {
                id:
                  authorized
                    .approval.id,

                planningRecordId:
                  record.id,

                tenantId:
                  record.tenantId,

                revisionNumber:
                  record.revisionNumber,
              },

              select: {
                id: true,
                roleCode: true,
                roleLabel: true,
                status: true,
                approverId: true,
                planningSignatureId:
                  true,
              },
            });

          if (!approval) {
            throw new PlanningReviewerAuthorizationError(
              "Approval assignment was not found for the current planning revision.",
              404,
            );
          }

          if (
            approval.approverId !==
            authorized.user.id
          ) {
            throw new PlanningReviewerAuthorizationError(
              "You are no longer the assigned approver for this review.",
              403,
            );
          }

          if (
            approval.status !==
            "Pending"
          ) {
            throw new PlanningReviewerAuthorizationError(
              `This approval has already been resolved with status ${approval.status}.`,
              409,
            );
          }

          if (
            approval.planningSignatureId
          ) {
            throw new PlanningReviewerAuthorizationError(
              "This approval already has signature evidence and cannot be returned as a pending review.",
              409,
            );
          }

          const decidedAt =
            new Date();

          const updatedApproval =
            await tx.planningApproval.update({
              where: {
                id:
                  approval.id,
              },

              data: {
                status:
                  "RevisionRequired",

                decisionComment,

                decidedById:
                  authorized
                    .user.id,

                decidedByName:
                  authorized
                    .user
                    .displayName,

                decidedByRole:
                  approval.roleLabel,

                decidedAt,
              },
            });

          /*
           * Revision 1 remains the submitted historical
           * revision. We only move the parent lifecycle
           * into Revision Needed.
           *
           * The existing /revision/start endpoint is
           * responsible for starting the next Draft
           * revision.
           */
          const updatedRecord =
            await tx.planningRecord.update({
              where: {
                id:
                  record.id,
              },

              data: {
                status:
                  "Revision Needed",

                updatedBy:
                  authorized
                    .user.id,
              },

              select: {
                id: true,
                status: true,
                revisionNumber:
                  true,
                submittedAt:
                  true,
                approvedAt:
                  true,
                activeAt:
                  true,
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                record.tenantId,

              planningRecordId:
                record.id,

              eventType:
                "Planning Revision Required",

              previousStatus:
                "Submitted",

              newStatus:
                "Revision Needed",

              revisionNumber:
                record.revisionNumber,

              actorId:
                authorized
                  .user.id,

              actorName:
                authorized
                  .user
                  .displayName,

              actorRole:
                approval.roleLabel,

              comment:
                decisionComment,

              metadata: {
                approvalId:
                  approval.id,

                approvalRoleCode:
                  approval.roleCode,

                approvalRoleLabel:
                  approval.roleLabel,

                decision:
                  "RevisionRequired",

                reviewerUserId:
                  authorized
                    .user.id,

                submittedRevisionNumber:
                  record.revisionNumber,

                nextAction:
                  "StartNewRevision",
              },
            },
          });

          return {
            record:
              updatedRecord,

            approval:
              updatedApproval,

            decision: {
              status:
                "RevisionRequired",

              comment:
                decisionComment,

              decidedAt,

              reviewer: {
                id:
                  authorized
                    .user.id,

                name:
                  authorized
                    .user
                    .displayName,

                email:
                  authorized
                    .user.email,

                roleCode:
                  approval.roleCode,

                roleLabel:
                  approval.roleLabel,
              },
            },

            revision: {
              returnedRevisionNumber:
                record.revisionNumber,

              nextRevisionNumber:
                record.revisionNumber +
                1,

              canStartNewRevision:
                true,
            },
          };
        },
      );

    return NextResponse.json({
      message:
        "Planning record returned for revision.",

      ...result,
    });
  } catch (error) {
    if (
      error instanceof
      PlanningReviewerAuthorizationError
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
      "Unable to return planning record for revision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to return the planning record for revision.",
      },
      {
        status: 500,
      },
    );
  }
}