import {
  canonicalHazardControlLibrary,
  getCanonicalControlHierarchy,
  type CanonicalHazardConceptId,
  type ControlHierarchy,
} from "./hazard-control-library";

import type {
  PlanningRequirementResolutionResult,
  ResolvedRequirementRule,
} from "./requirement-resolver";

/*
 * Qoreva Planning — Hazard / Control Recommender
 *
 * Purpose:
 *
 * Convert:
 *
 *   confirmed activities
 *   + applicable requirement rules
 *   + normalized source-backed controls
 *
 * into:
 *
 *   structured hazard/control recommendations
 *
 * This module intentionally does NOT:
 *
 * - read raw PDFs
 * - infer requirements from free-form user hazard text
 * - decide that a suggested control is accepted
 * - silently map ambiguous requirement text to a hazard
 *
 * AI assists. Qualified people make final decisions.
 */

export type HazardRecommendationDecision =
  | "Pending"
  | "Accepted"
  | "Modified"
  | "NotApplicable";

export type HazardRecommendationSourceType =
  | "CanonicalLibrary"
  | "Requirement";

export type HazardControlSource = {
  requirementRuleId: string | null;
  requirementRuleCode: string | null;

  requirementPackId: string | null;
  requirementPackName: string | null;

  packType: string | null;
  organizationName: string | null;

  sourceDocumentName: string | null;
  sourcePage: string | null;

  requirementText: string | null;
};

export type RecommendedControl = {
  id: string;

  text: string;

  /**
   * Qoreva Hierarchy of Controls classification.
   *
   * Null means the control has not yet been authoritatively classified.
   * Callers must not infer a hierarchy classification merely from free text.
   */
  controlHierarchy:
    ControlHierarchy | null;

  sourceType:
    HazardRecommendationSourceType;

  required: boolean;

  sourceActivityCodes: string[];

  sourceRequirementIds: string[];

  sources:
    HazardControlSource[];
};

export type HazardControlRecommendation = {
  id: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  hazardLabel: string;

  hazardDescription: string;

  hazardKind:
    | "Hazard"
    | "Exposure"
    | "ReadinessCondition";

  sourceActivityCodes: string[];

  controls: RecommendedControl[];

  riskAttention:
    | "Normal"
    | "Elevated"
    | "HighAttention";

  decision:
    HazardRecommendationDecision;

  requiresQualifiedReview: boolean;

  sources:
    HazardControlSource[];
};

export type UnassignedRequirementControl = {
  id: string;

  text: string;

  requirementRuleId: string;

  requirementRuleCode: string;

  requirementPackId: string;

  requirementPackName: string;

  packType: string;

  organizationName: string | null;

  sourceDocumentName: string | null;

  sourcePage: string | null;

  reason: string;
};

export type HazardControlRecommendationResult = {
  recommendations:
    HazardControlRecommendation[];

  unassignedRequirementControls:
    UnassignedRequirementControl[];

  metadata: {
    activityCount: number;

    applicableRequirementCount:
      number;

    recommendationCount: number;

    requirementBackedRecommendationCount:
      number;

    unassignedRequirementControlCount:
      number;

    recommenderVersion: string;
  };
};

/*
 * New normalized requiredControls contract.
 *
 * Requirement rules may eventually be produced from:
 *
 * - OSHA content
 * - State Plan content
 * - Owner requirements
 * - GC requirements
 * - company requirements
 * - project requirements
 * - contractor safety manuals
 *
 * A control should carry an explicit canonical hazard ID
 * whenever the source has been reviewed and normalized.
 *
 * We deliberately do not infer the hazard relationship
 * from arbitrary control wording here.
 */
type StructuredRequirementControl = {
  text: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  activityCodes: string[];

  required: boolean;
};

type RequirementControlParseResult = {
  assigned:
    StructuredRequirementControl[];

  unassigned: string[];
};

function stableRecommendationId(
  ...parts: Array<
    string | number | null | undefined
  >
) {
  const normalized =
    parts
      .map((part) =>
        String(part ?? "")
          .trim()
          .toLowerCase(),
      )
      .join("|");

  let hash = 2166136261;

  for (
    let index = 0;
    index < normalized.length;
    index += 1
  ) {
    hash ^=
      normalized.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return `qoreva-hc-${(
    hash >>> 0
  ).toString(36)}`;
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

  if (
    !Array.isArray(value)
  ) {
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

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value,
    )
  );
}

function isCanonicalHazardConceptId(
  value: unknown,
): value is CanonicalHazardConceptId {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  return (
    value in
    canonicalHazardControlLibrary
  );
}

function uniqueStrings(
  values: string[],
) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          value.trim(),
        )
        .filter(Boolean),
    ),
  );
}

function sourceFromRule(
  rule:
    ResolvedRequirementRule,
): HazardControlSource {
  return {
    requirementRuleId:
      rule.id,

    requirementRuleCode:
      rule.ruleCode,

    requirementPackId:
      rule.requirementPackId,

    requirementPackName:
      rule.requirementPackName,

    packType:
      rule.packType,

    organizationName:
      rule.organizationName,

    sourceDocumentName:
      rule.sourceDocumentName,

    sourcePage:
      rule.sourcePage,

    requirementText:
      rule.requirementText,
  };
}

/*
 * Supports both:
 *
 * LEGACY
 *
 * requiredControls: [
 *   "Use a spotter when required."
 * ]
 *
 * NEW NORMALIZED FORM
 *
 * requiredControls: [
 *   {
 *     text:
 *       "Maintain separation between workers and mobile equipment.",
 *
 *     canonicalHazardConceptId:
 *       "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",
 *
 *     activityCodes: [
 *       "MOBILE_EQUIPMENT"
 *     ],
 *
 *     required: true
 *   }
 * ]
 *
 * Legacy strings are preserved but are NOT automatically attached
 * to a hazard because that would recreate the inference problem
 * we are intentionally removing.
 */
function parseRequirementControls(
  value: unknown,
): RequirementControlParseResult {
  if (
    !Array.isArray(value)
  ) {
    return {
      assigned: [],
      unassigned: [],
    };
  }

  const assigned:
    StructuredRequirementControl[] =
    [];

  const unassigned:
    string[] = [];

  for (
    const item of
    value
  ) {
    if (
      typeof item ===
      "string"
    ) {
      const text =
        item.trim();

      if (text) {
        unassigned.push(
          text,
        );
      }

      continue;
    }

    if (
      !isRecord(item)
    ) {
      continue;
    }

    const text =
      nullableString(
        item.text ??
          item.control ??
          item.controlText,
      );

    if (!text) {
      continue;
    }

    const rawConceptId =
      item.canonicalHazardConceptId ??
      item.hazardConceptId ??
      item.relationshipId;

    if (
      !isCanonicalHazardConceptId(
        rawConceptId,
      )
    ) {
      /*
       * Keep the source-backed control visible,
       * but do not manufacture the hazard relationship.
       */
      unassigned.push(
        text,
      );

      continue;
    }

    assigned.push({
      text,

      canonicalHazardConceptId:
        rawConceptId,

      activityCodes:
        normalizeStringArray(
          item.activityCodes ??
            item.activityCode,
        ),

      required:
        item.required !==
        false,
    });
  }

  return {
    assigned,
    unassigned:
      uniqueStrings(
        unassigned,
      ),
  };
}

function canonicalDefinitionApplies(
  conceptId:
    CanonicalHazardConceptId,

  confirmedActivityCodes:
    Set<string>,
) {
  const definition =
    canonicalHazardControlLibrary[
      conceptId
    ];

  /*
   * GENERAL_WORK relationships are intentionally
   * available across the planning workflow.
   */
  if (
    definition.activityCodes.includes(
      "GENERAL_WORK",
    )
  ) {
    return true;
  }

  return definition
    .activityCodes
    .some(
      (activityCode) =>
        confirmedActivityCodes.has(
          activityCode,
        ),
    );
}

function relevantDefinitionActivities(
  conceptId:
    CanonicalHazardConceptId,

  confirmedActivityCodes:
    Set<string>,
) {
  const definition =
    canonicalHazardControlLibrary[
      conceptId
    ];

  return definition
    .activityCodes
    .filter(
      (activityCode) =>
        activityCode ===
          "GENERAL_WORK" ||
        confirmedActivityCodes.has(
          activityCode,
        ),
    );
}

function canonicalRiskAttention(
  conceptId:
    CanonicalHazardConceptId,
):
  | "Normal"
  | "Elevated"
  | "HighAttention" {
  const definition =
    canonicalHazardControlLibrary[
      conceptId
    ];

  return definition.riskAttention
    ? "HighAttention"
    : "Normal";
}

function baselineRecommendation(
  conceptId:
    CanonicalHazardConceptId,

  confirmedActivityCodes:
    Set<string>,
): HazardControlRecommendation {
  const definition =
    canonicalHazardControlLibrary[
      conceptId
    ];

  const sourceActivityCodes =
    relevantDefinitionActivities(
      conceptId,
      confirmedActivityCodes,
    );

  return {
    id:
      stableRecommendationId(
        "hazard",
        conceptId,
      ),

    canonicalHazardConceptId:
      conceptId,

    hazardLabel:
      definition.label,

    hazardDescription:
      definition.description,

    hazardKind:
      definition.kind,

    sourceActivityCodes,

    controls:
      definition.controls.map(
        (
          control,
          index,
        ) => ({
          id:
            stableRecommendationId(
              "canonical-control",
              conceptId,
              index,
              control,
            ),

          text:
            control,

          controlHierarchy:
            getCanonicalControlHierarchy(
              control,
            ),

          sourceType:
            "CanonicalLibrary",

          /*
           * Canonical library controls are recommendations.
           * Requirement-backed controls become required
           * only when an applicable source rule says so.
           */
          required:
            false,

          sourceActivityCodes,

          sourceRequirementIds:
            [],

          sources:
            [],
        }),
      ),

    riskAttention:
      canonicalRiskAttention(
        conceptId,
      ),

    decision:
      "Pending",

    requiresQualifiedReview:
      true,

    sources:
      [],
  };
}

function mergeControlIntoRecommendation(
  recommendation:
    HazardControlRecommendation,

  control:
    StructuredRequirementControl,

  rule:
    ResolvedRequirementRule,
) {
  const normalizedText =
    control.text
      .trim()
      .toLowerCase();

  const source =
    sourceFromRule(
      rule,
    );

  const existing =
    recommendation.controls.find(
      (candidate) =>
        candidate.text
          .trim()
          .toLowerCase() ===
        normalizedText,
    );

  if (existing) {
    existing.required =
      existing.required ||
      control.required;

    existing.sourceType =
      "Requirement";

    existing.sourceActivityCodes =
      uniqueStrings([
        ...existing
          .sourceActivityCodes,
        ...control
          .activityCodes,
      ]);

    existing.sourceRequirementIds =
      uniqueStrings([
        ...existing
          .sourceRequirementIds,
        rule.id,
      ]);

    if (
      !existing.sources.some(
        (candidate) =>
          candidate
            .requirementRuleId ===
          rule.id,
      )
    ) {
      existing.sources.push(
        source,
      );
    }

    return;
  }

  recommendation.controls.push({
    id:
      stableRecommendationId(
        "requirement-control",
        recommendation
          .canonicalHazardConceptId,
        rule.id,
        control.text,
      ),

    text:
      control.text,

    /*
     * Requirement-backed controls remain unclassified until the
     * normalized requirement source carries an authoritative hierarchy
     * classification. Qoreva must not guess from arbitrary wording.
     */
    controlHierarchy:
      getCanonicalControlHierarchy(
        control.text,
      ),

    sourceType:
      "Requirement",

    required:
      control.required,

    sourceActivityCodes:
      uniqueStrings([
        ...recommendation
          .sourceActivityCodes,
        ...control
          .activityCodes,
      ]),

    sourceRequirementIds: [
      rule.id,
    ],

    sources: [
      source,
    ],
  });
}

function addRuleSourceToRecommendation(
  recommendation:
    HazardControlRecommendation,

  rule:
    ResolvedRequirementRule,
) {
  if (
    recommendation.sources.some(
      (source) =>
        source
          .requirementRuleId ===
        rule.id,
    )
  ) {
    return;
  }

  recommendation.sources.push(
    sourceFromRule(
      rule,
    ),
  );
}

export function recommendPlanningHazardsAndControls({
  activityCodes,
  requirementResolution,
}: {
  activityCodes:
    string[];

  requirementResolution:
    PlanningRequirementResolutionResult;
}): HazardControlRecommendationResult {
  const normalizedActivityCodes =
    uniqueStrings(
      activityCodes,
    );

  const confirmedActivityCodes =
    new Set(
      normalizedActivityCodes,
    );

  const recommendations =
    new Map<
      CanonicalHazardConceptId,
      HazardControlRecommendation
    >();

  /*
   * STEP 1
   *
   * Create canonical candidates from confirmed work activity.
   *
   * These are suggestions only. They are NOT automatically
   * accepted into the official PTP.
   */
  for (
    const conceptId of
    Object.keys(
      canonicalHazardControlLibrary,
    ) as CanonicalHazardConceptId[]
  ) {
    if (
      !canonicalDefinitionApplies(
        conceptId,
        confirmedActivityCodes,
      )
    ) {
      continue;
    }

    recommendations.set(
      conceptId,
      baselineRecommendation(
        conceptId,
        confirmedActivityCodes,
      ),
    );
  }

  const unassignedRequirementControls:
    UnassignedRequirementControl[] =
    [];

  /*
   * STEP 2
   *
   * Overlay applicable requirement controls.
   *
   * This is where OSHA, State, Owner, GC, Project,
   * Company and contractor safety-manual rules can
   * enrich the canonical recommendation.
   */
  for (
    const rule of
    requirementResolution.rules
  ) {
    const parsed =
      parseRequirementControls(
        rule.requiredControls,
      );

    for (
      const control of
      parsed.assigned
    ) {
      const conceptId =
        control
          .canonicalHazardConceptId;

      /*
       * Do not surface a relationship that is unrelated
       * to the currently confirmed work activity unless
       * the applicable requirement itself explicitly
       * supplied an activity code that is active.
       */
      const definitionApplies =
        canonicalDefinitionApplies(
          conceptId,
          confirmedActivityCodes,
        );

      const explicitActivityApplies =
        control.activityCodes
          .some(
            (activityCode) =>
              confirmedActivityCodes.has(
                activityCode,
              ),
          );

      if (
        !definitionApplies &&
        !explicitActivityApplies
      ) {
        continue;
      }

      let recommendation =
        recommendations.get(
          conceptId,
        );

      if (!recommendation) {
        recommendation =
          baselineRecommendation(
            conceptId,
            confirmedActivityCodes,
          );

        recommendations.set(
          conceptId,
          recommendation,
        );
      }

      mergeControlIntoRecommendation(
        recommendation,
        control,
        rule,
      );

      addRuleSourceToRecommendation(
        recommendation,
        rule,
      );
    }

    /*
     * Legacy string controls stay visible for future
     * normalization but are not guessed onto hazards.
     *
     * This is intentional.
     */
    for (
      const controlText of
      parsed.unassigned
    ) {
      unassignedRequirementControls.push({
        id:
          stableRecommendationId(
            "unassigned-requirement-control",
            rule.id,
            controlText,
          ),

        text:
          controlText,

        requirementRuleId:
          rule.id,

        requirementRuleCode:
          rule.ruleCode,

        requirementPackId:
          rule.requirementPackId,

        requirementPackName:
          rule.requirementPackName,

        packType:
          rule.packType,

        organizationName:
          rule.organizationName,

        sourceDocumentName:
          rule.sourceDocumentName,

        sourcePage:
          rule.sourcePage,

        reason:
          "This applicable requirement contains a control, but the control does not yet have an explicit canonical hazard relationship. Qualified normalization is required before Qoreva assigns it automatically.",
      });
    }
  }

  /*
   * STEP 3
   *
   * Deterministic ordering.
   *
   * High-attention recommendations first, then
   * alphabetical for predictable field UX.
   */
  const orderedRecommendations =
    Array.from(
      recommendations.values(),
    ).sort(
      (a, b) => {
        const attentionRank = {
          HighAttention: 0,
          Elevated: 1,
          Normal: 2,
        } as const;

        const attentionDifference =
          attentionRank[
            a.riskAttention
          ] -
          attentionRank[
            b.riskAttention
          ];

        if (
          attentionDifference !==
          0
        ) {
          return attentionDifference;
        }

        return a.hazardLabel.localeCompare(
          b.hazardLabel,
        );
      },
    );

  const requirementBackedRecommendationCount =
    orderedRecommendations.filter(
      (recommendation) =>
        recommendation.sources
          .length > 0 ||
        recommendation.controls.some(
          (control) =>
            control.sourceType ===
            "Requirement",
        ),
    ).length;

  return {
    recommendations:
      orderedRecommendations,

    unassignedRequirementControls,

    metadata: {
      activityCount:
        normalizedActivityCodes.length,

      applicableRequirementCount:
        requirementResolution
          .rules.length,

      recommendationCount:
        orderedRecommendations
          .length,

      requirementBackedRecommendationCount,

      unassignedRequirementControlCount:
        unassignedRequirementControls
          .length,

      recommenderVersion:
        "qoreva-hazard-control-recommender-v1",
    },
  };
}