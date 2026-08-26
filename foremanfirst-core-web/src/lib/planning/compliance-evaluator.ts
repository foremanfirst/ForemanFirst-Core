import {
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type JsonRecord =
  Record<string, unknown>;

export type PlanningComplianceStatus =
  | "Satisfied"
  | "Unresolved"
  | "NotEvaluated";

export type PlanningComplianceResult = {
  requirementRuleId: string;
  requirementRuleCode: string;
  requirementTitle: string;

  requirementPackId: string;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;

  questionDefinitionId: string;
  questionCode: string;
  questionText: string;

  purpose: string;

  status:
    PlanningComplianceStatus;

  blockingLevel:
    string | null;

  message:
    string | null;

  validationType:
    string | null;

  expectedValue:
    string | null;

  actualValue:
    string | null;
};

export type PlanningComplianceEvaluation = {
  results:
    PlanningComplianceResult[];

  summary: {
    total: number;
    satisfied: number;
    unresolved: number;
    notEvaluated: number;

    submissionBlocking: number;
    approvalBlocking: number;
  };
};

type ParsedValidation = {
  type: string | null;
  value: string | null;
  values: string[];
  blockingLevel: string | null;
  message: string | null;
};

function isRecord(
  value: unknown,
): value is JsonRecord {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

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

function normalizeString(
  value:
    string | null | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return normalized
    ? normalized
    : null;
}

function normalizeStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(nullableString)
    .filter(
      (
        item,
      ): item is string =>
        Boolean(item),
    );
}

function parseValidation(
  value:
    Prisma.JsonValue | null,
): ParsedValidation | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    type:
      nullableString(
        value.type,
      ),

    value:
      nullableString(
        value.value,
      ),

    values:
      normalizeStringArray(
        value.values,
      ),

    blockingLevel:
      nullableString(
        value.blockingLevel,
      ),

    message:
      nullableString(
        value.message,
      ),
  };
}

function evaluateValidation({
  validation,
  actualValue,
}: {
  validation:
    ParsedValidation;
  actualValue:
    string | null | undefined;
}): PlanningComplianceStatus {
  const normalizedActual =
    normalizeString(
      actualValue,
    );

  if (!normalizedActual) {
    return "NotEvaluated";
  }

  switch (
    validation.type
  ) {
    case "AnswerEquals": {
      const expected =
        normalizeString(
          validation.value,
        );

      if (!expected) {
        return "NotEvaluated";
      }

      return (
        normalizedActual ===
        expected
      )
        ? "Satisfied"
        : "Unresolved";
    }

    case "AnswerContains": {
      const candidates = [
        ...(validation.value
          ? [
              validation.value,
            ]
          : []),

        ...validation.values,
      ]
        .map(
          normalizeString,
        )
        .filter(
          (
            item,
          ): item is string =>
            Boolean(item),
        );

      if (
        candidates.length ===
        0
      ) {
        return "NotEvaluated";
      }

      return candidates.some(
        (candidate) =>
          normalizedActual.includes(
            candidate,
          ),
      )
        ? "Satisfied"
        : "Unresolved";
    }

    default:
      return "NotEvaluated";
  }
}

export async function evaluatePlanningCompliance({
  tenantId,
  requirementRuleCodes,
  answers,
}: {
  tenantId: string;

  requirementRuleCodes:
    string[];

  answers: Record<
    string,
    string | null | undefined
  >;
}): Promise<
  PlanningComplianceEvaluation
> {
  const normalizedRuleCodes =
    Array.from(
      new Set(
        requirementRuleCodes
          .map(
            (code) =>
              code.trim(),
          )
          .filter(Boolean),
      ),
    );

  if (
    normalizedRuleCodes.length ===
    0
  ) {
    return {
      results: [],

      summary: {
        total:
          0,

        satisfied:
          0,

        unresolved:
          0,

        notEvaluated:
          0,

        submissionBlocking:
          0,

        approvalBlocking:
          0,
      },
    };
  }

  const links =
    await prisma.planningQuestionRequirement.findMany({
      where: {
        tenantId: {
          in: [
            "QOREVA",
            tenantId,
          ],
        },

        requirementRule: {
          ruleCode: {
            in:
              normalizedRuleCodes,
          },

          isActive:
            true,
        },

        questionDefinition: {
          isActive:
            true,

          isArchived:
            false,
        },
      },

      include: {
        questionDefinition:
          true,

        requirementRule: {
          include: {
            requirementPack:
              true,
          },
        },
      },

      orderBy: [
        {
          questionDefinition: {
            sortOrder:
              "asc",
          },
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  const results:
    PlanningComplianceResult[] =
    [];

  for (
    const link of
    links
  ) {
    const validation =
      parseValidation(
        link.validation,
      );

    /*
     * A requirement-question link without
     * validation metadata provides provenance
     * or information but does not create a
     * deterministic compliance decision.
     */
    if (!validation) {
      continue;
    }

    const actualValue =
      answers[
        link.questionDefinition
          .questionCode
      ] ??
      null;

    const status =
      evaluateValidation({
        validation,
        actualValue,
      });

    results.push({
      requirementRuleId:
        link.requirementRule.id,

      requirementRuleCode:
        link.requirementRule
          .ruleCode,

      requirementTitle:
        link.requirementRule
          .title,

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

      questionDefinitionId:
        link.questionDefinition.id,

      questionCode:
        link.questionDefinition
          .questionCode,

      questionText:
        link.questionDefinition
          .questionText,

      purpose:
        link.purpose,

      status,

      blockingLevel:
        validation
          .blockingLevel,

      message:
        validation.message,

      validationType:
        validation.type,

      expectedValue:
        validation.value,

      actualValue:
        actualValue ??
        null,
    });
  }

  const unresolved =
    results.filter(
      (result) =>
        result.status ===
        "Unresolved",
    );

  return {
    results,

    summary: {
      total:
        results.length,

      satisfied:
        results.filter(
          (result) =>
            result.status ===
            "Satisfied",
        ).length,

      unresolved:
        unresolved.length,

      notEvaluated:
        results.filter(
          (result) =>
            result.status ===
            "NotEvaluated",
        ).length,

      submissionBlocking:
        unresolved.filter(
          (result) =>
            normalizeString(
              result.blockingLevel,
            ) ===
            "submission",
        ).length,

      approvalBlocking:
        unresolved.filter(
          (result) =>
            normalizeString(
              result.blockingLevel,
            ) ===
            "approval",
        ).length,
    },
  };
}
