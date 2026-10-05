-- DropIndex
DROP INDEX "PlanningDocumentFinding_sourceDocumentId_analysisKey_key";

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_sourceDocumentId_analysisKey_idx" ON "PlanningDocumentFinding"("sourceDocumentId", "analysisKey");
