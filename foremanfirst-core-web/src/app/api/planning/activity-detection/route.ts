import { NextResponse } from "next/server";
import { detectPlanningActivities } from "@/lib/planning/activity-detection";
import {
  PlanningCreatorAuthorizationError,
  requireAuthorizedPlanningCreator,
} from "@/lib/planning/planning-creator-authorization";

export const dynamic = "force-dynamic";

function nullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const projectId = nullableString(body.projectId);
    const scopeText = nullableString(body.scopeText);

    if (!projectId) {
      return NextResponse.json(
        {
          message: "Project ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningCreator(
        projectId,
      );

    if (!scopeText) {
      return NextResponse.json(
        {
          message: "Scope description is required.",
        },
        {
          status: 400,
        },
      );
    }

    const activities = await detectPlanningActivities({
      tenantId:
        authorization.project.tenantId,
      scopeText,
    });

    return NextResponse.json({
      scopeText,
      activities,
      count: activities.length,
    });
  } catch (error) {
    if (
      error instanceof
        PlanningCreatorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Unable to detect planning activities:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to detect planning activities.",
      },
      {
        status: 500,
      },
    );
  }
}