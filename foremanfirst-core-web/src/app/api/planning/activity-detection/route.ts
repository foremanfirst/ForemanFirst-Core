import { NextResponse } from "next/server";
import { detectPlanningActivities } from "@/lib/planning/activity-detection";

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

    const tenantId = nullableString(body.tenantId);
    const scopeText = nullableString(body.scopeText);

    if (!tenantId) {
      return NextResponse.json(
        {
          message: "Tenant ID is required.",
        },
        {
          status: 400,
        },
      );
    }

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
      tenantId,
      scopeText,
    });

    return NextResponse.json({
      scopeText,
      activities,
      count: activities.length,
    });
  } catch (error) {
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