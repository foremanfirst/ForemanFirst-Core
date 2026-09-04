import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  recommendCanonicalControlsForHazard,
} from "@/lib/planning/hazard-control-library";

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

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export async function POST(
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

    const body = await request.json();

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord
              .tenantId,
          projectId:
            authorization.planningRecord
              .projectId,
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

    if (existingRecord.status !== "Draft") {
      return NextResponse.json(
        {
          message:
            "Control recommendations can only be generated while the planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const hazardId =
      toNullableString(body.hazardId);

    const hazardText =
      toNullableString(body.hazardText);

    const workStepId =
      toNullableString(body.workStepId);

    const workStepTitle =
      toNullableString(body.workStepTitle);

    const applicableActivityCodes =
      toStringArray(
        body.applicableActivityCodes,
      );

    const existingControls =
      toStringArray(body.existingControls);

    if (!hazardId) {
      return NextResponse.json(
        {
          message:
            "Hazard ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!hazardText) {
      return NextResponse.json(
        {
          message:
            "Hazard text is required.",
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

    const result =
      recommendCanonicalControlsForHazard({
        hazardText,
        applicableActivityCodes,
        existingControls,
      });

    return NextResponse.json({
      planningRecordId:
        existingRecord.id,

      revisionNumber:
        existingRecord.revisionNumber,

      workStep: {
        id: workStepId,
        title: workStepTitle,
      },

      hazard: {
        id: hazardId,
        text: hazardText,
      },

      match: result.match
        ? {
            canonicalHazardConceptId:
              result.match.definition.id,
            label:
              result.match.definition.label,
            kind:
              result.match.definition.kind,
            riskAttention:
              result.match.definition
                .riskAttention,
            score:
              result.match.score,
            matchedAlias:
              result.match.matchedAlias,
          }
        : null,

      recommendations:
        result.recommendations,

      summary: {
        existingControlCount:
          result.existingControlCount,
        duplicateControlCount:
          result.duplicateControlCount,
        recommendationCount:
          result.recommendations.length,
      },

      guidance:
        result.recommendations.length > 0
          ? "Select one, several, or all recommended controls for qualified-user review before adding them to the planning record."
          : result.match
            ? "No additional canonical controls were found after comparing the hazard against its existing controls."
            : "Qoreva did not find a sufficiently confident canonical hazard match. Add a control manually or review the hazard classification.",

      metadata: {
        recommendationEngineVersion:
          "qoreva-canonical-control-recommendations-v1",
        recommendationSource:
          "CanonicalHazardControlLibrary",
        advisoryOnly: true,
        requiresQualifiedUserSelection: true,
      },
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
      "Unable to generate recommended controls:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to generate recommended controls.",
      },
      {
        status: 500,
      },
    );
  }
}
