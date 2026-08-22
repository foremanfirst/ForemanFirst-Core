-- CreateTable
CREATE TABLE "DailyWorkerSafetyEngagementMocApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mocId" TEXT NOT NULL,
    "roleCode" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "approverId" TEXT,
    "approverName" TEXT,
    "approverEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "decision" TEXT,
    "comment" TEXT,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "decidedByRole" TEXT,
    "decidedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkerSafetyEngagementMocApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_tenantId_idx" ON "DailyWorkerSafetyEngagementMocApproval"("tenantId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_mocId_idx" ON "DailyWorkerSafetyEngagementMocApproval"("mocId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_roleCode_idx" ON "DailyWorkerSafetyEngagementMocApproval"("roleCode");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_status_idx" ON "DailyWorkerSafetyEngagementMocApproval"("status");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_approverId_idx" ON "DailyWorkerSafetyEngagementMocApproval"("approverId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_approverEmail_idx" ON "DailyWorkerSafetyEngagementMocApproval"("approverEmail");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_decidedAt_idx" ON "DailyWorkerSafetyEngagementMocApproval"("decidedAt");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_notifiedAt_idx" ON "DailyWorkerSafetyEngagementMocApproval"("notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyWorkerSafetyEngagementMocApproval_mocId_roleCode_key" ON "DailyWorkerSafetyEngagementMocApproval"("mocId", "roleCode");

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagementMocApproval" ADD CONSTRAINT "DailyWorkerSafetyEngagementMocApproval_mocId_fkey" FOREIGN KEY ("mocId") REFERENCES "DailyWorkerSafetyEngagementMoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
