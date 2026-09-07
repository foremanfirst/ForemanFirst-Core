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

type ActivityInput = {
  activityCode: string;
  name: string;
  category?: string | null;
  detectionSource?: string | null;
  score?: number | string | null;
  aiConfidence?: number | string | null;
  confirmationStatus?: string | null;
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
  activity: ActivityInput,
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

function normalizeConfirmationStatus(
  value: unknown,
) {
  return value === "Confirmed"
    ? "Confirmed"
    : "Pending";
}

function normalizeActivities(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const activities =
    value as ActivityInput[];

  const byCode =
    new Map<
      string,
      ActivityInput
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

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    const activities =
      normalizeActivities(
        body.activities,
      );

    const existing =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord.tenantId,
          projectId:
            authorization.planningRecord.projectId,
          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
          status: true,
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
            "Only Draft planning records can update detected activities.",
        },
        {
          status: 409,
        },
      );
    }

    const confirmedBy =
      authorization.user.displayName;

    const actorRole =
      authorization.membership.roleCodes.join(
        ", ",
      ) || "Planning Editor";

    const saved =
      await prisma.$transaction(
        async (tx) => {
          const existingActivities =
            await tx.planningActivity.findMany({
              where: {
                planningRecordId,
                tenantId:
                  existing.tenantId,
                isActive: true,
              },

              select: {
                activityCode: true,
              },
            });

          const nextActivityCodes =
            activities.map(
              (activity) =>
                activity.activityCode,
            );

          const nextActivityCodeSet =
            new Set(
              nextActivityCodes,
            );

          const removedActivityCodes =
            existingActivities
              .map(
                (activity) =>
                  activity.activityCode,
              )
              .filter(
                (activityCode) =>
                  !nextActivityCodeSet.has(
                    activityCode,
                  ),
              );

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
                  in:
                    removedActivityCodes,
                },
              },

              data: {
                isActive: false,
                confirmationStatus:
                  "Removed",
              },
            });
          }

          const now =
            new Date();

          for (const activity of activities) {
            const confidence =
              getActivityConfidence(
                activity,
              );

            const confirmationStatus =
              normalizeConfirmationStatus(
                activity.confirmationStatus,
              );

            const isConfirmed =
              confirmationStatus ===
              "Confirmed";

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

                /*
                 * Detection is only a Qoreva suggestion. A qualified user
                 * must explicitly confirm applicability in Step 5 before
                 * the activity can drive the official planning record.
                 */
                confirmationStatus,

                confirmedBy:
                  isConfirmed
                    ? confirmedBy
                    : null,

                confirmedAt:
                  isConfirmed
                    ? now
                    : null,

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

                confirmationStatus,

                confirmedBy:
                  isConfirmed
                    ? confirmedBy
                    : null,

                confirmedAt:
                  isConfirmed
                    ? now
                    : null,

                isActive:
                  true,
              },
            });
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existing.tenantId,

              planningRecordId,

              eventType:
                "PlanningActivitiesDetected",

              revisionNumber:
                null,

              actorId:
                authorization.user.id,

              actorName:
                authorization.user.displayName,

              actorRole,

              comment:
                "Detected planning activities were checkpointed before Guided Planning.",

              metadata: {
                activityCodes:
                  nextActivityCodes,

                removedActivityCodes,

                activityCount:
                  nextActivityCodes.length,
              },
            },
          });

          return {
            activityCodes:
              nextActivityCodes,

            removedActivityCodes,
          };
        },
      );

    return NextResponse.json({
      planningRecordId,

      saved: {
        activities:
          saved.activityCodes.length,

        removedActivities:
          saved.removedActivityCodes.length,
      },

      activities:
        saved.activityCodes,

      removedActivities:
        saved.removedActivityCodes,
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
      "Unable to save detected planning activities:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save detected planning activities.",
      },
      {
        status: 500,
      },
    );
  }
}
