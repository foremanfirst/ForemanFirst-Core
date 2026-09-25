import type { Prisma } from "@/generated/prisma/client";

import {
  evaluateControlledRisk,
} from "@/lib/planning/controlled-risk-evaluator";

import {
  evaluateWorkingControlCandidates,
} from "@/lib/planning/control-effectiveness-evaluator";

import type {
  PlanningDraftGenerationResult,
  PlanningWorkStepContext,
} from "@/lib/planning/planning-types";

type SyncPlanningControlEvaluationsArgs = {
  tx: Prisma.TransactionClient;
  tenantId: string;
  planningRecordId: string;
  revisionNumber: number;
  generatedDraft: PlanningDraftGenerationResult;
  workSteps: PlanningWorkStepContext[];
  evaluatedById: string | null;
  evaluatedByName: string | null;
  evaluatedByRole: string | null;
  evaluatedAt?: Date;
};

export async function syncPlanningControlEvaluations({
  tx,
  tenantId,
  planningRecordId,
  revisionNumber,
  generatedDraft,
  workSteps,
  evaluatedById,
  evaluatedByName,
  evaluatedByRole,
  evaluatedAt = new Date(),
}: SyncPlanningControlEvaluationsArgs) {
  const existingControlVerificationEvidence =
    await tx.planningControlEvaluation.findMany({
      where: {
        planningRecordId,
        tenantId,
        revisionNumber,
      },

      select: {
        workStepId: true,
        hazardId: true,
        controlId: true,

        verificationRequiredForCurrentContext: true,
        verificationEvidenceMethod: true,
        verificationEvidence: true,
        verificationCompleted: true,

        verifiedById: true,
        verifiedByName: true,
        verifiedByRole: true,
        verifiedAt: true,
      },
    });

  const existingControlVerificationEvidenceByKey =
    new Map(
      existingControlVerificationEvidence.map(
        (evaluation) => [
          JSON.stringify([
            evaluation.workStepId,
            evaluation.hazardId,
            evaluation.controlId,
          ]),
          evaluation,
        ],
      ),
    );

  /*
   * Control Intelligence is independent of Inherent Risk.
   */
  const workingControlEvaluations =
    generatedDraft.workSteps.map(
      (generatedStep) =>
        evaluateWorkingControlCandidates(
          generatedStep.hazardControlGroups,
        ),
    );

  const controlledRiskEvaluations =
    generatedDraft.workSteps.map(
      (generatedStep) => {
        const workStep =
          generatedStep.workStepId
            ? workSteps.find(
                (candidate) =>
                  candidate.workStepId ===
                  generatedStep.workStepId,
              )
            : undefined;

        if (
          !workStep ||
          !workStep.workStepId ||
          !["Low", "Medium", "High"].includes(
            workStep.inherentRiskLevel ?? "",
          )
        ) {
          return null;
        }

        return evaluateControlledRisk({
          inherentRiskLevel:
            workStep.inherentRiskLevel as
              | "Low"
              | "Medium"
              | "High",

          hazardControlGroups:
            generatedStep.hazardControlGroups,

          verificationEvidenceByControlId:
            Object.fromEntries(
              generatedStep.hazardControlGroups.flatMap(
                (group) =>
                  group.controls.flatMap(
                    (control) => {
                      const evidence =
                        existingControlVerificationEvidenceByKey.get(
                          JSON.stringify([
                            workStep.workStepId,
                            group.hazard.id,
                            control.id,
                          ]),
                        );

                      if (!evidence) {
                        return [];
                      }

                      return [[
                        control.id,
                        {
                          verificationRequiredForCurrentContext:
                            evidence.verificationRequiredForCurrentContext,
                          verificationEvidenceMethod:
                            evidence.verificationEvidenceMethod,
                          verificationEvidence:
                            evidence.verificationEvidence,
                          verificationCompleted:
                            evidence.verificationCompleted,
                        },
                      ]];
                    },
                  ),
              ),
            ),
        });
      },
    );

  await tx.planningControlEvaluation.deleteMany({
    where: {
      planningRecordId,
      tenantId,
      revisionNumber,
    },
  });

  const controlEvaluationRows =
    controlledRiskEvaluations.flatMap(
      (evaluation, workStepIndex) => {
        const generatedStep =
          generatedDraft.workSteps[workStepIndex];

        const controlEvaluations =
          evaluation?.controlEvaluations ??
          workingControlEvaluations[workStepIndex] ??
          [];

        const workStep =
          generatedStep?.workStepId
            ? workSteps.find(
                (candidate) =>
                  candidate.workStepId ===
                  generatedStep.workStepId,
              )
            : undefined;

        if (
          !generatedStep ||
          !workStep ||
          !workStep.workStepId
        ) {
          return [];
        }

        const stableWorkStepId =
          workStep.workStepId;

        const riskCreditByControlId =
          new Map(
            (
              evaluation?.riskCreditAssessments ??
              []
            ).map(
              (assessment) => [
                assessment.controlId,
                assessment,
              ],
            ),
          );

        return controlEvaluations.map(
          (controlEvaluation) => {
            const riskCreditAssessment =
              riskCreditByControlId.get(
                controlEvaluation.controlId,
              );

            const preservedEvidence =
              existingControlVerificationEvidenceByKey.get(
                JSON.stringify([
                  stableWorkStepId,
                  controlEvaluation.hazardId,
                  controlEvaluation.controlId,
                ]),
              );

            return {
              tenantId,
              planningRecordId,
              revisionNumber,

              workStepId:
                stableWorkStepId,

              workStepSequence:
                workStep.sequence,

              workStepTitle:
                workStep.title,

              hazardId:
                controlEvaluation.hazardId,

              controlId:
                controlEvaluation.controlId,

              hazardText:
                controlEvaluation.hazardText,

              canonicalHazardConceptId:
                controlEvaluation.canonicalHazardConceptId,

              controlText:
                controlEvaluation.controlText,

              controlHierarchy:
                controlEvaluation.controlHierarchy,

              protectiveFunction:
                controlEvaluation.protectiveFunction,

              effectiveness:
                controlEvaluation.effectiveness,

              verificationExpectation:
                controlEvaluation.verificationExpectation,

              verificationRequired:
                riskCreditAssessment
                  ?.verificationRequired ??
                controlEvaluation.verificationRequired,

              verificationMethod:
                riskCreditAssessment
                  ?.verificationMethod ??
                controlEvaluation.verificationMethod,

              verificationRequiredForCurrentContext:
                preservedEvidence
                  ?.verificationRequiredForCurrentContext ??
                null,

              verificationEvidenceMethod:
                preservedEvidence
                  ?.verificationEvidenceMethod ??
                null,

              verificationEvidence:
                preservedEvidence
                  ?.verificationEvidence ??
                null,

              verificationCompleted:
                preservedEvidence
                  ?.verificationCompleted ??
                false,

              verifiedById:
                preservedEvidence
                  ?.verifiedById ??
                null,

              verifiedByName:
                preservedEvidence
                  ?.verifiedByName ??
                null,

              verifiedByRole:
                preservedEvidence
                  ?.verifiedByRole ??
                null,

              verifiedAt:
                preservedEvidence
                  ?.verifiedAt ??
                null,

              riskCreditEligible:
                riskCreditAssessment
                  ?.riskCreditEligible ??
                false,

              criticalControlRecommended:
                controlEvaluation
                  .criticalControlRecommended,

              criticalControlClassification:
                controlEvaluation
                  .criticalControlClassification,

              criticalControlTrigger:
                controlEvaluation
                  .criticalControlTrigger,

              evaluationReason:
                controlEvaluation.evaluationReason,

              evaluatorVersion:
                evaluation?.evaluatorVersion ??
                controlEvaluation.evaluatorVersion,

              evaluatedById,
              evaluatedByName,
              evaluatedByRole,
              evaluatedAt,
            };
          },
        );
      },
    );

  if (controlEvaluationRows.length > 0) {
    await tx.planningControlEvaluation.createMany({
      data: controlEvaluationRows,
    });
  }

  return {
    controlledRiskEvaluations,
    controlEvaluationRows,
  };
}
