-- AlterTable
ALTER TABLE "DailyWorkerSafetyEngagementMocApproval" ADD COLUMN     "signatureAssetKey" TEXT,
ADD COLUMN     "signatureAttestation" TEXT,
ADD COLUMN     "signatureData" JSONB,
ADD COLUMN     "signatureIpAddress" TEXT,
ADD COLUMN     "signatureRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "signatureType" TEXT,
ADD COLUMN     "signatureUserAgent" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMocApproval_signedAt_idx" ON "DailyWorkerSafetyEngagementMocApproval"("signedAt");
