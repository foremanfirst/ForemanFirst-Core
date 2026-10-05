-- CreateTable
CREATE TABLE "EvaAuditEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "skillId" TEXT,
    "toolId" TEXT,
    "action" TEXT NOT NULL,
    "actionRisk" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "projectId" TEXT,
    "planningRecordId" TEXT,
    "confirmationRequired" BOOLEAN NOT NULL DEFAULT false,
    "confirmationStatus" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaAuditEvent_tenantId_idx" ON "EvaAuditEvent"("tenantId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_requestId_idx" ON "EvaAuditEvent"("requestId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_skillId_idx" ON "EvaAuditEvent"("skillId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_toolId_idx" ON "EvaAuditEvent"("toolId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_actorId_idx" ON "EvaAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_resourceType_resourceId_idx" ON "EvaAuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_projectId_idx" ON "EvaAuditEvent"("projectId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_planningRecordId_idx" ON "EvaAuditEvent"("planningRecordId");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_success_idx" ON "EvaAuditEvent"("success");

-- CreateIndex
CREATE INDEX "EvaAuditEvent_createdAt_idx" ON "EvaAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "EvaAuditEvent" ADD CONSTRAINT "EvaAuditEvent_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PlanningHazardControlDecision_planningRecordId_revisionNumber_w" RENAME TO "PlanningHazardControlDecision_planningRecordId_revisionNumb_key";
