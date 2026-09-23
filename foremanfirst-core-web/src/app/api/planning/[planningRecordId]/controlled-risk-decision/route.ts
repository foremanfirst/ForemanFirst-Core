import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

import {
  CONTROLLED_RISK_EVALUATOR_VERSION,
} from "@/lib/planning/controlled-risk-evaluator";

import {
  buildCriticalControlRelationshipFingerprint,
} from "@/lib/planning/critical-control-decision";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type RiskLevel =
  | "Low"
  | "Medium"
  | "High";

const ALLOWED_DECISIONS =
  new Set([
    "Confirm",
    "Override",
  ]);

const ALLOWED_RISK_LEVELS =
  new Set<RiskLevel>([
    "Low",
    "Medium",
    "High",
  ]);

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getSnapshotGeneration(
  snapshot: unknown,
) {
  if (!isRecord(snapshot)) {
    return null;
  }

  const generation =
    snapshot.qorevaDraftGeneration;

  return isRecord(generation)
    ? generation
    : null;
}

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

function isRiskLevel(
  value: string | null,
): value is RiskLevel {
  return (
    value !== null &&
    ALLOWED_RISK_LEVELS.has(
      value as RiskLevel,
    )
  );
}

function hasMeaningfulOverrideReason(
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
            "Controlled Risk decisions can only be changed while the planning record is in Draft.",
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

    const decision =
      toNullableString(
        body.decision,
      );

    const requestedRiskLevel =
      toNullableString(
        body.controlledRiskLevel,
      );

    const overrideReason =
      toNullableString(
        body.overrideReason,
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
      !decision ||
      !ALLOWED_DECISIONS.has(
        decision,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Decision must be Confirm or Override.",
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

          inherentRiskLevel: true,

          recommendedControlledRiskLevel:
            true,

          controlledRiskLevel: true,
        },
      });

    if (!workStep) {
      return NextResponse.json(
        {
          message:
            "The current work step was not found. Save or refresh the planning draft and try again.",
        },
        {
          status: 404,
        },
      );
    }

    const recommendedRiskLevel =
      toNullableString(
        workStep
          .recommendedControlledRiskLevel,
      );

    if (
      !isRiskLevel(
        recommendedRiskLevel,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Qoreva does not currently have enough structured evidence to recommend Controlled Risk for this work step.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Controlled Risk is an official qualified-user decision.
     *
     * Rebuild readiness from the authoritative active-revision
     * snapshot and persisted server evidence. Browser state alone
     * must never be able to make an incomplete work step eligible.
     */
    const activeRevision =
      await prisma.planningRevision.findFirst({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,
        },

        select: {
          snapshot: true,
        },
      });

    const generation =
      getSnapshotGeneration(
        activeRevision?.snapshot,
      );

    const generatedWorkSteps =
      generation &&
      Array.isArray(
        generation.workSteps,
      )
        ? generation.workSteps
        : null;

    const generatedStep =
      generatedWorkSteps?.find(
        (candidate) =>
          isRecord(candidate) &&
          candidate.workStepId ===
            workStep.id,
      );

    if (
      !isRecord(generatedStep) ||
      !Array.isArray(
        generatedStep.hazardControlGroups,
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Current hazard and control readiness could not be verified for this work step. Regenerate or refresh the planning draft before confirming Controlled Risk.",
        },
        {
          status: 409,
        },
      );
    }

    const hazardGroups =
      generatedStep.hazardControlGroups.filter(
        (group) =>
          isRecord(group) &&
          isRecord(group.hazard) &&
          group.hazard.text !==
            "User-entered controls requiring hazard assignment",
      );

    if (hazardGroups.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one current significant hazard with associated controls must be reviewed before confirming or overriding Controlled Risk.",
        },
        {
          status: 409,
        },
      );
    }

    const currentControls =
      hazardGroups.flatMap(
        (group) => {
          if (
            !isRecord(group) ||
            !isRecord(group.hazard) ||
            typeof group.hazard.id !==
              "string" ||
            typeof group.hazard.text !==
              "string" ||
            !Array.isArray(
              group.controls,
            ) ||
            group.controls.length === 0
          ) {
            return [];
          }

          const hazard =
            group.hazard;

          return group.controls.flatMap(
            (control) =>
              isRecord(control) &&
              typeof control.id ===
                "string" &&
              typeof control.text ===
                "string"
                ? [
                    {
                      hazardId:
                        hazard.id,
                      hazardText:
                        hazard.text,
                      controlId:
                        control.id,
                      controlText:
                        control.text,
                    },
                  ]
                : [],
          );
        },
      );

    const everyHazardHasControls =
      hazardGroups.every(
        (group) =>
          isRecord(group) &&
          Array.isArray(
            group.controls,
          ) &&
          group.controls.length > 0,
      );

    if (
      !everyHazardHasControls ||
      currentControls.length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "Every current significant hazard must have at least one associated control before confirming or overriding Controlled Risk.",
        },
        {
          status: 409,
        },
      );
    }

    const [
      controlDecisions,
      controlEvaluations,
    ] =
      await Promise.all([
        prisma.planningHazardControlDecision.findMany({
          where: {
            planningRecordId,

            tenantId:
              existingRecord.tenantId,

            revisionNumber:
              existingRecord.revisionNumber,

            workStepId:
              workStep.id,
          },

          select: {
            recommendationId: true,
            decision: true,
          },
        }),

        prisma.planningControlEvaluation.findMany({
          where: {
            planningRecordId,

            tenantId:
              existingRecord.tenantId,

            revisionNumber:
              existingRecord.revisionNumber,

            workStepId:
              workStep.id,
          },

          select: {
            hazardId: true,
            controlId: true,
            hazardText: true,
            controlText: true,

            verificationExpectation:
              true,

            verificationRequiredForCurrentContext:
              true,

            verificationCompleted:
              true,
          },
        }),
      ]);

    const acceptedControlIds =
      new Set(
        controlDecisions
          .filter(
            (controlDecision) =>
              controlDecision.decision ===
              "Accept",
          )
          .map(
            (controlDecision) =>
              controlDecision.recommendationId,
          ),
      );

    const evaluationByIdentity =
      new Map(
        controlEvaluations.map(
          (evaluation) => [
            [
              evaluation.hazardId,
              evaluation.controlId,
            ].join(":"),
            evaluation,
          ],
        ),
      );

    const unresolvedControlCount =
      currentControls.filter(
        (control) => {
          if (
            !acceptedControlIds.has(
              control.controlId,
            )
          ) {
            return true;
          }

          const evaluation =
            evaluationByIdentity.get(
              [
                control.hazardId,
                control.controlId,
              ].join(":"),
            );

          if (
            !evaluation ||
            evaluation.hazardText !==
              control.hazardText ||
            evaluation.controlText !==
              control.controlText
          ) {
            return true;
          }

          if (
            evaluation.verificationExpectation ===
            "Required"
          ) {
            return (
              evaluation.verificationCompleted !==
              true
            );
          }

          if (
            evaluation.verificationExpectation ===
            "Conditional"
          ) {
            return !(
              evaluation.verificationRequiredForCurrentContext ===
                false ||
              (
                evaluation.verificationRequiredForCurrentContext ===
                  true &&
                evaluation.verificationCompleted ===
                  true
              )
            );
          }

          return false;
        },
      ).length;

    if (unresolvedControlCount > 0) {
      return NextResponse.json(
        {
          message:
            `Complete control acceptance and required verification for ${unresolvedControlCount} ${
              unresolvedControlCount === 1
                ? "control"
                : "controls"
            } before confirming or overriding Controlled Risk.`,
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Critical Control designation is a qualified-user decision
     * separate from accepting the control or confirming Controlled
     * Risk. Rebuild each exact current-revision fingerprint on the
     * server so stale or client-authored decisions cannot satisfy
     * this gate.
     */
    const criticalControlCandidates =
      await prisma.planningControlEvaluation.findMany({
        where: {
          planningRecordId,

          tenantId:
            existingRecord.tenantId,

          revisionNumber:
            existingRecord.revisionNumber,

          workStepSequence:
            workStep.sequence,

          criticalControlRecommended:
            true,
        },

        select: {
          workStepId: true,
          hazardId: true,
          controlId: true,

          canonicalHazardConceptId:
            true,

          hazardText: true,
          controlText: true,

          criticalControlClassification:
            true,

          criticalControlTrigger:
            true,

          evaluatorVersion: true,
        },
      });

    const criticalControlDecisions =
      await prisma.planningCriticalControlDecision.findMany({
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
          relationshipFingerprint:
            true,
        },
      });

    const decidedFingerprints =
      new Set(
        criticalControlDecisions.map(
          (criticalDecision) =>
            criticalDecision
              .relationshipFingerprint,
        ),
      );

    const pendingCriticalControlCount =
      criticalControlCandidates.filter(
        (candidate) =>
          !decidedFingerprints.has(
            buildCriticalControlRelationshipFingerprint({
              planningRecordId,

              revisionNumber:
                existingRecord
                  .revisionNumber,

              workStepId:
                candidate.workStepId,

              hazardId:
                candidate.hazardId,

              controlId:
                candidate.controlId,

              canonicalHazardConceptId:
                candidate
                  .canonicalHazardConceptId,

              hazardText:
                candidate.hazardText,

              controlText:
                candidate.controlText,

              criticalControlClassification:
                candidate.criticalControlClassification,

              criticalControlTrigger:
                candidate.criticalControlTrigger,

              evaluatorVersion:
                candidate.evaluatorVersion,
            }),
          ),
      ).length;

    if (
      pendingCriticalControlCount >
      0
    ) {
      return NextResponse.json(
        {
          message:
            `Complete ${pendingCriticalControlCount} Critical Control candidate ${
              pendingCriticalControlCount ===
              1
                ? "decision"
                : "decisions"
            } before confirming or overriding Controlled Risk.`,
        },
        {
          status: 409,
        },
      );
    }

    let finalRiskLevel:
      RiskLevel;

    if (
      decision === "Confirm"
    ) {
      finalRiskLevel =
        recommendedRiskLevel;
    } else {
      if (
        !isRiskLevel(
          requestedRiskLevel,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Select Low, Medium, or High for the overridden Controlled Risk.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        requestedRiskLevel ===
        recommendedRiskLevel
      ) {
        return NextResponse.json(
          {
            message:
              "The selected risk matches Qoreva’s recommendation. Use Confirm Recommendation instead.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        !hasMeaningfulOverrideReason(
          overrideReason,
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Explain why the Controlled Risk differs from Qoreva’s recommendation using at least three meaningful words.",
          },
          {
            status: 400,
          },
        );
      }

      finalRiskLevel =
        requestedRiskLevel;
    }

    const actorRole =
      authorization
        .membership
        .roleCodes
        .join(", ") ||
      "Planning Editor";

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.planningWorkStep.update({
              where: {
                id:
                  workStep.id,
              },

              data: {
                /*
                 * controlledRiskLevel is the
                 * qualified-user official value.
                 *
                 * riskLevel mirrors it temporarily
                 * for legacy Planning/WSE consumers.
                 */
                controlledRiskLevel:
                  finalRiskLevel,

                riskLevel:
                  finalRiskLevel,
              },

              select: {
                id: true,
                sequence: true,
                title: true,

                inherentRiskLevel: true,

                recommendedControlledRiskLevel:
                  true,

                controlledRiskLevel:
                  true,

                riskLevel: true,
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,

              planningRecordId,

              eventType:
                decision === "Confirm"
                  ? "Controlled Risk Confirmed"
                  : "Controlled Risk Overridden",

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
                decision === "Confirm"
                  ? `Qoreva’s Controlled Risk recommendation was confirmed for work step ${workStep.sequence}.`
                  : `Qoreva’s Controlled Risk recommendation was overridden for work step ${workStep.sequence}.`,

              metadata: {
                workStepId:
                  workStep.id,

                workStepSequence:
                  workStep.sequence,

                workStepTitle:
                  workStep.title,

                decision,

                inherentRiskLevel:
                  workStep
                    .inherentRiskLevel,

                recommendedControlledRiskLevel:
                  recommendedRiskLevel,

                previousControlledRiskLevel:
                  workStep
                    .controlledRiskLevel,

                finalControlledRiskLevel:
                  finalRiskLevel,

                overrideReason:
                  decision === "Override"
                    ? overrideReason
                    : null,

                evaluatorVersion:
                  CONTROLLED_RISK_EVALUATOR_VERSION,
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

      decision: {
        type: decision,

        overrideReason:
          decision === "Override"
            ? overrideReason
            : null,
      },

      workStep: result,
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
      "Unable to save Controlled Risk decision:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save the Controlled Risk decision.",
      },
      {
        status: 500,
      },
    );
  }
}
