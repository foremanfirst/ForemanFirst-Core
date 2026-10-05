import { NextResponse } from "next/server";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type WorkStepInput = {
  sequence?: number;
  title?: string | null;
  description?: string | null;
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

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    /*
     * Authorization is intentionally resolved before
     * request-body parsing or any mutation work.
     *
     * Draft-authoring access requires:
     * - authenticated user
     * - active tenant membership
     * - active project membership
     * - canCreatePlanning OR canManagePlanning
     */
    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
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
          projectId: true,
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

    if (existing.status !== "Draft") {
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

    const body =
      await request.json();

    const workSteps =
      Array.isArray(body.workSteps)
        ? (body.workSteps as WorkStepInput[])
        : [];

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

    const normalizedSteps =
      workSteps.map(
        (step, index) => ({
          sequence:
            index + 1,

          title:
            nullableString(
              step.title,
            ),

          description:
            nullableString(
              step.description,
            ),
        }),
      );

    for (
      let index = 0;
      index < normalizedSteps.length;
      index += 1
    ) {
      if (
        !normalizedSteps[index].title
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
    }

    const actorRole =
      authorization.membership.roleCodes.length >
      0
        ? authorization.membership.roleCodes.join(
            ", ",
          )
        : "Planning Editor";

    const saved =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Step 4 owns the preliminary work sequence.
           *
           * At this stage hazards, controls, safety-critical
           * designation, and risk level have not necessarily
           * been completed yet.
           *
           * Those fields are enriched during Guided Planning.
           */
          await tx.planningWorkStep.deleteMany({
            where: {
              planningRecordId,

              tenantId:
                existing.tenantId,
            },
          });

          await tx.planningWorkStep.createMany({
            data:
              normalizedSteps.map(
                (step) => ({
                  tenantId:
                    existing.tenantId,

                  planningRecordId,

                  sequence:
                    step.sequence,

                  title:
                    step.title!,

                  description:
                    step.description,

                  hazards:
                    null,

                  controls:
                    null,

                  safetyCritical:
                    false,

                  riskLevel:
                    null,
                }),
              ),
          });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existing.tenantId,

              planningRecordId,

              eventType:
                "WorkSequenceSaved",

              revisionNumber:
                null,

              actorId:
                authorization.user.id,

              actorName:
                authorization.user.displayName,

              actorRole,

              comment:
                "Preliminary work sequence was saved during scope planning.",

              metadata: {
                workStepCount:
                  normalizedSteps.length,
              },
            },
          });

          return tx.planningWorkStep.findMany({
            where: {
              planningRecordId,

              tenantId:
                existing.tenantId,
            },

            orderBy: {
              sequence: "asc",
            },
          });
        },
      );

    return NextResponse.json({
      workSteps: saved,

      saved: {
        workSteps:
          saved.length,
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
      "Unable to save planning work sequence:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save planning work sequence.",
      },
      {
        status: 500,
      },
    );
  }
}
