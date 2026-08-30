-- CreateTable
CREATE TABLE "PlanningHazardControlDecision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "modifiedText" TEXT,
    "targetHazardId" TEXT,
    "canonicalHazardConceptId" TEXT,
    "sourceType" TEXT,
    "sourceMetadata" JSONB,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedByRole" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningHazardControlDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_tenantId_idx" ON "PlanningHazardControlDecision"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_planningRecordId_idx" ON "PlanningHazardControlDecision"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_decision_idx" ON "PlanningHazardControlDecision"("decision");

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_targetHazardId_idx" ON "PlanningHazardControlDecision"("targetHazardId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_canonicalHazardConceptId_idx" ON "PlanningHazardControlDecision"("canonicalHazardConceptId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlDecision_decidedAt_idx" ON "PlanningHazardControlDecision"("decidedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningHazardControlDecision_planningRecordId_recommendati_key" ON "PlanningHazardControlDecision"("planningRecordId", "recommendationId");

-- AddForeignKey
ALTER TABLE "PlanningHazardControlDecision" ADD CONSTRAINT "PlanningHazardControlDecision_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
