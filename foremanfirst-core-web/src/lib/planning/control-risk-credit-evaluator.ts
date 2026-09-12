import type {
  PlanningControlEvaluationCandidate,
} from "./control-effectiveness-evaluator";

/**
 * Qoreva Planning — Control Risk-Credit Evidence
 *
 * Determines whether Qoreva currently has sufficient structured
 * evidence to rely on a specific control when later calculating
 * a Controlled Risk recommendation.
 *
 * This service intentionally does NOT:
 *
 * - calculate Controlled Risk
 * - assign numeric risk-reduction points
 * - treat Hierarchy of Controls as automatic effectiveness
 * - assume expected effectiveness proves implementation
 * - infer verification from control wording
 * - make Critical Control recommendations official
 *
 * AI assists. Qualified people make final decisions.
 */

export const CONTROL_RISK_CREDIT_EVALUATOR_VERSION =
  "qoreva-control-risk-credit-evaluator-v2";

export type ControlRiskCreditStatus =
  | "Eligible"
  | "NeedsVerification"
  | "InsufficientIntelligence";

export type ControlRiskCreditAssessment = {
  hazardId: string;
  controlId: string;

  status: ControlRiskCreditStatus;

  riskCreditEligible: boolean;

  verificationRequired: boolean;

  verificationMethod: string | null;

  reasons: string[];

  evaluatorVersion: string;
};

export type ControlRiskCreditEvidence = {
  /**
   * Legacy compatibility field. A supplied or expected method alone
   * is never proof that verification occurred.
   */
  verificationMethod?: string | null;

  /**
   * Used only when the canonical verification expectation is
   * Conditional.
   *
   * true  = verification is required for this work-step context
   * false = verification is not required for this context
   * unset = Qoreva does not yet have enough contextual evidence
   *         to make that determination
   */
  verificationRequiredForCurrentContext?: boolean | null;

  // Qualified-user evidence describing what was actually performed.
  verificationEvidenceMethod?: string | null;
  verificationEvidence?: string | null;
  verificationCompleted?: boolean;
};

/**
 * MVP rule:
 *
 * A control may contribute to future Controlled Risk reasoning only
 * when Qoreva has explicit effectiveness intelligence AND any
 * required planning-specific verification evidence is present.
 *
 * "Eligible" does NOT mean that risk must be lowered.
 * It only means the control is sufficiently understood to be
 * considered by the future Controlled Risk evaluator.
 */
export function evaluateControlRiskCredit({
  candidate,
  evidence,
}: {
  candidate: PlanningControlEvaluationCandidate;
  evidence?: ControlRiskCreditEvidence;
}): ControlRiskCreditAssessment {
  const reasons: string[] = [];

  /*
   * The canonical method describes how verification should occur.
   * It must never be treated as evidence that verification occurred.
   */
  const verificationMethod =
    candidate.verificationMethod?.trim() ||
    null;

  const verificationEvidenceMethod =
    evidence?.verificationEvidenceMethod?.trim() ||
    null;

  const verificationEvidence =
    evidence?.verificationEvidence?.trim() ||
    null;

  const hasCompletedVerificationEvidence =
    evidence?.verificationCompleted === true &&
    Boolean(verificationEvidenceMethod) &&
    Boolean(verificationEvidence);

  if (
    candidate.effectiveness === "Unresolved" ||
    candidate.protectiveFunction === "Unresolved" ||
    candidate.verificationExpectation === "Unresolved"
  ) {
    reasons.push(
      "Qoreva does not have sufficient structured effectiveness intelligence for this control relationship.",
    );

    return {
      hazardId: candidate.hazardId,
      controlId: candidate.controlId,
      status: "InsufficientIntelligence",
      riskCreditEligible: false,
      verificationRequired:
        candidate.verificationRequired,
      verificationMethod,
      reasons,
      evaluatorVersion:
        CONTROL_RISK_CREDIT_EVALUATOR_VERSION,
    };
  }

  if (
    candidate.verificationExpectation === "Required" &&
    !hasCompletedVerificationEvidence
  ) {
    reasons.push(
      "This control requires planning-specific verification evidence before Qoreva can rely on it for Controlled Risk reasoning.",
    );

    return {
      hazardId: candidate.hazardId,
      controlId: candidate.controlId,
      status: "NeedsVerification",
      riskCreditEligible: false,
      verificationRequired: true,
      verificationMethod,
      reasons,
      evaluatorVersion:
        CONTROL_RISK_CREDIT_EVALUATOR_VERSION,
    };
  }

  if (
    candidate.verificationExpectation === "Conditional"
  ) {
    const verificationRequiredForCurrentContext =
      evidence?.verificationRequiredForCurrentContext;

    if (
      verificationRequiredForCurrentContext ===
      undefined ||
      verificationRequiredForCurrentContext ===
      null
    ) {
      reasons.push(
        "Verification is conditional for this control, but Qoreva does not yet have enough planning-specific evidence to determine whether verification is required for the current work-step context.",
      );

      return {
        hazardId: candidate.hazardId,
        controlId: candidate.controlId,
        status: "NeedsVerification",
        riskCreditEligible: false,
        verificationRequired: false,
        verificationMethod,
        reasons,
        evaluatorVersion:
          CONTROL_RISK_CREDIT_EVALUATOR_VERSION,
      };
    }

    if (
      verificationRequiredForCurrentContext &&
      !hasCompletedVerificationEvidence
    ) {
      reasons.push(
        "Verification is required for this work-step context, but the required planning-specific verification evidence has not yet been provided.",
      );

      return {
        hazardId: candidate.hazardId,
        controlId: candidate.controlId,
        status: "NeedsVerification",
        riskCreditEligible: false,
        verificationRequired: true,
        verificationMethod,
        reasons,
        evaluatorVersion:
          CONTROL_RISK_CREDIT_EVALUATOR_VERSION,
      };
    }

    reasons.push(
      verificationRequiredForCurrentContext
        ? "Completed planning-specific verification evidence is present for this work-step context."
        : "Qoreva has structured evidence that separate verification is not required for this work-step context.",
    );
  } else if (
    candidate.verificationExpectation ===
    "NotNormallyRequired"
  ) {
    reasons.push(
      "Qoreva has structured effectiveness intelligence and this control does not normally require separate planning-specific verification.",
    );
  } else {
    reasons.push(
      "Completed planning-specific verification evidence is present.",
    );
  }

  return {
    hazardId: candidate.hazardId,
    controlId: candidate.controlId,
    status: "Eligible",
    riskCreditEligible: true,
    verificationRequired:
      candidate.verificationExpectation === "Required" ||
      (
        candidate.verificationExpectation === "Conditional" &&
        evidence?.verificationRequiredForCurrentContext === true
      ),
    verificationMethod,
    reasons,
    evaluatorVersion:
      CONTROL_RISK_CREDIT_EVALUATOR_VERSION,
  };
}
