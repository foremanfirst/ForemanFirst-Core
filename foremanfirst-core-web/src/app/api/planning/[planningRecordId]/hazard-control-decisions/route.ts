import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

const ALLOWED_DECISIONS = new Set([
  "Assign",
  "Accept",
  "Modify",
  "NotApplicable",
]);

const ALLOWED_ITEM_TYPES = new Set([
  "Hazard",
  "Control",
]);

function toNullableString(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },
        select: {
          id: true,
          tenantId: true,
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

    const decisions =
      await prisma.planningHazardControlDecision.findMany({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber:
            existingRecord.revisionNumber,
        },
        orderBy: [
          {
            decidedAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

    return NextResponse.json({
      revisionNumber:
        existingRecord.revisionNumber,
      decisions,
    });
  } catch (error) {
    console.error(
      "Unable to load hazard/control decisions:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load hazard/control decisions.",
      },
      {
        status: 500,
      },
    );
  }
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
            "Hazard and control decisions can only be changed while the planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const recommendationId =
      toNullableString(
        body.recommendationId,
      );

    const itemType =
      toNullableString(
        body.itemType,
      );

    const originalText =
      toNullableString(
        body.originalText,
      );

    const decision =
      toNullableString(
        body.decision,
      );

    const modifiedText =
      toNullableString(
        body.modifiedText,
      );

    const targetHazardId =
      toNullableString(
        body.targetHazardId,
      );

    const canonicalHazardConceptId =
      toNullableString(
        body.canonicalHazardConceptId,
      );

    const sourceType =
      toNullableString(
        body.sourceType,
      );

    const decidedById =
      toNullableString(
        body.decidedById,
      );

    const decidedByName =
      toNullableString(
        body.decidedByName,
      );

    const decidedByRole =
      toNullableString(
        body.decidedByRole,
      );

    if (!recommendationId) {
      return NextResponse.json(
        {
          message:
            "Recommendation ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !itemType ||
      !ALLOWED_ITEM_TYPES.has(
        itemType,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Item type must be Hazard or Control.",
        },
        {
          status: 400,
        },
      );
    }

    if (!originalText) {
      return NextResponse.json(
        {
          message:
            "Original hazard or control text is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !decision ||
      !ALLOWED_DECISIONS.has(
        decision,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Decision must be Assign, Accept, Modify, or NotApplicable.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      decision === "Assign" &&
      !targetHazardId
    ) {
      return NextResponse.json(
        {
          message:
            "A target hazard is required when assigning a control.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      decision === "Assign" &&
      itemType !== "Control"
    ) {
      return NextResponse.json(
        {
          message:
            "Only controls can be assigned to a target hazard.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      decision === "Modify" &&
      !modifiedText
    ) {
      return NextResponse.json(
        {
          message:
            "Modified text is required when the decision is Modify.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.sourceMetadata !==
        undefined &&
      body.sourceMetadata !==
        null &&
      !isRecord(
        body.sourceMetadata,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Source metadata must be a valid object.",
        },
        {
          status: 400,
        },
      );
    }

    const decisionTimestamp =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const existingDecision =
            await tx.planningHazardControlDecision.findFirst({
              where: {
                planningRecordId,
                tenantId:
                  existingRecord.tenantId,
                revisionNumber:
                  existingRecord.revisionNumber,
                recommendationId,
              },
              select: {
                id: true,
                revisionNumber: true,
                decision: true,
                originalText: true,
                modifiedText: true,
                targetHazardId: true,
                canonicalHazardConceptId:
                  true,
                sourceType: true,
              },
            });

          const decisionRecord =
            existingDecision
              ? await tx.planningHazardControlDecision.update({
                  where: {
                    id:
                      existingDecision.id,
                  },
                  data: {
                    itemType,
                    originalText,
                    decision,
                    modifiedText:
                      decision ===
                      "Modify"
                        ? modifiedText
                        : null,
                    targetHazardId:
                      decision ===
                      "Assign"
                        ? targetHazardId
                        : null,
                    canonicalHazardConceptId,
                    sourceType,
                    sourceMetadata:
                      isRecord(
                        body.sourceMetadata,
                      )
                        ? body.sourceMetadata
                        : undefined,
                    decidedById,
                    decidedByName,
                    decidedByRole,
                    decidedAt:
                      decisionTimestamp,
                  },
                })
              : await tx.planningHazardControlDecision.create({
                  data: {
                    tenantId:
                      existingRecord.tenantId,

                    planningRecordId,

                    revisionNumber:
                      existingRecord.revisionNumber,

                    recommendationId,

                    itemType,

                    originalText,

                    decision,

                    modifiedText:
                      decision ===
                      "Modify"
                        ? modifiedText
                        : null,

                    targetHazardId:
                      decision ===
                      "Assign"
                        ? targetHazardId
                        : null,

                    canonicalHazardConceptId,

                    sourceType,

                    sourceMetadata:
                      isRecord(
                        body.sourceMetadata,
                      )
                        ? body.sourceMetadata
                        : undefined,

                    decidedById,

                    decidedByName,

                    decidedByRole,

                    decidedAt:
                      decisionTimestamp,
                  },
                });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,

              planningRecordId,

              eventType:
                existingDecision
                  ? "Hazard Control Decision Updated"
                  : "Hazard Control Decision Created",

              previousStatus:
                existingRecord.status,

              newStatus:
                existingRecord.status,

              revisionNumber:
                existingRecord.revisionNumber,

              actorId:
                decidedById,

              actorName:
                decidedByName,

              actorRole:
                decidedByRole,

              comment:
                existingDecision
                  ? `Hazard/control review decision was updated to ${decision}.`
                  : `Hazard/control review decision was recorded as ${decision}.`,

              metadata: {
                hazardControlDecisionId:
                  decisionRecord.id,

                recommendationId,

                itemType,

                decision,

                revisionNumber:
                  existingRecord.revisionNumber,

                previousDecision:
                  existingDecision?.decision ??
                  null,

                targetHazardId:
                  decision ===
                  "Assign"
                    ? targetHazardId
                    : null,

                canonicalHazardConceptId,

                sourceType,
              },
            },
          });

          return decisionRecord;
        },
      );

    return NextResponse.json({
      revisionNumber:
        existingRecord.revisionNumber,
      decision: result,
    });
  } catch (error) {
    console.error(
      "Unable to persist hazard/control decision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to persist hazard/control decision.",
      },
      {
        status: 500,
      },
    );
  }
}