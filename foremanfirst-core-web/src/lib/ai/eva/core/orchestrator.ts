/**
 * Eva Orchestrator
 *
 * Eva's central request-routing and execution layer.
 *
 * Current phase:
 * - receives runtime context
 * - evaluates installed skills
 * - filters skills through permissions
 * - selects eligible tools
 * - executes authorized registered tools
 * - returns a controlled response
 *
 * Future phases will add:
 * - richer intent recognition
 * - user confirmation workflows
 * - draft-generation workflows
 * - administrative actions
 * - broader AI reasoning
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import type {
  EvaResponse,
} from "./types";

import type {
  EvaToolId,
} from "../tools";

import type {
  EvaRuntimeContext,
} from "./context";

import {
  selectEvaSkills,
} from "./skill-selection";

import {
  selectEvaTools,
} from "./tool-selection";

import {
  executeEvaTool,
} from "./tool-execution";

export type RunEvaOptions = {
  requestedToolId?: EvaToolId;
  toolInput?: unknown;
};

export async function runEva(
  context: EvaRuntimeContext,
  options: RunEvaOptions = {},
): Promise<EvaResponse> {
  /*
   * ----------------------------------------------------------
   * 1. Determine which Eva Skills are available.
   * ----------------------------------------------------------
   */
  const eligibleSkills =
    selectEvaSkills(
      context,
    );

  if (
    eligibleSkills.length === 0
  ) {
    return {
      message:
        "I understand your request, but I don't currently have an installed Qoreva capability that can handle it.",

      suggestions: [
        "Try asking about a Qoreva feature that is currently available.",
      ],
    };
  }

  /*
   * ----------------------------------------------------------
   * 2. Determine which registered Tools are eligible.
   *
   * Tool selection remains deterministic.
   * Eva cannot invent tools or bypass permissions.
   * ----------------------------------------------------------
   */
  const eligibleTools =
    selectEvaTools(
      context,
    );

  /*
   * ----------------------------------------------------------
   * 3. If no Tool is currently applicable, safely route
   *    the request to the available Skill.
   * ----------------------------------------------------------
   */
  if (
    eligibleTools.length === 0
  ) {
    const selectedSkill =
      eligibleSkills[0];

    return {
      message:
        `Eva routed your request to the ${selectedSkill.name} capability. No executable tool is currently applicable to this request.`,

      suggestions:
        eligibleSkills.map(
          (skill) =>
            skill.name,
        ),

      sourceSkill:
        selectedSkill.id,
    };
  }

  /*
   * ----------------------------------------------------------
   * 4. Execute the selected Tool.
   *
   * Eva currently exposes registered Planning read and draft-generation tools.
   * Future versions will add richer intent recognition and
   * user-confirmation workflows before higher-risk actions.
   * ----------------------------------------------------------
   */
  const selectedTool =
    options.requestedToolId
      ? eligibleTools.find(
          (tool) =>
            tool.id ===
            options.requestedToolId,
        )
      : eligibleTools[0];

  if (!selectedTool) {
    return {
      message:
        options.requestedToolId
          ? "Eva is not authorized or currently able to execute that tool."
          : "Eva could not determine an executable tool for this request.",
    };
  }

  try {
    const result =
      await executeEvaTool(
        selectedTool.id as Parameters<
          typeof executeEvaTool
        >[0],
        context,
        options.toolInput,
      );

    return {
      message:
        result.success
          ? selectedTool.actionRisk === "DRAFT"
            ? `Eva generated a draft using ${selectedTool.name}.`
            : `Eva retrieved the requested ${selectedTool.name} information.`
          : `Eva was unable to complete ${selectedTool.name}.`,

      requiresConfirmation:
        selectedTool.requiresUserConfirmation,

      sourceSkill:
        selectedTool.skillId,

      sourceTool:
        selectedTool.id,

      data:
        result.data,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Eva was unable to complete the requested operation.",

      sourceSkill:
        selectedTool.skillId,

      sourceTool:
        selectedTool.id,
    };
  }
}
