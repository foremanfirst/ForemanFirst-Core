import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getPlanningQualifiedReviewerCapability,
  PlanningQualifiedReviewerAuthorizationError,
  requireAuthorizedPlanningQualifiedReviewer,
} from "@/lib/planning/planning-qualified-reviewer-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    candidateId: string;
  }>;
};

type CandidateDecision =
  | "Accepted"
  | "Dismissed";

function isCandidateDecision(
  value: unknown,
): value is CandidateDecision {
  return (
    value === "Accepted" ||
    value === "Dismissed"
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    const capability =
      await getPlanningQualifiedReviewerCapability(
        planningRecordId,
      );

    return NextResponse.json({
      canReview:
        capability.canReview,
    });
  } catch (error) {
    if (
      error instanceof
      PlanningQualifiedReviewerAuthorizationError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "Failed to resolve Document Intelligence review capability.",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to resolve Document Intelligence review capability.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      candidateId,
    } = await context.params;

    const authorization =
      await requireAuthorizedPlanningQualifiedReviewer(
        planningRecordId,
      );

    const body =
      await request.json();

    const decision =
      typeof body.decision === "string"
        ? body.decision.trim()
        : "";

    if (!isCandidateDecision(decision)) {
      return NextResponse.json(
        {
          error:
            'decision must be either "Accepted" or "Dismissed".',
        },
        {
          status: 400,
        },
      );
    }

    const reviewedAt =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Authorization was established before this transaction,
           * but lifecycle state must be re-read immediately before
           * recording a qualified-user disposition.
           */
          const currentRecord =
            await tx.planningRecord.findFirst({
              where: {
                id: planningRecordId,

                tenantId:
                  authorization.planningRecord.tenantId,

                projectId:
                  authorization.planningRecord.projectId,

                isArchived:
                  false,
              },

              select: {
                id: true,
                status: true,
                revisionNumber: true,
              },
            });

          if (!currentRecord) {
            return {
              outcome:
                "RecordUnavailable" as const,
            };
          }

          if (
            currentRecord.status !==
            "Draft"
          ) {
            return {
              outcome:
                "NotDraft" as const,
            };
          }

          /*
           * The candidate must belong to the current revision and
           * still be Proposed. This makes the first valid qualified
           * disposition win and prevents a stale browser or second
           * reviewer from overwriting an earlier safety decision.
           */
          const updateResult =
            await tx.planningQuestionCandidate.updateMany({
              where: {
                id:
                  candidateId,

                tenantId:
                  authorization.planningRecord.tenantId,

                planningRecordId,

                revisionNumber:
                  currentRecord.revisionNumber,

                status:
                  "Proposed",

                sourceDocument: {
                  isSelected:
                    true,

                  aiProcessingStatus:
                    "Complete",
                },
              },

              data: {
                status:
                  decision,

                reviewedById:
                  authorization.user.id,

                reviewedByName:
                  authorization.user.displayName,

                reviewedAt,

                acceptedAt:
                  decision === "Accepted"
                    ? reviewedAt
                    : null,

                dismissedAt:
                  decision === "Dismissed"
                    ? reviewedAt
                    : null,
              },
            });

          if (
            updateResult.count !==
            1
          ) {
            return {
              outcome:
                "CandidateUnavailable" as const,
            };
          }

          const candidate =
            await tx.planningQuestionCandidate.findFirst({
              where: {
                id:
                  candidateId,

                tenantId:
                  authorization.planningRecord.tenantId,

                planningRecordId,

                revisionNumber:
                  currentRecord.revisionNumber,
              },

              select: {
                id: true,
                status: true,
                reviewedById: true,
                reviewedByName: true,
                reviewedAt: true,
                acceptedAt: true,
                dismissedAt: true,
              },
            });

          if (!candidate) {
            throw new Error(
              "Reviewed Document Intelligence question could not be reloaded.",
            );
          }

          return {
            outcome:
              "Reviewed" as const,

            candidate,
          };
        },
      );

    if (
      result.outcome ===
      "RecordUnavailable"
    ) {
      return NextResponse.json(
        {
          error:
            "Planning record is no longer available.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      result.outcome ===
      "NotDraft"
    ) {
      return NextResponse.json(
        {
          error:
            "Document Intelligence questions can only be reviewed while the Planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      result.outcome ===
      "CandidateUnavailable"
    ) {
      return NextResponse.json(
        {
          error:
            "This Document Intelligence question is no longer available for review or has already been reviewed.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      candidate:
        result.candidate,
    });
  } catch (error) {
    if (
      error instanceof
      PlanningQualifiedReviewerAuthorizationError
    ) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "Failed to review Document Intelligence question candidate.",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to review the Document Intelligence question.",
      },
      {
        status: 500,
      },
    );
  }
}
