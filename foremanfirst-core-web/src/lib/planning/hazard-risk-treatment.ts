import type {
  CanonicalHazardConceptId,
} from "./hazard-control-library";

import type {
  PlanningRiskLevel,
} from "./controlled-risk-evaluator";

/**
 * Qoreva Planning — Hazard Risk-Treatment Intelligence
 *
 * Purpose:
 *
 * Define what Controlled Risk recommendation Qoreva may
 * defensibly make for a canonical hazard after its required
 * protective-function coverage has been satisfied.
 *
 * Protective coverage and risk treatment are deliberately
 * separate:
 *
 * Coverage answers:
 * "Is the expected control system sufficiently represented?"
 *
 * Risk treatment answers:
 * "What risk recommendation, if any, may Qoreva make from that
 * control system?"
 *
 * This module intentionally does NOT:
 *
 * - calculate risk from control counts
 * - use Hierarchy of Controls as a numeric score
 * - assume Covered means risk must decrease
 * - change credible consequence severity
 * - make the qualified person's final risk decision
 *
 * MVP begins conservatively. Pilot hazards may participate in
 * Controlled Risk evaluation, but coverage alone does not yet
 * authorize an automatic reduction from Inherent Risk.
 *
 * AI assists. Qualified people make final decisions.
 */

export type HazardRiskTreatmentPolicy = {
  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  /**
   * Inherent Risk levels for which this policy has been
   * explicitly reviewed.
   */
  supportedInherentRiskLevels:
    PlanningRiskLevel[];

  /**
   * Maximum automatic reduction authorized by this policy.
   *
   * 0 means Qoreva may recommend maintaining Inherent Risk
   * after sufficient coverage, but may not automatically
   * recommend a lower level.
   *
   * Future validated policies may authorize a bounded
   * categorical reduction without introducing points-based
   * scoring.
   */
  maximumAutomaticReductionLevels:
    0 | 1 | 2;

  basis: string;

  policyVersion: string;
};

const PILOT_POLICY_VERSION =
  "qoreva-hazard-risk-treatment-pilot-v1";

/**
 * Conservative MVP pilot.
 *
 * These hazards have explicit control-effectiveness and
 * protective-coverage intelligence, but the current pilot does
 * not yet authorize automatic categorical risk reduction.
 *
 * This allows Qoreva to distinguish:
 *
 * - insufficient evidence
 * - complete protective coverage
 * - defensible recommendation to maintain Inherent Risk
 *
 * without falsely claiming that coverage itself proves a lower
 * Controlled Risk.
 */
const hazardRiskTreatmentPolicies:
  HazardRiskTreatmentPolicy[] =
  [
    {
      canonicalHazardConceptId:
        "EXCAVATION_COLLAPSE",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Protective-system selection and competent-person assurance are necessary to control excavation-collapse exposure, but the current Qoreva pilot does not yet contain a validated hazard-specific likelihood model that justifies automatically lowering the planner-selected Inherent Risk category.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_SHOCK",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "De-energization and safe-condition verification provide strong protection when applicable and correctly established, but the current pilot does not automatically translate that protection into a lower categorical risk level.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_UNEXPECTED_ENERGIZATION",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Energy isolation and safe-condition verification are required protective functions for the current pilot path, but coverage alone does not authorize automatic categorical risk reduction.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_STORED_ENERGY",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Energy-source identification, isolation, and safe-condition verification form the current pilot control system, but Qoreva does not yet have a validated hazard-specific basis for automatically lowering the planner-selected Inherent Risk category.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },
    {
      canonicalHazardConceptId:
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Hand positioning, suitable tools, worker separation, and task-appropriate hand protection form the current manual-potholing control system, but the Qoreva pilot does not yet authorize an automatic reduction from the planner-selected Inherent Risk category.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Utility-location preparation, positive verification, maintained clearance, and approved non-destructive exposure methods provide the required protective system, but the current pilot does not automatically translate that coverage into a lower categorical risk level.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Document review, additional locating where required, positive verification, and stopping mechanical excavation when location remains uncertain address the current protective-coverage requirements, but they do not authorize automatic categorical risk reduction in the pilot.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Support requirements, an approved support system, loading controls, and continuing inspection form the current exposed-utility support strategy, but Qoreva does not yet have a validated likelihood model that authorizes an automatic reduction from Inherent Risk.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      supportedInherentRiskLevels: [
        "Low",
        "Medium",
        "High",
      ],

      maximumAutomaticReductionLevels:
        0,

      basis:
        "Controlled travel areas, worker separation, communication, and conditional spotter use form the current mobile-equipment interaction control system, but the pilot does not automatically lower the planner-selected Inherent Risk category.",

      policyVersion:
        PILOT_POLICY_VERSION,
    },

  ];

const hazardRiskTreatmentPolicyById =
  new Map(
    hazardRiskTreatmentPolicies.map(
      (policy) => [
        policy.canonicalHazardConceptId,
        policy,
      ],
    ),
  );

export function getHazardRiskTreatmentPolicy(
  canonicalHazardConceptId:
    CanonicalHazardConceptId,
):
  | HazardRiskTreatmentPolicy
  | null {
  return (
    hazardRiskTreatmentPolicyById.get(
      canonicalHazardConceptId,
    ) ?? null
  );
}
