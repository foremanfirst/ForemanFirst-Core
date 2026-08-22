-- AlterTable
ALTER TABLE "DailyWorkerSafetyEngagementMoc" ADD COLUMN     "approvalRouting" JSONB,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewDecision" TEXT,
ADD COLUMN     "reviewedByRole" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedById" TEXT,
ADD COLUMN     "submittedByName" TEXT,
ADD COLUMN     "submittedByRole" TEXT;

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_status_idx" ON "DailyWorkerSafetyEngagementMoc"("status");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_submittedAt_idx" ON "DailyWorkerSafetyEngagementMoc"("submittedAt");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_reviewedAt_idx" ON "DailyWorkerSafetyEngagementMoc"("reviewedAt");
