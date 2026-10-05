/**
 * Eva Context
 *
 * Shared runtime context types for Eva.
 *
 * Context construction is intentionally implemented in
 * context-builder.ts so there is one authoritative server-side
 * path for resolving the authenticated user's tenant, project,
 * roles, and permissions.
 */

import type {
  EvaConversationContext,
  EvaProjectContext,
  EvaUserContext,
} from "./types";

export type EvaRuntimeContext = {
  conversation: EvaConversationContext;

  user: EvaUserContext;

  project: EvaProjectContext | null;

  availableSkillIds: string[];

  metadata: Record<string, unknown>;
};
