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

    const workStepId =
      toNullableString(
        body.workStepId,
      );

    const attested =
      body.attested === true;

    if (!workStepId) {
      return NextResponse.json(
        {
          message:
            "Work-step identity is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!attested) {
      return NextResponse.json(
        {
          message:
            "Qualified-user Core Critical Control review attestation is required.",
        },
        {
          status: 400,
        },
      );
    }

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
            "Core Critical Control review can only be completed while the planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const coreEvaluations =
      await prisma.planningControlEvaluation.findMany({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          workStepId,

          criticalControlRecommended:
            true,

          criticalControlClassification:
            "Core",
        },

        orderBy: [
          {
            hazardText: "asc",
          },
          {
            controlText: "asc",
          },
        ],

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

          criticalControlClassification:
            true,

          criticalControlTrigger:
            true,

          evaluatorVersion: true,
        },
      });

    if (coreEvaluations.length === 0) {
      return NextResponse.json(
        {
          message:
            "No current Core Critical Control candidates were found for this work step.",
        },
        {
          status: 409,
        },
      );
    }

    const workStepSequence =
      coreEvaluations[0]
        .workStepSequence;

    if (
      workStepSequence === null ||
      coreEvaluations.some(
        (evaluation) =>
          evaluation.workStepSequence !==
          workStepSequence,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Core Critical Control candidates do not have one authoritative work-step sequence.",
        },
        {
          status: 409,
        },
      );
    }

    const controlIds = [
      ...new Set(
        coreEvaluations.map(
          (evaluation) =>
            evaluation.controlId,
        ),
      ),
    ];

    const acceptedControls =
      await prisma.planningHazardControlDecision.findMany({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          recommendationId: {
            in: controlIds,
          },

          itemType:
            "Control",

          decision:
            "Accept",
        },

        select: {
          recommendationId: true,
        },
      });

    const acceptedControlIds =
      new Set(
        acceptedControls.map(
          (decision) =>
            decision.recommendationId,
        ),
      );

    const unacceptedControlIds =
      controlIds.filter(
        (controlId) =>
          !acceptedControlIds.has(
            controlId,
          ),
      );

    if (
      unacceptedControlIds.length >
      0
    ) {
      return NextResponse.json(
        {
          message:
            `Accept all Core Critical Control candidates before confirming the step review. ${unacceptedControlIds.length} ${unacceptedControlIds.length === 1 ? "control remains" : "controls remain"} unaccepted.`,
        },
        {
          status: 409,
        },
      );
    }

    const relationships =
      coreEvaluations.map(
        (evaluation) => ({
          evaluation,

          relationshipFingerprint:
            buildCriticalControlRelationshipFingerprint({
              planningRecordId,

              revisionNumber:
                existingRecord
                  .revisionNumber,

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
                evaluation
                  .criticalControlClassification,

              criticalControlTrigger:
                evaluation
                  .criticalControlTrigger,

              evaluatorVersion:
                evaluation.evaluatorVersion,
            }),
        }),
      );

    const existingDecisions =
      await prisma.planningCriticalControlDecision.findMany({
        where: {
          planningRecordId,

          revisionNumber:
            existingRecord.revisionNumber,

          relationshipFingerprint: {
            in: relationships.map(
              (relationship) =>
                relationship
                  .relationshipFingerprint,
            ),
          },
        },

        select: {
          relationshipFingerprint:
            true,
        },
      });

    const decidedFingerprints =
      new Set(
        existingDecisions.map(
          (decision) =>
            decision
              .relationshipFingerprint,
        ),
      );

    const pendingRelationships =
      relationships.filter(
        (relationship) =>
          !decidedFingerprints.has(
            relationship
              .relationshipFingerprint,
          ),
      );

    if (
      pendingRelationships.length ===
      0
    ) {
      return NextResponse.json({
        planningRecordId,

        revisionNumber:
          existingRecord.revisionNumber,

        workStepId,
        workStepSequence,

        coreCandidateCount:
          coreEvaluations.length,

        newlyConfirmedCount: 0,

        alreadyDecidedCount:
          existingDecisions.length,
      });
    }

    const actorRole =
      authorization
        .membership
        .roleCodes
        .join(", ") ||
      "Planning Editor";

    const now = new Date();

    const newlyConfirmedCount =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.planningCriticalControlDecision.createMany({
              data:
                pendingRelationships.map(
                  ({
                    evaluation,
                    relationshipFingerprint,
                  }) => ({
                    tenantId:
                      existingRecord.tenantId,

                    planningRecordId,

                    revisionNumber:
                      existingRecord
                        .revisionNumber,

                    workStepId:
                      evaluation.workStepId,

                    workStepSequence:
                      evaluation
                        .workStepSequence,

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

                    decision:
                      "Confirmed",

                    decisionReason:
                      null,

                    recommendedEvaluatorVersion:
                      evaluation
                        .evaluatorVersion,

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
                  }),
                ),

              skipDuplicates:
                true,
            });

          if (created.count > 0) {
            await tx.planningWorkStep.updateMany({
              where: {
                planningRecordId,

                tenantId:
                  existingRecord.tenantId,

                sequence:
                  workStepSequence,
              },

              data: {
                controlledRiskLevel:
                  null,

                riskLevel:
                  null,
              },
            });

            await tx.planningEvent.create({
              data: {
                tenantId:
                  existingRecord.tenantId,

                planningRecordId,

                eventType:
                  "Core Critical Controls Confirmed",

                previousStatus:
                  existingRecord.status,

                newStatus:
                  existingRecord.status,

                revisionNumber:
                  existingRecord
                    .revisionNumber,

                actorId:
                  authorization.user.id,

                actorName:
                  authorization
                    .user
                    .displayName,

                actorRole,

                comment:
                  `${created.count} Core Critical Control ${created.count === 1 ? "designation was" : "designations were"} confirmed for work step ${workStepSequence}.`,

                metadata: {
                  workStepId,
                  workStepSequence,

                  workStepTitle:
                    coreEvaluations[0]
                      .workStepTitle,

                  attested:
                    true,

                  coreCandidateCount:
                    coreEvaluations.length,

                  newlyConfirmedCount:
                    created.count,

                  relationshipFingerprints:
                    pendingRelationships.map(
                      (relationship) =>
                        relationship
                          .relationshipFingerprint,
                    ),

                  controlledRiskInvalidated:
                    true,
                },
              },
            });
          }

          return created.count;
        },
      );

    return NextResponse.json({
      planningRecordId,

      revisionNumber:
        existingRecord.revisionNumber,

      workStepId,
      workStepSequence,

      coreCandidateCount:
        coreEvaluations.length,

      newlyConfirmedCount,

      alreadyDecidedCount:
        existingDecisions.length,

      decidedByName:
        authorization.user.displayName,

      decidedByRole:
        actorRole,

      decidedAt:
        now,
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
      "Unable to complete Core Critical Control review:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to complete the Core Critical Control review.",
      },
      {
        status: 500,
      },
    );
  }
}
