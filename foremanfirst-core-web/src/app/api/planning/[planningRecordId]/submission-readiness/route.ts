import {
  NextResponse,
} from "next/server";

import {
  evaluatePlanningSubmissionReadiness,
} from "@/lib/planning/submission-readiness";

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
      await evaluatePlanningSubmissionReadiness(
        planningRecordId,
      );

    return NextResponse.json({
      readiness: {
        ready:
          readiness.ready,

        compliance: {
          summary:
            readiness.compliance.summary,

          blockers:
            readiness.blockers.map(
              (blocker) => ({
                requirementRuleCode:
                  blocker.requirementRuleCode,

                requirementTitle:
                  blocker.requirementTitle,

                requirementPackName:
                  blocker.requirementPackName,

                packType:
                  blocker.packType,

                organizationName:
                  blocker.organizationName,

                questionCode:
                  blocker.questionCode,

                questionText:
                  blocker.questionText,

                status:
                  blocker.status,

                blockingLevel:
                  blocker.blockingLevel,

                message:
                  blocker.message,
              }),
            ),
        },
      },
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

    console.error(
      "Unable to evaluate Planning submission readiness:",
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
          "Unable to evaluate Planning submission readiness.",
      },
      {
        status: 500,
      },
    );
  }
}
