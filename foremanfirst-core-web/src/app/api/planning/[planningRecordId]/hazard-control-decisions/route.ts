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

function toUniqueStringArray(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(toNullableString)
        .filter(
          (item): item is string =>
            Boolean(item),
        ),
    ),
  ].slice(0, 50);
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
        include: {
          targets: {
            orderBy: [
              {
                isPrimary: "desc",
              },
              {
                createdAt: "asc",
              },
            ],
          },
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

    const workStepId =
      toNullableString(
        body.workStepId,
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

    const legacyTargetHazardId =
      toNullableString(
        body.targetHazardId,
      );

    const requestedTargetHazardIds =
      toUniqueStringArray(
        body.targetHazardIds,
      );

    const targetHazardIds =
      requestedTargetHazardIds.length > 0
        ? requestedTargetHazardIds
        : legacyTargetHazardId
          ? [legacyTargetHazardId]
          : [];

    const targetHazardId =
      targetHazardIds[0] ?? null;

    const canonicalHazardConceptId =
      toNullableString(
        body.canonicalHazardConceptId,
      );

    const sourceType =
      toNullableString(
        body.sourceType,
      );

    const decidedById =
      authorization.user.id;

    const decidedByName =
      authorization.user.displayName;

    const decidedByRole =
      authorization.membership.roleCodes.join(
        ", ",
      ) || "Planning Editor";

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

    if (!workStepId) {
      return NextResponse.json(
        {
          message:
            "Stable work-step identity is required for hazard and control decisions.",
        },
        {
          status: 400,
        },
      );
    }

    const workStep =
      await prisma.planningWorkStep.findFirst({
        where: {
          id: workStepId,
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
        },
        select: {
          id: true,
          sequence: true,
          title: true,
        },
      });

    if (!workStep) {
      return NextResponse.json(
        {
          message:
            "Work step was not found for this planning record.",
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
      targetHazardIds.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "At least one target hazard is required when assigning a control.",
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
                workStepId:
                  workStep.id,
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
                    workStepId:
                      workStep.id,
                    workStepSequence:
                      workStep.sequence,
                    workStepTitle:
                      workStep.title,
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

                    workStepId:
                      workStep.id,

                    workStepSequence:
                      workStep.sequence,

                    workStepTitle:
                      workStep.title,

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

          await tx.planningHazardControlDecisionTarget.deleteMany({
            where: {
              decisionId:
                decisionRecord.id,
            },
          });

          if (
            decision === "Assign" &&
            targetHazardIds.length > 0
          ) {
            await tx.planningHazardControlDecisionTarget.createMany({
              data:
                targetHazardIds.map(
                  (hazardId, index) => ({
                    tenantId:
                      existingRecord.tenantId,
                    planningRecordId,
                    revisionNumber:
                      existingRecord.revisionNumber,
                    decisionId:
                      decisionRecord.id,
                    hazardId,
                    isPrimary:
                      index === 0,
                  }),
                ),
            });
          }

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

                targetHazardIds:
                  decision ===
                  "Assign"
                    ? targetHazardIds
                    : [],

                canonicalHazardConceptId,

                sourceType,
              },
            },
          });

          return tx.planningHazardControlDecision.findUniqueOrThrow({
            where: {
              id:
                decisionRecord.id,
            },
            include: {
              targets: {
                orderBy: [
                  {
                    isPrimary: "desc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],
              },
            },
          });
        },
      );

    return NextResponse.json({
      revisionNumber:
        existingRecord.revisionNumber,
      decision: result,
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