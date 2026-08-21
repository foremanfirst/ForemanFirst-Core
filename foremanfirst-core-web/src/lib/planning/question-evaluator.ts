import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type EvaluatePlanningQuestionsInput = {
  tenantId: string;
  activityCodes: string[];
  answers?: Record<string, string | null | undefined>;
};

type EvaluatedQuestion = {
  id: string;
  questionCode: string;
  category: string;
  section: string | null;
  questionText: string;
  helpText: string | null;
  questionType: string;
  options: Prisma.JsonValue | null;
  unit: string | null;
  isRequired: boolean;
  isCritical: boolean;
  sortOrder: number;
  sourceType: string;
};

type RuleConditions = {
  activityCode?: string;
  questionCode?: string;
  value?: string;
  values?: string[];
};

function normalizeAnswer(
  value: string | null | undefined,
) {
  if (value === null || value === undefined) {
    return null;
  }

  return value.trim().toLowerCase();
}

function parseConditions(
  value: Prisma.JsonValue,
): RuleConditions {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const result: RuleConditions = {};

  if (
    "activityCode" in value &&
    typeof value.activityCode === "string"
  ) {
    result.activityCode = value.activityCode;
  }

  if (
    "questionCode" in value &&
    typeof value.questionCode === "string"
  ) {
    result.questionCode = value.questionCode;
  }

  if (
    "value" in value &&
    typeof value.value === "string"
  ) {
    result.value = value.value;
  }

  if (
    "values" in value &&
    Array.isArray(value.values)
  ) {
    result.values = value.values.filter(
      (item): item is string =>
        typeof item === "string",
    );
  }

  return result;
}

function ruleMatches({
  ruleType,
  conditions,
  activityCodes,
  answers,
}: {
  ruleType: string;
  conditions: RuleConditions;
  activityCodes: Set<string>;
  answers: Record<
    string,
    string | null | undefined
  >;
}) {
  switch (ruleType) {
    case "Always":
      return true;

    case "ActivityDetected": {
      if (!conditions.activityCode) {
        return false;
      }

      return activityCodes.has(
        conditions.activityCode,
      );
    }

    case "AnswerEquals": {
      if (
        !conditions.questionCode ||
        conditions.value === undefined
      ) {
        return false;
      }

      const actualValue = normalizeAnswer(
        answers[conditions.questionCode],
      );

      const expectedValue = normalizeAnswer(
        conditions.value,
      );

      return actualValue === expectedValue;
    }

    case "AnswerContains": {
      if (!conditions.questionCode) {
        return false;
      }

      const actualValue = normalizeAnswer(
        answers[conditions.questionCode],
      );

      if (!actualValue) {
        return false;
      }

      if (conditions.value) {
        const expectedValue = normalizeAnswer(
          conditions.value,
        );

        return expectedValue
          ? actualValue.includes(expectedValue)
          : false;
      }

      if (
        conditions.values &&
        conditions.values.length > 0
      ) {
        return conditions.values.some(
          (value) => {
            const expectedValue =
              normalizeAnswer(value);

            return expectedValue
              ? actualValue.includes(
                  expectedValue,
                )
              : false;
          },
        );
      }

      return false;
    }

    default:
      return false;
  }
}

export async function evaluatePlanningQuestions({
  tenantId,
  activityCodes,
  answers = {},
}: EvaluatePlanningQuestionsInput): Promise<
  EvaluatedQuestion[]
> {
  const normalizedActivityCodes = new Set(
    activityCodes
      .map((code) => code.trim())
      .filter(Boolean),
  );

  const definitions =
    await prisma.planningQuestionDefinition.findMany({
      where: {
        isActive: true,
        isArchived: false,

        OR: [
          {
            tenantId: "QOREVA",
          },
          {
            tenantId,
          },
        ],
      },

      include: {
        rules: {
          where: {
            isActive: true,
          },

          orderBy: [
            {
              priority: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          questionCode: "asc",
        },
      ],
    });

  const visibleQuestions: EvaluatedQuestion[] =
    [];

  for (const definition of definitions) {
    if (definition.rules.length === 0) {
      continue;
    }

    /*
     * V1 behavior:
     *
     * Multiple Show rules are treated as OR conditions.
     *
     * Example:
     * EXCAVATION_UTILITIES_PRESENT can display when:
     * - EXCAVATION is detected
     * OR
     * - UNDERGROUND_UTILITIES is detected
     *
     * Later we can support explicit AND/grouped rule sets.
     */
    const shouldShow =
      definition.rules.some((rule) => {
        if (rule.action !== "Show") {
          return false;
        }

        const conditions =
          parseConditions(rule.conditions);

        return ruleMatches({
          ruleType: rule.ruleType,
          conditions,
          activityCodes:
            normalizedActivityCodes,
          answers,
        });
      });

    if (!shouldShow) {
      continue;
    }

    visibleQuestions.push({
      id: definition.id,
      questionCode:
        definition.questionCode,
      category: definition.category,
      section: definition.section,
      questionText:
        definition.questionText,
      helpText: definition.helpText,
      questionType:
        definition.questionType,
      options: definition.options,
      unit: definition.unit,
      isRequired:
        definition.isRequired,
      isCritical:
        definition.isCritical,
      sortOrder:
        definition.sortOrder,
      sourceType:
        definition.sourceType,
    });
  }

  return visibleQuestions;
}