import {
  NextResponse,
} from "next/server";

import {
  evaluatePlanningOperationalReadiness,
} from "@/lib/planning/operational-readiness";

import {
  PlanningReaderAuthorizationError,
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    await requireAuthorizedPlanningReader(
      planningRecordId,
    );

    const readiness =
      await evaluatePlanningOperationalReadiness(
        planningRecordId,
      );

    return NextResponse.json({
      readiness,
    });
  } catch (error) {
    if (
      error instanceof
        PlanningReaderAuthorizationError
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

    if (
      error instanceof Error &&
      error.message ===
        "Planning record was not found."
    ) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "Unable to evaluate planning operational readiness:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to evaluate planning operational readiness.",
      },
      {
        status: 500,
      },
    );
  }
}
