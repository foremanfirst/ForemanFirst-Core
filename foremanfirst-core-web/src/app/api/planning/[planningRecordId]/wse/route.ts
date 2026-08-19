import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function toNullableDate(
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed;
}

function startOfDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0,
  );

  return result;
}

function endOfDay(
  date: Date,
) {
  const result =
    new Date(date);

  result.setHours(
    23,
    59,
    59,
    999,
  );

  return result;
}

function utcDateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } =
      await context.params;

    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
        },
      });

    if (!planningRecord) {
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

    const wseRecords =
      await prisma.dailyWorkerSafetyEngagement.findMany({
        where: {
          planningRecordId,
          tenantId:
            planningRecord.tenantId,
        },

        orderBy: [
          {
            engagementDate:
              "desc",
          },
          {
            createdAt:
              "desc",
          },
        ],

        include: {
          tasks: {
            orderBy: {
              sequence: "asc",
            },
          },

          signatures: {
            orderBy: {
              createdAt: "asc",
            },
          },

          mocRecords: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    return NextResponse.json({
      wseRecords,
    });
  } catch (error) {
    console.error(
      "Unable to load Daily WSE records:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load Daily WSE records.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } =
      await context.params;

    const body =
      await request.json();

    const foremanName =
      toNullableString(
        body.foremanName,
      );

    const foremanId =
      toNullableString(
        body.foremanId,
      );

    if (!foremanName) {
      return NextResponse.json(
        {
          message:
            "Foreman / supervisor name is required.",
        },
        {
          status: 400,
        },
      );
    }

    const requestedDate =
      toNullableDate(
        body.engagementDate,
      ) ??
      new Date();

    const planningRecord =
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
          effectiveStartDate: true,
          effectiveEndDate: true,

          planType: true,
          title: true,

          projectId: true,
          contractorId: true,

          responsibleSupervisor:
            true,
          responsibleSupervisorId:
            true,

          workLocation: true,
          shift: true,

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

          workSteps: {
            orderBy: {
              sequence: "asc",
            },

            select: {
              id: true,
              sequence: true,
              title: true,
              description: true,
              hazards: true,
              controls: true,
              safetyCritical: true,
              riskLevel: true,
            },
          },
        },
      });

    if (!planningRecord) {
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
      planningRecord.status !==
      "Approved"
    ) {
      return NextResponse.json(
        {
          message:
            "A Daily WSE can only be started from an Approved planning record.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !planningRecord.effectiveStartDate ||
      !planningRecord.effectiveEndDate
    ) {
      return NextResponse.json(
        {
          message:
            "The approved planning record does not have a complete effective date range.",
        },
        {
          status: 409,
        },
      );
    }

    const effectiveStartDate =
      planningRecord.effectiveStartDate;

    const effectiveEndDate =
      planningRecord.effectiveEndDate;

    const requestedDateKey =
      utcDateKey(
        requestedDate,
      );

    const effectiveStartDateKey =
      utcDateKey(
        effectiveStartDate,
      );

    const effectiveEndDateKey =
      utcDateKey(
        effectiveEndDate,
      );

    if (
      requestedDateKey <
      effectiveStartDateKey
    ) {
      return NextResponse.json(
        {
          message:
            "The Daily WSE date is before this PTP becomes effective.",

          effectiveStartDate,
          effectiveEndDate,
        },
        {
          status: 409,
        },
      );
    }

    if (
      requestedDateKey >
      effectiveEndDateKey
    ) {
      return NextResponse.json(
        {
          message:
            "This PTP has expired for the selected Daily WSE date. Revise or extend the PTP before starting another Daily WSE.",

          effectiveStartDate,
          effectiveEndDate,
        },
        {
          status: 409,
        },
      );
    }

    const requestedDayStart =
      startOfDay(
        requestedDate,
      );

    const requestedDayEnd =
      endOfDay(
        requestedDate,
      );

    const approvedRevision =
      await prisma.planningRevision.findFirst({
        where: {
          planningRecordId,

          tenantId:
            planningRecord.tenantId,

          revisionNumber:
            planningRecord.revisionNumber,
        },

        select: {
          id: true,
          revisionNumber: true,
          status: true,
        },
      });

    if (!approvedRevision) {
      return NextResponse.json(
        {
          message:
            "The approved planning revision snapshot could not be found.",
        },
        {
          status: 409,
        },
      );
    }

    const requestedShift =
      toNullableString(
        body.shift,
      ) ??
      planningRecord.shift ??
      null;

    const existingDailyWse =
      await prisma.dailyWorkerSafetyEngagement.findFirst({
        where: {
          planningRecordId,

          tenantId:
            planningRecord.tenantId,

          revisionNumber:
            planningRecord.revisionNumber,

          engagementDate: {
            gte:
              requestedDayStart,

            lte:
              requestedDayEnd,
          },

          ...(requestedShift
            ? {
                shift:
                  requestedShift,
              }
            : {}),
        },

        include: {
          tasks: {
            orderBy: {
              sequence: "asc",
            },
          },

          signatures: {
            orderBy: {
              createdAt: "asc",
            },
          },

          mocRecords: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (existingDailyWse) {
      return NextResponse.json(
        {
          message:
            "A Daily WSE already exists for this planning revision, date, and shift.",

          wse:
            existingDailyWse,

          existing:
            true,
        },
        {
          status: 409,
        },
      );
    }

    if (
      planningRecord.workSteps.length ===
      0
    ) {
      return NextResponse.json(
        {
          message:
            "The approved planning record does not contain any work steps to carry into the Daily WSE.",
        },
        {
          status: 409,
        },
      );
    }

    const created =
      await prisma.$transaction(
        async (tx) => {
          const dailyWse =
            await tx.dailyWorkerSafetyEngagement.create({
              data: {
                tenantId:
                  planningRecord.tenantId,

                planningRecordId,

                revisionNumber:
                  planningRecord.revisionNumber,

                engagementDate:
                  requestedDate,

                shift:
                  requestedShift,

                foremanId,

                foremanName,

                workLocation:
                  toNullableString(
                    body.workLocation,
                  ) ??
                  planningRecord.workLocation ??
                  null,

                dailyRiskLevel:
                  toNullableString(
                    body.dailyRiskLevel,
                  ),

                emergencyActionPlanReviewed:
                  false,

                emergencyNotes:
                  null,

                changeStatus:
                  "No Changes",

                status:
                  "Open",

                createdBy:
                  toNullableString(
                    body.createdBy,
                  ) ??
                  foremanId,

                updatedBy:
                  toNullableString(
                    body.createdBy,
                  ) ??
                  foremanId,
              },
            });

          await tx.dailyWorkerSafetyEngagementTask.createMany({
            data:
              planningRecord.workSteps.map(
                (
                  step,
                  index,
                ) => ({
                  tenantId:
                    planningRecord.tenantId,

                  dailyWseId:
                    dailyWse.id,

                  sequence:
                    index + 1,

                  taskDescription:
                    step.description
                      ? `${step.title} — ${step.description}`
                      : step.title,

                  hazards:
                    step.hazards ??
                    "",

                  mitigations:
                    step.controls ??
                    "",

                  riskLevel:
                    step.riskLevel,

                  safetyCritical:
                    step.safetyCritical,
                }),
              ),
          });

          await tx.planningEvent.create({
            data: {
              tenantId:
                planningRecord.tenantId,

              planningRecordId,

              eventType:
                "Daily WSE Started",

              previousStatus:
                planningRecord.status,

              newStatus:
                planningRecord.status,

              revisionNumber:
                planningRecord.revisionNumber,

              actorId:
                foremanId,

              actorName:
                foremanName,

              actorRole:
                toNullableString(
                  body.foremanRole,
                ) ??
                "Foreman / Supervisor",

              comment:
                "Daily Worker Safety Engagement started from the approved and effective planning revision.",

              metadata: {
                dailyWseId:
                  dailyWse.id,

                engagementDate:
                  requestedDate.toISOString(),

                shift:
                  requestedShift,

                copiedWorkStepCount:
                  planningRecord.workSteps.length,

                planningRevisionId:
                  approvedRevision.id,

                planningRevisionNumber:
                  planningRecord.revisionNumber,

                effectiveStartDate:
                  effectiveStartDate.toISOString(),

                effectiveEndDate:
                  effectiveEndDate.toISOString(),
              },
            },
          });

          return tx.dailyWorkerSafetyEngagement.findUnique({
            where: {
              id:
                dailyWse.id,
            },

            include: {
              tasks: {
                orderBy: {
                  sequence:
                    "asc",
                },
              },

              signatures: {
                orderBy: {
                  createdAt:
                    "asc",
                },
              },

              mocRecords: {
                orderBy: {
                  createdAt:
                    "asc",
                },
              },
            },
          });
        },
      );

    return NextResponse.json(
      {
        wse:
          created,

        source: {
          planningRecordId:
            planningRecord.id,

          planningRevisionId:
            approvedRevision.id,

          revisionNumber:
            planningRecord.revisionNumber,

          effectiveStartDate,
          effectiveEndDate,

          planType:
            planningRecord.planType,

          planTitle:
            planningRecord.title,

          project:
            planningRecord.project,

          contractor:
            planningRecord.contractor,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to start Daily WSE:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to start Daily WSE.",
      },
      {
        status: 500,
      },
    );
  }
}