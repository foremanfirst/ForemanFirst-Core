import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
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

function getAuditRole(
  roleCodes: string[],
) {
  if (roleCodes.length > 0) {
    return roleCodes[0];
  }

  return "Planning Creator";
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    /*
     * Resolve identity and Planning editing authority
     * entirely server-side.
     *
     * The browser is not trusted to provide actorId,
     * actorName, actorRole, tenant, project, or Planning
     * permissions.
     */
    const authorized =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    const revisionReason =
      toNullableString(
        body.revisionReason,
      );

    if (!revisionReason) {
      return NextResponse.json(
        {
          message:
            "A revision reason is required before starting a new revision.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id:
            planningRecordId,

          tenantId:
            authorized
              .planningRecord
              .tenantId,

          projectId:
            authorized
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
          approvedAt: true,
          activeAt: true,
        },
      });

    if (!existing) {
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
      existing.status !==
      "Revision Needed"
    ) {
      return NextResponse.json(
        {
          message:
            "A new revision can only be started when the planning record status is Revision Needed.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      existing.revisionNumber !==
      authorized
        .planningRecord
        .revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "The planning record revision changed before the new revision could be started.",
        },
        {
          status: 409,
        },
      );
    }

    const previousRevisionNumber =
      existing.revisionNumber;

    const nextRevisionNumber =
      previousRevisionNumber + 1;

    const previousRevision =
      await prisma.planningRevision.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existing.tenantId,
          revisionNumber:
            previousRevisionNumber,
        },

        select: {
          id: true,
        },
      });

    if (!previousRevision) {
      return NextResponse.json(
        {
          message:
            "The previous planning revision snapshot could not be found.",
        },
        {
          status: 409,
        },
      );
    }

    const existingNextRevision =
      await prisma.planningRevision.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existing.tenantId,
          revisionNumber:
            nextRevisionNumber,
        },

        select: {
          id: true,
        },
      });

    if (existingNextRevision) {
      return NextResponse.json(
        {
          message:
            `Revision ${nextRevisionNumber} already exists for this planning record.`,
        },
        {
          status: 409,
        },
      );
    }

    const actorRole =
      getAuditRole(
        authorized
          .membership
          .roleCodes,
      );

    const record =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-read the workflow state inside the transaction
           * before advancing the formal revision number.
           */
          const current =
            await tx.planningRecord.findFirst({
              where: {
                id:
                  planningRecordId,

                tenantId:
                  existing.tenantId,

                projectId:
                  existing.projectId,

                isArchived:
                  false,
              },

              select: {
                id: true,
                status: true,
                revisionNumber:
                  true,
              },
            });

          if (!current) {
            throw new PlanningEditorAuthorizationError(
              "Planning record was not found.",
              404,
            );
          }

          if (
            current.status !==
            "Revision Needed"
          ) {
            throw new PlanningEditorAuthorizationError(
              "The planning record is no longer awaiting a new revision.",
              409,
            );
          }

          if (
            current.revisionNumber !==
            previousRevisionNumber
          ) {
            throw new PlanningEditorAuthorizationError(
              "The planning record revision changed before the new revision could be started.",
              409,
            );
          }

          const nextRevisionCheck =
            await tx.planningRevision.findFirst({
              where: {
                planningRecordId,
                tenantId:
                  existing.tenantId,
                revisionNumber:
                  nextRevisionNumber,
              },

              select: {
                id: true,
              },
            });

          if (nextRevisionCheck) {
            throw new PlanningEditorAuthorizationError(
              `Revision ${nextRevisionNumber} already exists for this planning record.`,
              409,
            );
          }

          const updated =
            await tx.planningRecord.update({
              where: {
                id:
                  planningRecordId,
              },

              data: {
                revisionNumber:
                  nextRevisionNumber,

                status:
                  "Draft",

                submittedAt:
                  null,

                approvedAt:
                  null,

                activeAt:
                  null,

                updatedBy:
                  authorized
                    .user.id,
              },

              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

                project: {
                  select: {
                    id: true,
                    name: true,
                    projectCode:
                      true,
                  },
                },

                contractor: {
                  select: {
                    id: true,
                    name: true,
                    legalName: true,
                    trade: true,
                  },
                },
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existing.tenantId,

              planningRecordId,

              eventType:
                "Planning Revision Started",

              previousStatus:
                existing.status,

              newStatus:
                "Draft",

              revisionNumber:
                nextRevisionNumber,

              actorId:
                authorized
                  .user.id,

              actorName:
                authorized
                  .user
                  .displayName,

              actorRole,

              comment:
                revisionReason,

              metadata: {
                previousRevisionNumber,

                newRevisionNumber:
                  nextRevisionNumber,

                previousRevisionId:
                  previousRevision.id,

                revisionReason,

                initiatedBy: {
                  userId:
                    authorized
                      .user.id,

                  email:
                    authorized
                      .user.email,

                  projectMembershipId:
                    authorized
                      .membership
                      .projectMembershipId,

                  roleCodes:
                    authorized
                      .membership
                      .roleCodes,

                  canCreatePlanning:
                    authorized
                      .membership
                      .canCreatePlanning,

                  canManagePlanning:
                    authorized
                      .membership
                      .canManagePlanning,
                },
              },
            },
          });

          return updated;
        },
      );

    return NextResponse.json({
      record,

      revision: {
        previousRevisionNumber,

        currentRevisionNumber:
          nextRevisionNumber,

        revisionReason,

        startedBy: {
          id:
            authorized.user.id,

          name:
            authorized
              .user
              .displayName,

          email:
            authorized
              .user.email,

          role:
            actorRole,
        },
      },
    });
  } catch (error) {
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

    console.error(
      "Unable to start planning revision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to start planning revision.",
      },
      {
        status: 500,
      },
    );
  }
}