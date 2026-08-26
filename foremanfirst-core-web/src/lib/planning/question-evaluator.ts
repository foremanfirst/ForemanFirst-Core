import { prisma } from "@/lib/prisma";
import {
  Prisma,
} from "@/generated/prisma/client";

type EvaluatePlanningQuestionsInput = {
  tenantId: string;
  activityCodes: string[];
  requirementRuleCodes?: string[];
  answers?: Record<
    string,
    string | null | undefined
  >;
};

type RequirementQuestionSource = {
  requirementRuleId: string;
  ruleCode: string;
  title: string;
  requirementText: string;
  purpose: string;
  severity: string | null;
  requirementPackId: string;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;
  version: number;
  sourceDocumentName: string | null;
  sourcePage: string | null;
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
  requirementSources:
    RequirementQuestionSource[];
};

type CompoundRuleCondition = {
  ruleType: string;
  conditions: Prisma.JsonValue;
};

type RuleConditions = {
  activityCode?: string;
  questionCode?: string;
  value?: string;
  values?: string[];
  requirementRuleCode?: string;
  requirementRuleCodes?: string[];

  match?: "ALL" | "ANY";
  rules?: CompoundRuleCondition[];
};

function normalizeAnswer(
  value: string | null | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return value
    .trim()
    .toLowerCase();
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

  const result:
    RuleConditions = {};

  if (
    "activityCode" in value &&
    typeof value.activityCode ===
      "string"
  ) {
    result.activityCode =
      value.activityCode;
  }

  if (
    "questionCode" in value &&
    typeof value.questionCode ===
      "string"
  ) {
    result.questionCode =
      value.questionCode;
  }

  if (
    "value" in value &&
    typeof value.value ===
      "string"
  ) {
    result.value =
      value.value;
  }

  if (
    "values" in value &&
    Array.isArray(value.values)
  ) {
    result.values =
      value.values.filter(
        (
          item,
        ): item is string =>
          typeof item ===
          "string",
      );
  }

  if (
    "requirementRuleCode" in
      value &&
    typeof value.requirementRuleCode ===
      "string"
  ) {
    result.requirementRuleCode =
      value.requirementRuleCode;
  }

  if (
    "ruleCode" in value &&
    typeof value.ruleCode ===
      "string" &&
    !result.requirementRuleCode
  ) {
    result.requirementRuleCode =
      value.ruleCode;
  }

  if (
    "requirementRuleCodes" in
      value &&
    Array.isArray(
      value.requirementRuleCodes,
    )
  ) {
    result.requirementRuleCodes =
      value.requirementRuleCodes.filter(
        (
          item,
        ): item is string =>
          typeof item ===
          "string",
      );
  }

  if (
    "ruleCodes" in value &&
    Array.isArray(
      value.ruleCodes,
    ) &&
    !result.requirementRuleCodes
  ) {
    result.requirementRuleCodes =
      value.ruleCodes.filter(
        (
          item,
        ): item is string =>
          typeof item ===
          "string",
      );
  }

  if (
    "match" in value &&
    typeof value.match ===
      "string"
  ) {
    result.match =
      value.match === "ANY"
        ? "ANY"
        : "ALL";
  }

  if (
    "rules" in value &&
    Array.isArray(value.rules)
  ) {
    result.rules =
      value.rules
        .map(
          (
            item,
          ): CompoundRuleCondition | null => {
            if (
              !item ||
              typeof item !==
                "object" ||
              Array.isArray(item)
            ) {
              return null;
            }

            if (
              !(
                "ruleType" in
                item
              ) ||
              typeof item.ruleType !==
                "string"
            ) {
              return null;
            }

            const nestedConditions =
              "conditions" in item
                ? item.conditions
                : {};

            return {
              ruleType:
                item.ruleType,

              conditions:
                nestedConditions as Prisma.JsonValue,
            };
          },
        )
        .filter(
          (
            item,
          ): item is CompoundRuleCondition =>
            Boolean(item),
        );
  }

  return result;
}

function ruleMatches({
  ruleType,
  conditions,
  activityCodes,
  requirementRuleCodes,
  linkedRequirementRuleCodes,
  answers,
}: {
  ruleType: string;
  conditions: RuleConditions;
  activityCodes: Set<string>;
  requirementRuleCodes: Set<string>;
  linkedRequirementRuleCodes: string[];
  answers: Record<
    string,
    string | null | undefined
  >;
}): boolean {
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

    case "RequirementApplies": {
      const configuredCodes = [
        ...(conditions
          .requirementRuleCode
          ? [
              conditions
                .requirementRuleCode,
            ]
          : []),

        ...(
          conditions
            .requirementRuleCodes ??
          []
        ),
      ]
        .map(
          (code) =>
            code.trim(),
        )
        .filter(Boolean);

      const codesToCheck =
        configuredCodes.length >
        0
          ? configuredCodes
          : linkedRequirementRuleCodes;

      if (
        codesToCheck.length ===
        0
      ) {
        return false;
      }

      return codesToCheck.some(
        (ruleCode) =>
          requirementRuleCodes.has(
            ruleCode,
          ),
      );
    }

    case "Compound": {
      const nestedRules =
        conditions.rules ??
        [];

      if (
        nestedRules.length ===
        0
      ) {
        return false;
      }

      const results: boolean[] =
        nestedRules.map(
          (nestedRule) =>
            ruleMatches({
              ruleType:
                nestedRule.ruleType,

              conditions:
                parseConditions(
                  nestedRule.conditions,
                ),

              activityCodes,

              requirementRuleCodes,

              linkedRequirementRuleCodes,

              answers,
            }),
        );

      return conditions.match ===
        "ANY"
        ? results.some(Boolean)
        : results.every(Boolean);
    }

    case "AnswerEquals": {
      if (
        !conditions.questionCode ||
        conditions.value ===
          undefined
      ) {
        return false;
      }

      const actualValue =
        normalizeAnswer(
          answers[
            conditions
              .questionCode
          ],
        );

      const expectedValue =
        normalizeAnswer(
          conditions.value,
        );

      return (
        actualValue ===
        expectedValue
      );
    }

    case "AnswerContains": {
      if (
        !conditions.questionCode
      ) {
        return false;
      }

      const actualValue =
        normalizeAnswer(
          answers[
            conditions
              .questionCode
          ],
        );

      if (!actualValue) {
        return false;
      }

      if (
        conditions.value
      ) {
        const expectedValue =
          normalizeAnswer(
            conditions.value,
          );

        return expectedValue
          ? actualValue.includes(
              expectedValue,
            )
          : false;
      }

      if (
        conditions.values &&
        conditions.values.length >
          0
      ) {
        return conditions.values.some(
          (value) => {
            const expectedValue =
              normalizeAnswer(
                value,
              );

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
  requirementRuleCodes = [],
  answers = {},
}: EvaluatePlanningQuestionsInput): Promise<
  EvaluatedQuestion[]
> {
  const normalizedActivityCodes =
    new Set(
      activityCodes
        .map(
          (code) =>
            code.trim(),
        )
        .filter(Boolean),
    );

  const normalizedRequirementRuleCodes =
    new Set(
      requirementRuleCodes
        .map(
          (code) =>
            code.trim(),
        )
        .filter(Boolean),
    );

  const definitions =
    await prisma.planningQuestionDefinition.findMany({
      where: {
        isActive: true,
        isArchived: false,

        OR: [
          {
            tenantId:
              "QOREVA",
          },
          {
            tenantId,
          },
        ],
      },

      include: {
        rules: {
          where: {
            isActive:
              true,
          },

          orderBy: [
            {
              priority:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],
        },

        requirementLinks: {
          include: {
            requirementRule: {
              include: {
                requirementPack:
                  true,
              },
            },
          },
        },
      },

      orderBy: [
        {
          sortOrder:
            "asc",
        },
        {
          questionCode:
            "asc",
        },
      ],
    });

  const visibleQuestions:
    EvaluatedQuestion[] =
    [];

  for (
    const definition of
    definitions
  ) {
    if (
      definition.rules.length ===
      0
    ) {
      continue;
    }

    const linkedRequirementRuleCodes =
      definition.requirementLinks
        .map(
          (link) =>
            link.requirementRule
              .ruleCode,
        )
        .filter(Boolean);

    const shouldShow =
      definition.rules.some(
        (rule) => {
          if (
            rule.action !==
            "Show"
          ) {
            return false;
          }

          const conditions =
            parseConditions(
              rule.conditions,
            );

          return ruleMatches({
            ruleType:
              rule.ruleType,

            conditions,

            activityCodes:
              normalizedActivityCodes,

            requirementRuleCodes:
              normalizedRequirementRuleCodes,

            linkedRequirementRuleCodes,

            answers,
          });
        },
      );

    if (!shouldShow) {
      continue;
    }

    const requirementSources =
      definition.requirementLinks
        .filter(
          (link) =>
            normalizedRequirementRuleCodes.has(
              link.requirementRule
                .ruleCode,
            ),
        )
        .map(
          (link) => ({
            requirementRuleId:
              link.requirementRule.id,

            ruleCode:
              link.requirementRule
                .ruleCode,

            title:
              link.requirementRule
                .title,

            requirementText:
              link.requirementRule
                .requirementText,

            purpose:
              link.purpose,

            severity:
              link.requirementRule
                .severity,

            requirementPackId:
              link.requirementRule
                .requirementPack.id,

            requirementPackName:
              link.requirementRule
                .requirementPack.name,

            packType:
              link.requirementRule
                .requirementPack
                .packType,

            organizationName:
              link.requirementRule
                .requirementPack
                .organizationName,

            version:
              link.requirementRule
                .requirementPack
                .version,

            sourceDocumentName:
              link.requirementRule
                .sourceDocumentName,

            sourcePage:
              link.requirementRule
                .sourcePage,
          }),
        );

    visibleQuestions.push({
      id:
        definition.id,

      questionCode:
        definition.questionCode,

      category:
        definition.category,

      section:
        definition.section,

      questionText:
        definition.questionText,

      helpText:
        definition.helpText,

      questionType:
        definition.questionType,

      options:
        definition.options,

      unit:
        definition.unit,

      isRequired:
        definition.isRequired,

      isCritical:
        definition.isCritical,

      sortOrder:
        definition.sortOrder,

      sourceType:
        definition.sourceType,

      requirementSources,
    });
  }

  return visibleQuestions;
}