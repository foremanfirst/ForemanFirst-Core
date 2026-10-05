/**
 * Eva Tool Registry
 *
 * Central registry for Eva's executable domain tools.
 *
 * The registry is the single source of truth for:
 * - tool identity
 * - tool metadata
 * - required permissions
 * - action risk
 * - confirmation requirements
 * - executable implementation
 *
 * Eva's selection and execution layers must use this registry
 * rather than maintaining duplicate tool definitions.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import type {
  EvaToolDefinition,
} from "../core/types";

import {
  getEvaPlanningRecord,
} from "./planning/get-planning-record";

import {
  generateEvaPlanningDraftAnswer,
} from "./planning/generate-draft-answer";

export const EVA_TOOL_DEFINITIONS:
  EvaToolDefinition[] = [
    {
      id:
        "planning.getPlanningRecord",

      name:
        "Get Planning Record",

      description:
        "Read the authorized Planning Record and its current planning context.",

      skillId:
        "planning",

      requiredPermissions: [
        "READ",
      ],

      actionRisk:
        "READ_ONLY",

      requiresUserConfirmation:
        false,
    },

    {
      id:
        "planning.generateDraftAnswer",

      name:
        "Generate Draft Planning Answer",

      description:
        "Generate an AI-assisted draft answer for a Planning question using authorized planning context.",

      skillId:
        "planning",

      requiredPermissions: [
        "READ",
      ],

      actionRisk:
        "DRAFT",

      requiresUserConfirmation:
        false,
    },
  ];

export const EVA_TOOLS = {
  planning: {
    getPlanningRecord:
      getEvaPlanningRecord,

    generateDraftAnswer:
      generateEvaPlanningDraftAnswer,
  },
} as const;

export type EvaToolId =
  | "planning.getPlanningRecord"
  | "planning.generateDraftAnswer";

export function getEvaToolDefinition(
  toolId: EvaToolId,
): EvaToolDefinition | null {
  return (
    EVA_TOOL_DEFINITIONS.find(
      (tool) =>
        tool.id === toolId,
    ) ?? null
  );
}

export function getEvaToolDefinitions():
  EvaToolDefinition[] {
  return [
    ...EVA_TOOL_DEFINITIONS,
  ];
}

export function getEvaTool(
  toolId: EvaToolId,
) {
  switch (toolId) {
    case "planning.getPlanningRecord":
      return EVA_TOOLS.planning.getPlanningRecord;

    case "planning.generateDraftAnswer":
      return EVA_TOOLS.planning.generateDraftAnswer;

    default:
      return null;
  }
}
