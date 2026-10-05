/**
 * Eva Tool Execution
 *
 * Central execution boundary for Eva tools.
 *
 * Tool selection determines what Eva may use.
 * Tool execution performs the final defense-in-depth checks
 * before invoking the underlying Qoreva capability.
 *
 * Every executable tool attempt is audited.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import type {
  EvaRuntimeContext,
} from "./context";

import type {
  EvaQuestionContext,
} from "@/lib/ai/eva";

import {
  requireEvaPermission,
} from "./permissions";

import {
  recordEvaAuditEvent,
} from "./audit";

import {
  EVA_TOOLS,
  getEvaToolDefinition,
  type EvaToolId,
} from "../tools";

export type EvaToolExecutionResult = {
  toolId: EvaToolId;

  success: boolean;

  data: unknown;
};

export async function executeEvaTool(
  toolId: EvaToolId,
  context: EvaRuntimeContext,
  input?: unknown,
): Promise<EvaToolExecutionResult> {
  /*
   * ----------------------------------------------------------
   * 1. Resolve the registered tool definition.
   * ----------------------------------------------------------
   */
  const definition =
    getEvaToolDefinition(toolId);

  if (!definition) {
    throw new Error(
      `Eva tool is not registered: ${toolId}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 2. Verify the underlying Skill is available.
   * ----------------------------------------------------------
   */
  if (
    !context.availableSkillIds.includes(
      definition.skillId,
    )
  ) {
    throw new Error(
      `Eva skill is not available: ${definition.skillId}`,
    );
  }

  /*
   * ----------------------------------------------------------
   * 3. Defense-in-depth permission enforcement.
   * ----------------------------------------------------------
   */
  for (
    const permission of
    definition.requiredPermissions
  ) {
    requireEvaPermission(
      context.user,
      permission,
    );
  }

  /*
   * ----------------------------------------------------------
   * 4. Executable implementations are resolved through the
   * typed EVA_TOOLS registry.
   *
   * Each execution branch below uses its concrete function
   * signature rather than a union of callable tool types.
   * ----------------------------------------------------------
   */

  /*
   * ----------------------------------------------------------
   * 5. Planning Record read.
   *
   * This tool requires an explicit current Planning Record.
   * Eva must never invent or infer a Planning Record ID.
   * ----------------------------------------------------------
   */
  if (
    toolId ===
      "planning.getPlanningRecord"
  ) {
    const planningRecordId =
      context.conversation.currentRecordId;

    if (!planningRecordId) {
      throw new Error(
        "Eva requires an active Planning Record.",
      );
    }

    const planningRecordTool =
      EVA_TOOLS.planning.getPlanningRecord;

    try {
      const data =
        await planningRecordTool(
          planningRecordId,
        );

      await recordEvaAuditEvent({
        context,

        action:
          "READ_PLANNING_RECORD",

        actionRisk:
          definition.actionRisk,

        skillId:
          definition.skillId,

        toolId,

        resourceType:
          "PlanningRecord",

        resourceId:
          planningRecordId,

        confirmationRequired:
          definition.requiresUserConfirmation,

        confirmationStatus:
          definition.requiresUserConfirmation
            ? "REQUIRED"
            : "NOT_REQUIRED",

        success:
          true,

        metadata: {
          currentModule:
            context.conversation.currentModule,

          operation:
            "READ",
        },
      });

      return {
        toolId,

        success:
          true,

        data,
      };
    } catch (error) {
      try {
        await recordEvaAuditEvent({
          context,

          action:
            "READ_PLANNING_RECORD",

          actionRisk:
            definition.actionRisk,

          skillId:
            definition.skillId,

          toolId,

          resourceType:
            "PlanningRecord",

          resourceId:
            planningRecordId,

          confirmationRequired:
            definition.requiresUserConfirmation,

          confirmationStatus:
            definition.requiresUserConfirmation
              ? "REQUIRED"
              : "NOT_REQUIRED",

          success:
            false,

          errorCode:
            "TOOL_EXECUTION_FAILED",

          errorMessage:
            error instanceof Error
              ? error.message
              : "Unknown Eva tool execution error.",
        });
      } catch (auditError) {
        console.error(
          "Eva audit recording failed:",
          auditError,
        );
      }

      throw error;
    }
  }

  /*
   * ----------------------------------------------------------
   * 6. Draft Answer generation.
   *
   * This tool intentionally requires a fully constructed
   * EvaQuestionContext.
   *
   * We do NOT manufacture that context from a Planning Record ID.
   * The existing Planning API already owns construction of the
   * question-specific context.
   *
   * The orchestrator now passes this explicit context into the tool.
   * ----------------------------------------------------------
   */
  if (
    toolId ===
      "planning.generateDraftAnswer"
  ) {
    if (!input) {
      throw new Error(
        "Eva draft-answer execution requires an explicit EvaQuestionContext.",
      );
    }

    const questionContext =
      input as EvaQuestionContext;

    try {
      const data =
        await EVA_TOOLS.planning.generateDraftAnswer(
          questionContext,
        );

      await recordEvaAuditEvent({
        context,

        action:
          "GENERATE_DRAFT_ANSWER",

        actionRisk:
          definition.actionRisk,

        skillId:
          definition.skillId,

        toolId,

        resourceType:
          "PlanningRecord",

        resourceId:
          context.conversation.currentRecordId ??
          null,

        confirmationRequired:
          definition.requiresUserConfirmation,

        confirmationStatus:
          definition.requiresUserConfirmation
            ? "REQUIRED"
            : "NOT_REQUIRED",

        success:
          true,

        metadata: {
          currentModule:
            context.conversation.currentModule,

          operation:
            "DRAFT",

          questionCode:
            questionContext.questionCode,
        },
      });

      return {
        toolId,

        success:
          true,

        data,
      };
    } catch (error) {
      try {
        await recordEvaAuditEvent({
          context,

          action:
            "GENERATE_DRAFT_ANSWER",

          actionRisk:
            definition.actionRisk,

          skillId:
            definition.skillId,

          toolId,

          resourceType:
            "PlanningRecord",

          resourceId:
            context.conversation.currentRecordId ??
            null,

          confirmationRequired:
            definition.requiresUserConfirmation,

          confirmationStatus:
            definition.requiresUserConfirmation
              ? "REQUIRED"
              : "NOT_REQUIRED",

          success:
            false,

          errorCode:
            "DRAFT_GENERATION_FAILED",

          errorMessage:
            error instanceof Error
              ? error.message
              : "Unknown Eva draft generation error.",
        });
      } catch (auditError) {
        console.error(
          "Eva audit recording failed:",
          auditError,
        );
      }

      throw error;
    }
  }

  /*
   * ----------------------------------------------------------
   * 7. No unrecognized tool may execute.
   * ----------------------------------------------------------
   */
  throw new Error(
    `Eva tool execution is not implemented: ${toolId}`,
  );
}
