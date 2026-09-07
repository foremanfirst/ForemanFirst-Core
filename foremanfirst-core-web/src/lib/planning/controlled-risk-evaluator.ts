import type {
  GeneratedHazardControlGroup,
  PlanningControlHierarchy,
} from "./planning-types";

import type {
  CanonicalHazardConceptId,
} from "./hazard-control-library";

import {
  evaluateWorkingControlCandidates,
  type PlanningControlEvaluationCandidate,
} from "./control-effectiveness-evaluator";

import {
  evaluateControlRiskCredit,
  type ControlRiskCreditAssessment,
  type ControlRiskCreditEvidence,
} from "./control-risk-credit-evaluator";

import {
  evaluateHazardProtectiveCoverage,
  type HazardProtectiveCoverageAssessment,
} from "./hazard-protective-coverage-evaluator";

import {
  getHazardRiskTreatmentPolicy,
} from "./hazard-risk-treatment";

/**
 * Qoreva Planning — Controlled Risk Evaluator
 *
 * Purpose:
 *
 * Produce a deterministic Qoreva Controlled Risk recommendation
 * only when the working PTP contains enough structured evidence
 * to support one.
 *
 * The reasoning chain is:
 *
 * Working hazard/control relationships
 *   -> canonical control-effectiveness intelligence
 *   -> planning-specific verification / risk-credit evidence
 *   -> hazard protective-function coverage
 *   -> hazard-specific risk-treatment policy
 *   -> Qoreva Controlled Risk recommendation
 *
 * This service intentionally does NOT:
 *
 * - infer Inherent Risk
 * - lower risk merely because controls exist
 * - count controls as risk reduction
 * - treat Hierarchy of Controls as a numeric score
 * - use riskAttention as a risk calculation
 * - infer canonical hazard identity from wording
 * - treat planning-time evidence as proof of field implementation
 * - make the qualified person's final risk decision
 *
 * AI assists. Qualified people make final decisions.
 */

export const CONTROLLED_RISK_EVALUATOR_VERSION =
  "qoreva-controlled-risk-evaluator-v2";

export type PlanningRiskLevel =
  | "Low"
  | "Medium"
  | "High";

export type ControlledRiskEvaluationStatus =
  | "InsufficientEvidence"
  | "ReadyForEvaluation";

export type ControlEvidenceSummary = {
  totalControls: number;

  classifiedControls: number;

  unclassifiedControls: number;

  requiredControls: number;

  hierarchyCounts: Record<
    PlanningControlHierarchy,
    number
  >;

  evaluatedControls: number;

  riskCreditEligibleControls: number;

  controlsNeedingVerification: number;

  controlsWithInsufficientIntelligence: number;
};

export type HazardControlEvidence = {
  hazardId: string;

  hazardText: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId | null;

  controlCount: number;

  classifiedControlCount: number;

  unclassifiedControlCount: number;

  requiredControlCount: number;

  hasControls: boolean;

  hasClassifiedControls: boolean;

  protectiveCoverageStatus:
    | "Covered"
    | "Incomplete"
    | "Unresolved";

  missingRequiredFunctions: string[];
};

export type ControlledRiskEvaluationResult = {
  inherentRiskLevel:
    PlanningRiskLevel;

  status:
    ControlledRiskEvaluationStatus;

  /**
   * Qoreva recommendation only.
   *
   * Qualified-person confirmation remains required before this
   * becomes the official Controlled Risk value.
   */
  recommendedControlledRiskLevel:
    PlanningRiskLevel | null;

  evidence:
    ControlEvidenceSummary;

  hazardEvidence:
    HazardControlEvidence[];

  controlEvaluations:
    PlanningControlEvaluationCandidate[];

  riskCreditAssessments:
    ControlRiskCreditAssessment[];

  protectiveCoverageAssessments:
    HazardProtectiveCoverageAssessment[];

  reasons: string[];

  evaluatorVersion: string;
};

export type ControlledRiskVerificationEvidenceByControlId =
  Record<
    string,
    ControlRiskCreditEvidence | undefined
  >;

function emptyHierarchyCounts(): Record<
  PlanningControlHierarchy,
  number
> {
  return {
    Elimination: 0,
    Substitution: 0,
    Engineering: 0,
    Administrative: 0,
    PPE: 0,
  };
}

function asCanonicalHazardConceptId(
  value: string | null | undefined,
): CanonicalHazardConceptId | null {
  if (!value) {
    return null;
  }

  return value as CanonicalHazardConceptId;
}

export function evaluateControlledRisk({
  inherentRiskLevel,
  hazardControlGroups,
  verificationEvidenceByControlId = {},
}: {
  inherentRiskLevel:
    PlanningRiskLevel;

  hazardControlGroups:
    GeneratedHazardControlGroup[];

  verificationEvidenceByControlId?:
    ControlledRiskVerificationEvidenceByControlId;
}): ControlledRiskEvaluationResult {
  const hierarchyCounts =
    emptyHierarchyCounts();

  let totalControls = 0;
  let classifiedControls = 0;
  let requiredControls = 0;

  for (const group of hazardControlGroups) {
    for (const control of group.controls) {
      totalControls += 1;

      if (control.required) {
        requiredControls += 1;
      }

      if (control.controlHierarchy) {
        classifiedControls += 1;

        hierarchyCounts[
          control.controlHierarchy
        ] += 1;
      }
    }
  }

  const unclassifiedControls =
    totalControls -
    classifiedControls;

  const controlEvaluations =
    evaluateWorkingControlCandidates(
      hazardControlGroups,
    );

  const riskCreditAssessments =
    controlEvaluations.map(
      (candidate) =>
        evaluateControlRiskCredit({
          candidate,
          evidence:
            verificationEvidenceByControlId[
              candidate.controlId
            ],
        }),
    );

  const protectiveCoverageAssessments =
    hazardControlGroups.map(
      (group) =>
        evaluateHazardProtectiveCoverage({
          hazardId:
            group.hazard.id,

          hazardText:
            group.hazard.text,

          canonicalHazardConceptId:
            asCanonicalHazardConceptId(
              group.canonicalHazardConceptId,
            ),

          candidates:
            controlEvaluations,

          riskCreditAssessments,
        }),
    );

  const hazardEvidence:
    HazardControlEvidence[] =
    hazardControlGroups.map(
      (group) => {
        const controlCount =
          group.controls.length;

        const classifiedControlCount =
          group.controls.filter(
            (control) =>
              Boolean(
                control.controlHierarchy,
              ),
          ).length;

        const requiredControlCount =
          group.controls.filter(
            (control) =>
              control.required,
          ).length;

        const coverage =
          protectiveCoverageAssessments.find(
            (assessment) =>
              assessment.hazardId ===
              group.hazard.id,
          );

        return {
          hazardId:
            group.hazard.id,

          hazardText:
            group.hazard.text,

          canonicalHazardConceptId:
            asCanonicalHazardConceptId(
              group.canonicalHazardConceptId,
            ),

          controlCount,

          classifiedControlCount,

          unclassifiedControlCount:
            controlCount -
            classifiedControlCount,

          requiredControlCount,

          hasControls:
            controlCount > 0,

          hasClassifiedControls:
            classifiedControlCount >
            0,

          protectiveCoverageStatus:
            coverage?.status ??
            "Unresolved",

          missingRequiredFunctions:
            coverage?.missingRequiredFunctions ??
            [],
        };
      },
    );

  const reasons: string[] = [];

  if (
    hazardControlGroups.length ===
    0
  ) {
    reasons.push(
      "No structured hazard-control relationships are available for evaluation.",
    );
  }

  const hazardsWithoutControls =
    hazardEvidence.filter(
      (hazard) =>
        !hazard.hasControls,
    );

  if (
    hazardsWithoutControls.length >
    0
  ) {
    reasons.push(
      `${hazardsWithoutControls.length} hazard${
        hazardsWithoutControls.length ===
        1
          ? ""
          : "s"
      } currently ${
        hazardsWithoutControls.length ===
        1
          ? "has"
          : "have"
      } no selected controls.`,
    );
  }

  if (
    unclassifiedControls > 0
  ) {
    reasons.push(
      `${unclassifiedControls} selected control${
        unclassifiedControls === 1
          ? ""
          : "s"
      } ${
        unclassifiedControls === 1
          ? "does"
          : "do"
      } not yet have an authoritative Hierarchy of Controls classification.`,
    );
  }

  const controlsNeedingVerification =
    riskCreditAssessments.filter(
      (assessment) =>
        assessment.status ===
        "NeedsVerification",
    ).length;

  const controlsWithInsufficientIntelligence =
    riskCreditAssessments.filter(
      (assessment) =>
        assessment.status ===
        "InsufficientIntelligence",
    ).length;

  const riskCreditEligibleControls =
    riskCreditAssessments.filter(
      (assessment) =>
        assessment.riskCreditEligible,
    ).length;

  const incompleteCoverage =
    protectiveCoverageAssessments.filter(
      (assessment) =>
        assessment.status ===
        "Incomplete",
    );

  const unresolvedCoverage =
    protectiveCoverageAssessments.filter(
      (assessment) =>
        assessment.status ===
        "Unresolved",
    );

  if (
    controlsNeedingVerification >
    0
  ) {
    reasons.push(
      `${controlsNeedingVerification} control${
        controlsNeedingVerification ===
        1
          ? ""
          : "s"
      } ${
        controlsNeedingVerification ===
        1
          ? "requires"
          : "require"
      } additional planning-specific verification evidence before Qoreva can rely on ${
        controlsNeedingVerification ===
        1
          ? "it"
          : "them"
      } for Controlled Risk reasoning.`,
    );
  }

  if (
    controlsWithInsufficientIntelligence >
    0
  ) {
    reasons.push(
      `${controlsWithInsufficientIntelligence} control${
        controlsWithInsufficientIntelligence ===
        1
          ? ""
          : "s"
      } ${
        controlsWithInsufficientIntelligence ===
        1
          ? "does"
          : "do"
      } not yet have sufficient Qoreva effectiveness intelligence for automated risk consideration.`,
    );
  }

  if (
    incompleteCoverage.length >
    0
  ) {
    reasons.push(
      `${incompleteCoverage.length} hazard${
        incompleteCoverage.length ===
        1
          ? ""
          : "s"
      } ${
        incompleteCoverage.length ===
        1
          ? "has"
          : "have"
      } incomplete required protective-function coverage.`,
    );
  }

  if (
    unresolvedCoverage.length >
    0
  ) {
    reasons.push(
      `${unresolvedCoverage.length} hazard${
        unresolvedCoverage.length ===
        1
          ? ""
          : "s"
      } ${
        unresolvedCoverage.length ===
        1
          ? "does"
          : "do"
      } not yet have explicit Qoreva protective-coverage intelligence.`,
    );
  }

  const allHazardsCovered =
    hazardControlGroups.length >
      0 &&
    protectiveCoverageAssessments.every(
      (assessment) =>
        assessment.status ===
        "Covered",
    );

  const treatmentPolicies =
    protectiveCoverageAssessments.map(
      (assessment) => {
        if (
          !assessment.canonicalHazardConceptId
        ) {
          return null;
        }

        return getHazardRiskTreatmentPolicy(
          assessment.canonicalHazardConceptId,
        );
      },
    );

  const allPoliciesAvailable =
    treatmentPolicies.every(
      (policy) =>
        policy !== null,
    );

  const allPoliciesSupportInherentRisk =
    treatmentPolicies.every(
      (policy) =>
        policy !== null &&
        policy.supportedInherentRiskLevels.includes(
          inherentRiskLevel,
        ),
    );

  if (
    allHazardsCovered &&
    !allPoliciesAvailable
  ) {
    reasons.push(
      "At least one covered hazard does not yet have an explicit Qoreva risk-treatment policy.",
    );
  }

  if (
    allHazardsCovered &&
    allPoliciesAvailable &&
    !allPoliciesSupportInherentRisk
  ) {
    reasons.push(
      "At least one hazard risk-treatment policy does not support the selected Inherent Risk level.",
    );
  }

  const readyForEvaluation =
    allHazardsCovered &&
    allPoliciesAvailable &&
    allPoliciesSupportInherentRisk;

  /**
   * Current pilot policy:
   *
   * Protective coverage can establish that Qoreva has enough
   * structured evidence to make a recommendation.
   *
   * However, every currently validated pilot treatment policy
   * authorizes zero automatic categorical reduction. Therefore
   * the defensible recommendation is to maintain the planner's
   * Inherent Risk level.
   *
   * Future hazard-specific policies may authorize bounded
   * reductions after validation. They must not be implemented
   * as control-count or hierarchy-point arithmetic.
   */
  const recommendedControlledRiskLevel =
    readyForEvaluation
      ? inherentRiskLevel
      : null;

  if (readyForEvaluation) {
    reasons.push(
      "All evaluated hazards have complete required protective-function coverage and supported Qoreva risk-treatment policies.",
    );

    reasons.push(
      "The current validated pilot policies do not authorize automatic categorical risk reduction, so Qoreva recommends maintaining the selected Inherent Risk level as Controlled Risk.",
    );
  }

  return {
    inherentRiskLevel,

    status:
      readyForEvaluation
        ? "ReadyForEvaluation"
        : "InsufficientEvidence",

    recommendedControlledRiskLevel,

    evidence: {
      totalControls,

      classifiedControls,

      unclassifiedControls,

      requiredControls,

      hierarchyCounts,

      evaluatedControls:
        controlEvaluations.length,

      riskCreditEligibleControls,

      controlsNeedingVerification,

      controlsWithInsufficientIntelligence,
    },

    hazardEvidence,

    controlEvaluations,

    riskCreditAssessments,

    protectiveCoverageAssessments,

    reasons,

    evaluatorVersion:
      CONTROLLED_RISK_EVALUATOR_VERSION,
  };
}
