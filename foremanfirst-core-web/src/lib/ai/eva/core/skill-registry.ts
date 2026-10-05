/**
 * Eva Skill Registry
 *
 * Central registry of Eva's domain capabilities.
 *
 * The registry is deliberately explicit. A capability should only
 * become available to Eva after its underlying Qoreva functionality
 * actually exists and is authorized.
 */

import type {
  EvaSkillDefinition,
} from "./types";

import {
  EVA_BUILT_IN_SKILLS,
} from "./built-in-skills";

const skillRegistry:
  EvaSkillDefinition[] = [
    ...EVA_BUILT_IN_SKILLS,
  ];

export function registerEvaSkill(
  skill: EvaSkillDefinition,
): void {
  const existing =
    skillRegistry.find(
      (item) => item.id === skill.id,
    );

  if (existing) {
    return;
  }

  skillRegistry.push(skill);
}

export function getEvaSkills():
  EvaSkillDefinition[] {
  return [
    ...skillRegistry,
  ];
}

export function getEvaSkill(
  skillId: string,
):
  EvaSkillDefinition | null {
  return (
    skillRegistry.find(
      (skill) => skill.id === skillId,
    ) ?? null
  );
}
