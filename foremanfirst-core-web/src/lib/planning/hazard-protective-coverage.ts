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
        "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Prerequisite",

          requiredForCoverage:
            true,

          basis:
            "Manual potholing requires tools that are suitable for the material and exposure method and confirmed fit for use before workers rely on them.",
        },

        {
          protectiveFunction:
            "PreventExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Workers must keep hands and other body parts outside the striking, cutting, and pinch-point paths created by manual digging and probing.",
        },

        {
          protectiveFunction:
            "SeparateExposure",

          role:
            "Supporting",

          requiredForCoverage:
            false,

          basis:
            "Spacing and communication can reduce exposure to another worker's movement but do not replace direct control of hand and body position.",
        },

        {
          protectiveFunction:
            "LimitExposure",

          role:
            "Supporting",

          requiredForCoverage:
            false,

          basis:
            "Task-appropriate hand protection may limit some injury severity but cannot substitute for preventing contact with the hazard.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_CONTACT",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Prerequisite",

          requiredForCoverage:
            true,

          basis:
            "Applicable locate information must be obtained before ground disturbance so the exposure strategy addresses known and suspected underground systems.",
        },

        {
          protectiveFunction:
            "VerifySafeCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The actual utility location and depth must be positively exposed or otherwise verified where required before mechanical excavation relies on the planned boundary.",
        },

        {
          protectiveFunction:
            "SeparateExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Required clearance must be maintained between mechanical excavation and the verified underground utility.",
        },

        {
          protectiveFunction:
            "PreventExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Approved non-destructive methods provide direct protection while utilities are being exposed or verified.",
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
    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Prerequisite",

          requiredForCoverage:
            true,

          basis:
            "Available drawings, records, and field markings must be reviewed so the verification strategy begins with the best available utility-location information.",
        },

        {
          protectiveFunction:
            "VerifySafeCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The actual utility location and depth must be sufficiently verified before mechanical excavation relies on the planned work boundary.",
        },

        {
          protectiveFunction:
            "PreventExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "The plan must stop mechanical excavation when location or depth cannot be adequately verified.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Prerequisite",

          requiredForCoverage:
            true,

          basis:
            "Utility-owner and project support requirements must be determined before the utility loses its original soil support.",
        },

        {
          protectiveFunction:
            "PreventExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "An approved support system must prevent damaging movement, deflection, or separation of the exposed utility.",
        },

        {
          protectiveFunction:
            "SeparateExposure",

          role:
            "Supporting",

          requiredForCoverage:
            true,

          basis:
            "Equipment, spoil, materials, and other destabilizing loading must be controlled around the exposed utility and its support system.",
        },

        {
          protectiveFunction:
            "DetectCondition",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The exposed utility and support system must be inspected before work continues and when conditions or loading change.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "GENERAL_ADJACENT_OPERATIONS",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "The crew must understand nearby and simultaneous operations before work begins so coordination needs and potential conflicts can be addressed.",
        },

        {
          protectiveFunction:
            "SeparateExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Work boundaries, access, equipment movement, and sequencing must be coordinated so affected crews and conflicting operations are appropriately separated in space or time.",
        },

        {
          protectiveFunction:
            "DetectCondition",

          role:
            "Supporting",

          requiredForCoverage:
            false,

          basis:
            "Stop-work and reassessment provide additional protection when changing adjacent operations introduce a new or uncontrolled exposure.",
        },
      ],
    },

    {
      canonicalHazardConceptId:
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",

      protectiveFunctions: [
        {
          protectiveFunction:
            "SeparateExposure",

          role:
            "Primary",

          requiredForCoverage:
            true,

          basis:
            "Workers must be separated from excavation-equipment travel paths and operating areas wherever practical.",
        },

        {
          protectiveFunction:
            "SupportReadiness",

          role:
            "Assurance",

          requiredForCoverage:
            true,

          basis:
            "Operators, spotters, and affected workers need an effective communication method to coordinate movement and stop-work actions.",
        },

        {
          protectiveFunction:
            "DetectCondition",

          role:
            "Supporting",

          requiredForCoverage:
            false,

          basis:
            "A spotter provides additional detection when visibility, backing, congestion, or other site conditions make one necessary.",
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
