/**
 * Eva Tool Selection
 *
 * Determines which registered Eva tools are eligible for the
 * current request.
 *
 * Tool selection is intentionally deterministic in this phase.
 * AI may eventually assist with intent recognition, but it must
 * never bypass Qoreva authorization or tool availability rules.
 *
 * The Eva Tool Registry is the single source of truth for tool
 * definitions.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import type {
  EvaRuntimeContext,
} from "./context";

import type {
  EvaToolDefinition,
} from "./types";

import {
  getEvaToolDefinitions,
} from "../tools";

export function selectEvaTools(
  context: EvaRuntimeContext,
): EvaToolDefinition[] {
  return getEvaToolDefinitions().filter(
    (tool) => {
      /*
       * The underlying Eva Skill must actually be available.
       */
      if (
        !context.availableSkillIds.includes(
          tool.skillId,
        )
      ) {
        return false;
      }

      /*
       * Every required permission must be present
       * in the authenticated user's context.
       */
      const hasPermissions =
        tool.requiredPermissions.every(
          (permission) =>
            context.user.permissions.includes(
              permission,
            ),
        );

      if (!hasPermissions) {
        return false;
      }

      /*
       * Planning record reads require an active
       * Planning context.
       *
       * Eva must never guess a record ID.
       */
      if (
        tool.id ===
          "planning.getPlanningRecord" &&
        (
          context.conversation.currentModule !==
            "planning" ||
          !context.conversation.currentRecordId
        )
      ) {
        return false;
      }

      return true;
    },
  );
}
