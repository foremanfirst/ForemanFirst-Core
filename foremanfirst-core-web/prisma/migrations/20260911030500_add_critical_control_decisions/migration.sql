-- CreateTable
CREATE TABLE "PlanningCriticalControlDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "workStepId" TEXT NOT NULL,
    "workStepSequence" INTEGER,
    "workStepTitle" TEXT,
    "hazardId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "canonicalHazardConceptId" TEXT,
    "hazardText" TEXT NOT NULL,
    "controlText" TEXT NOT NULL,
    "relationshipFingerprint" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decisionReason" TEXT,
    "recommendedEvaluatorVersion" TEXT NOT NULL,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedByRole" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningCriticalControlDecision_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"PCCD_record_revision_fingerprint_key"
ON "PlanningCriticalControlDecision"(
    "planningRecordId",
    "revisionNumber",
    "relationshipFingerprint"
);

CREATE INDEX
"PCCD_tenant_idx"
ON "PlanningCriticalControlDecision"("tenantId");

CREATE INDEX
"PCCD_record_idx"
ON "PlanningCriticalControlDecision"("planningRecordId");

CREATE INDEX
"PCCD_record_revision_idx"
ON "PlanningCriticalControlDecision"(
    "planningRecordId",
    "revisionNumber"
);

CREATE INDEX
"PCCD_revision_idx"
ON "PlanningCriticalControlDecision"("revisionNumber");

CREATE INDEX
"PCCD_work_step_idx"
ON "PlanningCriticalControlDecision"("workStepId");

CREATE INDEX
"PCCD_work_step_sequence_idx"
ON "PlanningCriticalControlDecision"("workStepSequence");

CREATE INDEX
"PCCD_hazard_idx"
ON "PlanningCriticalControlDecision"("hazardId");

CREATE INDEX
"PCCD_control_idx"
ON "PlanningCriticalControlDecision"("controlId");

CREATE INDEX
"PCCD_canonical_hazard_idx"
ON "PlanningCriticalControlDecision"(
    "canonicalHazardConceptId"
);

CREATE INDEX
"PCCD_decision_idx"
ON "PlanningCriticalControlDecision"("decision");

CREATE INDEX
"PCCD_decided_at_idx"
ON "PlanningCriticalControlDecision"("decidedAt");

ALTER TABLE "PlanningCriticalControlDecision"
ADD CONSTRAINT
"PCCD_record_fkey"
FOREIGN KEY ("planningRecordId")
REFERENCES "PlanningRecord"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
