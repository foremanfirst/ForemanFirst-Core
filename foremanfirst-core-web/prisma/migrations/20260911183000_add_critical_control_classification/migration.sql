ALTER TABLE "PlanningControlEvaluation"
ADD COLUMN "criticalControlClassification" TEXT NOT NULL DEFAULT 'Supporting',
ADD COLUMN "criticalControlTrigger" TEXT;

-- Preserve all existing recommendations conservatively until the
-- v2 evaluator regenerates their exact Core/Contextual/Supporting policy.
UPDATE "PlanningControlEvaluation"
SET "criticalControlClassification" = 'Core'
WHERE "criticalControlRecommended" = true;

CREATE INDEX "PlanningControlEvaluation_critical_class_idx"
ON "PlanningControlEvaluation"("criticalControlClassification");
