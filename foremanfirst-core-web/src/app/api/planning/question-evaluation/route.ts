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
import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

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

function sanitizePlanningAnswers(
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([questionCode, answer]) => {
      if (typeof answer !== "string") {
        return [];
      }

      const code = questionCode.trim();
      const normalized = answer.trim();

      if (
        !code ||
        !normalized ||
        /^(dd+|test|testing|asdf|xxx+|tbd|unknown|n\/?a|na)$/i.test(normalized)
      ) {
        return [];
      }

      return [[code, normalized]];
    }),
  );
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

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

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

    /*
     * The API is the trust boundary. Placeholder, empty, and
     * non-string answers must not influence requirement logic.
     */
    const answers =
      sanitizePlanningAnswers(
        body.answers,
      );

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

          tenantId:
            authorization.planningRecord
              .tenantId,

          projectId:
            authorization.planningRecord
              .projectId,

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