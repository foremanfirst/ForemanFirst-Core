-- CreateTable
CREATE TABLE "PlanningHazardControlOverride" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "workStepId" TEXT NOT NULL,
    "workStepSequence" INTEGER,
    "workStepTitle" TEXT,
    "itemType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetItemId" TEXT,
    "parentHazardId" TEXT,
    "originalText" TEXT,
    "finalText" TEXT,
    "canonicalHazardConceptId" TEXT,
    "sourceType" TEXT,
    "sourceMetadata" JSONB,
    "reason" TEXT,
    "changedById" TEXT,
    "changedByName" TEXT,
    "changedByRole" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operationKey" TEXT NOT NULL,

    CONSTRAINT "PlanningHazardControlOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_tenantId_idx" ON "PlanningHazardControlOverride"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_planningRecordId_idx" ON "PlanningHazardControlOverride"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_planningRecordId_revisionNumb_idx" ON "PlanningHazardControlOverride"("planningRecordId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_revisionNumber_idx" ON "PlanningHazardControlOverride"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_workStepId_idx" ON "PlanningHazardControlOverride"("workStepId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_itemType_idx" ON "PlanningHazardControlOverride"("itemType");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_action_idx" ON "PlanningHazardControlOverride"("action");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_targetItemId_idx" ON "PlanningHazardControlOverride"("targetItemId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_parentHazardId_idx" ON "PlanningHazardControlOverride"("parentHazardId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_canonicalHazardConceptId_idx" ON "PlanningHazardControlOverride"("canonicalHazardConceptId");

-- CreateIndex
CREATE INDEX "PlanningHazardControlOverride_changedAt_idx" ON "PlanningHazardControlOverride"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningHazardControlOverride_planningRecordId_revisionNumb_key" ON "PlanningHazardControlOverride"("planningRecordId", "revisionNumber", "operationKey");

-- AddForeignKey
ALTER TABLE "PlanningHazardControlOverride" ADD CONSTRAINT "PlanningHazardControlOverride_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
