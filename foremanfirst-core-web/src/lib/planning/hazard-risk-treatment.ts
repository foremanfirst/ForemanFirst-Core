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
