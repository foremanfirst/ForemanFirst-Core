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
        !["Low", "Medium", "High"].includes(
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

          return record;
        },
      );

    return NextResponse.json({
      record: saved,

      saved: {
        workSteps:
          workSteps.length,

        questionResponses:
          questionResponses.length,
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