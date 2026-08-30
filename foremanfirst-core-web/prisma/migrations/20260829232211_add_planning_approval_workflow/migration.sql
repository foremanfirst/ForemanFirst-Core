-- CreateTable
CREATE TABLE "PlanningApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "roleCode" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "approverId" TEXT,
    "approverName" TEXT,
    "approverEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "decisionComment" TEXT,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedByRole" TEXT,
    "decidedAt" TIMESTAMP(3),
    "signatureRequired" BOOLEAN NOT NULL DEFAULT true,
    "planningSignatureId" TEXT,
    "notificationStatus" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningApproval_tenantId_idx" ON "PlanningApproval"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningApproval_planningRecordId_idx" ON "PlanningApproval"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningApproval_revisionNumber_idx" ON "PlanningApproval"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningApproval_roleCode_idx" ON "PlanningApproval"("roleCode");

-- CreateIndex
CREATE INDEX "PlanningApproval_approverId_idx" ON "PlanningApproval"("approverId");

-- CreateIndex
CREATE INDEX "PlanningApproval_approverEmail_idx" ON "PlanningApproval"("approverEmail");

-- CreateIndex
CREATE INDEX "PlanningApproval_status_idx" ON "PlanningApproval"("status");

-- CreateIndex
CREATE INDEX "PlanningApproval_planningSignatureId_idx" ON "PlanningApproval"("planningSignatureId");

-- CreateIndex
CREATE INDEX "PlanningApproval_decidedAt_idx" ON "PlanningApproval"("decidedAt");

-- CreateIndex
CREATE INDEX "PlanningApproval_notifiedAt_idx" ON "PlanningApproval"("notifiedAt");

-- CreateIndex
CREATE INDEX "PlanningApproval_createdAt_idx" ON "PlanningApproval"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningApproval_planningRecordId_revisionNumber_roleCode_s_key" ON "PlanningApproval"("planningRecordId", "revisionNumber", "roleCode", "sortOrder");

-- AddForeignKey
ALTER TABLE "PlanningApproval" ADD CONSTRAINT "PlanningApproval_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
