import { NextRequest, NextResponse } from "next/server";

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

type ApproveAndSignBody = {
  attestationAccepted?: boolean;
  decisionComment?: string | null;
};

function firstForwardedIp(
  request: NextRequest,
) {
  const forwardedFor =
    request.headers.get(
      "x-forwarded-for",
    );

  if (forwardedFor) {
    const first =
      forwardedFor
        .split(",")[0]
        ?.trim();

    if (first) {
      return first;
    }
  }

  return (
    request.headers.get(
      "x-real-ip",
    ) ?? null
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      approvalId,
    } = await context.params;

    const body =
      (await request.json()) as ApproveAndSignBody;

    if (
      body.attestationAccepted !==
      true
    ) {
      return NextResponse.json(
        {
          message:
            "Electronic approval attestation must be accepted before signing.",
        },
        {
          status: 400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningReviewer(
        planningRecordId,
        approvalId,
      );

    const decisionComment =
      body.decisionComment?.trim() ||
      null;

    const signedAt =
      new Date();

    const ipAddress =
      firstForwardedIp(
        request,
      );

    const userAgent =
      request.headers.get(
        "user-agent",
      );

    const result =
      await prisma.$transaction(
        async (tx) => {
          const currentRecord =
            await tx.planningRecord.findFirst(
              {
                where: {
                  id: authorization
                    .planningRecord.id,
                  tenantId:
                    authorization
                      .planningRecord
                      .tenantId,
                  projectId:
                    authorization
                      .planningRecord
                      .projectId,
                  archivedAt: null,
                },
                select: {
                  id: true,
                  tenantId: true,
                  projectId: true,
                  title: true,
                  status: true,
                  revisionNumber: true,
                  submittedAt: true,
                },
              },
            );

          if (!currentRecord) {
            throw new Error(
              "Planning record was not found.",
            );
          }

          if (
            currentRecord.status !==
            "Submitted"
          ) {
            return {
              error: {
                status: 409,
                message:
                  "Only a submitted planning revision can be approved.",
              },
            };
          }

          if (
            currentRecord.revisionNumber !==
            authorization
              .planningRecord
              .revisionNumber
          ) {
            return {
              error: {
                status: 409,
                message:
                  "The planning revision changed before this approval could be saved.",
              },
            };
          }

          const currentApproval =
            await tx.planningApproval.findFirst(
              {
                where: {
                  id: authorization
                    .approval.id,
                  tenantId:
                    currentRecord.tenantId,
                  planningRecordId:
                    currentRecord.id,
                  revisionNumber:
                    currentRecord.revisionNumber,
                },
              },
            );

          if (!currentApproval) {
            return {
              error: {
                status: 404,
                message:
                  "The approval assignment was not found.",
              },
            };
          }

          if (
            currentApproval.approverId !==
            authorization.user.id
          ) {
            return {
              error: {
                status: 403,
                message:
                  "This approval assignment belongs to a different reviewer.",
              },
            };
          }

          if (
            currentApproval.status !==
            "Pending"
          ) {
            return {
              error: {
                status: 409,
                message:
                  "This approval assignment is no longer pending.",
              },
            };
          }

          if (
            currentApproval
              .planningSignatureId
          ) {
            return {
              error: {
                status: 409,
                message:
                  "A signature is already attached to this approval assignment.",
              },
            };
          }

          const blockingApprovalCount =
            await tx.planningApproval.count(
              {
                where: {
                  planningRecordId:
                    currentRecord.id,
                  tenantId:
                    currentRecord.tenantId,
                  revisionNumber:
                    currentRecord.revisionNumber,
                  status: {
                    in: [
                      "RevisionRequired",
                      "Rejected",
                    ],
                  },
                },
              },
            );

          if (
            blockingApprovalCount > 0
          ) {
            return {
              error: {
                status: 409,
                message:
                  "This planning revision has a blocking review decision and cannot be approved.",
              },
            };
          }

          const signature =
            await tx.planningSignature.create(
              {
                data: {
                  tenantId:
                    currentRecord.tenantId,
                  planningRecordId:
                    currentRecord.id,
                  revisionNumber:
                    currentRecord.revisionNumber,

                  role:
                    currentApproval
                      .roleLabel,

                  signerId:
                    authorization.user.id,

                  signerName:
                    authorization.user
                      .displayName,

                  signerEmail:
                    authorization.user.email,

                  isRequired:
                    currentApproval
                      .isRequired,

                  sortOrder:
                    currentApproval
                      .sortOrder,

                  status:
                    "Signed",

                  signatureType:
                    "AuthenticatedElectronic",

                  signedAt,

                  ipAddress,

                  userAgent,

                  deviceInfo:
                    null,
                },
              },
            );

          const updatedApproval =
            await tx.planningApproval.update(
              {
                where: {
                  id: currentApproval.id,
                },

                data: {
                  status:
                    "Approved",

                  decisionComment,

                  decidedById:
                    authorization.user.id,

                  decidedByName:
                    authorization.user
                      .displayName,

                  decidedByRole:
                    currentApproval
                      .roleLabel,

                  decidedAt:
                    signedAt,

                  planningSignatureId:
                    signature.id,
                },
              },
            );

          const approvals =
            await tx.planningApproval.findMany(
              {
                where: {
                  tenantId:
                    currentRecord.tenantId,

                  planningRecordId:
                    currentRecord.id,

                  revisionNumber:
                    currentRecord.revisionNumber,
                },

                select: {
                  id: true,
                  isRequired: true,
                  status: true,
                },
              },
            );

          const requiredApprovalCount =
            approvals.filter(
              (approval) =>
                approval.isRequired,
            ).length;

          const approvedRequiredCount =
            approvals.filter(
              (approval) =>
                approval.isRequired &&
                approval.status ===
                  "Approved",
            ).length;

          const pendingRequiredCount =
            approvals.filter(
              (approval) =>
                approval.isRequired &&
                approval.status ===
                  "Pending",
            ).length;

          const allRequiredApproved =
            requiredApprovalCount > 0 &&
            approvedRequiredCount ===
              requiredApprovalCount;

          await tx.planningEvent.create(
            {
              data: {
                tenantId:
                  currentRecord.tenantId,

                planningRecordId:
                  currentRecord.id,

                eventType:
                  "Planning Approval Signed",

                previousStatus:
                  currentRecord.status,

                newStatus:
                  currentRecord.status,

                revisionNumber:
                  currentRecord.revisionNumber,

                actorId:
                  authorization.user.id,

                actorName:
                  authorization.user
                    .displayName,

                actorRole:
                  currentApproval
                    .roleLabel,

                comment:
                  decisionComment,

                metadata: {
                  approvalId:
                    updatedApproval.id,

                  roleCode:
                    updatedApproval
                      .roleCode,

                  roleLabel:
                    updatedApproval
                      .roleLabel,

                  decision:
                    "Approved",

                  planningSignatureId:
                    signature.id,

                  signatureType:
                    signature.signatureType,

                  signedAt:
                    signedAt.toISOString(),

                  attestationAccepted:
                    true,

                  requiredApprovalCount,

                  approvedRequiredCount,

                  pendingRequiredCount,

                  allRequiredApproved,
                },
              },
            },
          );

          return {
            record: {
              id:
                currentRecord.id,

              status:
                currentRecord.status,

              revisionNumber:
                currentRecord
                  .revisionNumber,
            },

            approval: {
              id:
                updatedApproval.id,

              roleCode:
                updatedApproval
                  .roleCode,

              roleLabel:
                updatedApproval
                  .roleLabel,

              status:
                updatedApproval.status,

              decidedById:
                updatedApproval
                  .decidedById,

              decidedByName:
                updatedApproval
                  .decidedByName,

              decidedByRole:
                updatedApproval
                  .decidedByRole,

              decidedAt:
                updatedApproval
                  .decidedAt,

              planningSignatureId:
                updatedApproval
                  .planningSignatureId,
            },

            signature: {
              id:
                signature.id,

              status:
                signature.status,

              signatureType:
                signature.signatureType,

              signerId:
                signature.signerId,

              signerName:
                signature.signerName,

              signerEmail:
                signature.signerEmail,

              signedAt:
                signature.signedAt,
            },

            workflow: {
              requiredApprovalCount,

              approvedRequiredCount,

              pendingRequiredCount,

              readyForFinalization:
                allRequiredApproved,
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
      "Approve and sign planning approval failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to approve and sign this planning review.",
      },
      {
        status: 500,
      },
    );
  }
}
