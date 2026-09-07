import type {
  CanonicalHazardConceptId,
  ControlHierarchy,
} from "./hazard-control-library";

import type {
  GeneratedHazardControlGroup,
} from "./planning-types";

import {
  getCanonicalControlEffectiveness,
  type ControlEffectiveness,
  type ControlProtectiveFunction,
  type ControlVerificationExpectation,
} from "./control-effectiveness";

/**
 * Qoreva Planning — Working Control Evaluation
 *
 * Converts the actual working hazard/control relationships
 * into deterministic evaluation candidates.
 *
 * This service intentionally does NOT:
 *
 * - calculate Controlled Risk
 * - infer canonical hazard identity from display wording
 * - treat Hierarchy of Controls as automatic effectiveness
 * - give risk credit merely because a control exists
 * - treat expected effectiveness as proof of implementation
 * - make Critical Control recommendations official
 *
 * AI assists. Qualified people make final decisions.
 */

export const CONTROL_EFFECTIVENESS_EVALUATOR_VERSION =
  "qoreva-control-effectiveness-evaluator-v1";

export type PlanningControlEvaluationCandidate = {
  hazardId: string;
  hazardText: string;

  controlId: string;
  controlText: string;

  canonicalHazardConceptId:
    CanonicalHazardConceptId | null;

  controlHierarchy:
    ControlHierarchy | null;

  protectiveFunction:
    ControlProtectiveFunction;

  effectiveness:
    ControlEffectiveness;

  verificationExpectation:
    ControlVerificationExpectation;

  verificationRequired:
    boolean;

  verificationMethod:
    string | null;

  /**
   * False until Qoreva has sufficient structured evidence
   * that the applicable control has been selected,
   * implemented, and verified as required.
   */
  riskCreditEligible:
    boolean;

  /**
   * Advisory Qoreva candidate only.
   * Qualified-user confirmation remains required before any
   * Critical Control becomes official planning data.
   */
  criticalControlRecommended:
    boolean;

  evaluationReason: string;

  evaluatorVersion: string;
};

function asCanonicalHazardConceptId(
  value: string | null | undefined,
): CanonicalHazardConceptId | null {
  if (!value) {
    return null;
  }

  /*
   * The working group receives this value only from Qoreva's
   * canonical library/resolver. Keep the cast isolated here
   * rather than spreading assertions through evaluation code.
   *
   * A future shared canonical-ID domain type can remove this
   * compatibility boundary.
   */
  return value as CanonicalHazardConceptId;
}

export function evaluateWorkingControlCandidates(
  groups: GeneratedHazardControlGroup[],
): PlanningControlEvaluationCandidate[] {
  const candidates:
    PlanningControlEvaluationCandidate[] = [];

  for (const group of groups) {
    const canonicalHazardConceptId =
      asCanonicalHazardConceptId(
        group.canonicalHazardConceptId,
      );

    for (const control of group.controls) {
      const intelligence =
        canonicalHazardConceptId
          ? getCanonicalControlEffectiveness({
              canonicalHazardConceptId,
              controlText: control.text,
            })
          : null;

      if (!intelligence) {
        candidates.push({
          hazardId:
            group.hazard.id,

          hazardText:
            group.hazard.text,

          controlId:
            control.id,

          controlText:
            control.text,

          canonicalHazardConceptId,

          controlHierarchy:
            control.controlHierarchy ??
            null,

          protectiveFunction:
            "Unresolved",

          effectiveness:
            "Unresolved",

          verificationExpectation:
            "Unresolved",

          verificationRequired:
            false,

          verificationMethod:
            null,

          riskCreditEligible:
            false,

          criticalControlRecommended:
            false,

          evaluationReason:
            canonicalHazardConceptId
              ? "Qoreva does not yet have explicit effectiveness intelligence for this exact canonical hazard-to-control relationship. Qualified review is required before the control can contribute to an automated Controlled Risk recommendation."
              : "The working hazard does not have a confirmed canonical Qoreva identity. The control remains valid working-plan content, but Qoreva will not infer effectiveness or risk credit from wording alone.",

          evaluatorVersion:
            CONTROL_EFFECTIVENESS_EVALUATOR_VERSION,
        });

        continue;
      }

      candidates.push({
        hazardId:
          group.hazard.id,

        hazardText:
          group.hazard.text,

        controlId:
          control.id,

        controlText:
          control.text,

        canonicalHazardConceptId,

        controlHierarchy:
          intelligence.controlHierarchy,

        protectiveFunction:
          intelligence.protectiveFunction,

        effectiveness:
          intelligence.expectedEffectiveness,

        verificationExpectation:
          intelligence.verificationExpectation,

        verificationRequired:
          intelligence.verificationExpectation ===
          "Required",

        /*
         * We know verification is expected, but we do not yet
         * have structured evidence describing how this control
         * will be verified for this specific work step.
         */
        verificationMethod:
          null,

        /*
         * Expected effectiveness is not implementation proof.
         * Risk credit remains locked until verification and
         * applicability evidence are represented explicitly.
         */
        riskCreditEligible:
          false,

        criticalControlRecommended:
          intelligence.criticalControlCandidate,

        evaluationReason:
          intelligence.effectivenessBasis,

        evaluatorVersion:
          CONTROL_EFFECTIVENESS_EVALUATOR_VERSION,
      });
    }
  }

  return candidates;
}
