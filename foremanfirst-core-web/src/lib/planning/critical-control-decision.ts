import { createHash } from "node:crypto";

import {
  CRITICAL_CONTROL_POLICY_VERSION,
} from "./critical-control-policy";

/**
 * Stable identity for the exact Critical Control relationship and
 * Qoreva recommendation reviewed by the qualified user.
 *
 * Any identity, wording, canonical meaning, revision, or evaluator
 * change creates a different fingerprint. An old decision therefore
 * cannot silently attach to changed safety content.
 */
export function buildCriticalControlRelationshipFingerprint({
  planningRecordId,
  revisionNumber,
  workStepId,
  hazardId,
  controlId,
  canonicalHazardConceptId,
  hazardText,
  controlText,
  criticalControlClassification,
  criticalControlTrigger,
  evaluatorVersion,
}: {
  planningRecordId: string;
  revisionNumber: number;
  workStepId: string;
  hazardId: string;
  controlId: string;
  canonicalHazardConceptId:
    string | null;
  hazardText: string;
  controlText: string;
  criticalControlClassification: string;
  criticalControlTrigger: string | null;
  evaluatorVersion: string;
}) {
  const identity =
    JSON.stringify([
      planningRecordId,
      revisionNumber,
      workStepId,
      hazardId,
      controlId,
      canonicalHazardConceptId,
      hazardText,
      controlText,
      CRITICAL_CONTROL_POLICY_VERSION,
      criticalControlClassification,
      criticalControlTrigger,
      evaluatorVersion,
    ]);

  return createHash("sha256")
    .update(identity)
    .digest("hex");
}
