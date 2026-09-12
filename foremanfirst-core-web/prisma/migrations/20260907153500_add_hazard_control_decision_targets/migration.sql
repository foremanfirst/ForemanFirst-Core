CREATE TABLE "PlanningHazardControlDecisionTarget" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "decisionId" TEXT NOT NULL,
    "hazardId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningHazardControlDecisionTarget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanningHazardControlDecisionTarget_decisionId_hazardId_key"
ON "PlanningHazardControlDecisionTarget"("decisionId", "hazardId");

CREATE INDEX "PlanningHazardControlDecisionTarget_tenantId_idx"
ON "PlanningHazardControlDecisionTarget"("tenantId");

CREATE INDEX "PlanningHazardControlDecisionTarget_planningRecordId_idx"
ON "PlanningHazardControlDecisionTarget"("planningRecordId");

CREATE INDEX "PlanningHazardControlDecisionTarget_planningRecordId_revisionNumber_idx"
ON "PlanningHazardControlDecisionTarget"("planningRecordId", "revisionNumber");

CREATE INDEX "PlanningHazardControlDecisionTarget_decisionId_idx"
ON "PlanningHazardControlDecisionTarget"("decisionId");

CREATE INDEX "PlanningHazardControlDecisionTarget_hazardId_idx"
ON "PlanningHazardControlDecisionTarget"("hazardId");

CREATE INDEX "PlanningHazardControlDecisionTarget_isPrimary_idx"
ON "PlanningHazardControlDecisionTarget"("isPrimary");

ALTER TABLE "PlanningHazardControlDecisionTarget"
ADD CONSTRAINT "PlanningHazardControlDecisionTarget_decisionId_fkey"
FOREIGN KEY ("decisionId")
REFERENCES "PlanningHazardControlDecision"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

INSERT INTO "PlanningHazardControlDecisionTarget" (
    "id",
    "tenantId",
    "planningRecordId",
    "revisionNumber",
    "decisionId",
    "hazardId",
    "isPrimary"
)
SELECT
    md5("id" || ':' || "targetHazardId"),
    "tenantId",
    "planningRecordId",
    "revisionNumber",
    "id",
    "targetHazardId",
    TRUE
FROM "PlanningHazardControlDecision"
WHERE "decision" = 'Assign'
  AND "targetHazardId" IS NOT NULL;
