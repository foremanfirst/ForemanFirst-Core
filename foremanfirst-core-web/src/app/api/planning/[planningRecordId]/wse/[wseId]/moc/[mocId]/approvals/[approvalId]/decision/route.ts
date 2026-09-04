import { NextResponse } from "next/server";
import type {
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MocApproverAuthorizationError,
  requireAuthorizedMocApprover,
} from "@/lib/planning/moc-approver-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    wseId: string;
    mocId: string;
    approvalId: string;
  }>;
};

type MocDecision =
  | "Approved"
  | "Rejected"
  | "RevisionRequired";

function toNullableString(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

function normalizeDecision(
  value: unknown,
): MocDecision | null {
  if (
    value === "Approved" ||
    value === "Rejected" ||
    value === "RevisionRequired"
  ) {
    return value;
  }

  return null;
}

function normalizeSignatureData(
  value: unknown,
): Prisma.InputJsonValue | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(
        value,
      ),
    ) as Prisma.InputJsonValue;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      wseId,
      mocId,
      approvalId,
    } =
      await context.params;

    const authorization =
      await requireAuthorizedMocApprover(
        planningRecordId,
        wseId,
        mocId,
        approvalId,
      );

    const body =
      await request.json();

    const decision =
      normalizeDecision(
        body.decision,
      );

    if (!decision) {
      return NextResponse.json(
        {
          message:
            "Decision must be Approved, Rejected, or RevisionRequired.",
        },
        {
          status:
            400,
        },
      );
    }

    const comment =
      toNullableString(
        body.comment,
      );

    if (
      (
        decision ===
          "Rejected" ||
        decision ===
          "RevisionRequired"
      ) &&
      !comment
    ) {
      return NextResponse.json(
        {
          message:
            "A comment is required when rejecting the MOC or requesting revision.",
        },
        {
          status:
            400,
        },
      );
    }

    const decidedById =
      authorization.user.id;

    const decidedByName =
      authorization.user.displayName;

    const decidedByRole =
      authorization.approval.roleLabel;

    const signatureType =
      toNullableString(
        body.signatureType,
      );

    const signatureData =
      normalizeSignatureData(
        body.signatureData,
      );

    const signatureAssetKey =
      toNullableString(
        body.signatureAssetKey,
      );

    const signatureAttestation =
      toNullableString(
        body.signatureAttestation,
      );

    if (
      decision ===
      "Approved"
    ) {
      if (!signatureType) {
        return NextResponse.json(
          {
            message:
              "Signature type is required to approve this MOC.",
          },
          {
            status:
              400,
          },
        );
      }

      if (
        !signatureData &&
        !signatureAssetKey
      ) {
        return NextResponse.json(
          {
            message:
              "A signature is required before this MOC can be approved.",
          },
          {
            status:
              400,
          },
        );
      }

      if (
        !signatureAttestation
      ) {
        return NextResponse.json(
          {
            message:
              "Approval attestation is required before signing this MOC.",
          },
          {
            status:
              400,
          },
        );
      }
    }

    const approval =
      await prisma.dailyWorkerSafetyEngagementMocApproval.findFirst({
        where: {
          id:
            approvalId,

          tenantId:
            authorization.planningRecord.tenantId,

          mocId:
            mocId,

          moc: {
            tenantId:
              authorization.planningRecord.tenantId,

            dailyWseId:
              wseId,

            dailyWse: {
              tenantId:
                authorization.planningRecord.tenantId,

              planningRecordId:
                planningRecordId,
            },
          },
        },

        include: {
          moc: {
            include: {
              dailyWse: {
                select: {
                  id:
                    true,

                  tenantId:
                    true,

                  planningRecordId:
                    true,

                  revisionNumber:
                    true,

                  status:
                    true,
                },
              },
            },
          },
        },
      });

    if (!approval) {
      return NextResponse.json(
        {
          message:
            "MOC approval record was not found.",
        },
        {
          status:
            404,
        },
      );
    }

    if (
      approval.moc.status !==
      "PendingApproval"
    ) {
      return NextResponse.json(
        {
          message:
            "This MOC is no longer pending approval.",
        },
        {
          status:
            409,
        },
      );
    }

    if (
      approval.status !==
      "Pending"
    ) {
      return NextResponse.json(
        {
          message:
            "This approval decision has already been recorded.",
        },
        {
          status:
            409,
        },
      );
    }

    const decidedAt =
      new Date();

    const signedAt =
      decision ===
      "Approved"
        ? decidedAt
        : null;

    const signatureIpAddress =
      decision ===
      "Approved"
        ? toNullableString(
            request.headers.get(
              "x-forwarded-for",
            ),
          ) ??
          toNullableString(
            request.headers.get(
              "x-real-ip",
            ),
          )
        : null;

    const signatureUserAgent =
      decision ===
      "Approved"
        ? toNullableString(
            request.headers.get(
              "user-agent",
            ),
          )
        : null;

    const result =
      await prisma.$transaction(
        async (
          tx,
        ) => {
          const updatedApproval =
            await tx.dailyWorkerSafetyEngagementMocApproval.update({
              where: {
                id:
                  approvalId,
              },

              data: {
                status:
                  decision,

                decision,

                comment,

                decidedById,

                decidedByName,

                decidedByRole,

                decidedAt,

                signatureType:
                  decision ===
                  "Approved"
                    ? signatureType
                    : null,

                signatureData:
                  decision ===
                    "Approved" &&
                  signatureData
                    ? signatureData
                    : undefined,

                signatureAssetKey:
                  decision ===
                  "Approved"
                    ? signatureAssetKey
                    : null,

                signatureAttestation:
                  decision ===
                  "Approved"
                    ? signatureAttestation
                    : null,

                signedAt,

                signatureIpAddress,

                signatureUserAgent,
              },
            });

          const approvals =
            await tx.dailyWorkerSafetyEngagementMocApproval.findMany({
              where: {
                mocId:
                  mocId,
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
            });

          const requiredApprovals =
            approvals.filter(
              (
                item,
              ) =>
                item.required,
            );

          const hasRejected =
            requiredApprovals.some(
              (
                item,
              ) =>
                item.status ===
                "Rejected",
            );

          const hasRevisionRequired =
            requiredApprovals.some(
              (
                item,
              ) =>
                item.status ===
                "RevisionRequired",
            );

          const allRequiredApproved =
            requiredApprovals.length >
              0 &&
            requiredApprovals.every(
              (
                item,
              ) =>
                item.status ===
                "Approved",
            );

          let parentStatus:
            | "PendingApproval"
            | "Approved"
            | "Rejected"
            | "RevisionRequired" =
            "PendingApproval";

          if (
            hasRevisionRequired
          ) {
            parentStatus =
              "RevisionRequired";
          } else if (
            hasRejected
          ) {
            parentStatus =
              "Rejected";
          } else if (
            allRequiredApproved
          ) {
            parentStatus =
              "Approved";
          }

          const parentDecision =
            parentStatus ===
            "PendingApproval"
              ? null
              : parentStatus;

          const parentReviewedAt =
            parentStatus ===
            "PendingApproval"
              ? null
              : decidedAt;

          const parentApprovedAt =
            parentStatus ===
            "Approved"
              ? decidedAt
              : null;

          const parentRejectedAt =
            parentStatus ===
            "Rejected"
              ? decidedAt
              : null;

          const updatedMoc =
            await tx.dailyWorkerSafetyEngagementMoc.update({
              where: {
                id:
                  mocId,
              },

              data: {
                status:
                  parentStatus,

                reviewDecision:
                  parentDecision,

                reviewedAt:
                  parentReviewedAt,

                approvedAt:
                  parentApprovedAt,

                rejectedAt:
                  parentRejectedAt,

                reviewedById:
                  parentStatus ===
                  "PendingApproval"
                    ? null
                    : decidedById,

                reviewedByName:
                  parentStatus ===
                  "PendingApproval"
                    ? null
                    : decidedByName,

                reviewedByRole:
                  parentStatus ===
                  "PendingApproval"
                    ? null
                    : decidedByRole,

                reviewComment:
                  parentStatus ===
                  "PendingApproval"
                    ? null
                    : comment,
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                approval.moc.dailyWse
                  .tenantId,

              planningRecordId:
                planningRecordId,

              eventType:
                decision ===
                "Approved"
                  ? "Daily WSE MOC Approved and Signed"
                  : "Daily WSE MOC Approval Decision",

              revisionNumber:
                approval.moc.dailyWse
                  .revisionNumber,

              actorId:
                decidedById,

              actorName:
                decidedByName,

              actorRole:
                decidedByRole,

              comment:
                comment ??
                `${approval.roleLabel}: ${decision}.`,

              metadata: {
                dailyWseId:
                  wseId,

                mocId:
                  mocId,

                approvalId:
                  approvalId,

                roleCode:
                  approval.roleCode,

                roleLabel:
                  approval.roleLabel,

                required:
                  approval.required,

                decision,

                approvalStatus:
                  decision,

                mocStatus:
                  parentStatus,

                signatureRequired:
                  approval.signatureRequired,

                signatureCaptured:
                  decision ===
                  "Approved",

                signatureType:
                  decision ===
                  "Approved"
                    ? signatureType
                    : null,

                signedAt:
                  signedAt
                    ? signedAt.toISOString()
                    : null,

                requiredApprovalCount:
                  requiredApprovals.length,

                approvedRequiredCount:
                  requiredApprovals.filter(
                    (
                      item,
                    ) =>
                      item.status ===
                      "Approved",
                  ).length,

                pendingRequiredCount:
                  requiredApprovals.filter(
                    (
                      item,
                    ) =>
                      item.status ===
                      "Pending",
                  ).length,
              },
            },
          });

          return {
            approval:
              updatedApproval,

            approvals,

            moc:
              updatedMoc,
          };
        },
      );

    return NextResponse.json({
      message:
        result.moc.status ===
        "Approved"
          ? "MOC approved and signed."
          : result.moc.status ===
              "Rejected"
            ? "MOC rejected."
            : result.moc.status ===
                "RevisionRequired"
              ? "MOC revision required."
              : "Approval decision recorded.",

      approval:
        result.approval,

      approvals:
        result.approvals,

      moc:
        result.moc,
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        MocApproverAuthorizationError
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
      "Unable to record Daily WSE MOC approval decision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to record MOC approval decision.",
      },
      {
        status:
          500,
      },
    );
  }
}