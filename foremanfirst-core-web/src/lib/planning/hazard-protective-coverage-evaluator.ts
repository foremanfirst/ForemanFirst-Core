import type {
  CanonicalHazardConceptId,
} from "./hazard-control-library";

import type {
  ControlProtectiveFunction,
} from "./control-effectiveness";

import type {
  PlanningControlEvaluationCandidate,
} from "./control-effectiveness-evaluator";

import type {
  ControlRiskCreditAssessment,
} from "./control-risk-credit-evaluator";

import {
  getHazardProtectiveCoverage,
  type HazardProtectiveFunctionRole,
} from "./hazard-protective-coverage";

/**
 * Qoreva Planning — Hazard Protective Coverage Evaluation
 *
 * Determines whether the actual working controls for a canonical
 * hazard sufficiently represent the protective functions Qoreva
 * expects before that hazard can participate in Controlled Risk
 * recommendation logic.
 *
 * This service intentionally does NOT:
 *
 * - calculate Controlled Risk
 * - assign numeric risk-reduction points
 * - lower risk because a control merely exists
 * - treat Hierarchy of Controls as proof of effectiveness
 * - allow supporting controls to substitute for required functions
 * - infer canonical hazard identity from wording
 * - make qualified-person decisions
 *
 * "Covered" means the required protective-function structure is
 * represented by controls that are eligible for planning-time risk
 * consideration. It does NOT prove field implementation.
 *
 * AI assists. Qualified people make final decisions.
 */

export const HAZARD_PROTECTIVE_COVERAGE_EVALUATOR_VERSION =
  "qoreva-hazard-protective-coverage-evaluator-v1";

export type HazardProtectiveCoverageStatus =
  | "Covered"
  | "Incomplete"
  | "Unresolved";

export type HazardProtectiveFunctionCoverage = {
  protectiveFunction:
    ControlProtectiveFunction;

  role:
    HazardProtectiveFunctionRole;

  requiredForCoverage:
    boolean;

  satisfied:
    boolean;

  eligibleControlIds:
    string[];

  candidateControlIds:
    string[];

  reasons:
    string[];
};

export type HazardProtectiveCoverageAssessment = {
  hazardId: string;

  hazardText: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId | null;

  status:
    HazardProtectiveCoverageStatus;

  functionCoverage:
    HazardProtectiveFunctionCoverage[];

  missingRequiredFunctions:
    ControlProtectiveFunction[];

  unresolvedControlIds:
    string[];

  reasons:
    string[];

  evaluatorVersion: string;
};

function uniqueStrings(
  values: string[],
): string[] {
  return Array.from(
    new Set(values),
  );
}

/**
 * Evaluate one working hazard against Qoreva's explicit protective
 * coverage intelligence.
 *
 * Candidates and risk-credit assessments are joined by control ID.
 * Only risk-credit-eligible controls may satisfy a required
 * protective function.
 */
export function evaluateHazardProtectiveCoverage({
  hazardId,
  hazardText,
  canonicalHazardConceptId,
  candidates,
  riskCreditAssessments,
}: {
  hazardId: string;

  hazardText: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId | null;

  candidates:
    PlanningControlEvaluationCandidate[];

  riskCreditAssessments:
    ControlRiskCreditAssessment[];
}): HazardProtectiveCoverageAssessment {
  const reasons: string[] = [];

  const hazardCandidates =
    candidates.filter(
      (candidate) =>
        candidate.hazardId ===
        hazardId,
    );

  const assessmentByControlId =
    new Map(
      riskCreditAssessments
        .filter(
          (assessment) =>
            assessment.hazardId ===
            hazardId,
        )
        .map(
          (assessment) => [
            assessment.controlId,
            assessment,
          ],
        ),
    );

  const unresolvedControlIds =
    uniqueStrings(
      hazardCandidates
        .filter(
          (candidate) =>
            candidate.protectiveFunction ===
              "Unresolved" ||
            candidate.effectiveness ===
              "Unresolved" ||
            candidate.verificationExpectation ===
              "Unresolved",
        )
        .map(
          (candidate) =>
            candidate.controlId,
        ),
    );

  if (!canonicalHazardConceptId) {
    reasons.push(
      "The working hazard does not have a confirmed canonical Qoreva identity, so protective-function coverage cannot be evaluated automatically.",
    );

    return {
      hazardId,
      hazardText,
      canonicalHazardConceptId: null,
      status: "Unresolved",
      functionCoverage: [],
      missingRequiredFunctions: [],
      unresolvedControlIds,
      reasons,
      evaluatorVersion:
        HAZARD_PROTECTIVE_COVERAGE_EVALUATOR_VERSION,
    };
  }

  const coverageDefinition =
    getHazardProtectiveCoverage(
      canonicalHazardConceptId,
    );

  if (!coverageDefinition) {
    reasons.push(
      "Qoreva does not yet have explicit protective-coverage intelligence for this canonical hazard. Qualified review is required before automated Controlled Risk reasoning can rely on this hazard.",
    );

    return {
      hazardId,
      hazardText,
      canonicalHazardConceptId,
      status: "Unresolved",
      functionCoverage: [],
      missingRequiredFunctions: [],
      unresolvedControlIds,
      reasons,
      evaluatorVersion:
        HAZARD_PROTECTIVE_COVERAGE_EVALUATOR_VERSION,
    };
  }

  const functionCoverage =
    coverageDefinition.protectiveFunctions.map(
      (
        requirement,
      ): HazardProtectiveFunctionCoverage => {
        const matchingCandidates =
          hazardCandidates.filter(
            (candidate) =>
              candidate.protectiveFunction ===
              requirement.protectiveFunction,
          );

        const eligibleCandidates =
          matchingCandidates.filter(
            (candidate) =>
              assessmentByControlId.get(
                candidate.controlId,
              )?.riskCreditEligible ===
              true,
          );

        const satisfied =
          eligibleCandidates.length >
          0;

        const functionReasons:
          string[] = [];

        if (satisfied) {
          functionReasons.push(
            `The ${requirement.protectiveFunction} function is represented by at least one control currently eligible for planning-time risk consideration.`,
          );
        } else if (
          matchingCandidates.length >
          0
        ) {
          functionReasons.push(
            `The ${requirement.protectiveFunction} function is represented in the working plan, but none of its matching controls currently have sufficient evidence to be eligible for planning-time risk consideration.`,
          );
        } else {
          functionReasons.push(
            `The working plan does not currently contain a recognized control that provides the ${requirement.protectiveFunction} function.`,
          );
        }

        functionReasons.push(
          requirement.basis,
        );

        return {
          protectiveFunction:
            requirement.protectiveFunction,

          role:
            requirement.role,

          requiredForCoverage:
            requirement.requiredForCoverage,

          satisfied,

          eligibleControlIds:
            eligibleCandidates.map(
              (candidate) =>
                candidate.controlId,
            ),

          candidateControlIds:
            matchingCandidates.map(
              (candidate) =>
                candidate.controlId,
            ),

          reasons:
            functionReasons,
        };
      },
    );

  const missingRequiredFunctions =
    functionCoverage
      .filter(
        (item) =>
          item.requiredForCoverage &&
          !item.satisfied,
      )
      .map(
        (item) =>
          item.protectiveFunction,
      );

  if (
    missingRequiredFunctions.length >
    0
  ) {
    reasons.push(
      `The planned control system is incomplete for automated Controlled Risk reasoning because ${missingRequiredFunctions.join(
        ", ",
      )} ${
        missingRequiredFunctions.length ===
        1
          ? "is"
          : "are"
      } not yet sufficiently supported.`,
    );

    return {
      hazardId,
      hazardText,
      canonicalHazardConceptId,
      status: "Incomplete",
      functionCoverage,
      missingRequiredFunctions,
      unresolvedControlIds,
      reasons,
      evaluatorVersion:
        HAZARD_PROTECTIVE_COVERAGE_EVALUATOR_VERSION,
    };
  }

  reasons.push(
    "All protective functions currently required by Qoreva's explicit coverage intelligence are represented by controls eligible for planning-time risk consideration.",
  );

  if (
    unresolvedControlIds.length >
    0
  ) {
    reasons.push(
      "Additional working controls remain unresolved. They receive no automatic risk credit and do not contribute to this coverage determination.",
    );
  }

  return {
    hazardId,
    hazardText,
    canonicalHazardConceptId,
    status: "Covered",
    functionCoverage,
    missingRequiredFunctions: [],
    unresolvedControlIds,
    reasons,
    evaluatorVersion:
      HAZARD_PROTECTIVE_COVERAGE_EVALUATOR_VERSION,
  };
}
