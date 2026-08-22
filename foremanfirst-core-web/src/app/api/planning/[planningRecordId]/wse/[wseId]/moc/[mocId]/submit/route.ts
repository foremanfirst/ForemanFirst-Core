import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  resolveMocApprovalRouting,
} from "@/lib/planning/approval-routing";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    wseId: string;
    mocId: string;
  }>;
};

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

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      wseId,
      mocId,
    } =
      await context.params;

    const body =
      await request.json();

    const moc =
      await prisma.dailyWorkerSafetyEngagementMoc.findFirst({
        where: {
          id:
            mocId,

          dailyWseId:
            wseId,

          dailyWse: {
            planningRecordId:
              planningRecordId,
          },
        },

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

              foremanName:
                true,

              status:
                true,
            },
          },

          approvals:
            true,
        },
      });

    if (!moc) {
      return NextResponse.json(
        {
          message:
            "MOC record was not found.",
        },
        {
          status:
            404,
        },
      );
    }

    if (
      moc.dailyWse.status ===
      "Completed"
    ) {
      return NextResponse.json(
        {
          message:
            "Completed Daily WSE records are locked.",
        },
        {
          status:
            409,
        },
      );
    }

    if (
      moc.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft MOC records can be submitted for approval.",
        },
        {
          status:
            409,
        },
      );
    }

    if (
      moc.approvals.length >
      0
    ) {
      return NextResponse.json(
        {
          message:
            "This Draft MOC already contains approval records and cannot be submitted again.",
        },
        {
          status:
            409,
        },
      );
    }

    if (
      !toNullableString(
        moc.changeDescription,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Describe the change before submitting the MOC.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      !toNullableString(
        moc.newHazards,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Document the new or changed hazards before submitting the MOC.",
        },
        {
          status:
            400,
        },
      );
    }

    if (
      !toNullableString(
        moc.newMitigations,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Document the new or changed controls before submitting the MOC.",
        },
        {
          status:
            400,
        },
      );
    }

    const routing =
      await resolveMocApprovalRouting(
        planningRecordId,
      );

    if (
      routing.roles.length ===
      0
    ) {
      return NextResponse.json(
        {
          message:
            "No MOC approval routing is configured for this project. Configure at least one MOC approver role before submission.",
        },
        {
          status:
            409,
        },
      );
    }

    const requiredRoles =
      routing.roles.filter(
        (
          role,
        ) =>
          role.required,
      );

    if (
      requiredRoles.length ===
      0
    ) {
      return NextResponse.json(
        {
          message:
            "MOC approval routing must include at least one required approver.",
        },
        {
          status:
            409,
        },
      );
    }

    const submittedAt =
      new Date();

    const submittedById =
      toNullableString(
        body.submittedById,
      );

    const submittedByName =
      toNullableString(
        body.submittedByName,
      ) ??
      moc.dailyWse.foremanName;

    const submittedByRole =
      toNullableString(
        body.submittedByRole,
      ) ??
      "Foreman / Supervisor";

    const result =
      await prisma.$transaction(
        async (
          tx,
        ) => {
          const updatedMoc =
            await tx.dailyWorkerSafetyEngagementMoc.update({
              where: {
                id:
                  mocId,
              },

              data: {
                status:
                  "PendingApproval",

                submittedById,

                submittedByName,

                submittedByRole,

                submittedAt,

                approvalRouting: {
                  roles:
                    routing.roles.map(
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

                        signerId:
                          role.signerId,

                        signerName:
                          role.signerName,

                        signerEmail:
                          role.signerEmail,

                        sourceType:
                          role.sourceType,

                        sources:
                          role.sources,
                      }),
                    ),

                  applicablePacks:
                    routing.applicablePacks,

                  metadata:
                    routing.metadata,
                },
              },
            });

          await tx.dailyWorkerSafetyEngagementMocApproval.createMany({
            data:
              routing.roles.map(
                (
                  role,
                ) => ({
                  tenantId:
                    moc.dailyWse.tenantId,

                  mocId:
                    mocId,

                  roleCode:
                    role.code,

                  roleLabel:
                    role.label,

                  required:
                    role.required,

                  sortOrder:
                    role.order,

                  approverId:
                    role.signerId,

                  approverName:
                    role.signerName,

                  approverEmail:
                    role.signerEmail,

                  status:
                    "Pending",

                  decision:
                    null,

                  comment:
                    null,

                  decidedById:
                    null,

                  decidedByName:
                    null,

                  decidedByRole:
                    null,

                  decidedAt:
                    null,

                  notifiedAt:
                    null,
                }),
              ),
          });

          await tx.planningEvent.create({
            data: {
              tenantId:
                moc.dailyWse.tenantId,

              planningRecordId:
                planningRecordId,

              eventType:
                "Daily WSE MOC Submitted",

              revisionNumber:
                moc.dailyWse.revisionNumber,

              actorId:
                submittedById,

              actorName:
                submittedByName,

              actorRole:
                submittedByRole,

              comment:
                "Daily WSE MOC submitted for approval.",

              metadata: {
                dailyWseId:
                  wseId,

                mocId:
                  mocId,

                mocStatus:
                  "PendingApproval",

                requiresPtpRevision:
                  moc.requiresPtpRevision,

                approverRoleCount:
                  routing.roles.length,

                requiredApproverRoleCount:
                  requiredRoles.length,

                approvalRecordsCreated:
                  routing.roles.length,

                notificationTrigger:
                  true,

                notificationsDispatched:
                  false,
              },
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

          return {
            moc:
              updatedMoc,

            approvals,
          };
        },
      );

    return NextResponse.json({
      moc:
        result.moc,

      approvals:
        result.approvals,

      routing,

      notification: {
        trigger:
          true,

        dispatched:
          false,

        message:
          "MOC submitted successfully. Notification delivery will occur through the configured notification service.",
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Unable to submit Daily WSE MOC:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit Daily WSE MOC.",
      },
      {
        status:
          500,
      },
    );
  }
}