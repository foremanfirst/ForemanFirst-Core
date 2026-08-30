import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

const ALLOWED_ITEM_TYPES = new Set([
  "Hazard",
  "Control",
]);

const ALLOWED_ACTIONS = new Set([
  "Add",
  "Edit",
  "Change",
  "Remove",
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

function toNullableInteger(
  value: unknown,
) {
  if (
    typeof value === "number" &&
    Number.isInteger(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsed = Number(
      value,
    );

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return null;
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

    const overrides =
      await prisma.planningHazardControlOverride.findMany({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber:
            existingRecord.revisionNumber,
        },
        orderBy: [
          {
            changedAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

    return NextResponse.json({
      revisionNumber:
        existingRecord.revisionNumber,
      overrides,
    });
  } catch (error) {
    console.error(
      "Unable to load hazard/control overrides:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load hazard/control overrides.",
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
            "Hazard and control changes can only be made while the planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const operationKey =
      toNullableString(
        body.operationKey,
      );

    const workStepId =
      toNullableString(
        body.workStepId,
      );

    const workStepSequence =
      toNullableInteger(
        body.workStepSequence,
      );

    const workStepTitle =
      toNullableString(
        body.workStepTitle,
      );

    const itemType =
      toNullableString(
        body.itemType,
      );

    const action =
      toNullableString(
        body.action,
      );

    const targetItemId =
      toNullableString(
        body.targetItemId,
      );

    const parentHazardId =
      toNullableString(
        body.parentHazardId,
      );

    const originalText =
      toNullableString(
        body.originalText,
      );

    const finalText =
      toNullableString(
        body.finalText,
      );

    const canonicalHazardConceptId =
      toNullableString(
        body.canonicalHazardConceptId,
      );

    const sourceType =
      toNullableString(
        body.sourceType,
      );

    const reason =
      toNullableString(
        body.reason,
      );

    const changedById =
      toNullableString(
        body.changedById,
      );

    const changedByName =
      toNullableString(
        body.changedByName,
      );

    const changedByRole =
      toNullableString(
        body.changedByRole,
      );

    if (!operationKey) {
      return NextResponse.json(
        {
          message:
            "Operation key is required.",
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
            "Work step ID is required.",
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

    if (
      !action ||
      !ALLOWED_ACTIONS.has(
        action,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Action must be Add, Edit, Change, or Remove.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action === "Change" &&
      itemType !== "Hazard"
    ) {
      return NextResponse.json(
        {
          message:
            "Change is reserved for hazard classification changes. Use Edit for control wording changes.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action !== "Add" &&
      !targetItemId
    ) {
      return NextResponse.json(
        {
          message:
            "Target item ID is required when editing, changing, or removing an existing item.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action === "Add" &&
      targetItemId
    ) {
      return NextResponse.json(
        {
          message:
            "A newly added item must not include a target item ID.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      (
        action === "Edit" ||
        action === "Change" ||
        action === "Remove"
      ) &&
      !originalText
    ) {
      return NextResponse.json(
        {
          message:
            "Original text is required when changing an existing hazard or control.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      action !== "Remove" &&
      !finalText
    ) {
      return NextResponse.json(
        {
          message:
            "Final text is required when adding, editing, or changing a hazard or control.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      itemType === "Control" &&
      (
        action === "Add" ||
        action === "Edit"
      ) &&
      !parentHazardId
    ) {
      return NextResponse.json(
        {
          message:
            "A parent hazard is required when adding or editing a control.",
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

    const changeTimestamp =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const existingOverride =
            await tx.planningHazardControlOverride.findFirst({
              where: {
                planningRecordId,
                tenantId:
                  existingRecord.tenantId,
                revisionNumber:
                  existingRecord.revisionNumber,
                operationKey,
              },
              select: {
                id: true,
                action: true,
                itemType: true,
                originalText: true,
                finalText: true,
                targetItemId: true,
                parentHazardId: true,
                canonicalHazardConceptId:
                  true,
              },
            });

          const overrideRecord =
            existingOverride
              ? await tx.planningHazardControlOverride.update({
                  where: {
                    id:
                      existingOverride.id,
                  },
                  data: {
                    workStepId,
                    workStepSequence,
                    workStepTitle,
                    itemType,
                    action,
                    targetItemId:
                      action === "Add"
                        ? null
                        : targetItemId,
                    parentHazardId,
                    originalText:
                      action === "Add"
                        ? null
                        : originalText,
                    finalText:
                      action === "Remove"
                        ? null
                        : finalText,
                    canonicalHazardConceptId,
                    sourceType,
                    sourceMetadata:
                      isRecord(
                        body.sourceMetadata,
                      )
                        ? body.sourceMetadata
                        : undefined,
                    reason,
                    changedById,
                    changedByName,
                    changedByRole,
                    changedAt:
                      changeTimestamp,
                  },
                })
              : await tx.planningHazardControlOverride.create({
                  data: {
                    tenantId:
                      existingRecord.tenantId,

                    planningRecordId,

                    revisionNumber:
                      existingRecord.revisionNumber,

                    operationKey,

                    workStepId,

                    workStepSequence,

                    workStepTitle,

                    itemType,

                    action,

                    targetItemId:
                      action === "Add"
                        ? null
                        : targetItemId,

                    parentHazardId,

                    originalText:
                      action === "Add"
                        ? null
                        : originalText,

                    finalText:
                      action === "Remove"
                        ? null
                        : finalText,

                    canonicalHazardConceptId,

                    sourceType,

                    sourceMetadata:
                      isRecord(
                        body.sourceMetadata,
                      )
                        ? body.sourceMetadata
                        : undefined,

                    reason,

                    changedById,

                    changedByName,

                    changedByRole,

                    changedAt:
                      changeTimestamp,
                  },
                });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,

              planningRecordId,

              eventType:
                existingOverride
                  ? "Hazard Control Override Updated"
                  : "Hazard Control Override Created",

              previousStatus:
                existingRecord.status,

              newStatus:
                existingRecord.status,

              revisionNumber:
                existingRecord.revisionNumber,

              actorId:
                changedById,

              actorName:
                changedByName,

              actorRole:
                changedByRole,

              comment:
                existingOverride
                  ? `${itemType} ${action.toLowerCase()} override was updated.`
                  : `${itemType} ${action.toLowerCase()} override was recorded.`,

              metadata: {
                hazardControlOverrideId:
                  overrideRecord.id,

                operationKey,

                workStepId,

                workStepSequence,

                itemType,

                action,

                revisionNumber:
                  existingRecord.revisionNumber,

                targetItemId:
                  action === "Add"
                    ? null
                    : targetItemId,

                parentHazardId,

                canonicalHazardConceptId,

                sourceType,

                previousAction:
                  existingOverride?.action ??
                  null,
              },
            },
          });

          return overrideRecord;
        },
      );

    return NextResponse.json({
      revisionNumber:
        existingRecord.revisionNumber,
      override: result,
    });
  } catch (error) {
    console.error(
      "Unable to persist hazard/control override:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to persist hazard/control override.",
      },
      {
        status: 500,
      },
    );
  }
}
