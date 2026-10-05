/**
 * Eva Audit Service
 *
 * Central audit boundary for Eva activity.
 *
 * Every executable Eva tool attempt should produce one audit event.
 *
 * Audit records are intentionally structured and minimal.
 * Do not store full prompts, full Planning Records, or arbitrary
 * AI-generated content in audit metadata.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  EvaRuntimeContext,
} from "./context";

import type {
  EvaActionRisk,
} from "./types";

export type EvaAuditInput = {
  context: EvaRuntimeContext;

  action: string;
  actionRisk: EvaActionRisk;

  skillId?: string | null;
  toolId?: string | null;

  resourceType?: string | null;
  resourceId?: string | null;

  confirmationRequired?: boolean;
  confirmationStatus?: string | null;

  success: boolean;

  errorCode?: string | null;
  errorMessage?: string | null;

  metadata?: Prisma.InputJsonObject | null;
};

function sanitizeMetadata(
  metadata?: Prisma.InputJsonObject | null,
): Prisma.InputJsonObject | undefined {
  if (!metadata) {
    return undefined;
  }

  /*
   * Keep audit metadata intentionally small and structured.
   *
   * Never pass raw prompts, complete database records,
   * credentials, tokens, or arbitrary model output here.
   */
  return metadata;
}

export async function recordEvaAuditEvent(
  input: EvaAuditInput,
) {
  const {
    context,
    action,
    actionRisk,
    skillId = null,
    toolId = null,
    resourceType = null,
    resourceId = null,
    confirmationRequired = false,
    confirmationStatus = null,
    success,
    errorCode = null,
    errorMessage = null,
    metadata = null,
  } = input;

  return prisma.evaAuditEvent.create({
    data: {
      tenantId:
        context.user.tenantId,

      requestId:
        context.metadata.requestId
          ? String(
              context.metadata.requestId,
            )
          : crypto.randomUUID(),

      skillId,
      toolId,

      action,
      actionRisk,

      actorType:
        "USER",

      actorId:
        context.user.userId,

      actorName:
        context.user.displayName,

      actorRole:
        context.user.tenantRoles[0] ?? null,

      resourceType,
      resourceId,

      projectId:
        context.project?.projectId ?? null,

      planningRecordId:
        context.conversation.currentRecordId ??
        null,

      confirmationRequired,
      confirmationStatus,

      success,

      errorCode,
      errorMessage,

      metadata:
        sanitizeMetadata(metadata),
    },
  });
}
