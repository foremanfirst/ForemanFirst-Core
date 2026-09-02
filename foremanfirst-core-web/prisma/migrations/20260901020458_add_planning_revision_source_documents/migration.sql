-- CreateTable
CREATE TABLE "PlanningRevisionSourceDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "planningRevisionId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "contractorDocumentId" TEXT,
    "sourceType" TEXT NOT NULL,
    "label" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "contentSha256" TEXT,
    "isAiReady" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatusAtSelection" TEXT,
    "reviewStatusAtSelection" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningRevisionSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_tenantId_idx" ON "PlanningRevisionSourceDocument"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_planningRecordId_idx" ON "PlanningRevisionSourceDocument"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_planningRevisionId_idx" ON "PlanningRevisionSourceDocument"("planningRevisionId");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_revisionNumber_idx" ON "PlanningRevisionSourceDocument"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_sourceDocumentId_idx" ON "PlanningRevisionSourceDocument"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_contractorDocumentId_idx" ON "PlanningRevisionSourceDocument"("contractorDocumentId");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_sourceType_idx" ON "PlanningRevisionSourceDocument"("sourceType");

-- CreateIndex
CREATE INDEX "PlanningRevisionSourceDocument_capturedAt_idx" ON "PlanningRevisionSourceDocument"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningRevisionSourceDocument_planningRevisionId_sourceDoc_key" ON "PlanningRevisionSourceDocument"("planningRevisionId", "sourceDocumentId");

-- AddForeignKey
ALTER TABLE "PlanningRevisionSourceDocument" ADD CONSTRAINT "PlanningRevisionSourceDocument_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRevisionSourceDocument" ADD CONSTRAINT "PlanningRevisionSourceDocument_planningRevisionId_fkey" FOREIGN KEY ("planningRevisionId") REFERENCES "PlanningRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
