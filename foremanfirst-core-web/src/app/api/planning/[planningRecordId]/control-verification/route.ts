import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  evaluateControlRiskCredit,
} from "@/lib/planning/control-risk-credit-evaluator";

import type {
  PlanningControlEvaluationCandidate,
} from "@/lib/planning/control-effectiveness-evaluator";

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

    const riskCreditAssessment =
      evaluateControlRiskCredit({
        candidate: {
          hazardId:
            evaluation.hazardId,

          hazardText:
            evaluation.hazardText,

          controlId:
            evaluation.controlId,

          controlText:
            evaluation.controlText,

          canonicalHazardConceptId:
            evaluation.canonicalHazardConceptId as
              PlanningControlEvaluationCandidate["canonicalHazardConceptId"],

          controlHierarchy:
            evaluation.controlHierarchy as
              PlanningControlEvaluationCandidate["controlHierarchy"],

          protectiveFunction:
            evaluation.protectiveFunction as
              PlanningControlEvaluationCandidate["protectiveFunction"],

          effectiveness:
            evaluation.effectiveness as
              PlanningControlEvaluationCandidate["effectiveness"],

          verificationExpectation:
            evaluation.verificationExpectation as
              PlanningControlEvaluationCandidate["verificationExpectation"],

          verificationRequired:
            evaluation.verificationRequired,

          verificationMethod:
            evaluation.verificationMethod,

          riskCreditEligible:
            evaluation.riskCreditEligible,

          criticalControlRecommended:
            evaluation.criticalControlRecommended,

          /*
           * Risk Credit does not use Critical Control classification.
           * Preserve a conservative compatibility value while the
           * contextual policy is wired into persisted evaluations.
           */
          criticalControlClassification:
            evaluation
              .criticalControlClassification as
              PlanningControlEvaluationCandidate[
                "criticalControlClassification"
              ],

          criticalControlTrigger:
            evaluation
              .criticalControlTrigger,

          evaluationReason:
            evaluation.evaluationReason ??
            "",

          evaluatorVersion:
            evaluation.evaluatorVersion,
        },

        evidence: {
          verificationMethod:
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

          verificationCompleted:
            verificationRequired,
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

    const result =
      await prisma.$transaction(
        async (tx) => {
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
                  riskCreditAssessment
                    .riskCreditEligible,
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

          return updatedEvaluation;
        },
      );

    return NextResponse.json({
      planningRecordId,

      revisionNumber:
        existingRecord.revisionNumber,

      controlEvaluation:
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
