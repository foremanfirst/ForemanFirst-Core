/**
 * Eva Built-In Skills
 *
 * Explicit catalog of Eva capabilities that are currently installed
 * in Qoreva.
 *
 * Future Qoreva modules should add their Eva Skill definitions here
 * when the corresponding product capability is actually available.
 *
 * Do not register hypothetical capabilities simply because they are
 * planned for the future.
 */

import type {
  EvaSkillDefinition,
} from "./types";

import {
  EVA_PLANNING_SKILL,
} from "../skills/planning";

export const EVA_BUILT_IN_SKILLS:
  EvaSkillDefinition[] = [
    EVA_PLANNING_SKILL,
  ];
