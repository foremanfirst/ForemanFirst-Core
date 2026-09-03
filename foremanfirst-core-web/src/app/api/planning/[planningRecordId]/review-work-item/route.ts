import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningReviewerAuthorizationError,
  requireAuthorizedPlanningReviewer,
} from "@/lib/planning/reviewer-authorization";

import {
  PlanningFinalizerAuthorizationError,
  requireAuthorizedPlanningFinalizer,
} from "@/lib/planning/planning-finalizer-authorization";

import {
  evaluatePlanningFinalizationReadiness,
} from "@/lib/planning/finalization-readiness";

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
          approvedAt: true,
          activeAt: true,

          effectiveStartDate: true,
          effectiveEndDate: true,

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
     * Load the exact approval snapshot for the
     * current formal planning revision.
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

    /*
     * --------------------------------------------------
     * Approval summary
     * --------------------------------------------------
     */

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

    /*
     * --------------------------------------------------
     * Signature verification
     * --------------------------------------------------
     *
     * Finalization readiness must verify the actual
     * signature records rather than trusting only the
     * PlanningApproval.planningSignatureId field.
     */

    const signatureRequiredApprovals =
      requiredApprovals.filter(
        (approval) =>
          approval.signatureRequired,
      );

    const linkedSignatureIds =
      Array.from(
        new Set(
          signatureRequiredApprovals
            .map(
              (approval) =>
                approval.planningSignatureId,
            )
            .filter(
              (
                signatureId,
              ): signatureId is string =>
                Boolean(signatureId),
            ),
        ),
      );

    const signatures =
      linkedSignatureIds.length > 0
        ? await prisma.planningSignature.findMany({
            where: {
              id: {
                in: linkedSignatureIds,
              },

              tenantId:
                record.tenantId,

              planningRecordId:
                record.id,

              revisionNumber:
                record.revisionNumber,
            },

            select: {
              id: true,
              revisionNumber: true,

              signerId: true,
              signerName: true,
              signerEmail: true,

              status: true,
              signatureType: true,
              signedAt: true,
            },
          })
        : [];

    const signaturesById =
      new Map(
        signatures.map(
          (signature) => [
            signature.id,
            signature,
          ],
        ),
      );

    const verifiedSignatureApprovalIds =
      new Set<string>();

    for (
      const approval of
      signatureRequiredApprovals
    ) {
      if (
        !approval.planningSignatureId
      ) {
        continue;
      }

      const signature =
        signaturesById.get(
          approval.planningSignatureId,
        );

      if (!signature) {
        continue;
      }

      if (
        signature.status !== "Signed" ||
        !signature.signedAt
      ) {
        continue;
      }

      /*
       * When both identity references exist they
       * must agree. This protects against a signature
       * being linked to the wrong reviewer approval.
       */
      if (
        approval.approverId &&
        signature.signerId &&
        approval.approverId !==
          signature.signerId
      ) {
        continue;
      }

      verifiedSignatureApprovalIds.add(
        approval.id,
      );
    }

    const verifiedSignatureCount =
      verifiedSignatureApprovalIds.size;

    /*
     * --------------------------------------------------
     * Current reviewer capability
     * --------------------------------------------------
     */

    let currentReviewerApprovalId:
      | string
      | null = null;

    let currentReviewerRoleCode:
      | string
      | null = null;

    let currentReviewerRoleLabel:
      | string
      | null = null;

    for (const approval of approvals) {
      if (
        approval.status !== "Pending"
      ) {
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

    /*
     * --------------------------------------------------
     * Current finalizer capability
     * --------------------------------------------------
     *
     * The UI does not infer this from role labels.
     * Authorization comes from the authenticated user's
     * active project membership on the server.
     */

    let canFinalize = false;

    let currentFinalizerRoleCodes:
      string[] = [];

    try {
      const authorizedFinalizer =
        await requireAuthorizedPlanningFinalizer(
          record.id,
        );

      canFinalize = true;

      currentFinalizerRoleCodes =
        authorizedFinalizer
          .membership
          .roleCodes;
    } catch (error) {
      if (
        !(
          error instanceof
          PlanningFinalizerAuthorizationError
        )
      ) {
        throw error;
      }
    }

    /*
     * --------------------------------------------------
     * Deterministic finalization readiness
     * --------------------------------------------------
     *
     * The shared domain evaluator is the
     * authoritative source for whether the
     * current revision may be finalized.
     *
     * User authorization remains separate:
     * readiness answers whether the record
     * is ready; canFinalize answers whether
     * the authenticated user may perform
     * the finalization action.
     */

    const finalizationReadiness =
      await evaluatePlanningFinalizationReadiness(
        record.id,
      );

    const finalizationBlockers =
      finalizationReadiness.blockers;

    const finalizationReady =
      finalizationReadiness.ready;

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

        approvedAt:
          record.approvedAt,

        activeAt:
          record.activeAt,

        effectiveStartDate:
          record.effectiveStartDate,

        effectiveEndDate:
          record.effectiveEndDate,

        qualityScore:
          record.qualityScore,

        project:
          record.project,

        contractor:
          record.contractor,
      },

      revision: {
        revisionNumber:
          record.revisionNumber,

        isSubmitted:
          record.status ===
          "Submitted",

        isApproved:
          record.status ===
          "Approved",
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

        requiredSignatures:
          signatureRequiredApprovals.length,

        verifiedSignatures:
          verifiedSignatureCount,

        openComments:
          openCommentCount,

        allRequiredApproved:
          requiredApprovals.length >
            0 &&
          approvedRequiredCount ===
            requiredApprovals.length,

        allRequiredSignaturesVerified:
          signatureRequiredApprovals.length ===
          verifiedSignatureCount,

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

            const linkedSignature =
              approval
                .planningSignatureId
                ? signaturesById.get(
                    approval
                      .planningSignatureId,
                  ) ?? null
                : null;

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
                  approval
                    .signatureRequired,

                planningSignatureId:
                  approval
                    .planningSignatureId,

                verified:
                  verifiedSignatureApprovalIds.has(
                    approval.id,
                  ),

                signedAt:
                  linkedSignature
                    ?.signedAt ??
                  null,

                signatureType:
                  linkedSignature
                    ?.signatureType ??
                  null,
              },

              notification: {
                status:
                  approval
                    .notificationStatus,

                notifiedAt:
                  approval.notifiedAt,

                reminderSentAt:
                  approval
                    .reminderSentAt,
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

        /*
         * Finalization authority is intentionally
         * independent from reviewer authority.
         */
        canFinalize,

        currentFinalizerRoleCodes,
      },

      finalization: {
        ready:
          finalizationReady,

        canFinalize,

        canFinalizeNow:
          finalizationReady &&
          canFinalize,

        alreadyFinalized:
          record.status ===
          "Approved",

        active:
          Boolean(
            record.activeAt,
          ),

        effectiveStartDate:
          record
            .effectiveStartDate,

        effectiveEndDate:
          record
            .effectiveEndDate,

        requiredApprovalCount:
          requiredApprovals.length,

        approvedRequiredCount,

        requiredSignatureCount:
          signatureRequiredApprovals.length,

        verifiedSignatureCount,

        openReviewCommentCount:
          openCommentCount,

        blockers:
          finalizationBlockers,
      },

      metadata: {
        workflowVersion:
          "qoreva-planning-review-work-item-v2-finalization",

        finalizationWorkflowVersion:
          "qoreva-planning-finalization-v1",

        revisionScoped: true,

        advisoryOnly: false,

        requiresAuthenticatedReviewerForDecision:
          true,

        requiresAuthenticatedFinalizerForFinalization:
          true,

        finalizationAuthority:
          "PROJECT_CAN_MANAGE_PLANNING",
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