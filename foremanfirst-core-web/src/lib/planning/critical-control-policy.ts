/**
 * Qoreva Planning — Critical Control Recommendation Policy
 *
 * Critical Control classification is separate from control
 * effectiveness, Risk Credit, and qualified-user designation.
 *
 * Unknown existing candidates remain Core until explicitly reviewed.
 * This fail-closed default prevents a policy omission from silently
 * removing a Critical Control review requirement.
 */

export const CRITICAL_CONTROL_POLICY_VERSION =
  "qoreva-critical-control-policy-v1";

export type CriticalControlClassification =
  | "Core"
  | "Contextual"
  | "Supporting";

export type CriticalControlPolicy = {
  classification:
    CriticalControlClassification;

  trigger:
    string | null;
};

function policyKey(
  canonicalHazardConceptId: string,
  controlText: string,
) {
  return `${canonicalHazardConceptId}::${controlText
    .trim()
    .toLowerCase()}`;
}

const contextualPolicies =
  new Map<string, string>([
    [
      policyKey(
        "EXCAVATION_COLLAPSE",
        "Reinspect after weather, vibration, water intrusion, or other conditions that could affect excavation stability.",
      ),
      "Weather, vibration, water intrusion, or another condition could affect excavation stability.",
    ],
    [
      policyKey(
        "UNDERGROUND_UTILITY_CONTACT",
        "Use private locating or additional locating methods when required by project conditions.",
      ),
      "Records, markings, site conditions, or project requirements require additional utility locating.",
    ],
    [
      policyKey(
        "UNDERGROUND_UTILITY_LOCATION_UNCERTAINTY",
        "Stop mechanical excavation when the utility location or depth cannot be adequately verified.",
      ),
      "The utility location or depth cannot be adequately verified.",
    ],
    [
      policyKey(
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",
        "Inspect the exposed utility and support system before work continues and whenever conditions or loading change.",
      ),
      "The utility has been exposed or its support conditions or loading have changed.",
    ],
    [
      policyKey(
        "UNDERGROUND_UTILITY_SUPPORT_LOSS",
        "Control equipment, spoil, materials, and other loading that could affect the exposed utility or its support system.",
      ),
      "Equipment, spoil, materials, or other loading could affect an exposed utility or its support system.",
    ],
    [
      policyKey(
        "MOBILE_EQUIPMENT_PERSONNEL_INTERACTION",
        "Use a spotter when visibility, backing, congestion, or site conditions require one.",
      ),
      "Visibility, backing, congestion, or site conditions require a spotter.",
    ],
  ]);

const supportingPolicies =
  new Set<string>([
    policyKey(
      "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",
      "Select and inspect hand tools suitable for the material, exposure method, and known or suspected utilities.",
    ),
    policyKey(
      "EXCAVATION_MANUAL_POTHOLING_HAND_INJURY",
      "Keep hands and other body parts outside striking, cutting, and pinch-point paths while digging or probing.",
    ),
    policyKey(
      "UNDERGROUND_UTILITY_CONTACT",
      "Obtain applicable utility locate information before disturbing the ground.",
    ),
    policyKey(
      "UNDERGROUND_UTILITY_SUPPORT_LOSS",
      "Determine utility-owner and project requirements for supporting the exposed utility before removing its original soil support.",
    ),
  ]);

export function getCriticalControlPolicy({
  canonicalHazardConceptId,
  controlText,
  legacyCandidate,
}: {
  canonicalHazardConceptId:
    string | null;
  controlText: string;
  legacyCandidate: boolean;
}): CriticalControlPolicy {
  if (!canonicalHazardConceptId) {
    return {
      classification:
        "Supporting",
      trigger:
        null,
    };
  }

  const key =
    policyKey(
      canonicalHazardConceptId,
      controlText,
    );

  if (supportingPolicies.has(key)) {
    return {
      classification:
        "Supporting",
      trigger:
        null,
    };
  }

  const contextualTrigger =
    contextualPolicies.get(key);

  if (contextualTrigger) {
    return {
      classification:
        "Contextual",
      trigger:
        contextualTrigger,
    };
  }

  return {
    classification:
      legacyCandidate
        ? "Core"
        : "Supporting",

    trigger:
      null,
  };
}
