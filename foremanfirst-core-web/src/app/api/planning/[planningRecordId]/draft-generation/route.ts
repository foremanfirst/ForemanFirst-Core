import { NextResponse } from "next/server";

import {
  buildPlanningGenerationContext,
} from "@/lib/planning/planning-context";

import {
  generatePlanningDraft,
} from "@/lib/planning/draft-generator";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    await requireAuthorizedPlanningEditor(
      planningRecordId,
    );

    const planningContext =
      await buildPlanningGenerationContext(
        planningRecordId,
      );

    if (
      planningContext.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Draft generation is only available for planning records in Draft status.",
        },
        {
          status: 409,
        },
      );
    }

    const draft =
      generatePlanningDraft(
        planningContext,
      );

    return NextResponse.json({
      planningRecordId,
      draft,
    });
  } catch (error) {
    if (
      error instanceof
        PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "Unable to generate planning draft:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate planning draft.";

    const status =
      message ===
      "Planning record was not found."
        ? 404
        : 500;

    return NextResponse.json(
      {
        message,
      },
      {
        status,
      },
    );
  }
}