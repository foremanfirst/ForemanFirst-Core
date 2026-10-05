-- CreateTable
CREATE TABLE "PlanningDocumentFinding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "findingType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "confidence" DECIMAL(5,4),
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    "resolutionNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "analysisKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningDocumentFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningQuestionCandidate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "findingId" TEXT,
    "questionText" TEXT NOT NULL,
    "helpText" TEXT,
    "category" TEXT NOT NULL,
    "section" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'TextArea',
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    "generationReason" TEXT,
    "sourceMetadata" JSONB,
    "confidence" DECIMAL(5,4),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningQuestionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_tenantId_idx" ON "PlanningDocumentFinding"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_planningRecordId_idx" ON "PlanningDocumentFinding"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_planningRecordId_revisionNumber_idx" ON "PlanningDocumentFinding"("planningRecordId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_sourceDocumentId_idx" ON "PlanningDocumentFinding"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_findingType_idx" ON "PlanningDocumentFinding"("findingType");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_severity_idx" ON "PlanningDocumentFinding"("severity");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_status_idx" ON "PlanningDocumentFinding"("status");

-- CreateIndex
CREATE INDEX "PlanningDocumentFinding_createdAt_idx" ON "PlanningDocumentFinding"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningDocumentFinding_sourceDocumentId_analysisKey_key" ON "PlanningDocumentFinding"("sourceDocumentId", "analysisKey");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_tenantId_idx" ON "PlanningQuestionCandidate"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_planningRecordId_idx" ON "PlanningQuestionCandidate"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_planningRecordId_revisionNumber_idx" ON "PlanningQuestionCandidate"("planningRecordId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_findingId_idx" ON "PlanningQuestionCandidate"("findingId");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_status_idx" ON "PlanningQuestionCandidate"("status");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_category_idx" ON "PlanningQuestionCandidate"("category");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_isCritical_idx" ON "PlanningQuestionCandidate"("isCritical");

-- CreateIndex
CREATE INDEX "PlanningQuestionCandidate_createdAt_idx" ON "PlanningQuestionCandidate"("createdAt");

-- AddForeignKey
ALTER TABLE "PlanningDocumentFinding" ADD CONSTRAINT "PlanningDocumentFinding_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningDocumentFinding" ADD CONSTRAINT "PlanningDocumentFinding_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "PlanningSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionCandidate" ADD CONSTRAINT "PlanningQuestionCandidate_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionCandidate" ADD CONSTRAINT "PlanningQuestionCandidate_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "PlanningDocumentFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
