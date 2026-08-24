import {
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requirementPackApplies,
  type ApplicabilityContext,
} from "@/lib/planning/requirement-applicability";

type JsonRecord =
  Record<string, unknown>;

type RequirementTriggerMatch =
  | "ALL"
  | "ANY";

type RequirementTriggerCondition =
  | {
      type: "Always";
    }
  | {
      type: "ActivityDetected";
      activityCodes: string[];
    }
  | {
      type: "AnswerEquals";
      questionCode: string;
      value: string;
    }
  | {
      type: "AnswerContains";
      questionCode: string;
      values: string[];
    }
  | {
      type: "PlanType";
      values: string[];
    }
  | {
      type: "Trade";
      values: string[];
    };

type ParsedTriggerConditions = {
  match: RequirementTriggerMatch;
  conditions: RequirementTriggerCondition[];
};

export type RequirementResolutionOverrides = {
  activityCodes?: string[];
  answers?: Record<
    string,
    string | null | undefined
  >;
};

export type ResolvedRequirementRule = {
  id: string;
  requirementPackId: string;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;
  packVersion: number;
  ruleCode: string;
  title: string;
  requirementText: string;
  category: string | null;
  severity: string | null;
  requiredInformation: Prisma.JsonValue | null;
  requiredControls: Prisma.JsonValue | null;
  sourceDocumentName: string | null;
  sourcePage: string | null;
  sourceReference: Prisma.JsonValue | null;
  triggerConditions: Prisma.JsonValue | null;
};

export type PlanningRequirementResolutionResult = {
  planningRecordId: string;
  tenantId: string;
  planType: string;
  effectiveEvaluationDate: string;
  rules: ResolvedRequirementRule[];
  applicablePacks: Array<{
    id: string;
    name: string;
    packType: string;
    organizationName: string | null;
    version: number;
  }>;
  metadata: {
    candidatePackCount: number;
    applicablePackCount: number;
    candidateRuleCount: number;
    applicableRuleCount: number;
    unresolvedRuleCount: number;
    resolverVersion: string;
  };
};

function isRecord(
  value: unknown,
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function nullableString(
  value: unknown,
) {
  if (
    typeof value !== "string"
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
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeStringArray(
  value: unknown,
) {
  if (
    typeof value === "string"
  ) {
    const normalized =
      nullableString(value);

    return normalized
      ? [normalized]
      : [];
  }

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

function normalizeMatch(
  value: unknown,
): RequirementTriggerMatch {
  return value === "ANY"
    ? "ANY"
    : "ALL";
}

function parseTriggerCondition(
  value: unknown,
): RequirementTriggerCondition | null {
  if (!isRecord(value)) {
    return null;
  }

  const type =
    nullableString(value.type);

  if (!type) {
    return null;
  }

  switch (type) {
    case "Always":
      return {
        type: "Always",
      };

    case "ActivityDetected": {
      const activityCodes =
        normalizeStringArray(
          value.activityCodes ??
            value.activityCode,
        );

      if (
        activityCodes.length ===
        0
      ) {
        return null;
      }

      return {
        type: "ActivityDetected",
        activityCodes,
      };
    }

    case "AnswerEquals": {
      const questionCode =
        nullableString(
          value.questionCode,
        );

      const expectedValue =
        nullableString(
          value.value,
        );

      if (
        !questionCode ||
        !expectedValue
      ) {
        return null;
      }

      return {
        type: "AnswerEquals",
        questionCode,
        value: expectedValue,
      };
    }

    case "AnswerContains": {
      const questionCode =
        nullableString(
          value.questionCode,
        );

      const values =
        normalizeStringArray(
          value.values ??
            value.value,
        );

      if (
        !questionCode ||
        values.length ===
          0
      ) {
        return null;
      }

      return {
        type: "AnswerContains",
        questionCode,
        values,
      };
    }

    case "PlanType": {
      const values =
        normalizeStringArray(
          value.values ??
            value.planTypes ??
            value.planType ??
            value.value,
        );

      if (
        values.length ===
        0
      ) {
        return null;
      }

      return {
        type: "PlanType",
        values,
      };
    }

    case "Trade": {
      const values =
        normalizeStringArray(
          value.values ??
            value.trades ??
            value.trade ??
            value.value,
        );

      if (
        values.length ===
        0
      ) {
        return null;
      }

      return {
        type: "Trade",
        values,
      };
    }

    default:
      return null;
  }
}

function parseTriggerConditions(
  value: Prisma.JsonValue | null,
): ParsedTriggerConditions | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawConditions =
    Array.isArray(
      value.conditions,
    )
      ? value.conditions
      : [];

  const conditions =
    rawConditions
      .map(parseTriggerCondition)
      .filter(
        (
          condition,
        ): condition is RequirementTriggerCondition =>
          Boolean(condition),
      );

  if (
    conditions.length ===
    0
  ) {
    return null;
  }

  return {
    match:
      normalizeMatch(
        value.match,
      ),
    conditions,
  };
}

function equalsAny(
  actual: string | null,
  expected: string[],
) {
  if (!actual) {
    return false;
  }

  const normalizedActual =
    normalizeString(actual);

  return expected.some(
    (candidate) =>
      normalizeString(candidate) ===
      normalizedActual,
  );
}

function answerContainsAny(
  actual: string | null,
  expected: string[],
) {
  if (!actual) {
    return false;
  }

  const normalizedActual =
    normalizeString(actual);

  return expected.some(
    (candidate) => {
      const normalizedExpected =
        normalizeString(candidate);

      return Boolean(
        normalizedExpected,
      ) &&
        normalizedActual.includes(
          normalizedExpected,
        );
    },
  );
}

function triggerConditionMatches({
  condition,
  activityCodes,
  answers,
  planType,
  contractorTrade,
}: {
  condition: RequirementTriggerCondition;
  activityCodes: Set<string>;
  answers: Map<string, string | null>;
  planType: string;
  contractorTrade: string | null;
}) {
  switch (condition.type) {
    case "Always":
      return true;

    case "ActivityDetected":
      return condition.activityCodes.some(
        (activityCode) =>
          activityCodes.has(
            activityCode,
          ),
      );

    case "AnswerEquals": {
      const actual =
        answers.get(
          condition.questionCode,
        ) ??
        null;

      return equalsAny(
        actual,
        [condition.value],
      );
    }

    case "AnswerContains": {
      const actual =
        answers.get(
          condition.questionCode,
        ) ??
        null;

      return answerContainsAny(
        actual,
        condition.values,
      );
    }

    case "PlanType":
      return equalsAny(
        planType,
        condition.values,
      );

    case "Trade":
      return equalsAny(
        contractorTrade,
        condition.values,
      );

    default:
      return false;
  }
}

function requirementRuleApplies({
  triggerConditions,
  activityCodes,
  answers,
  planType,
  contractorTrade,
}: {
  triggerConditions: Prisma.JsonValue | null;
  activityCodes: Set<string>;
  answers: Map<string, string | null>;
  planType: string;
  contractorTrade: string | null;
}) {
  const parsed =
    parseTriggerConditions(
      triggerConditions,
    );

  if (!parsed) {
    return {
      applies: false,
      resolved: false,
    };
  }

  const results =
    parsed.conditions.map(
      (condition) =>
        triggerConditionMatches({
          condition,
          activityCodes,
          answers,
          planType,
          contractorTrade,
        }),
    );

  return {
    applies:
      parsed.match === "ANY"
        ? results.some(Boolean)
        : results.every(Boolean),
    resolved: true,
  };
}

function dateIsActive({
  effectiveDate,
  expirationDate,
  evaluationDate,
}: {
  effectiveDate: Date | null;
  expirationDate: Date | null;
  evaluationDate: Date;
}) {
  if (
    effectiveDate &&
    effectiveDate.getTime() >
      evaluationDate.getTime()
  ) {
    return false;
  }

  if (
    expirationDate &&
    expirationDate.getTime() <
      evaluationDate.getTime()
  ) {
    return false;
  }

  return true;
}

function packPriority(
  packType: string,
) {
  switch (
    packType
      .trim()
      .toLowerCase()
  ) {
    case "qoreva":
      return 5;

    case "federal":
    case "osha":
      return 10;

    case "state":
    case "stateplan":
    case "state_plan":
      return 20;

    case "owner":
      return 30;

    case "gc":
      return 40;

    case "company":
      return 50;

    case "project":
      return 60;

    default:
      return 25;
  }
}

export async function resolveApplicablePlanningRequirements(
  planningRecordId: string,
  overrides: RequirementResolutionOverrides = {},
): Promise<PlanningRequirementResolutionResult> {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      include: {
        company: true,
        project: true,
        contractor: true,

        activities: {
          where: {
            isActive: true,
            confirmationStatus:
              "Confirmed",
          },
        },

        questionResponses:
          true,
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  const evaluationDate =
    record.plannedStartDate ??
    new Date();

  const applicabilityContext:
    ApplicabilityContext = {
    tenantId:
      record.tenantId,

    companyId:
      record.companyId,

    projectId:
      record.projectId,

    contractorId:
      record.contractorId,

    planType:
      record.planType,

    companyName:
      record.company.name,

    projectName:
      record.project.name,

    projectCode:
      record.project.projectCode,

    clientName:
      record.project.clientName,

    contractorName:
      record.contractor?.name ??
      null,

    contractorTrade:
      record.contractor?.trade ??
      null,
  };

  const candidatePacks =
    await prisma.requirementPack.findMany({
      where: {
        tenantId:
          record.tenantId,

        isActive:
          true,

        isArchived:
          false,

        status: {
          in: [
            "Active",
            "Approved",
          ],
        },
      },

      include: {
        rules: {
          where: {
            isActive:
              true,

            status: {
              in: [
                "Active",
                "Approved",
              ],
            },
          },

          orderBy: [
            {
              category:
                "asc",
            },

            {
              ruleCode:
                "asc",
            },
          ],
        },
      },

      orderBy: [
        {
          version:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  const applicablePacks =
    candidatePacks
      .filter(
        (pack) =>
          requirementPackApplies(
            pack.applicability,
            applicabilityContext,
          ) &&
          dateIsActive({
            effectiveDate:
              pack.effectiveDate,

            expirationDate:
              pack.expirationDate,

            evaluationDate,
          }),
      )
      .sort(
        (a, b) => {
          const priorityDifference =
            packPriority(
              a.packType,
            ) -
            packPriority(
              b.packType,
            );

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference;
          }

          if (
            a.version !==
            b.version
          ) {
            return (
              a.version -
              b.version
            );
          }

          return a.name.localeCompare(
            b.name,
          );
        },
      );

  const activityCodes =
    new Set(
      (
        overrides.activityCodes ??
        record.activities.map(
          (activity) =>
            activity.activityCode,
        )
      )
        .map(
          (code) =>
            code.trim(),
        )
        .filter(Boolean),
    );

  const responseIdentifiers =
    record.questionResponses
      .map(
        (response) =>
          response.questionId,
      )
      .filter(Boolean);

  const questionDefinitions =
    responseIdentifiers.length >
    0
      ? await prisma.planningQuestionDefinition.findMany({
          where: {
            isActive:
              true,

            isArchived:
              false,

            OR: [
              {
                id: {
                  in:
                    responseIdentifiers,
                },
              },

              {
                questionCode: {
                  in:
                    responseIdentifiers,
                },
              },
            ],
          },

          orderBy: [
            {
              version:
                "desc",
            },
          ],
        })
      : [];

  const definitionById =
    new Map(
      questionDefinitions.map(
        (definition) => [
          definition.id,
          definition,
        ],
      ),
    );

  const definitionByCode =
    new Map<
      string,
      (typeof questionDefinitions)[number]
    >();

  for (
    const definition of
    questionDefinitions
  ) {
    if (
      !definitionByCode.has(
        definition.questionCode,
      )
    ) {
      definitionByCode.set(
        definition.questionCode,
        definition,
      );
    }
  }

  const answers =
    new Map<
      string,
      string | null
    >();

  for (
    const response of
    record.questionResponses
  ) {
    const definition =
      definitionById.get(
        response.questionId,
      ) ??
      definitionByCode.get(
        response.questionId,
      );

    const questionCode =
      definition?.questionCode ??
      response.questionId;

    answers.set(
      questionCode,
      response.responseValue,
    );
  }

  for (
    const [
      questionCode,
      responseValue,
    ] of Object.entries(
      overrides.answers ??
      {},
    )
  ) {
    const normalizedCode =
      questionCode.trim();

    if (!normalizedCode) {
      continue;
    }

    answers.set(
      normalizedCode,
      typeof responseValue ===
        "string"
        ? responseValue
        : null,
    );
  }

  const resolvedRules:
    ResolvedRequirementRule[] =
    [];

  let candidateRuleCount =
    0;

  let unresolvedRuleCount =
    0;

  for (
    const pack of
    applicablePacks
  ) {
    for (
      const rule of
      pack.rules
    ) {
      candidateRuleCount +=
        1;

      if (
        !dateIsActive({
          effectiveDate:
            rule.effectiveDate,

          expirationDate:
            rule.expirationDate,

          evaluationDate,
        })
      ) {
        continue;
      }

      const resolution =
        requirementRuleApplies({
          triggerConditions:
            rule.triggerConditions,

          activityCodes,
          answers,

          planType:
            record.planType,

          contractorTrade:
            record.contractor?.trade ??
            null,
        });

      if (
        !resolution.resolved
      ) {
        unresolvedRuleCount +=
          1;

        continue;
      }

      if (!resolution.applies) {
        continue;
      }

      resolvedRules.push({
        id:
          rule.id,

        requirementPackId:
          pack.id,

        requirementPackName:
          pack.name,

        packType:
          pack.packType,

        organizationName:
          pack.organizationName,

        packVersion:
          pack.version,

        ruleCode:
          rule.ruleCode,

        title:
          rule.title,

        requirementText:
          rule.requirementText,

        category:
          rule.category,

        severity:
          rule.severity,

        requiredInformation:
          rule.requiredInformation,

        requiredControls:
          rule.requiredControls,

        sourceDocumentName:
          rule.sourceDocumentName,

        sourcePage:
          rule.sourcePage,

        sourceReference:
          rule.sourceReference,

        triggerConditions:
          rule.triggerConditions,
      });
    }
  }

  return {
    planningRecordId:
      record.id,

    tenantId:
      record.tenantId,

    planType:
      record.planType,

    effectiveEvaluationDate:
      evaluationDate.toISOString(),

    rules:
      resolvedRules,

    applicablePacks:
      applicablePacks.map(
        (pack) => ({
          id:
            pack.id,

          name:
            pack.name,

          packType:
            pack.packType,

          organizationName:
            pack.organizationName,

          version:
            pack.version,
        }),
      ),

    metadata: {
      candidatePackCount:
        candidatePacks.length,

      applicablePackCount:
        applicablePacks.length,

      candidateRuleCount,

      applicableRuleCount:
        resolvedRules.length,

      unresolvedRuleCount,

      resolverVersion:
        "qoreva-requirements-v2-live-intake",
    },
  };
}