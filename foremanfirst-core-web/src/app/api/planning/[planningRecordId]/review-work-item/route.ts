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
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const record =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
          projectId: true,
          title: true,
          planType: true,
          status: true,
          revisionNumber: true,
          submittedAt: true,
          qualityScore: true,

          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },

          contractor: {
            select: {
              id: true,
              name: true,
            },
          },

        },
      });

    if (!record) {
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
     * Prisma cannot reference the parent revisionNumber from inside
     * the nested relation filter above. Load the current revision's
     * approval snapshot explicitly so the reviewer work item is always
     * scoped to the exact submitted revision.
     */
    const approvals =
      await prisma.planningApproval.findMany({
        where: {
          planningRecordId:
            record.id,
          tenantId:
            record.tenantId,
          revisionNumber:
            record.revisionNumber,
        },

        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],

        select: {
          id: true,
          revisionNumber: true,
          roleCode: true,
          roleLabel: true,
          isRequired: true,
          sortOrder: true,

          approverId: true,
          approverName: true,
          approverEmail: true,

          status: true,
          decisionComment: true,

          decidedById: true,
          decidedByName: true,
          decidedByRole: true,
          decidedAt: true,

          signatureRequired: true,
          planningSignatureId: true,

          notificationStatus: true,
          notifiedAt: true,
          reminderSentAt: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    const approverIds = Array.from(
      new Set(
        approvals
          .map(
            (approval) =>
              approval.approverId,
          )
          .filter(
            (
              approverId,
            ): approverId is string =>
              Boolean(approverId),
          ),
      ),
    );

    const users =
      approverIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: approverIds,
              },
            },

            select: {
              id: true,
              displayName: true,
              email: true,
              status: true,
              isActive: true,
            },
          })
        : [];

    const usersById =
      new Map(
        users.map((user) => [
          user.id,
          user,
        ]),
      );

    const projectMemberships =
      approverIds.length > 0
        ? await prisma.projectMembership.findMany({
            where: {
              tenantId:
                record.tenantId,
              projectId:
                record.projectId,
              isActive: true,

              tenantMembership: {
                tenantId:
                  record.tenantId,
                isActive: true,
                userId: {
                  in: approverIds,
                },
              },
            },

            select: {
              id: true,
              roleCodes: true,
              approvalRoleCodes: true,
              canReviewPlanning: true,
              canApprovePlanning: true,

              tenantMembership: {
                select: {
                  userId: true,
                },
              },
            },
          })
        : [];

    const membershipsByUserId =
      new Map(
        projectMemberships.map(
          (membership) => [
            membership
              .tenantMembership
              .userId,
            membership,
          ],
        ),
      );

    const openCommentCount =
      await prisma.planningReviewComment.count({
        where: {
          planningRecordId:
            record.id,
          tenantId:
            record.tenantId,
          revisionNumber:
            record.revisionNumber,
          status: "Open",
        },
      });

    const requiredApprovals =
      approvals.filter(
        (approval) =>
          approval.isRequired,
      );

    const approvedRequiredCount =
      requiredApprovals.filter(
        (approval) =>
          approval.status ===
          "Approved",
      ).length;

    const pendingRequiredCount =
      requiredApprovals.filter(
        (approval) =>
          approval.status ===
          "Pending",
      ).length;

    const revisionRequiredCount =
      approvals.filter(
        (approval) =>
          approval.status ===
          "RevisionRequired",
      ).length;

    const rejectedCount =
      approvals.filter(
        (approval) =>
          approval.status ===
          "Rejected",
      ).length;

    let currentReviewerApprovalId: string | null =
      null;

    let currentReviewerRoleCode: string | null =
      null;

    let currentReviewerRoleLabel: string | null =
      null;

    for (const approval of approvals) {
      if (approval.status !== "Pending") {
        continue;
      }

      try {
        const authorized =
          await requireAuthorizedPlanningReviewer(
            record.id,
            approval.id,
          );

        currentReviewerApprovalId =
          authorized.approval.id;

        currentReviewerRoleCode =
          authorized.approval.roleCode;

        currentReviewerRoleLabel =
          authorized.approval.roleLabel;

        break;
      } catch (error) {
        if (
          error instanceof
          PlanningReviewerAuthorizationError
        ) {
          continue;
        }

        throw error;
      }
    }

    const workItem = {
      planningRecord: {
        id: record.id,
        title: record.title,
        planType: record.planType,
        status: record.status,
        revisionNumber:
          record.revisionNumber,
        submittedAt:
          record.submittedAt,
        qualityScore:
          record.qualityScore,

        project: record.project,
        contractor:
          record.contractor,
      },

      revision: {
        revisionNumber:
          record.revisionNumber,
        isSubmitted:
          record.status ===
            "Submitted",
      },

      summary: {
        totalApprovals:
          approvals.length,
        requiredApprovals:
          requiredApprovals.length,
        approvedRequired:
          approvedRequiredCount,
        pendingRequired:
          pendingRequiredCount,
        revisionRequired:
          revisionRequiredCount,
        rejected:
          rejectedCount,
        openComments:
          openCommentCount,

        allRequiredApproved:
          requiredApprovals.length >
            0 &&
          approvedRequiredCount ===
            requiredApprovals.length,

        hasBlockingDecision:
          revisionRequiredCount > 0 ||
          rejectedCount > 0,
      },

      approvals:
        approvals.map(
          (approval) => {
            const user =
              approval.approverId
                ? usersById.get(
                    approval.approverId,
                  ) ?? null
                : null;

            const membership =
              approval.approverId
                ? membershipsByUserId.get(
                    approval.approverId,
                  ) ?? null
                : null;

            const assignedRoleIsEligible =
              Boolean(
                membership &&
                  membership
                    .canApprovePlanning &&
                  membership
                    .approvalRoleCodes
                    .includes(
                      approval.roleCode,
                    ),
              );

            return {
              id: approval.id,
              revisionNumber:
                approval.revisionNumber,

              roleCode:
                approval.roleCode,
              roleLabel:
                approval.roleLabel,
              isRequired:
                approval.isRequired,
              sortOrder:
                approval.sortOrder,

              approver: {
                id:
                  approval.approverId,
                name:
                  approval.approverName,
                email:
                  approval.approverEmail,

                currentIdentity:
                  user
                    ? {
                        displayName:
                          user.displayName,
                        email:
                          user.email,
                        status:
                          user.status,
                        isActive:
                          user.isActive,
                      }
                    : null,
              },

              eligibility: {
                hasActiveProjectMembership:
                  Boolean(
                    membership,
                  ),
                canReviewPlanning:
                  membership
                    ?.canReviewPlanning ??
                  false,
                canApprovePlanning:
                  membership
                    ?.canApprovePlanning ??
                  false,
                approvalRoleCodes:
                  membership
                    ?.approvalRoleCodes ??
                  [],
                assignedRoleIsEligible,
              },

              status:
                approval.status,
              decisionComment:
                approval.decisionComment,

              decision: {
                decidedById:
                  approval.decidedById,
                decidedByName:
                  approval.decidedByName,
                decidedByRole:
                  approval.decidedByRole,
                decidedAt:
                  approval.decidedAt,
              },

              signature: {
                required:
                  approval.signatureRequired,
                planningSignatureId:
                  approval.planningSignatureId,
              },

              notification: {
                status:
                  approval.notificationStatus,
                notifiedAt:
                  approval.notifiedAt,
                reminderSentAt:
                  approval.reminderSentAt,
              },

              createdAt:
                approval.createdAt,
              updatedAt:
                approval.updatedAt,
            };
          },
        ),

      capabilities: {
        reviewerIdentityResolved:
          Boolean(
            currentReviewerApprovalId,
          ),

        currentReviewerApprovalId,

        currentReviewerRoleCode,

        currentReviewerRoleLabel,

        canApproveAndSign:
          Boolean(
            currentReviewerApprovalId,
          ),

        canReturnForRevision:
          Boolean(
            currentReviewerApprovalId,
          ),
      },

      metadata: {
        workflowVersion:
          "qoreva-planning-review-work-item-v1",
        revisionScoped: true,
        advisoryOnly: false,
        requiresAuthenticatedReviewerForDecision:
          true,
      },
    };

    return NextResponse.json({
      workItem,
    });
  } catch (error) {
    console.error(
      "Unable to load planning reviewer work item:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load the planning reviewer work item.",
      },
      {
        status: 500,
      },
    );
  }
}
