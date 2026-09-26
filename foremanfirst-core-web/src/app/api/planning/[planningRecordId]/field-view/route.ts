import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningReaderAuthorizationError,
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

import {
  buildCriticalControlRelationshipFingerprint,
} from "@/lib/planning/critical-control-decision";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningReader(
        planningRecordId,
      );

    const record =
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
          planType: true,
          title: true,
          status: true,
          revisionNumber: true,

          responsibleSupervisor: true,
          plannedStartDate: true,
          effectiveStartDate: true,
          effectiveEndDate: true,

          workLocation: true,
          crewSize: true,
          shift: true,

          scopeDescription: true,
          equipmentTools: true,
          materialsChemicals: true,
          adjacentWork: true,
          specialConditions: true,

          requiredPpe: true,
          requiredPermits: true,
          emergencyPlan: true,
          stopWorkTriggers: true,

          company: {
            select: {
              id: true,
              name: true,
            },
          },

          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
              clientName: true,
            },
          },

          contractor: {
            select: {
              id: true,
              name: true,
              legalName: true,
              trade: true,
            },
          },

          workSteps: {
            orderBy: {
              sequence: "asc",
            },

            select: {
              id: true,
              sequence: true,
              title: true,
              description: true,
              equipmentTools: true,
              materialsChemicals: true,
              locationOverride: true,
              safetyCritical: true,
              inherentRiskLevel: true,
              recommendedControlledRiskLevel: true,
              controlledRiskLevel: true,
            },
          },
        },
      });

    if (!record) {
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

    const controlEvaluations =
      await prisma.planningControlEvaluation.findMany({
        where: {
          planningRecordId: record.id,
          tenantId:
            authorization.planningRecord.tenantId,
          revisionNumber: record.revisionNumber,
        },

        orderBy: [
          {
            workStepSequence: "asc",
          },
          {
            hazardText: "asc",
          },
          {
            controlText: "asc",
          },
        ],
      });

    const criticalControlDecisions =
      await prisma.planningCriticalControlDecision.findMany({
        where: {
          planningRecordId: record.id,
          tenantId:
            authorization.planningRecord.tenantId,
          revisionNumber: record.revisionNumber,
        },
      });

    const criticalControlDecisionByFingerprint =
      new Map(
        criticalControlDecisions.map(
          (decision) => [
            decision.relationshipFingerprint,
            decision,
          ],
        ),
      );

    const controlEvaluationsWithCriticalControlDecisions =
      controlEvaluations.map(
        (evaluation) => {
          const relationshipFingerprint =
            buildCriticalControlRelationshipFingerprint({
              planningRecordId: record.id,
              revisionNumber: record.revisionNumber,
              workStepId: evaluation.workStepId,
              hazardId: evaluation.hazardId,
              controlId: evaluation.controlId,
              canonicalHazardConceptId:
                evaluation.canonicalHazardConceptId,
              hazardText: evaluation.hazardText,
              controlText: evaluation.controlText,
              criticalControlClassification:
                evaluation.criticalControlClassification,
              criticalControlTrigger:
                evaluation.criticalControlTrigger,
              evaluatorVersion:
                evaluation.evaluatorVersion,
            });

          const criticalControlDecision =
            criticalControlDecisionByFingerprint.get(
              relationshipFingerprint,
            );

          return {
            ...evaluation,

            criticalControlDecision:
              criticalControlDecision?.decision ?? null,

            criticalControlDecisionReason:
              criticalControlDecision?.decisionReason ?? null,

            criticalControlDecidedById:
              criticalControlDecision?.decidedById ?? null,

            criticalControlDecidedByName:
              criticalControlDecision?.decidedByName ?? null,

            criticalControlDecidedByRole:
              criticalControlDecision?.decidedByRole ?? null,

            criticalControlDecidedAt:
              criticalControlDecision?.decidedAt ?? null,
          };
        },
      );

    const now = new Date();

    let fieldLifecycleState:
      | "Effective"
      | "Upcoming"
      | "Expired"
      | "Unavailable" =
        "Unavailable";

    if (record.status === "Approved") {
      if (
        record.effectiveStartDate &&
        now < record.effectiveStartDate
      ) {
        fieldLifecycleState =
          "Upcoming";
      } else if (
        record.effectiveEndDate &&
        now > record.effectiveEndDate
      ) {
        fieldLifecycleState =
          "Expired";
      } else if (
        record.effectiveStartDate &&
        record.effectiveEndDate
      ) {
        fieldLifecycleState =
          "Effective";
      }
    }

    const fieldWorkSteps =
      record.workSteps.map(
        (workStep) => {
          const stepEvaluations =
            controlEvaluationsWithCriticalControlDecisions.filter(
              (evaluation) =>
                evaluation.workStepId ===
                workStep.id,
            );

          const hazardsById =
            new Map<
              string,
              {
                hazardId: string;
                hazardText: string;
                canonicalHazardConceptId:
                  string | null;
                controls: typeof stepEvaluations;
              }
            >();

          for (const evaluation of stepEvaluations) {
            const existingHazard =
              hazardsById.get(
                evaluation.hazardId,
              );

            if (existingHazard) {
              existingHazard.controls.push(
                evaluation,
              );

              continue;
            }

            hazardsById.set(
              evaluation.hazardId,
              {
                hazardId:
                  evaluation.hazardId,

                hazardText:
                  evaluation.hazardText,

                canonicalHazardConceptId:
                  evaluation.canonicalHazardConceptId,

                controls: [
                  evaluation,
                ],
              },
            );
          }

          const hazards =
            Array.from(
              hazardsById.values(),
            );

          const requiredVerificationCount =
            stepEvaluations.filter(
              (evaluation) =>
                evaluation
                  .verificationRequiredForCurrentContext ===
                true,
            ).length;

          const controlsAwaitingVerification =
            stepEvaluations.filter(
              (evaluation) =>
                evaluation
                  .verificationRequiredForCurrentContext ===
                  true &&
                !evaluation
                  .verificationCompleted,
            ).length;

          const completedVerifications =
            stepEvaluations.filter(
              (evaluation) =>
                evaluation
                  .verificationRequiredForCurrentContext ===
                  true &&
                evaluation
                  .verificationCompleted,
            ).length;

          const confirmedCriticalControls =
            stepEvaluations.filter(
              (evaluation) =>
                evaluation
                  .criticalControlDecision ===
                "Confirmed",
            ).length;

          return {
            ...workStep,

            fieldSummary: {
              hazardCount:
                hazards.length,

              controlCount:
                stepEvaluations.length,

              confirmedCriticalControlCount:
                confirmedCriticalControls,

              requiredVerificationCount,

              controlsAwaitingVerification,

              completedVerifications,
            },

            hazards,
          };
        },
      );

    return NextResponse.json({
      fieldLifecycleState,

      fieldUseAllowed:
        fieldLifecycleState ===
        "Effective",

      record: {
        ...record,
        workSteps: fieldWorkSteps,
      },
    });
  } catch (error) {
    if (
      error instanceof
        PlanningReaderAuthorizationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Failed to load planning field view:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load the planning field view.",
      },
      {
        status: 500,
      },
    );
  }
}
