-- AlterTable
ALTER TABLE "PlanningWorkStep" ADD COLUMN     "controlledRiskLevel" TEXT,
ADD COLUMN     "inherentRiskLevel" TEXT;

-- Backfill compatibility:
-- Existing Qoreva work-step risk values represented risk after considering
-- the planned controls, so preserve them as the initial controlled risk.
-- Do not infer inherent risk for historical records.
UPDATE "PlanningWorkStep"
SET "controlledRiskLevel" = "riskLevel"
WHERE "riskLevel" IS NOT NULL
  AND "controlledRiskLevel" IS NULL;

-- CreateIndex
CREATE INDEX "PlanningWorkStep_inherentRiskLevel_idx" ON "PlanningWorkStep"("inherentRiskLevel");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_controlledRiskLevel_idx" ON "PlanningWorkStep"("controlledRiskLevel");
