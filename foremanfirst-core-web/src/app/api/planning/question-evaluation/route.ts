import { NextResponse } from "next/server";
import { evaluatePlanningQuestions } from "@/lib/planning/question-evaluator";

export const dynamic = "force-dynamic";

function nullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const tenantId = nullableString(body.tenantId);

    const activityCodes = Array.isArray(
      body.activityCodes,
    )
      ? body.activityCodes.filter(
          (value: unknown): value is string =>
            typeof value === "string",
        )
      : [];

    const answers =
      body.answers &&
      typeof body.answers === "object" &&
      !Array.isArray(body.answers)
        ? body.answers
        : {};

    if (!tenantId) {
      return NextResponse.json(
        {
          message: "Tenant ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const questions =
      await evaluatePlanningQuestions({
        tenantId,
        activityCodes,
        answers,
      });

    return NextResponse.json({
      activityCodes,
      answers,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error(
      "Unable to evaluate planning questions:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to evaluate planning questions.",
      },
      {
        status: 500,
      },
    );
  }
}