import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function toPositiveInt(
  value: unknown,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function isJsonObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord.tenantId,
          projectId:
            authorization.planningRecord.projectId,
          isArchived: false,
        },
        select: {
          id: true,
          tenantId: true,
          status: true,
          revisionNumber: true,
        },
      });

    if (!existingRecord) {
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

    if (
      existingRecord.status !== "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft planning records can generate or refresh a draft revision.",
        },
        {
          status: 409,
        },
      );
    }

    const revisionNumber =
      toPositiveInt(
        body.revisionNumber,
        existingRecord.revisionNumber,
      );

    if (
      revisionNumber !==
      existingRecord.revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "Draft revision number must match the planning record's active revision number.",
        },
        {
          status: 409,
        },
      );
    }

    if (!isJsonObject(body.snapshot)) {
      return NextResponse.json(
        {
          message:
            "A structured draft snapshot is required.",
        },
        {
          status: 400,
        },
      );
    }

    const status =
      toNullableString(
        body.status,
      ) ?? "Draft";

    if (status !== "Draft") {
      return NextResponse.json(
        {
          message:
            "The Build Plan stage can only persist a Draft revision.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const existingRevision =
            await tx.planningRevision.findFirst({
              where: {
                planningRecordId,
                revisionNumber,
                tenantId:
                  existingRecord.tenantId,
              },
              select: {
                id: true,
              },
            });

          const revision =
            existingRevision
              ? await tx.planningRevision.update({
                  where: {
                    id:
                      existingRevision.id,
                  },
                  data: {
                    status: "Draft",
                    revisionReason:
                      toNullableString(
                        body.revisionReason,
                      ),
                    snapshot:
                      body.snapshot,
                    createdBy:
                      authorization.user.id,
                  },
                })
              : await tx.planningRevision.create({
                  data: {
                    tenantId:
                      existingRecord.tenantId,
                    planningRecordId,
                    revisionNumber,
                    status: "Draft",
                    revisionReason:
                      toNullableString(
                        body.revisionReason,
                      ),
                    snapshot:
                      body.snapshot,
                    createdBy:
                      authorization.user.id,
                  },
                });

          let reviewInvalidated = false;
          let invalidatedReviewId:
            | string
            | null = null;
          let invalidatedSignatureCount = 0;

          /*
           * Step 7B — Pre-Submission Review Invalidation
           *
           * Refreshing an existing draft revision means the material
           * planning content may have changed after the creator/preparer
           * completed Step 7. A prior completion must never authorize
           * submission of newly changed content.
           *
           * Keep the formal PTP revision number unchanged while the record
           * is still Draft, but invalidate the completed pre-submission
           * review and any signatures tied to that stale draft content.
           */
          if (existingRevision) {
            const completedReview =
              await tx.planningReview.findFirst({
                where: {
                  planningRecordId,
                  tenantId:
                    existingRecord.tenantId,
                  revisionNumber,
                  status: "Completed",
                },
                orderBy: {
                  updatedAt: "desc",
                },
                select: {
                  id: true,
                },
              });

            if (completedReview) {
              invalidatedReviewId =
                completedReview.id;

              await tx.planningReview.update({
                where: {
                  id:
                    completedReview.id,
                },
                data: {
                  status:
                    "Revalidation Required",
                  confirmations: {
                    scope: false,
                    sequence: false,
                    hazards: false,
                    controls: false,
                    risk: false,
                    requirements: false,
                    emergency: false,
                  },
                  completedAt: null,
                },
              });

              reviewInvalidated = true;
            }

            const signatureDeleteResult =
              await tx.planningSignature.deleteMany({
                where: {
                  planningRecordId,
                  tenantId:
                    existingRecord.tenantId,
                  revisionNumber,
                },
              });

            invalidatedSignatureCount =
              signatureDeleteResult.count;

            if (
              reviewInvalidated ||
              invalidatedSignatureCount > 0
            ) {
              await tx.planningEvent.create({
                data: {
                  tenantId:
                    existingRecord.tenantId,
                  planningRecordId,
                  eventType:
                    "Pre-Submission Review Invalidated",
                  previousStatus:
                    existingRecord.status,
                  newStatus:
                    existingRecord.status,
                  revisionNumber,
                  actorId:
                    authorization.user.id,
                  actorName:
                    authorization.user.displayName,
                  actorRole:
                    authorization.membership.roleCodes.join(
                      ", ",
                    ) || "Planning Editor",
                  comment:
                    "Draft planning content changed after pre-submission review. Reconfirmation is required before the record can proceed to submission.",
                  metadata: {
                    planningReviewId:
                      invalidatedReviewId,
                    revisionId:
                      revision.id,
                    invalidatedSignatureCount,
                  },
                },
              });
            }
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,
              planningRecordId,
              eventType:
                existingRevision
                  ? "Planning Revision Refreshed"
                  : "Planning Revision Generated",
              previousStatus:
                existingRecord.status,
              newStatus:
                existingRecord.status,
              revisionNumber,
              actorId:
                authorization.user.id,
              actorName:
                authorization.user.displayName,
              actorRole:
                authorization.membership.roleCodes.join(
                  ", ",
                ) || "Planning Editor",
              comment:
                existingRevision
                  ? "Draft planning revision refreshed before pre-submission review."
                  : "Draft planning revision generated for pre-submission review.",
              metadata: {
                revisionId:
                  revision.id,
                reviewInvalidated,
                invalidatedSignatureCount,
              },
            },
          });

          return {
            revision,
            reviewInvalidated,
            invalidatedSignatureCount,
          };
        },
      );

    return NextResponse.json({
      revision: result.revision,
      reviewInvalidated:
        result.reviewInvalidated,
      invalidatedSignatureCount:
        result.invalidatedSignatureCount,
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
      "Unable to persist planning revision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to persist planning revision.",
      },
      {
        status: 500,
      },
    );
  }
}
