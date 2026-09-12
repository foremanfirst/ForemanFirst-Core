import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

import {
  buildCriticalControlRelationshipFingerprint,
} from "@/lib/planning/critical-control-decision";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

const ALLOWED_DECISIONS =
  new Set([
    "Confirmed",
    "Declined",
    "NotApplicable",
  ]);

function toNullableString(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function hasMeaningfulReason(
  value: string | null,
) {
  if (!value) {
    return false;
  }

  const words =
    value
      .split(/\s+/g)
      .filter(Boolean);

  return (
    value.length >= 12 &&
    words.length >= 3
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
      (await request.json()) as
        Record<string, unknown>;

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,

          tenantId:
            authorization
              .planningRecord
              .tenantId,

          projectId:
            authorization
              .planningRecord
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

    if (
      existingRecord.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Critical Control decisions can only be changed while the planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const workStepId =
      toNullableString(
        body.workStepId,
      );

    const hazardId =
      toNullableString(
        body.hazardId,
      );

    const controlId =
      toNullableString(
        body.controlId,
      );

    const decision =
      toNullableString(
        body.decision,
      );

    const decisionReason =
      toNullableString(
        body.decisionReason,
      );

    if (
      !workStepId ||
      !hazardId ||
      !controlId
    ) {
      return NextResponse.json(
        {
          message:
            "Work-step, hazard, and control identities are required.",
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
            "Decision must be Confirmed, Declined, or NotApplicable.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      (
        decision === "Declined" ||
        decision === "NotApplicable"
      ) &&
      !hasMeaningfulReason(
        decisionReason,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Document the qualified-user basis for this Critical Control decision using at least three meaningful words.",
        },
        {
          status: 400,
        },
      );
    }

    const evaluation =
      await prisma.planningControlEvaluation.findFirst({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          workStepId,
          hazardId,
          controlId,
        },

        select: {
          workStepId: true,
          workStepSequence: true,
          workStepTitle: true,

          hazardId: true,
          hazardText: true,

          controlId: true,
          controlText: true,

          canonicalHazardConceptId:
            true,

          criticalControlRecommended:
            true,
          criticalControlClassification:
            true,
          criticalControlTrigger:
            true,

          evaluatorVersion: true,
        },
      });

    if (!evaluation) {
      return NextResponse.json(
        {
          message:
            "The current control evaluation was not found. Save and refresh the draft before recording a Critical Control decision.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      decision === "NotApplicable" &&
      evaluation
        .criticalControlClassification !==
        "Contextual"
    ) {
      return NextResponse.json(
        {
          message:
            "Not Applicable may only be used for a Contextual Critical Control candidate.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !evaluation
        .criticalControlRecommended
    ) {
      return NextResponse.json(
        {
          message:
            "This control is not currently a Qoreva Critical Control candidate.",
        },
        {
          status: 409,
        },
      );
    }

    const acceptedControlDecision =
      await prisma.planningHazardControlDecision.findFirst({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          recommendationId:
            evaluation.controlId,

          itemType:
            "Control",

          decision:
            "Accept",
        },

        select: {
          id: true,
        },
      });

    if (!acceptedControlDecision) {
      return NextResponse.json(
        {
          message:
            "Accept this control before making its Critical Control designation decision.",
        },
        {
          status: 409,
        },
      );
    }

    const relationshipFingerprint =
      buildCriticalControlRelationshipFingerprint({
        planningRecordId,

        revisionNumber:
          existingRecord.revisionNumber,

        workStepId:
          evaluation.workStepId,

        hazardId:
          evaluation.hazardId,

        controlId:
          evaluation.controlId,

        canonicalHazardConceptId:
          evaluation
            .canonicalHazardConceptId,

        hazardText:
          evaluation.hazardText,

        controlText:
          evaluation.controlText,

        criticalControlClassification:
          evaluation.criticalControlClassification,

        criticalControlTrigger:
          evaluation.criticalControlTrigger,

        evaluatorVersion:
          evaluation.evaluatorVersion,
      });

    const previousDecision =
      await prisma.planningCriticalControlDecision.findUnique({
        where: {
          planningRecordId_revisionNumber_relationshipFingerprint: {
            planningRecordId,

            revisionNumber:
              existingRecord.revisionNumber,

            relationshipFingerprint,
          },
        },

        select: {
          decision: true,
          decisionReason: true,
        },
      });

    const actorRole =
      authorization
        .membership
        .roleCodes
        .join(", ") ||
      "Planning Editor";

    const now =
      new Date();

    const saved =
      await prisma.$transaction(
        async (tx) => {
          const persistedDecision =
            await tx.planningCriticalControlDecision.upsert({
              where: {
                planningRecordId_revisionNumber_relationshipFingerprint: {
                  planningRecordId,

                  revisionNumber:
                    existingRecord.revisionNumber,

                  relationshipFingerprint,
                },
              },

              create: {
                tenantId:
                  existingRecord.tenantId,

                planningRecordId,

                revisionNumber:
                  existingRecord.revisionNumber,

                workStepId:
                  evaluation.workStepId,

                workStepSequence:
                  evaluation.workStepSequence,

                workStepTitle:
                  evaluation.workStepTitle,

                hazardId:
                  evaluation.hazardId,

                controlId:
                  evaluation.controlId,

                canonicalHazardConceptId:
                  evaluation
                    .canonicalHazardConceptId,

                hazardText:
                  evaluation.hazardText,

                controlText:
                  evaluation.controlText,

                relationshipFingerprint,

                decision,

                decisionReason:
                  decision !== "Confirmed"
                    ? decisionReason
                    : null,

                recommendedEvaluatorVersion:
                  evaluation.evaluatorVersion,

                decidedById:
                  authorization.user.id,

                decidedByName:
                  authorization
                    .user
                    .displayName,

                decidedByRole:
                  actorRole,

                decidedAt:
                  now,
              },

              update: {
                decision,

                decisionReason:
                  decision !== "Confirmed"
                    ? decisionReason
                    : null,

                decidedById:
                  authorization.user.id,

                decidedByName:
                  authorization
                    .user
                    .displayName,

                decidedByRole:
                  actorRole,

                decidedAt:
                  now,
              },
            });

          /*
           * A new or changed Critical Control designation makes the
           * prior qualified-user Controlled Risk decision stale.
           * Qoreva's recommendation remains available, but the final
           * value must be confirmed again after critical review.
           */
          if (
            evaluation.workStepSequence !==
            null
          ) {
            await tx.planningWorkStep.updateMany({
              where: {
                planningRecordId,

                tenantId:
                  existingRecord.tenantId,

                sequence:
                  evaluation.workStepSequence,
              },

              data: {
                controlledRiskLevel:
                  null,

                riskLevel:
                  null,
              },
            });
          }

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,

              planningRecordId,

              eventType:
                decision === "Confirmed"
                  ? "Critical Control Confirmed"
                  : decision === "NotApplicable"
                    ? "Contextual Critical Control Not Applicable"
                    : "Critical Control Declined",

              previousStatus:
                existingRecord.status,

              newStatus:
                existingRecord.status,

              revisionNumber:
                existingRecord.revisionNumber,

              actorId:
                authorization.user.id,

              actorName:
                authorization
                  .user
                  .displayName,

              actorRole,

              comment:
                decision === "Confirmed"
                  ? `A Critical Control designation was confirmed in work step ${evaluation.workStepSequence ?? "unknown"}.`
                  : decision === "NotApplicable"
                    ? `A Contextual Critical Control trigger was documented as not applicable in work step ${evaluation.workStepSequence ?? "unknown"}.`
                    : `A Critical Control designation was declined in work step ${evaluation.workStepSequence ?? "unknown"}.`,

              metadata: {
                workStepId:
                  evaluation.workStepId,

                workStepSequence:
                  evaluation.workStepSequence,

                workStepTitle:
                  evaluation.workStepTitle,

                hazardId:
                  evaluation.hazardId,

                hazardText:
                  evaluation.hazardText,

                controlId:
                  evaluation.controlId,

                controlText:
                  evaluation.controlText,

                canonicalHazardConceptId:
                  evaluation
                    .canonicalHazardConceptId,

                relationshipFingerprint,

                qorevaRecommendedCritical:
                  true,

                previousDecision:
                  previousDecision
                    ?.decision ??
                  null,

                previousDecisionReason:
                  previousDecision
                    ?.decisionReason ??
                  null,

                decision,

                decisionReason:
                  decision !== "Confirmed"
                    ? decisionReason
                    : null,

                controlledRiskInvalidated:
                  true,

                evaluatorVersion:
                  evaluation.evaluatorVersion,
              },
            },
          });

          return persistedDecision;
        },
      );

    return NextResponse.json({
      planningRecordId,

      revisionNumber:
        existingRecord.revisionNumber,

      criticalControlDecision: {
        id:
          saved.id,

        workStepId:
          saved.workStepId,

        workStepSequence:
          saved.workStepSequence,

        hazardId:
          saved.hazardId,

        controlId:
          saved.controlId,

        decision:
          saved.decision,

        decisionReason:
          saved.decisionReason,

        decidedByName:
          saved.decidedByName,

        decidedByRole:
          saved.decidedByRole,

        decidedAt:
          saved.decidedAt,
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
      "Unable to save Critical Control decision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save the Critical Control decision.",
      },
      {
        status: 500,
      },
    );
  }
}
