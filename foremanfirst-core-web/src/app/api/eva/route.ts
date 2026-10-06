import { NextResponse } from "next/server";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
} from "@/lib/auth/current-user";

import {
  generateEvaConversationResponse,
  type EvaConversationMessage,
} from "@/lib/ai/eva/conversation";

import {
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

import {
  buildEvaUserContext,
} from "@/lib/ai/eva/core/context-builder";

import {
  getEvaSkills,
} from "@/lib/ai/eva/core/skill-registry";

import {
  runEva,
} from "@/lib/ai/eva/core/orchestrator";

import type {
  EvaRuntimeContext,
} from "@/lib/ai/eva/core/context";

export const dynamic = "force-dynamic";

function nullableString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function parseHistory(
  value: unknown,
): EvaConversationMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item,
      ): item is EvaConversationMessage =>
        Boolean(
          item &&
            typeof item === "object" &&
            "role" in item &&
            (item.role === "user" ||
              item.role === "assistant") &&
            "content" in item &&
            typeof item.content === "string",
        ),
    )
    .map((item) => ({
      role: item.role,
      content:
        item.content.trim().slice(
          0,
          8000,
        ),
    }))
    .filter(
      (item) =>
        item.content.length > 0,
    )
    .slice(-20);
}

export async function GET() {
  try {
    const user =
      await requireCurrentUser();

    return NextResponse.json({
      user: {
        displayName:
          user.displayName,
      },
    });
  } catch (error) {
    if (
      error instanceof
      QorevaAuthenticationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 401 },
      );
    }

    console.error(
      "EVA identity error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "EVA could not load the current user.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const user =
      await requireCurrentUser();

    const body =
      await request.json();

    const userMessage =
      nullableString(
        body.userMessage,
      );

    if (!userMessage) {
      return NextResponse.json(
        {
          message:
            "A message is required.",
        },
        { status: 400 },
      );
    }

    if (userMessage.length > 8000) {
      return NextResponse.json(
        {
          message:
            "That message is too long.",
        },
        { status: 400 },
      );
    }

    const currentModule =
      nullableString(
        body.currentModule,
      ) ?? "qoreva";

    const currentPathname =
      nullableString(
        body.currentPathname,
      ) ?? "/";

    const currentRecordId =
      nullableString(
        body.currentRecordId,
      );

    const history =
      parseHistory(
        body.history,
      );

    const normalizedModule =
      currentModule.slice(
        0,
        100,
      );

    const normalizedPathname =
      currentPathname.slice(
        0,
        500,
      );

    const normalizedRecordId =
      currentRecordId?.slice(
        0,
        200,
      ) ?? null;

    let authorizedContext:
      unknown = null;

    /*
     * Phase 3A — Authorized Planning awareness.
     *
     * The record ID supplied by the browser is only a requested
     * target. It grants no record access by itself.
     *
     * Qoreva first resolves the authenticated user's Planning
     * Reader authorization. Those authoritative tenant/project
     * IDs are then used to build EVA's runtime context.
     *
     * The actual record read still executes through EVA's
     * registered Planning tool, which performs its own record
     * authorization and records the read in EVA's audit trail.
     */
    if (
      normalizedModule === "planning" &&
      normalizedRecordId
    ) {
      const authorization =
        await requireAuthorizedPlanningReader(
          normalizedRecordId,
        );

      const availableSkillIds =
        getEvaSkills().map(
          (skill) => skill.id,
        );

      const {
        userContext,
        projectContext,
      } =
        await buildEvaUserContext(
          authorization.user,
          {
            tenantId:
              authorization.planningRecord.tenantId,

            projectId:
              authorization.planningRecord.projectId,

            userMessage,

            currentModule:
              normalizedModule,

            currentRecordId:
              normalizedRecordId,

            availableSkillIds,
          },
        );

      const runtimeContext:
        EvaRuntimeContext = {
        conversation: {
          user:
            userContext,

          project:
            projectContext,

          currentModule:
            normalizedModule,

          currentRecordId:
            normalizedRecordId,

          userMessage,
        },

        user:
          userContext,

        project:
          projectContext,

        availableSkillIds,

        metadata: {
          requestId:
            crypto.randomUUID(),

          source:
            "global-eva-conversation",
        },
      };

      const planningRead =
        await runEva(
          runtimeContext,
          {
            requestedToolId:
              "planning.getPlanningRecord",
          },
        );

      if (
        planningRead.sourceTool ===
          "planning.getPlanningRecord" &&
        planningRead.data
      ) {
        authorizedContext =
          planningRead.data;
      }
    }

    const response =
      await generateEvaConversationResponse({
        userDisplayName:
          user.displayName,

        currentModule:
          normalizedModule,

        currentPathname:
          normalizedPathname,

        currentRecordId:
          normalizedRecordId,

        userMessage,

        history,

        authorizedContext,
      });

    return NextResponse.json({
      message: response,

      user: {
        displayName:
          user.displayName,
      },
    });
  } catch (error) {
    if (
      error instanceof
      QorevaAuthenticationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 401 },
      );
    }

    console.error(
      "EVA conversation error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "EVA was unable to respond. Please try again.",
      },
      { status: 500 },
    );
  }
}
