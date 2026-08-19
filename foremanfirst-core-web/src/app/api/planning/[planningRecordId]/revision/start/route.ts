import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const body =
      await request.json();

    const revisionReason =
      toNullableString(
        body.revisionReason,
      );

    const actorId =
      toNullableString(
        body.actorId,
      );

    const actorName =
      toNullableString(
        body.actorName,
      );

    const actorRole =
      toNullableString(
        body.actorRole,
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

    if (
      !actorName ||
      !actorRole
    ) {
      return NextResponse.json(
        {
          message:
            "Actor name and role are required before starting a new revision.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
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

    const record =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.planningRecord.update({
              where: {
                id: planningRecordId,
              },

              data: {
                revisionNumber:
                  nextRevisionNumber,

                status: "Draft",

                submittedAt: null,
                approvedAt: null,
                activeAt: null,

                updatedBy:
                  actorId,
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
                    projectCode: true,
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

              actorId,

              actorName,

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
      },
    });
  } catch (error) {
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