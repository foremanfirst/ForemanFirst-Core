import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type ReviewCommentInput = {
  clientId?: string;
  targetId?: string;
  section?: string;
  label?: string;
  comment?: string;
  status?: string;
  createdByName?: string | null;
  createdAt?: string | null;
  resolvedAt?: string | null;
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

function toNullableDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed;
}

function isConfirmationObject(
  value: unknown,
): value is Record<string, boolean> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  return Object.values(value).every(
    (item) =>
      typeof item === "boolean",
  );
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const body =
      await request.json();

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
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
            "Only Draft planning records can complete qualified review.",
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
            "Review revision number does not match the planning record's active revision.",
        },
        {
          status: 409,
        },
      );
    }

    const revision =
      await prisma.planningRevision.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
        },
        select: {
          id: true,
        },
      });

    if (!revision) {
      return NextResponse.json(
        {
          message:
            "Generate and save the draft revision before completing qualified review.",
        },
        {
          status: 409,
        },
      );
    }

    const reviewerName =
      toNullableString(
        body.reviewerName,
      );

    const reviewerRole =
      toNullableString(
        body.reviewerRole,
      );

    if (!reviewerName) {
      return NextResponse.json(
        {
          message:
            "Qualified reviewer name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!reviewerRole) {
      return NextResponse.json(
        {
          message:
            "Qualified reviewer role is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isConfirmationObject(
        body.confirmations,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Qualified review confirmations are required.",
        },
        {
          status: 400,
        },
      );
    }

    const requiredConfirmationKeys = [
      "scope",
      "sequence",
      "hazards",
      "controls",
      "risk",
      "requirements",
      "emergency",
    ];

    const incompleteConfirmation =
      requiredConfirmationKeys.some(
        (key) =>
          body.confirmations[key] !==
          true,
      );

    if (incompleteConfirmation) {
      return NextResponse.json(
        {
          message:
            "All qualified review confirmations must be completed.",
        },
        {
          status: 400,
        },
      );
    }

    const comments =
      Array.isArray(body.comments)
        ? (body.comments as ReviewCommentInput[])
        : [];

    const invalidComment =
      comments.find(
        (comment) =>
          !toNullableString(
            comment.targetId,
          ) ||
          !toNullableString(
            comment.section,
          ) ||
          !toNullableString(
            comment.label,
          ) ||
          !toNullableString(
            comment.comment,
          ),
      );

    if (invalidComment) {
      return NextResponse.json(
        {
          message:
            "Every review comment requires a target, section, label, and comment.",
        },
        {
          status: 400,
        },
      );
    }

    const openComments =
      comments.filter(
        (comment) =>
          (
            toNullableString(
              comment.status,
            ) ?? "Open"
          ) === "Open",
      );

    if (
      openComments.length > 0
    ) {
      return NextResponse.json(
        {
          message:
            "Resolve all open review comments before completing qualified review.",
        },
        {
          status: 409,
        },
      );
    }

    const reviewTimestamp =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const existingReview =
            await tx.planningReview.findFirst({
              where: {
                planningRecordId,
                tenantId:
                  existingRecord.tenantId,
                revisionNumber,
              },
              orderBy: {
                updatedAt: "desc",
              },
              select: {
                id: true,
                startedAt: true,
              },
            });

          const completedAt =
            existingReview?.startedAt &&
            existingReview.startedAt >
              reviewTimestamp
              ? existingReview.startedAt
              : reviewTimestamp;

          const review =
            existingReview
              ? await tx.planningReview.update({
                  where: {
                    id:
                      existingReview.id,
                  },
                  data: {
                    reviewerId:
                      toNullableString(
                        body.reviewerId,
                      ),
                    reviewerName,
                    reviewerRole,
                    status: "Completed",
                    confirmations:
                      body.confirmations,
                    reviewNotes:
                      toNullableString(
                        body.reviewNotes,
                      ),
                    completedAt,
                  },
                })
              : await tx.planningReview.create({
                  data: {
                    tenantId:
                      existingRecord.tenantId,
                    planningRecordId,
                    revisionNumber,
                    reviewerId:
                      toNullableString(
                        body.reviewerId,
                      ),
                    reviewerName,
                    reviewerRole,
                    status: "Completed",
                    confirmations:
                      body.confirmations,
                    reviewNotes:
                      toNullableString(
                        body.reviewNotes,
                      ),
                    startedAt:
                      reviewTimestamp,
                    completedAt:
                      reviewTimestamp,
                  },
                });

          await tx.planningReviewComment.deleteMany({
            where: {
              planningReviewId:
                review.id,
              planningRecordId,
              tenantId:
                existingRecord.tenantId,
              revisionNumber,
            },
          });

          if (comments.length > 0) {
            await tx.planningReviewComment.createMany({
              data:
                comments.map(
                  (comment) => {
                    const status =
                      toNullableString(
                        comment.status,
                      ) ?? "Resolved";

                    return {
                      tenantId:
                        existingRecord.tenantId,
                      planningRecordId,
                      planningReviewId:
                        review.id,
                      revisionNumber,
                      targetId:
                        toNullableString(
                          comment.targetId,
                        )!,
                      section:
                        toNullableString(
                          comment.section,
                        )!,
                      label:
                        toNullableString(
                          comment.label,
                        )!,
                      comment:
                        toNullableString(
                          comment.comment,
                        )!,
                      status,
                      createdById:
                        toNullableString(
                          body.reviewerId,
                        ),
                      createdByName:
                        toNullableString(
                          comment.createdByName,
                        ) ??
                        reviewerName,
                      resolvedById:
                        status ===
                        "Resolved"
                          ? toNullableString(
                              body.reviewerId,
                            )
                          : null,
                      resolvedByName:
                        status ===
                        "Resolved"
                          ? reviewerName
                          : null,
                      resolvedAt:
                        status ===
                        "Resolved"
                          ? toNullableDate(
                              comment.resolvedAt,
                            ) ??
                            completedAt
                          : null,
                      createdAt:
                        toNullableDate(
                          comment.createdAt,
                        ) ??
                        completedAt,
                    };
                  },
                ),
            });
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,
              planningRecordId,
              eventType:
                existingReview
                  ? "Qualified Review Updated"
                  : "Qualified Review Completed",
              previousStatus:
                existingRecord.status,
              newStatus:
                existingRecord.status,
              revisionNumber,
              actorId:
                toNullableString(
                  body.reviewerId,
                ),
              actorName:
                reviewerName,
              actorRole:
                reviewerRole,
              comment:
                existingReview
                  ? "Qualified review was updated for the current draft revision."
                  : "Qualified review was completed for the current draft revision.",
              metadata: {
                planningReviewId:
                  review.id,
                reviewCommentCount:
                  comments.length,
              },
            },
          });

          return review;
        },
      );

    return NextResponse.json({
      review: result,
    });
  } catch (error) {
    console.error(
      "Unable to persist qualified review:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to persist qualified review.",
      },
      {
        status: 500,
      },
    );
  }
}