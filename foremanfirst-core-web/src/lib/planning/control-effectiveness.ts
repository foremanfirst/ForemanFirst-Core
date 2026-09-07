import type {
  CanonicalHazardConceptId,
  ControlHierarchy,
} from "./hazard-control-library";

/**
 * Qoreva Planning — Control Effectiveness Intelligence
 *
 * Purpose:
 *
 * Describe the known protective characteristics of a canonical
 * hazard-to-control relationship without turning Hierarchy of
 * Controls into an automatic risk-reduction score.
 *
 * This module intentionally does NOT:
 *
 * - calculate Controlled Risk
 * - assume a higher-order control is automatically effective
 * - evaluate arbitrary custom control wording
 * - make a Critical Control designation official
 * - replace qualified-person judgment
 *
 * AI assists. Qualified people make final decisions.
 */

export type ControlEffectiveness =
  | "Strong"
  | "Moderate"
  | "Limited"
  | "Unresolved";

export type ControlVerificationExpectation =
  | "Required"
  | "Conditional"
  | "NotNormallyRequired"
  | "Unresolved";

export type ControlProtectiveFunction =
  | "RemoveHazard"
  | "PreventExposure"
  | "SeparateExposure"
  | "IsolateEnergy"
  | "DetectCondition"
  | "VerifySafeCondition"
  | "LimitExposure"
  | "SupportReadiness"
  | "EmergencyResponse"
  | "Unresolved";

export type CanonicalControlEffectivenessDefinition = {
  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  controlText: string;

  controlHierarchy:
    ControlHierarchy | null;

  protectiveFunction:
    ControlProtectiveFunction;

  /**
   * Expected effectiveness when the control is applicable,
   * correctly selected, properly implemented, and maintained.
   *
   * This is NOT proof that the control is effective in a
   * particular field condition.
   */
  expectedEffectiveness:
    ControlEffectiveness;

  verificationExpectation:
    ControlVerificationExpectation;

  /**
   * Human-readable explanation of why Qoreva classifies this
   * relationship this way.
   */
  effectivenessBasis: string;

  /**
   * A candidate may later become a Critical Control through
   * Qoreva recommendation + qualified-user confirmation.
   */
  criticalControlCandidate:
    boolean;
};

function intelligenceKey(
  canonicalHazardConceptId:
    CanonicalHazardConceptId,
  controlText: string,
) {
  return `${canonicalHazardConceptId}::${controlText
    .trim()
    .toLowerCase()}`;
}

/**
 * Canonical effectiveness intelligence.
 *
 * Start deliberately small and explicit.
 *
 * We only add relationships whose protective function and
 * verification expectation are sufficiently clear. Additional
 * construction activities will expand this library through
 * controlled cross-trade validation.
 */
const canonicalControlEffectivenessDefinitions:
  CanonicalControlEffectivenessDefinition[] =
  [
    {
      canonicalHazardConceptId:
        "EXCAVATION_COLLAPSE",

      controlText:
        "A competent person must inspect the excavation and surrounding conditions as required.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "DetectCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Competent-person inspection can identify changing excavation conditions and deficiencies requiring corrective action, but inspection alone does not physically prevent a cave-in.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "EXCAVATION_COLLAPSE",

      controlText:
        "Determine the required protective system based on excavation depth, soil, loading, water, and actual site conditions.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "PreventExposure",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "A properly selected and implemented protective system directly addresses worker exposure to excavation collapse, but effectiveness depends on actual site conditions, correct selection, installation, and continued suitability.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "EXCAVATION_COLLAPSE",

      controlText:
        "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "DetectCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Reinspection detects changes that may invalidate the original excavation assessment or protective-system assumptions, but it does not independently prevent collapse.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_SHOCK",

      controlText:
        "De-energized work should be the default whenever feasible.",

      controlHierarchy:
        "Elimination",

      protectiveFunction:
        "RemoveHazard",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Removing hazardous electrical energy can eliminate the energized-contact exposure when de-energization is actually established and the required safe condition is verified.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_SHOCK",

      controlText:
        "Verify the required safe condition before work begins.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Verification of the required safe condition provides direct confirmation that the assumed electrical safety state exists before exposure begins; effectiveness depends on the applicable procedure, qualified execution, and actual system condition.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_UNEXPECTED_ENERGIZATION",

      controlText:
        "Apply the required energy-isolation and lockout/tagout process before work begins.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "IsolateEnergy",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Proper energy isolation and lockout/tagout prevents hazardous energy from being reintroduced during affected work when all applicable energy sources are identified, isolated, controlled, and verified.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_UNEXPECTED_ENERGIZATION",

      controlText:
        "Verify the required safe condition before work begins.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Verification confirms that the expected isolated or de-energized condition exists before work begins and is therefore a key assurance step rather than merely a general instruction.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_STORED_ENERGY",

      controlText:
        "Identify all hazardous energy sources that could affect the work.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Identifying hazardous energy sources is necessary to establish an effective isolation plan, but identification alone does not control or dissipate the energy.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_STORED_ENERGY",

      controlText:
        "Apply the required energy-isolation and lockout/tagout process before work begins.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "IsolateEnergy",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Proper isolation and lockout/tagout directly controls identified hazardous energy when the isolation method addresses the actual energy sources and remains effective throughout the work.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_STORED_ENERGY",

      controlText:
        "Verify the required safe condition before work begins.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Verification confirms that hazardous or stored energy has been controlled to the required safe state before exposure begins.",

      criticalControlCandidate:
        true,
    },
  ];

const canonicalControlEffectivenessByKey =
  new Map(
    canonicalControlEffectivenessDefinitions.map(
      (definition) => [
        intelligenceKey(
          definition.canonicalHazardConceptId,
          definition.controlText,
        ),
        definition,
      ],
    ),
  );

export function getCanonicalControlEffectiveness({
  canonicalHazardConceptId,
  controlText,
}: {
  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  controlText: string;
}):
  | CanonicalControlEffectivenessDefinition
  | null {
  return (
    canonicalControlEffectivenessByKey.get(
      intelligenceKey(
        canonicalHazardConceptId,
        controlText,
      ),
    ) ?? null
  );
}
