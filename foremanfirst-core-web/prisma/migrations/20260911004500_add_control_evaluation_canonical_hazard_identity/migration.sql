ALTER TABLE "PlanningControlEvaluation"
ADD COLUMN "canonicalHazardConceptId" TEXT;

CREATE INDEX "PlanningControlEvaluation_canonicalHazardConceptId_idx"
ON "PlanningControlEvaluation"("canonicalHazardConceptId");
