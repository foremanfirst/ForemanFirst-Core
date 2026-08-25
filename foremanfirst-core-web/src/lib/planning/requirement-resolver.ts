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

export type RequirementSourceLevel =
  | "Qoreva"
  | "Federal"
  | "StatePlan"
  | "Owner"
  | "GC"
  | "Company"
  | "Project"
  | "Other";

export type RequirementRelationship =
  | "Standalone"
  | "Additive"
  | "Overlapping";

export type RequirementGroupResolutionStatus =
  | "Standalone"
  | "Additive"
  | "ControllingResolved"
  | "ReviewRequired";

type RequirementResolutionMetadata = {
  groupKey: string | null;

  relationship:
    | "Additive"
    | "Overlapping"
    | null;

  stringencyRank:
    number | null;
};

export type ResolvedRequirementRule = {
  id: string;

  requirementPackId:
    string;

  requirementPackName:
    string;

  packType:
    string;

  organizationName:
    string | null;

  packVersion:
    number;

  /*
   * Source hierarchy is used for ordering,
   * provenance, and explanation.
   *
   * It is NOT automatically treated as a
   * stringency hierarchy.
   */
  sourceLevel:
    RequirementSourceLevel;

  sourcePrecedenceRank:
    number;

  ruleCode:
    string;

  title:
    string;

  requirementText:
    string;

  category:
    string | null;

  severity:
    string | null;

  requiredInformation:
    Prisma.JsonValue | null;

  requiredControls:
    Prisma.JsonValue | null;

  sourceDocumentName:
    string | null;

  sourcePage:
    string | null;

  sourceReference:
    Prisma.JsonValue | null;

  triggerConditions:
    Prisma.JsonValue | null;

  /*
   * Optional deterministic comparison metadata.
   *
   * Qoreva does not infer overlap/stringency merely
   * because two requirements have similar titles
   * or belong to the same category.
   */
  resolutionGroupKey:
    string | null;

  relationshipHint:
    | "Additive"
    | "Overlapping"
    | null;

  stringencyRank:
    number | null;
};

export type ResolvedRequirementGroup = {
  groupKey:
    string;

  category:
    string | null;

  relationship:
    RequirementRelationship;

  status:
    RequirementGroupResolutionStatus;

  ruleIds:
    string[];

  ruleCodes:
    string[];

  controllingRuleId:
    string | null;

  controllingRuleCode:
    string | null;

  requiresQualifiedReview:
    boolean;

  resolutionReason:
    string;
};

export type PlanningRequirementResolutionResult = {
  planningRecordId:
    string;

  tenantId:
    string;

  planType:
    string;

  effectiveEvaluationDate:
    string;

  /*
   * Preserve every applicable requirement.
   *
   * Even when Qoreva can deterministically identify
   * a controlling requirement, all contributing
   * sources remain available for auditability.
   */
  rules:
    ResolvedRequirementRule[];

  groups:
    ResolvedRequirementGroup[];

  applicablePacks:
    Array<{
      id: string;

      name: string;

      packType: string;

      organizationName:
        string | null;

      version:
        number;

      sourceLevel:
        RequirementSourceLevel;

      sourcePrecedenceRank:
        number;
    }>;

  metadata: {
    candidatePackCount:
      number;

    applicablePackCount:
      number;

    candidateRuleCount:
      number;

    applicableRuleCount:
      number;

    unresolvedRuleCount:
      number;

    requirementGroupCount:
      number;

    additiveGroupCount:
      number;

    overlappingGroupCount:
      number;

    controllingResolvedGroupCount:
      number;

    reviewRequiredGroupCount:
      number;

    resolverVersion:
      string;
  };
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
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizeCodeLike(
  value: string,
) {
  return value
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function normalizeStringArray(
  value: unknown,
) {
  if (
    typeof value ===
    "string"
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
  return value ===
    "ANY"
    ? "ANY"
    : "ALL";
}

function normalizeRelationship(
  value: unknown,
):
  | "Additive"
  | "Overlapping"
  | null {
  const normalized =
    nullableString(value)
      ?.toLowerCase();

  if (
    normalized ===
    "additive"
  ) {
    return "Additive";
  }

  if (
    normalized ===
      "overlapping" ||
    normalized ===
      "overlap"
  ) {
    return "Overlapping";
  }

  return null;
}

function finiteNumber(
  value: unknown,
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : null;
}

function parseTriggerCondition(
  value: unknown,
): RequirementTriggerCondition | null {
  if (!isRecord(value)) {
    return null;
  }

  const type =
    nullableString(
      value.type,
    );

  if (!type) {
    return null;
  }

  switch (type) {
    case "Always":
      return {
        type:
          "Always",
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
        type:
          "ActivityDetected",

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
        type:
          "AnswerEquals",

        questionCode,

        value:
          expectedValue,
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
        type:
          "AnswerContains",

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
        type:
          "PlanType",

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
        type:
          "Trade",

        values,
      };
    }

    default:
      return null;
  }
}

function parseTriggerConditions(
  value:
    Prisma.JsonValue | null,
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
      .map(
        parseTriggerCondition,
      )
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

function parseResolutionMetadata(
  sourceReference:
    Prisma.JsonValue | null,
): RequirementResolutionMetadata {
  if (
    !isRecord(
      sourceReference,
    )
  ) {
    return {
      groupKey:
        null,

      relationship:
        null,

      stringencyRank:
        null,
    };
  }

  const resolution =
    isRecord(
      sourceReference.resolution,
    )
      ? sourceReference
          .resolution
      : null;

  if (!resolution) {
    return {
      groupKey:
        null,

      relationship:
        null,

      stringencyRank:
        null,
    };
  }

  const rawGroupKey =
    nullableString(
      resolution.groupKey ??
        resolution
          .requirementGroup ??
        resolution
          .comparisonGroup,
    );

  const groupKey =
    rawGroupKey
      ? normalizeCodeLike(
          rawGroupKey,
        )
      : null;

  const relationship =
    normalizeRelationship(
      resolution.relationship ??
        resolution
          .relationshipType,
    );

  const stringencyRank =
    finiteNumber(
      resolution.stringencyRank ??
        resolution
          .stringencyScore,
    );

  return {
    groupKey,

    relationship,

    stringencyRank,
  };
}

function equalsAny(
  actual:
    string | null,

  expected:
    string[],
) {
  if (!actual) {
    return false;
  }

  const normalizedActual =
    normalizeString(
      actual,
    );

  return expected.some(
    (candidate) =>
      normalizeString(
        candidate,
      ) ===
      normalizedActual,
  );
}

function answerContainsAny(
  actual:
    string | null,

  expected:
    string[],
) {
  if (!actual) {
    return false;
  }

  const normalizedActual =
    normalizeString(
      actual,
    );

  return expected.some(
    (candidate) => {
      const normalizedExpected =
        normalizeString(
          candidate,
        );

      return (
        Boolean(
          normalizedExpected,
        ) &&
        normalizedActual.includes(
          normalizedExpected,
        )
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
  condition:
    RequirementTriggerCondition;

  activityCodes:
    Set<string>;

  answers:
    Map<
      string,
      string | null
    >;

  planType:
    string;

  contractorTrade:
    string | null;
}) {
  switch (
    condition.type
  ) {
    case "Always":
      return true;

    case "ActivityDetected":
      return condition
        .activityCodes
        .some(
          (
            activityCode,
          ) =>
            activityCodes.has(
              activityCode,
            ),
        );

    case "AnswerEquals": {
      const actual =
        answers.get(
          condition
            .questionCode,
        ) ??
        null;

      return equalsAny(
        actual,
        [
          condition.value,
        ],
      );
    }

    case "AnswerContains": {
      const actual =
        answers.get(
          condition
            .questionCode,
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
  triggerConditions:
    Prisma.JsonValue | null;

  activityCodes:
    Set<string>;

  answers:
    Map<
      string,
      string | null
    >;

  planType:
    string;

  contractorTrade:
    string | null;
}) {
  const parsed =
    parseTriggerConditions(
      triggerConditions,
    );

  /*
   * Missing or invalid trigger configuration
   * does not silently make a requirement
   * applicable.
   *
   * Universal rules must explicitly use an
   * Always trigger.
   */
  if (!parsed) {
    return {
      applies:
        false,

      resolved:
        false,
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
      parsed.match ===
      "ANY"
        ? results.some(
            Boolean,
          )
        : results.every(
            Boolean,
          ),

    resolved:
      true,
  };
}

function dateIsActive({
  effectiveDate,
  expirationDate,
  evaluationDate,
}: {
  effectiveDate:
    Date | null;

  expirationDate:
    Date | null;

  evaluationDate:
    Date;
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

function sourceLevelForPackType(
  packType: string,
): RequirementSourceLevel {
  switch (
    packType
      .trim()
      .toLowerCase()
  ) {
    case "qoreva":
      return "Qoreva";

    case "federal":
    case "osha":
      return "Federal";

    case "state":
    case "stateplan":
    case "state_plan":
    case "state plan":
      return "StatePlan";

    case "owner":
      return "Owner";

    case "gc":
    case "generalcontractor":
    case "general_contractor":
    case "general contractor":
      return "GC";

    case "company":
      return "Company";

    case "project":
      return "Project";

    default:
      return "Other";
  }
}

function sourcePrecedenceRank(
  packType: string,
) {
  /*
   * Source hierarchy:
   *
   * Federal OSHA
   * State Plan
   * Owner
   * GC
   * Company
   * Project
   *
   * This rank controls deterministic ordering
   * and provenance only.
   *
   * It must NOT be treated as a proxy for
   * requirement stringency.
   */
  switch (
    sourceLevelForPackType(
      packType,
    )
  ) {
    case "Qoreva":
      return 0;

    case "Federal":
      return 10;

    case "StatePlan":
      return 20;

    case "Owner":
      return 30;

    case "GC":
      return 40;

    case "Company":
      return 50;

    case "Project":
      return 60;

    case "Other":
    default:
      return 25;
  }
}

function resolveRequirementGroups(
  rules:
    ResolvedRequirementRule[],
) {
  const grouped =
    new Map<
      string,
      ResolvedRequirementRule[]
    >();

  for (
    const rule of
    rules
  ) {
    /*
     * Do not infer overlap from category/title.
     *
     * Rules without an explicit resolution group
     * remain standalone.
     */
    const groupKey =
      rule.resolutionGroupKey ??
      `RULE:${rule.id}`;

    const existing =
      grouped.get(
        groupKey,
      ) ??
      [];

    existing.push(
      rule,
    );

    grouped.set(
      groupKey,
      existing,
    );
  }

  const groups:
    ResolvedRequirementGroup[] =
    [];

  for (
    const [
      groupKey,
      groupRules,
    ] of grouped.entries()
  ) {
    const orderedRules =
      [...groupRules].sort(
        (a, b) => {
          if (
            a.sourcePrecedenceRank !==
            b.sourcePrecedenceRank
          ) {
            return (
              a.sourcePrecedenceRank -
              b.sourcePrecedenceRank
            );
          }

          if (
            a.packVersion !==
            b.packVersion
          ) {
            return (
              a.packVersion -
              b.packVersion
            );
          }

          return a.ruleCode.localeCompare(
            b.ruleCode,
          );
        },
      );

    const category =
      orderedRules.find(
        (rule) =>
          Boolean(
            rule.category,
          ),
      )?.category ??
      null;

    /*
     * No explicit grouping means this requirement
     * stands independently.
     */
    if (
      orderedRules.length ===
        1 &&
      !orderedRules[0]
        .resolutionGroupKey
    ) {
      const onlyRule =
        orderedRules[0];

      groups.push({
        groupKey,

        category,

        relationship:
          "Standalone",

        status:
          "Standalone",

        ruleIds: [
          onlyRule.id,
        ],

        ruleCodes: [
          onlyRule.ruleCode,
        ],

        controllingRuleId:
          onlyRule.id,

        controllingRuleCode:
          onlyRule.ruleCode,

        requiresQualifiedReview:
          false,

        resolutionReason:
          "No explicit overlap group is configured. This applicable requirement remains independently controlling for its own subject.",
      });

      continue;
    }

    const relationshipHints =
      orderedRules
        .map(
          (rule) =>
            rule.relationshipHint,
        )
        .filter(
          (
            relationship,
          ): relationship is
            | "Additive"
            | "Overlapping" =>
            Boolean(
              relationship,
            ),
        );

    const allExplicitlyAdditive =
      relationshipHints.length ===
        orderedRules.length &&
      relationshipHints.every(
        (relationship) =>
          relationship ===
          "Additive",
      );

    /*
     * Additive rules all remain applicable.
     *
     * Example:
     * OSHA may require one control while an
     * Owner adds another non-conflicting control.
     */
    if (
      allExplicitlyAdditive
    ) {
      groups.push({
        groupKey,

        category,

        relationship:
          "Additive",

        status:
          "Additive",

        ruleIds:
          orderedRules.map(
            (rule) =>
              rule.id,
          ),

        ruleCodes:
          orderedRules.map(
            (rule) =>
              rule.ruleCode,
          ),

        controllingRuleId:
          null,

        controllingRuleCode:
          null,

        requiresQualifiedReview:
          false,

        resolutionReason:
          "All rules in this group are explicitly configured as additive. Qoreva preserves and applies each requirement rather than selecting one controlling rule.",
      });

      continue;
    }

    /*
     * For overlapping requirements, Qoreva only
     * determines the controlling/more-stringent
     * requirement when every rule includes explicit
     * comparable stringency metadata.
     *
     * Source precedence is never used as a
     * stringency tie-breaker.
     */
    const allHaveStringencyRank =
      orderedRules.every(
        (rule) =>
          rule.stringencyRank !==
          null,
      );

    if (
      allHaveStringencyRank
    ) {
      const highestRank =
        Math.max(
          ...orderedRules.map(
            (rule) =>
              rule.stringencyRank as number,
          ),
        );

      const highestRules =
        orderedRules.filter(
          (rule) =>
            rule.stringencyRank ===
            highestRank,
        );

      if (
        highestRules.length ===
        1
      ) {
        const controllingRule =
          highestRules[0];

        groups.push({
          groupKey,

          category,

          relationship:
            "Overlapping",

          status:
            "ControllingResolved",

          ruleIds:
            orderedRules.map(
              (rule) =>
                rule.id,
            ),

          ruleCodes:
            orderedRules.map(
              (rule) =>
                rule.ruleCode,
            ),

          controllingRuleId:
            controllingRule.id,

          controllingRuleCode:
            controllingRule.ruleCode,

          requiresQualifiedReview:
            false,

          resolutionReason:
            "All overlapping requirements contain explicit comparable stringency metadata, and one requirement has the unique highest stringency rank.",
        });

        continue;
      }
    }

    /*
     * If stringency cannot be determined
     * deterministically, Qoreva surfaces the
     * overlap instead of inventing a winner.
     */
    groups.push({
      groupKey,

      category,

      relationship:
        "Overlapping",

      status:
        "ReviewRequired",

      ruleIds:
        orderedRules.map(
          (rule) =>
            rule.id,
        ),

      ruleCodes:
        orderedRules.map(
          (rule) =>
            rule.ruleCode,
        ),

      controllingRuleId:
        null,

      controllingRuleCode:
        null,

      requiresQualifiedReview:
        true,

      resolutionReason:
        "Multiple applicable requirements overlap, but Qoreva does not have sufficient deterministic stringency metadata to select a controlling requirement. Qualified review is required.",
    });
  }

  return groups.sort(
    (a, b) =>
      a.groupKey.localeCompare(
        b.groupKey,
      ),
  );
}

export async function resolveApplicablePlanningRequirements(
  planningRecordId: string,

  overrides:
    RequirementResolutionOverrides = {},
): Promise<PlanningRequirementResolutionResult> {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id:
          planningRecordId,

        isArchived:
          false,
      },

      include: {
        company:
          true,

        project:
          true,

        contractor:
          true,

        activities: {
          where: {
            isActive:
              true,

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

  /*
   * Requirement Packs may be tenant-specific
   * or part of Qoreva's shared baseline library.
   *
   * QOREVA is the system-level namespace,
   * consistent with the shared Guided Planning
   * Question library.
   */
  const candidatePacks =
    await prisma.requirementPack.findMany({
      where: {
        tenantId: {
          in: [
            "QOREVA",
            record.tenantId,
          ],
        },

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
          const precedenceDifference =
            sourcePrecedenceRank(
              a.packType,
            ) -
            sourcePrecedenceRank(
              b.packType,
            );

          if (
            precedenceDifference !==
            0
          ) {
            return precedenceDifference;
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

      if (
        !resolution.applies
      ) {
        continue;
      }

      const resolutionMetadata =
        parseResolutionMetadata(
          rule.sourceReference,
        );

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

        sourceLevel:
          sourceLevelForPackType(
            pack.packType,
          ),

        sourcePrecedenceRank:
          sourcePrecedenceRank(
            pack.packType,
          ),

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

        resolutionGroupKey:
          resolutionMetadata.groupKey,

        relationshipHint:
          resolutionMetadata.relationship,

        stringencyRank:
          resolutionMetadata.stringencyRank,
      });
    }
  }

  const orderedRules =
    [...resolvedRules].sort(
      (a, b) => {
        if (
          a.sourcePrecedenceRank !==
          b.sourcePrecedenceRank
        ) {
          return (
            a.sourcePrecedenceRank -
            b.sourcePrecedenceRank
          );
        }

        const categoryComparison =
          (
            a.category ??
            ""
          ).localeCompare(
            b.category ??
            "",
          );

        if (
          categoryComparison !==
          0
        ) {
          return categoryComparison;
        }

        return a.ruleCode.localeCompare(
          b.ruleCode,
        );
      },
    );

  const groups =
    resolveRequirementGroups(
      orderedRules,
    );

  const additiveGroupCount =
    groups.filter(
      (group) =>
        group.status ===
        "Additive",
    ).length;

  const overlappingGroupCount =
    groups.filter(
      (group) =>
        group.relationship ===
        "Overlapping",
    ).length;

  const controllingResolvedGroupCount =
    groups.filter(
      (group) =>
        group.status ===
        "ControllingResolved",
    ).length;

  const reviewRequiredGroupCount =
    groups.filter(
      (group) =>
        group.status ===
        "ReviewRequired",
    ).length;

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
      orderedRules,

    groups,

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

          sourceLevel:
            sourceLevelForPackType(
              pack.packType,
            ),

          sourcePrecedenceRank:
            sourcePrecedenceRank(
              pack.packType,
            ),
        }),
      ),

    metadata: {
      candidatePackCount:
        candidatePacks.length,

      applicablePackCount:
        applicablePacks.length,

      candidateRuleCount,

      applicableRuleCount:
        orderedRules.length,

      unresolvedRuleCount,

      requirementGroupCount:
        groups.length,

      additiveGroupCount,

      overlappingGroupCount,

      controllingResolvedGroupCount,

      reviewRequiredGroupCount,

      resolverVersion:
        "qoreva-requirements-v3-precedence-resolution",
    },
  };
}