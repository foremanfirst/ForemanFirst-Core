import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type WorkStepInput = {
  sequence: number;
  title: string;
  description?: string | null;
  hazards?: string | null;
  controls?: string | null;
  safetyCritical?: boolean;
  riskLevel?: string | null;
};

type QuestionResponseInput = {
  questionId: string;
  category: string;
  question: string;
  helpText?: string | null;
  isCritical?: boolean;
  responseValue?: string | null;
  notes?: string | null;
};

type ConfirmedActivityInput = {
  activityCode: string;
  name: string;
  category?: string | null;

  /**
   * How the activity was originally identified.
   *
   * Current supported values:
   * - User
   * - AI
   * - Requirement
   * - System
   *
   * The current keyword/rule detection engine should normally
   * send System rather than AI.
   */
  detectionSource?: string | null;

  /**
   * Detection score returned by the current activity detector.
   * The browser currently works with scores such as 60, 70, 80.
   * We convert these to 0.6000, 0.7000, 0.8000 for persistence.
   */
  score?: number | string | null;

  /**
   * Future AI integrations may send confidence directly.
   * Values from 0-1 are stored directly.
   * Values from 0-100 are converted to 0-1.
   */
  aiConfidence?: number | string | null;
};

function nullableString(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed
    ? trimmed
    : null;
}

function boundedScore(
  value: unknown,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.trunc(parsed),
    ),
  );
}

function normalizeDetectionSource(
  value: unknown,
) {
  const normalized =
    nullableString(value);

  if (
    normalized === "User" ||
    normalized === "AI" ||
    normalized === "Requirement" ||
    normalized === "System"
  ) {
    return normalized;
  }

  return "System";
}

function normalizeConfidence(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  /**
   * Allow either:
   *
   * 0.70
   *
   * or:
   *
   * 70
   *
   * from the caller.
   */
  const normalized =
    parsed > 1
      ? parsed / 100
      : parsed;

  return Math.max(
    0,
    Math.min(
      1,
      normalized,
    ),
  );
}

function getActivityConfidence(
  activity: ConfirmedActivityInput,
) {
  if (
    activity.aiConfidence !== null &&
    activity.aiConfidence !== undefined
  ) {
    return normalizeConfidence(
      activity.aiConfidence,
    );
  }

  return normalizeConfidence(
    activity.score,
  );
}

function normalizeConfirmedActivities(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const activities =
    value as ConfirmedActivityInput[];

  /**
   * A Map prevents the same activityCode from being
   * persisted twice if the browser accidentally sends
   * duplicate selections.
   */
  const byCode =
    new Map<
      string,
      ConfirmedActivityInput
    >();

  for (const activity of activities) {
    const activityCode =
      nullableString(
        activity?.activityCode,
      );

    const name =
      nullableString(
        activity?.name,
      );

    if (
      !activityCode ||
      !name
    ) {
      continue;
    }

    byCode.set(
      activityCode,
      {
        ...activity,
        activityCode,
        name,
        category:
          nullableString(
            activity.category,
          ),
      },
    );
  }

  return Array.from(
    byCode.values(),
  );
}


export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },

        select: {
          id: true,

          activities: {
            where: {
              isActive: true,
              confirmationStatus:
                "Confirmed",
            },

            orderBy: {
              createdAt: "asc",
            },

            select: {
              activityCode: true,
              name: true,
              category: true,
              detectionSource: true,
              aiConfidence: true,
            },
          },
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

    const activities =
      existing.activities.map(
        (activity) => ({
          activityCode:
            activity.activityCode,

          name:
            activity.name,

          category:
            activity.category,

          detectionSource:
            activity.detectionSource,

          score:
            activity.aiConfidence !==
              null
              ? Math.round(
                  Number(
                    activity.aiConfidence,
                  ) * 100,
                )
              : 0,
        }),
      );

    return NextResponse.json({
      planningRecordId:
        existing.id,

      activities,

      count:
        activities.length,
    });
  } catch (error) {
    console.error(
      "Unable to load guided planning activities:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load guided planning activities.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const body =
      await request.json();

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
          responsibleSupervisor: true,
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
      existing.status !== "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft planning records can be edited.",
        },
        {
          status: 409,
        },
      );
    }

    const workSteps =
      Array.isArray(body.workSteps)
        ? (body.workSteps as WorkStepInput[])
        : [];

    const questionResponses =
      Array.isArray(
        body.questionResponses,
      )
        ? (body.questionResponses as QuestionResponseInput[])
        : [];

    const confirmedActivities =
      normalizeConfirmedActivities(
        body.confirmedActivities,
      );

    const confirmedBy =
      nullableString(
        body.confirmedBy,
      ) ??
      nullableString(
        existing.responsibleSupervisor,
      );

    if (workSteps.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one work step is required.",
        },
        {
          status: 400,
        },
      );
    }

    for (
      let index = 0;
      index < workSteps.length;
      index += 1
    ) {
      const step =
        workSteps[index];

      if (
        !nullableString(
          step.title,
        )
      ) {
        return NextResponse.json(
          {
            message:
              `Work step ${index + 1} requires a title.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        !nullableString(
          step.hazards,
        )
      ) {
        return NextResponse.json(
          {
            message:
              `Work step ${index + 1} requires hazards.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        !nullableString(
          step.controls,
        )
      ) {
        return NextResponse.json(
          {
            message:
              `Work step ${index + 1} requires controls.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        ![
          "Low",
          "Medium",
          "High",
        ].includes(
          nullableString(
            step.riskLevel,
          ) ?? "",
        )
      ) {
        return NextResponse.json(
          {
            message:
              `Work step ${index + 1} requires a valid risk level.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    const criticalMissing =
      questionResponses.filter(
        (response) =>
          response.isCritical &&
          !nullableString(
            response.responseValue,
          ),
      );

    if (
      criticalMissing.length > 0
    ) {
      return NextResponse.json(
        {
          message:
            "All safety-critical planning questions require a response.",
        },
        {
          status: 400,
        },
      );
    }

    const saved =
      await prisma.$transaction(
        async (tx) => {
          const record =
            await tx.planningRecord.update({
              where: {
                id: planningRecordId,
              },

              data: {
                requiredPpe:
                  nullableString(
                    body.requiredPpe,
                  ),

                requiredPermits:
                  nullableString(
                    body.requiredPermits,
                  ),

                emergencyPlan:
                  nullableString(
                    body.emergencyPlan,
                  ),

                stopWorkTriggers:
                  nullableString(
                    body.stopWorkTriggers,
                  ),

                planningNotes:
                  nullableString(
                    body.planningNotes,
                  ),

                qualityScore:
                  boundedScore(
                    body.qualityScore,
                  ),
              },
            });

          // ===================================================
          // CURRENT ACTIVITY STATE BEFORE SAVE
          // ===================================================

          const existingActivities =
            await tx.planningActivity.findMany({
              where: {
                planningRecordId,
                tenantId:
                  existing.tenantId,
              },

              select: {
                activityCode: true,
                name: true,
                category: true,
                detectionSource: true,
                aiConfidence: true,
                confirmationStatus: true,
                confirmedBy: true,
                confirmedAt: true,
                isActive: true,
              },
            });

          const previouslyActiveCodes =
            existingActivities
              .filter(
                (activity) =>
                  activity.isActive,
              )
              .map(
                (activity) =>
                  activity.activityCode,
              );

          const confirmedCodes =
            confirmedActivities.map(
              (activity) =>
                activity.activityCode,
            );

          const confirmedCodeSet =
            new Set(
              confirmedCodes,
            );

          const removedActivityCodes =
            previouslyActiveCodes.filter(
              (activityCode) =>
                !confirmedCodeSet.has(
                  activityCode,
                ),
            );

          const now =
            new Date();

          // ===================================================
          // DEACTIVATE ACTIVITIES USER REMOVED
          // ===================================================

          if (
            removedActivityCodes.length >
            0
          ) {
            await tx.planningActivity.updateMany({
              where: {
                planningRecordId,
                tenantId:
                  existing.tenantId,

                activityCode: {
                  in: removedActivityCodes,
                },
              },

              data: {
                isActive: false,
                confirmationStatus:
                  "Removed",
              },
            });
          }

          // ===================================================
          // UPSERT CURRENT CONFIRMED ACTIVITIES
          // ===================================================

          for (
            const activity of
            confirmedActivities
          ) {
            const confidence =
              getActivityConfidence(
                activity,
              );

            await tx.planningActivity.upsert({
              where: {
                planningRecordId_activityCode:
                  {
                    planningRecordId,
                    activityCode:
                      activity.activityCode,
                  },
              },

              create: {
                tenantId:
                  existing.tenantId,

                planningRecordId,

                activityCode:
                  activity.activityCode,

                name:
                  activity.name,

                category:
                  nullableString(
                    activity.category,
                  ),

                detectionSource:
                  normalizeDetectionSource(
                    activity.detectionSource,
                  ),

                aiConfidence:
                  confidence,

                confirmationStatus:
                  "Confirmed",

                confirmedBy,

                confirmedAt:
                  now,

                isActive:
                  true,
              },

              update: {
                tenantId:
                  existing.tenantId,

                name:
                  activity.name,

                category:
                  nullableString(
                    activity.category,
                  ),

                detectionSource:
                  normalizeDetectionSource(
                    activity.detectionSource,
                  ),

                aiConfidence:
                  confidence,

                confirmationStatus:
                  "Confirmed",

                confirmedBy,

                confirmedAt:
                  now,

                isActive:
                  true,
              },
            });
          }

          // ===================================================
          // REPLACE WORK STEPS
          // ===================================================

          await tx.planningWorkStep.deleteMany({
            where: {
              planningRecordId,
              tenantId:
                existing.tenantId,
            },
          });

          await tx.planningQuestionResponse.deleteMany({
            where: {
              planningRecordId,
              tenantId:
                existing.tenantId,
            },
          });

          await tx.planningWorkStep.createMany({
            data:
              workSteps.map(
                (
                  step,
                  index,
                ) => ({
                  tenantId:
                    existing.tenantId,

                  planningRecordId,

                  sequence:
                    index + 1,

                  title:
                    nullableString(
                      step.title,
                    )!,

                  description:
                    nullableString(
                      step.description,
                    ),

                  hazards:
                    nullableString(
                      step.hazards,
                    ),

                  controls:
                    nullableString(
                      step.controls,
                    ),

                  safetyCritical:
                    Boolean(
                      step.safetyCritical,
                    ),

                  riskLevel:
                    nullableString(
                      step.riskLevel,
                    ),
                }),
              ),
          });

          // ===================================================
          // REPLACE GUIDED QUESTION RESPONSES
          // ===================================================

          if (
            questionResponses.length >
            0
          ) {
            await tx.planningQuestionResponse.createMany({
              data:
                questionResponses.map(
                  (response) => ({
                    tenantId:
                      existing.tenantId,

                    planningRecordId,

                    questionId:
                      response.questionId,

                    category:
                      response.category,

                    question:
                      response.question,

                    helpText:
                      nullableString(
                        response.helpText,
                      ),

                    isCritical:
                      Boolean(
                        response.isCritical,
                      ),

                    responseValue:
                      nullableString(
                        response.responseValue,
                      ),

                    notes:
                      nullableString(
                        response.notes,
                      ),
                  }),
                ),
            });
          }

          // ===================================================
          // AUDIT EVENT
          // ===================================================

          await tx.planningEvent.create({
            data: {
              tenantId:
                existing.tenantId,

              planningRecordId,

              eventType:
                "GuidedPlanningSaved",

              revisionNumber:
                null,

              actorName:
                confirmedBy,

              actorRole:
                confirmedBy
                  ? "Responsible Supervisor"
                  : null,

              comment:
                "Guided planning, confirmed activities, work steps, and planning responses were saved.",

              metadata: {
                confirmedActivityCodes:
                  confirmedCodes,

                removedActivityCodes,

                workStepCount:
                  workSteps.length,

                questionResponseCount:
                  questionResponses.length,
              },
            },
          });

          return {
            record,

            activitySummary: {
              confirmed:
                confirmedCodes.length,

              removed:
                removedActivityCodes.length,

              confirmedCodes,

              removedCodes:
                removedActivityCodes,
            },
          };
        },
      );

    return NextResponse.json({
      record:
        saved.record,

      saved: {
        activities:
          saved.activitySummary.confirmed,

        removedActivities:
          saved.activitySummary.removed,

        workSteps:
          workSteps.length,

        questionResponses:
          questionResponses.length,
      },

      activities: {
        confirmedCodes:
          saved.activitySummary.confirmedCodes,

        removedCodes:
          saved.activitySummary.removedCodes,
      },
    });
  } catch (error) {
    console.error(
      "Unable to save guided planning:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save guided planning.",
      },
      {
        status: 500,
      },
    );
  }
}