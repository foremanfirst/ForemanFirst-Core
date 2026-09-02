-- AlterTable
ALTER TABLE "PlanningSourceDocument" ADD COLUMN     "aiConfidence" DECIMAL(5,4),
ADD COLUMN     "aiDocumentType" TEXT,
ADD COLUMN     "aiProcessingStatus" TEXT NOT NULL DEFAULT 'Not Started',
ADD COLUMN     "confirmedData" JSONB,
ADD COLUMN     "extractedData" JSONB;
