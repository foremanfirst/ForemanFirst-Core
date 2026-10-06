import { NextResponse } from "next/server";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
} from "@/lib/auth/current-user";

import {
  generateEvaConversationResponse,
  type EvaConversationMessage,
} from "@/lib/ai/eva/conversation";

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

    const response =
      await generateEvaConversationResponse({
        userDisplayName:
          user.displayName,

        currentModule:
          currentModule.slice(
            0,
            100,
          ),

        currentPathname:
          currentPathname.slice(
            0,
            500,
          ),

        currentRecordId:
          currentRecordId?.slice(
            0,
            200,
          ) ?? null,

        userMessage,

        history,
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
