/**
 * Eva Skill Selection
 *
 * Determines which installed Eva Skills are eligible to participate
 * in a request.
 *
 * This is intentionally deterministic at this stage.
 * Natural-language AI routing can be added later, but AI must never
 * be allowed to bypass permission or availability checks.
 */

import type {
  EvaSkillDefinition,
} from "./types";

import type {
  EvaRuntimeContext,
} from "./context";

import {
  getEvaSkills,
} from "./skill-registry";

function hasRequiredPermissions(
  context: EvaRuntimeContext,
  skill: EvaSkillDefinition,
): boolean {
  return skill.requiredPermissions.every(
    (permission) =>
      context.user.permissions.includes(
        permission,
      ),
  );
}

export function selectEvaSkills(
  context: EvaRuntimeContext,
):
  EvaSkillDefinition[] {
  return getEvaSkills().filter(
    (skill) => {
      if (
        skill.status !==
        "AVAILABLE"
      ) {
        return false;
      }

      return hasRequiredPermissions(
        context,
        skill,
      );
    },
  );
}
