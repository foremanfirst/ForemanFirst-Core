import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  evaluateControlRiskCredit,
} from "@/lib/planning/control-risk-credit-evaluator";

import type {
  PlanningControlEvaluationCandidate,
} from "@/lib/planning/control-effectiveness-evaluator";

import {
  buildControlConceptKey,
} from "@/lib/planning/draft-generator";

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

function hasMeaningfulEvidence(
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
            "Control verification evidence can only be changed while the planning record is in Draft.",
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

    const controlConceptKey =
      toNullableString(
        body.controlConceptKey,
      );

    const verificationEvidenceMethod =
      toNullableString(
        body.verificationEvidenceMethod,
      );

    const verificationEvidence =
      toNullableString(
        body.verificationEvidence,
      );

    const contextDecision =
      typeof body.verificationRequiredForCurrentContext ===
      "boolean"
        ? body.verificationRequiredForCurrentContext
        : null;

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
          id: true,

          workStepId: true,
          workStepSequence: true,
          workStepTitle: true,

          hazardId: true,
          hazardText: true,
          canonicalHazardConceptId:
            true,

          controlId: true,
          controlText: true,
          controlHierarchy: true,

          protectiveFunction: true,
          effectiveness: true,
          verificationExpectation:
            true,
          verificationRequired: true,
          verificationMethod: true,

          verificationRequiredForCurrentContext:
            true,
          verificationEvidenceMethod:
            true,
          verificationEvidence:
            true,
          verificationCompleted:
            true,
          verifiedById: true,
          verifiedByName: true,
          verifiedByRole: true,
          verifiedAt: true,

          riskCreditEligible: true,
          criticalControlRecommended:
            true,
          criticalControlClassification:
            true,
          criticalControlTrigger:
            true,
          evaluationReason: true,
          evaluatorVersion: true,
        },
      });

    if (!evaluation) {
      return NextResponse.json(
        {
          message:
            "The current control evaluation was not found. Save and refresh the Planning draft before recording verification.",
        },
        {
          status: 404,
        },
      );
    }

    const resolvedControlConceptKey =
      buildControlConceptKey(
        evaluation.workStepId,
        evaluation.controlText,
      );

    const matchingEvaluations =
      await prisma.planningControlEvaluation.findMany({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber:
            existingRecord.revisionNumber,
          workStepId:
            evaluation.workStepId,
        },

        select: {
          id: true,
          workStepId: true,
          workStepSequence: true,
          workStepTitle: true,
          hazardId: true,
          hazardText: true,
          canonicalHazardConceptId: true,
          controlId: true,
          controlText: true,
          controlHierarchy: true,
          protectiveFunction: true,
          effectiveness: true,
          verificationExpectation: true,
          verificationRequired: true,
          verificationMethod: true,
          verificationRequiredForCurrentContext: true,
          verificationEvidenceMethod: true,
          verificationEvidence: true,
          verificationCompleted: true,
          verifiedById: true,
          verifiedByName: true,
          verifiedByRole: true,
          verifiedAt: true,
          riskCreditEligible: true,
          criticalControlRecommended: true,
          criticalControlClassification: true,
          criticalControlTrigger: true,
          evaluationReason: true,
          evaluatorVersion: true,
        },
      });

    const controlConceptEvaluations =
      matchingEvaluations.filter(
        (candidate) =>
          buildControlConceptKey(
            candidate.workStepId,
            candidate.controlText,
          ) === resolvedControlConceptKey,
      );

    const expectation =
      evaluation
        .verificationExpectation;

    if (
      expectation !== "Required" &&
      expectation !== "Conditional"
    ) {
      return NextResponse.json(
        {
          message:
            "This control does not currently require planning-specific verification evidence.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      expectation === "Conditional" &&
      contextDecision === null
    ) {
      return NextResponse.json(
        {
          message:
            "Confirm whether verification is required for this work-step context.",
        },
        {
          status: 400,
        },
      );
    }

    const verificationRequired =
      expectation === "Required" ||
      contextDecision === true;

    if (
      verificationRequired &&
      !verificationEvidenceMethod
    ) {
      return NextResponse.json(
        {
          message:
            "Enter the method used to verify this control.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !hasMeaningfulEvidence(
        verificationEvidence,
      )
    ) {
      return NextResponse.json(
        {
          message:
            verificationRequired
              ? "Document meaningful field evidence showing how the control was verified using at least three words."
              : "Explain why separate verification is not required in this work-step context using at least three words.",
        },
        {
          status: 400,
        },
      );
    }

    const riskCreditAssessments =
      new Map(
        controlConceptEvaluations.map(
          (controlEvaluation) => {
            const relationshipExpectation =
              controlEvaluation.verificationExpectation;

            const relationshipVerificationRequired =
              relationshipExpectation ===
                "Required" ||
              (
                relationshipExpectation ===
                  "Conditional" &&
                contextDecision === true
              );

            const assessment =
              evaluateControlRiskCredit({
                candidate: {
                  hazardId:
                    controlEvaluation.hazardId,

                  hazardText:
                    controlEvaluation.hazardText,

                  controlId:
                    controlEvaluation.controlId,

                  controlText:
                    controlEvaluation.controlText,

                  canonicalHazardConceptId:
                    controlEvaluation
                      .canonicalHazardConceptId as
                      PlanningControlEvaluationCandidate[
                        "canonicalHazardConceptId"
                      ],

                  controlHierarchy:
                    controlEvaluation.controlHierarchy as
                      PlanningControlEvaluationCandidate[
                        "controlHierarchy"
                      ],

                  protectiveFunction:
                    controlEvaluation.protectiveFunction as
                      PlanningControlEvaluationCandidate[
                        "protectiveFunction"
                      ],

                  effectiveness:
                    controlEvaluation.effectiveness as
                      PlanningControlEvaluationCandidate[
                        "effectiveness"
                      ],

                  verificationExpectation:
                    controlEvaluation.verificationExpectation as
                      PlanningControlEvaluationCandidate[
                        "verificationExpectation"
                      ],

                  verificationRequired:
                    controlEvaluation.verificationRequired,

                  verificationMethod:
                    controlEvaluation.verificationMethod,

                  riskCreditEligible:
                    controlEvaluation.riskCreditEligible,

                  criticalControlRecommended:
                    controlEvaluation
                      .criticalControlRecommended,

                  criticalControlClassification:
                    controlEvaluation
                      .criticalControlClassification as
                      PlanningControlEvaluationCandidate[
                        "criticalControlClassification"
                      ],

                  criticalControlTrigger:
                    controlEvaluation
                      .criticalControlTrigger,

                  evaluationReason:
                    controlEvaluation
                      .evaluationReason ??
                    "",

                  evaluatorVersion:
                    controlEvaluation
                      .evaluatorVersion,
                },

                evidence: {
                  verificationMethod:
                    controlEvaluation
                      .verificationMethod,

                  verificationRequiredForCurrentContext:
                    relationshipExpectation ===
                      "Required"
                      ? true
                      : contextDecision,

                  verificationEvidenceMethod:
                    relationshipVerificationRequired
                      ? verificationEvidenceMethod
                      : null,

                  verificationEvidence,

                  verificationCompleted:
                    relationshipVerificationRequired,
                },
              });

            return [
              controlEvaluation.id,
              assessment,
            ] as const;
          },
        ),
      );

    const verificationTargetEvaluations =
      controlConceptEvaluations.filter(
        (controlEvaluation) =>
          controlEvaluation.verificationExpectation ===
            "Required" ||
          controlEvaluation.verificationExpectation ===
            "Conditional",
      );

    const actorRole =
      authorization
        .membership
        .roleCodes
        .join(", ") ||
      "Planning Editor";

    const now =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedEvaluations =
            [] as typeof controlConceptEvaluations;

          for (
            const targetEvaluation of
            verificationTargetEvaluations
          ) {
            const evaluation =
              targetEvaluation;

            const expectation =
              evaluation.verificationExpectation;

            const verificationRequired =
              expectation === "Required" ||
              (
                expectation ===
                  "Conditional" &&
                contextDecision === true
              );

            const updatedEvaluation =
              await tx.planningControlEvaluation.update({
              where: {
                id:
                  evaluation.id,
              },

              data: {
                verificationRequiredForCurrentContext:
                  expectation === "Required"
                    ? true
                    : contextDecision,

                verificationEvidenceMethod:
                  verificationRequired
                    ? verificationEvidenceMethod
                    : null,

                verificationEvidence,

                verificationCompleted:
                  verificationRequired,

                verifiedById:
                  authorization.user.id,

                verifiedByName:
                  authorization
                    .user
                    .displayName,

                verifiedByRole:
                  actorRole,

                verifiedAt:
                  now,

                /*
                 * Risk Credit eligibility belongs to this exact
                 * hazard-control relationship and can be evaluated
                 * immediately from its structured intelligence and
                 * newly recorded qualified-user evidence.
                 *
                 * The complete work-step Controlled Risk recommendation
                 * remains invalidated below until the full control system
                 * is evaluated separately.
                 */
                riskCreditEligible:
                  riskCreditAssessments.get(
                    evaluation.id,
                  )?.riskCreditEligible ??
                  false,
              },

              select: {
                id: true,

                workStepId: true,
                workStepSequence: true,
                workStepTitle: true,

                hazardId: true,
                hazardText: true,
                canonicalHazardConceptId:
                  true,

                controlId: true,
                controlText: true,
                controlHierarchy: true,

                protectiveFunction: true,
                effectiveness: true,
                verificationExpectation:
                  true,
                verificationRequired:
                  true,
                verificationMethod: true,

                verificationRequiredForCurrentContext:
                  true,
                verificationEvidenceMethod:
                  true,
                verificationEvidence:
                  true,
                verificationCompleted:
                  true,

                verifiedById: true,
                verifiedByName: true,
                verifiedByRole: true,
                verifiedAt: true,

                riskCreditEligible: true,
                criticalControlRecommended:
                  true,
                criticalControlClassification:
                  true,
                criticalControlTrigger:
                  true,
                evaluationReason: true,
                evaluatorVersion: true,
              },
            });

            updatedEvaluations.push(
              updatedEvaluation,
            );
          }

          if (
            evaluation.workStepSequence !==
            null
          ) {
            /*
             * Any new or changed verification evidence makes the
             * previous recommendation and qualified-user decision
             * stale until Qoreva evaluates the complete work step.
             */
            await tx.planningWorkStep.updateMany({
              where: {
                planningRecordId,

                tenantId:
                  existingRecord.tenantId,

                sequence:
                  evaluation.workStepSequence,
              },

              data: {
                recommendedControlledRiskLevel:
                  null,

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
                verificationRequired
                  ? "Control Verification Recorded"
                  : "Control Verification Not Required",

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
                verificationRequired
                  ? `Verification evidence was recorded for a control in work step ${evaluation.workStepSequence ?? "unknown"}.`
                  : `A qualified user confirmed that separate verification is not required for a control in work step ${evaluation.workStepSequence ?? "unknown"}.`,

              metadata: {
                evaluationId:
                  evaluation.id,

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

                controlConceptKey:
                  resolvedControlConceptKey,

                affectedRelationshipCount:
                  updatedEvaluations.length,

                affectedEvaluationIds:
                  updatedEvaluations.map(
                    (updatedEvaluation) =>
                      updatedEvaluation.id,
                  ),

                affectedRelationships:
                  updatedEvaluations.map(
                    (updatedEvaluation) => ({
                      evaluationId:
                        updatedEvaluation.id,

                      hazardId:
                        updatedEvaluation.hazardId,

                      hazardText:
                        updatedEvaluation.hazardText,

                      controlId:
                        updatedEvaluation.controlId,

                      controlText:
                        updatedEvaluation.controlText,
                    }),
                  ),

                verificationExpectation:
                  expectation,

                expectedVerificationMethod:
                  evaluation.verificationMethod,

                verificationRequiredForCurrentContext:
                  expectation === "Required"
                    ? true
                    : contextDecision,

                verificationEvidenceMethod:
                  verificationRequired
                    ? verificationEvidenceMethod
                    : null,

                verificationEvidence,

                previousVerificationCompleted:
                  evaluation.verificationCompleted,

                verificationCompleted:
                  verificationRequired,

                controlledRiskInvalidated:
                  true,
              },
            },
          });

          return updatedEvaluations;
        },
      );

    return NextResponse.json({
      planningRecordId,

      revisionNumber:
        existingRecord.revisionNumber,

      controlEvaluations:
        result,

      requiresRiskRefresh:
        true,

      message:
        "Verification evidence was saved. Save and refresh the Planning draft so Qoreva can recalculate Controlled Risk.",
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
      "Unable to save control verification evidence:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save the control verification evidence.",
      },
      {
        status: 500,
      },
    );
  }
}
