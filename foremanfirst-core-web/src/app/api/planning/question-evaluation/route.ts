import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluatePlanningQuestions,
} from "@/lib/planning/question-evaluator";
import {
  evaluatePlanningCompliance,
} from "@/lib/planning/compliance-evaluator";
import {
  resolveApplicablePlanningRequirements,
} from "@/lib/planning/requirement-resolver";

export const dynamic =
  "force-dynamic";

function nullableString(
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
) {
  try {
    const body =
      await request.json();

    const planningRecordId =
      nullableString(
        body.planningRecordId,
      );

    if (!planningRecordId) {
      return NextResponse.json(
        {
          message:
            "Planning Record ID is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const activityCodes =
      Array.isArray(
        body.activityCodes,
      )
        ? body.activityCodes.filter(
            (
              value: unknown,
            ): value is string =>
              typeof value ===
              "string",
          )
        : [];

    const answers =
      body.answers &&
      typeof body.answers ===
        "object" &&
      !Array.isArray(
        body.answers,
      )
        ? (
            body.answers as Record<
              string,
              string | null | undefined
            >
          )
        : {};

    /*
     * Server-side trust boundary:
     *
     * The browser does not choose the tenant or
     * decide which Requirement Rules apply.
     *
     * Qoreva loads the Planning Record, resolves
     * its tenant, evaluates Requirement Pack
     * applicability, and evaluates individual
     * Requirement Rule triggers on the server.
     */
    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id:
            planningRecordId,

          isArchived:
            false,
        },

        select: {
          id:
            true,

          tenantId:
            true,
        },
      });

    if (!planningRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status:
            404,
        },
      );
    }

    const requirementResolution =
      await resolveApplicablePlanningRequirements(
        planningRecordId,
        {
          /*
           * Use the live Guided Intake state so
           * requirement-driven questions can appear
           * immediately rather than one save later.
           */
          activityCodes,
          answers,
        },
      );

    const requirementRuleCodes =
      requirementResolution.rules.map(
        (rule) =>
          rule.ruleCode,
      );

    const questions =
      await evaluatePlanningQuestions({
        tenantId:
          planningRecord.tenantId,

        activityCodes,

        requirementRuleCodes,

        answers,
      });

    const compliance =
      await evaluatePlanningCompliance({
        tenantId:
          planningRecord.tenantId,

        requirementRuleCodes,

        answers,
      });

    return NextResponse.json({
      planningRecordId,

      activityCodes,

      answers,

      requirementRuleCodes,

      requirements: {
        rules:
          requirementResolution.rules,

        applicablePacks:
          requirementResolution
            .applicablePacks,

        metadata:
          requirementResolution
            .metadata,
      },

      questions,

      compliance,

      count:
        questions.length,
    });
  } catch (
    error
  ) {
    console.error(
      "Unable to evaluate planning questions:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to evaluate planning questions.",
      },
      {
        status:
          500,
      },
    );
  }
}