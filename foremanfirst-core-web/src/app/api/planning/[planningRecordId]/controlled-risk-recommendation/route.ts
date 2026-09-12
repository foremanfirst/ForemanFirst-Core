import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

import type {
  GeneratedHazardControlGroup,
  PlanningControlHierarchy,
} from "@/lib/planning/planning-types";

import {
  evaluateControlledRisk,
  type PlanningRiskLevel,
} from "@/lib/planning/controlled-risk-evaluator";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

const ALLOWED_RISK_LEVELS =
  new Set<PlanningRiskLevel>([
    "Low",
    "Medium",
    "High",
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

function isRiskLevel(
  value: string | null,
): value is PlanningRiskLevel {
  return (
    value !== null &&
    ALLOWED_RISK_LEVELS.has(
      value as PlanningRiskLevel,
    )
  );
}

const ALLOWED_CONTROL_HIERARCHIES =
  new Set<PlanningControlHierarchy>([
    "Elimination",
    "Substitution",
    "Engineering",
    "Administrative",
    "PPE",
  ]);

function asPlanningControlHierarchy(
  value: string | null,
): PlanningControlHierarchy | null {
  if (
    value !== null &&
    ALLOWED_CONTROL_HIERARCHIES.has(
      value as PlanningControlHierarchy,
    )
  ) {
    return value as PlanningControlHierarchy;
  }

  return null;
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

    const inherentRiskLevel =
      toNullableString(
        body.inherentRiskLevel,
      );

    if (!workStepId) {
      return NextResponse.json(
        {
          message:
            "Work-step ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isRiskLevel(
        inherentRiskLevel,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Select Low, Medium, or High for Inherent Risk.",
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
            "Controlled Risk recommendations can only be refreshed while the planning record is in Draft.",
        },
        {
          status: 409,
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

          inherentRiskLevel: true,

          recommendedControlledRiskLevel:
            true,

          controlledRiskLevel: true,
          riskLevel: true,
        },
      });

    if (!workStep) {
      return NextResponse.json(
        {
          message:
            "The current work step was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const verificationEvidence =
      await prisma.planningControlEvaluation.findMany({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          workStepSequence:
            workStep.sequence,
        },

        select: {
          workStepId: true,

          hazardId: true,
          hazardText: true,

          canonicalHazardConceptId:
            true,

          controlId: true,
          controlText: true,
          controlHierarchy: true,

          verificationRequiredForCurrentContext:
            true,

          verificationEvidenceMethod:
            true,

          verificationEvidence:
            true,

          verificationCompleted:
            true,
        },
      });

    if (
      verificationEvidence.length ===
      0
    ) {
      return NextResponse.json(
        {
          message:
            "No authoritative current-revision control evaluations are available for this work step.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Reconstruct the exact reviewed hazard-control relationships
     * from their current-revision authoritative evaluation snapshots.
     *
     * Source/provenance arrays are intentionally empty here because
     * this endpoint is not regenerating or replacing planning content.
     * The Controlled Risk evaluator uses the stable identities,
     * canonical hazard identity, exact control wording, hierarchy,
     * and qualified-user verification evidence below.
     */
    const relationshipGroupsByHazardId =
      new Map<
        string,
        GeneratedHazardControlGroup
      >();

    for (
      const relationship of
      verificationEvidence
    ) {
      let group =
        relationshipGroupsByHazardId.get(
          relationship.hazardId,
        );

      if (!group) {
        group = {
          id:
            `persisted-hazard-group:${workStep.sequence}:${relationship.hazardId}`,

          canonicalHazardConceptId:
            relationship
              .canonicalHazardConceptId,

          hazard: {
            id:
              relationship.hazardId,

            text:
              relationship.hazardText,

            source: "User",

            sourceActivityCodes: [],
            sourceQuestionCodes: [],
            sourceRequirementIds: [],

            controlHierarchy: null,
            required: false,
          },

          controls: [],
        };

        relationshipGroupsByHazardId.set(
          relationship.hazardId,
          group,
        );
      }

      group.controls.push({
        id:
          relationship.controlId,

        text:
          relationship.controlText,

        source: "User",

        sourceActivityCodes: [],
        sourceQuestionCodes: [],
        sourceRequirementIds: [],

        controlHierarchy:
          asPlanningControlHierarchy(
            relationship
              .controlHierarchy,
          ),

        required: false,
      });
    }

    const hazardControlGroups =
      Array.from(
        relationshipGroupsByHazardId.values(),
      );

    const evaluation =
      evaluateControlledRisk({
        inherentRiskLevel,

        hazardControlGroups,

        verificationEvidenceByControlId:
          Object.fromEntries(
            verificationEvidence.map(
              (evidence) => [
                evidence.controlId,

                {
                  verificationRequiredForCurrentContext:
                    evidence
                      .verificationRequiredForCurrentContext,

                  verificationEvidenceMethod:
                    evidence
                      .verificationEvidenceMethod,

                  verificationEvidence:
                    evidence
                      .verificationEvidence,

                  verificationCompleted:
                    evidence
                      .verificationCompleted,
                },
              ],
            ),
          ),
      });

    const actorRole =
      authorization
        .membership
        .roleCodes
        .join(", ") ||
      "Planning Editor";

    const updatedWorkStep =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.planningWorkStep.update({
              where: {
                id: workStep.id,
              },

              data: {
                inherentRiskLevel,

                recommendedControlledRiskLevel:
                  evaluation
                    .recommendedControlledRiskLevel,

                /*
                 * A refreshed recommendation is not a
                 * qualified-user final decision.
                 */
                controlledRiskLevel: null,
                riskLevel: null,
              },

              select: {
                id: true,
                sequence: true,
                title: true,

                inherentRiskLevel: true,

                recommendedControlledRiskLevel:
                  true,

                controlledRiskLevel: true,
                riskLevel: true,
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,

              planningRecordId,

              eventType:
                "Controlled Risk Recommendation Refreshed",

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
                evaluation
                  .recommendedControlledRiskLevel
                  ? `Qoreva refreshed the Controlled Risk recommendation for work step ${workStep.sequence}.`
                  : `Qoreva evaluated work step ${workStep.sequence} but additional structured evidence is still required.`,

              metadata: {
                workStepId:
                  workStep.id,

                workStepSequence:
                  workStep.sequence,

                workStepTitle:
                  workStep.title,

                previousInherentRiskLevel:
                  workStep
                    .inherentRiskLevel,

                inherentRiskLevel,

                previousRecommendedControlledRiskLevel:
                  workStep
                    .recommendedControlledRiskLevel,

                recommendedControlledRiskLevel:
                  evaluation
                    .recommendedControlledRiskLevel,

                previousControlledRiskLevel:
                  workStep
                    .controlledRiskLevel,

                evaluationStatus:
                  evaluation.status,

                evaluationReasons:
                  evaluation.reasons,

                evaluatorVersion:
                  evaluation.evaluatorVersion,
              },
            },
          });

          return updated;
        },
      );

    return NextResponse.json({
      planningRecordId,

      revisionNumber:
        existingRecord.revisionNumber,

      workStep:
        updatedWorkStep,

      evaluation: {
        status:
          evaluation.status,

        recommendedControlledRiskLevel:
          evaluation
            .recommendedControlledRiskLevel,

        relationshipCount:
          verificationEvidence.length,

        reasons:
          evaluation.reasons,

        evaluatorVersion:
          evaluation.evaluatorVersion,
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
      "Unable to refresh Controlled Risk recommendation:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to refresh the Controlled Risk recommendation.",
      },
      {
        status: 500,
      },
    );
  }
}
