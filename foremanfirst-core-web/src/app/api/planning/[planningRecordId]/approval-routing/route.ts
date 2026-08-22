import {
  NextResponse,
} from "next/server";

import {
  resolvePlanningApprovalRouting,
} from "@/lib/planning/approval-routing";

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

    const routing =
      await resolvePlanningApprovalRouting(
        planningRecordId,
      );

    return NextResponse.json({
      routing,
    });
  } catch (error) {
    console.error(
      "Unable to resolve Planning approval routing:",
      error,
    );

    if (
      error instanceof Error &&
      error.message ===
        "Planning record was not found."
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        message:
          "Unable to resolve Planning approval routing.",
      },
      {
        status: 500,
      },
    );
  }
}