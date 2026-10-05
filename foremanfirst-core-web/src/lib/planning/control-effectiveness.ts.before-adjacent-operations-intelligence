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
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      controlText:
        "Select and inspect hand tools suitable for the material, exposure method, and known or suspected utilities.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Suitable, inspected hand tools support safe manual exposure work by reducing foreseeable tool failure, misuse, and uncontrolled contact, but tool selection alone does not prevent hands from entering an injury path.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      controlText:
        "Keep hands and other body parts outside striking, cutting, and pinch-point paths while digging or probing.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "PreventExposure",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Maintaining body position outside the active striking, cutting, and pinch-point path directly prevents exposure to the principal manual-potholing hand-injury mechanisms when consistently implemented.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      controlText:
        "Use task-appropriate hand protection and replace damaged gloves before continuing work.",

      controlHierarchy:
        "PPE",

      protectiveFunction:
        "LimitExposure",

      expectedEffectiveness:
        "Limited",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "Appropriate hand protection may reduce the severity of some cuts, abrasions, and punctures, but it does not remove striking or pinch-point exposure and must be selected for the actual task.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      controlText:
        "Maintain safe spacing and communication between workers performing manual excavation or potholing.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SeparateExposure",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "Safe spacing and communication reduce exposure to another worker's tool movement and unexpected actions, but they supplement rather than replace control of each worker's own hand and body position.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Obtain applicable utility locate information before disturbing the ground.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Current utility-locate information is a necessary planning prerequisite for ground disturbance, but markings and records alone do not prove the exact utility location or depth.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Positively expose or verify utilities where required before mechanical excavation.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Positive exposure or equivalent approved verification confirms the utility's actual location and depth before mechanical excavation enters the affected tolerance area.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Review available drawings, records, and field markings.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Reviewing available drawings, records, and current field markings supports identification of known and suspected utilities, but documentary information alone does not prove exact field location or depth.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Use private locating or additional locating methods when required by project conditions.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "Additional locating methods can improve confidence when records, markings, or site conditions are uncertain, but their effectiveness depends on the current context, method capability, and qualified interpretation of the results.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Maintain required clearances from known utilities.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SeparateExposure",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "A maintained clearance separates mechanical excavation from the verified utility location, but effectiveness depends on accurate field verification and continuous control of the work boundary.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      controlText:
        "Use approved non-destructive excavation methods where required.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "PreventExposure",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "An approved non-destructive exposure method directly reduces the likelihood of damaging an underground system while its precise location and condition are being established.",

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
    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      controlText:
        "Review available drawings, records, and field markings.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Reviewing available drawings, records, and current field markings establishes the known utility-location information before excavation, but records and markings alone do not confirm exact location or depth.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      controlText:
        "Use private locating or additional locating methods when required by project conditions.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "Additional locating methods can resolve incomplete or conflicting location information when project conditions require them, but their necessity and adequacy depend on the current work-step context.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      controlText:
        "Positively expose or verify utilities where required before mechanical excavation.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "VerifySafeCondition",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Positive exposure or an equivalent approved verification method confirms the actual utility location and depth before mechanical excavation relies on the planned boundary.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      controlText:
        "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "PreventExposure",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "Stopping mechanical excavation prevents continued exposure when utility location or depth remains uncertain; the qualified user must determine whether that uncertainty exists in the current work-step context.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      controlText:
        "Determine utility-owner and project requirements for supporting the exposed utility before removing its original soil support.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Identifying utility-owner and project support requirements is a prerequisite to selecting a suitable support system before the utility loses its original soil support.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      controlText:
        "Install and maintain an approved support method that prevents damaging movement, deflection, or separation of the exposed utility.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "PreventExposure",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "An approved support system directly prevents damaging movement, deflection, or separation after the utility's original soil support is removed.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      controlText:
        "Inspect the exposed utility and support system before work continues and whenever conditions or loading change.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "DetectCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Inspection detects movement, deterioration, inadequate support, or changed loading before workers continue relying on the support system.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      controlText:
        "Control equipment, spoil, materials, and other loading that could affect the exposed utility or its support system.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "SeparateExposure",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Controlling equipment, spoil, materials, and other loading separates destabilizing forces from the exposed utility and its support system.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      controlText:
        "Establish controlled travel paths and equipment operating areas.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "SeparateExposure",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Controlled travel paths and operating areas create defined separation between moving excavation equipment and affected workers, but effectiveness depends on maintaining those boundaries.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      controlText:
        "Maintain effective communication between operators, spotters, and affected workers.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "SupportReadiness",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "A shared communication method supports coordinated movement and stop-work actions between operators, spotters, and affected workers, but does not replace physical separation.",

      criticalControlCandidate:
        false,
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      controlText:
        "Separate workers from moving equipment whenever practical.",

      controlHierarchy:
        "Engineering",

      protectiveFunction:
        "SeparateExposure",

      expectedEffectiveness:
        "Strong",

      verificationExpectation:
        "Required",

      effectivenessBasis:
        "Physical or operational separation directly prevents workers from occupying the movement path and operating envelope of excavation equipment.",

      criticalControlCandidate:
        true,
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      controlText:
        "Use a spotter when visibility, backing, congestion, or site conditions require one.",

      controlHierarchy:
        "Administrative",

      protectiveFunction:
        "DetectCondition",

      expectedEffectiveness:
        "Moderate",

      verificationExpectation:
        "Conditional",

      effectivenessBasis:
        "A spotter can detect personnel, clearance, and movement conflicts when operator visibility or site conditions require assistance; applicability must be decided for the current work-step context.",

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
