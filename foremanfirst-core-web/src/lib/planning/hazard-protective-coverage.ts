import type {
  CanonicalHazardConceptId,
} from "./hazard-control-library";

import type {
  ControlProtectiveFunction,
} from "./control-effectiveness";

/**
 * Qoreva Planning — Hazard Protective Coverage Intelligence
 *
 * Purpose:
 *
 * Describe the protective functions that make up a defensible
 * control system for a canonical hazard.
 *
 * This module answers:
 *
 * "What kinds of protection should be represented before Qoreva
 * can consider this hazard sufficiently covered for Controlled
 * Risk evaluation?"
 *
 * It intentionally does NOT:
 *
 * - calculate Controlled Risk
 * - award numeric risk-reduction points
 * - treat control count as protection
 * - assume Hierarchy of Controls proves effectiveness
 * - treat a supporting control as a substitute for a primary control
 * - make a Critical Control designation official
 * - replace qualified-person judgment
 *
 * AI assists. Qualified people make final decisions.
 */

export type HazardProtectiveFunctionRole =
  | "Prerequisite"
  | "Primary"
  | "Assurance"
  | "Supporting";

export type HazardProtectiveFunctionRequirement = {
  protectiveFunction:
    ControlProtectiveFunction;

  role:
    HazardProtectiveFunctionRole;

  /**
   * When true, this protective function must be sufficiently
   * represented before Qoreva may consider the hazard's planned
   * control system complete enough for Controlled Risk evaluation.
   */
  requiredForCoverage:
    boolean;

  /**
   * Human-readable explanation of why this protective function
   * belongs in the hazard's control system.
   */
  basis:
    string;
};

export type HazardProtectiveCoverageDefinition = {
  canonicalHazardConceptId:
    CanonicalHazardConceptId;

  protectiveFunctions:
    HazardProtectiveFunctionRequirement[];
};

/**
 * Pilot protective-coverage intelligence.
 *
 * Start deliberately small and explicit. A hazard that does not
 * have a definition here remains unresolved for automatic
 * protective-coverage evaluation.
 *
 * These definitions describe the expected structure of the
 * planned control system. They do not prove field implementation.
 */
const hazardProtectiveCoverageDefinitions:
  HazardProtectiveCoverageDefinition[] =
  [
    {
      canonicalHazardConceptId:
        "EXCAVATION_COLLAPSE",

      protectiveFunctions: [
        {
          protectiveFunction:
            "PreventExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Workers exposed to excavation collapse require a protective strategy that directly prevents or controls the collapse exposure when such protection is applicable.",
        },

        {
          protectiveFunction:
            "DetectCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "Excavation conditions can change before and during work, so competent-person inspection and reassessment provide required assurance that the planned protective strategy remains suitable.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_SHOCK",

      protectiveFunctions: [
        {
          protectiveFunction:
            "RemoveHazard",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "The preferred planned protective strategy is removal of hazardous electrical energy when de-energized work is feasible.",
        },

        {
          protectiveFunction:
            "VerifySafeCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The assumed de-energized or otherwise safe electrical condition must be verified before exposure begins.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_UNEXPECTED_ENERGIZATION",

      protectiveFunctions: [
        {
          protectiveFunction:
            "IsolateEnergy",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Hazardous energy must be isolated and controlled so unexpected energization cannot expose affected workers during the planned work.",
        },

        {
          protectiveFunction:
            "VerifySafeCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The planned isolated condition must be verified before affected work begins.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "ELECTRICAL_STORED_ENERGY",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Prerequisite",

          requiredForCoverage:
            true,

          basis:
            "Hazardous energy sources must first be identified so the isolation strategy can address the actual sources capable of affecting the work.",
        },

        {
          protectiveFunction:
            "IsolateEnergy",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Identified hazardous or stored energy must be isolated or otherwise controlled before affected work proceeds.",
        },

        {
          protectiveFunction:
            "VerifySafeCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The required safe state must be verified before workers rely on the planned energy-control condition.",
        },
      ],
    },
  ];

const hazardProtectiveCoverageById =
  new Map(
    hazardProtectiveCoverageDefinitions.map(
      (definition) => [
        definition.canonicalHazardConceptId,
        definition,
      ],
    ),
  );

export function getHazardProtectiveCoverage(
  canonicalHazardConceptId:
    CanonicalHazardConceptId,
):
  | HazardProtectiveCoverageDefinition
  | null {
  return (
    hazardProtectiveCoverageById.get(
      canonicalHazardConceptId,
    ) ?? null
  );
}
