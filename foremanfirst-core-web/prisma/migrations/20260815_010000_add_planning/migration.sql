-- CreateTable
CREATE TABLE "PlanningRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorId" TEXT,
    "planType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "revisionNumber" INTEGER NOT NULL DEFAULT 1,
    "responsibleSupervisor" TEXT,
    "responsibleSupervisorId" TEXT,
    "plannedStartDate" TIMESTAMP(3),
    "workLocation" TEXT,
    "crewSize" INTEGER,
    "shift" TEXT,
    "scopeDescription" TEXT,
    "equipmentTools" TEXT,
    "materialsChemicals" TEXT,
    "adjacentWork" TEXT,
    "specialConditions" TEXT,
    "requiredPpe" TEXT,
    "requiredPermits" TEXT,
    "emergencyPlan" TEXT,
    "stopWorkTriggers" TEXT,
    "planningNotes" TEXT,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "activeAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningWorkStep" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hazards" TEXT,
    "controls" TEXT,
    "safetyCritical" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningWorkStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningQuestionResponse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "helpText" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "responseValue" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningQuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningSourceDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "contractorDocumentId" TEXT,
    "sourceType" TEXT NOT NULL,
    "label" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "isAiReady" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatusAtSelection" TEXT,
    "reviewStatusAtSelection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningRevision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "revisionReason" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningReview" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "reviewerId" TEXT,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Review',
    "confirmations" JSONB,
    "reviewNotes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningReviewComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "planningReviewId" TEXT,
    "revisionNumber" INTEGER NOT NULL,
    "targetId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdById" TEXT,
    "createdByName" TEXT,
    "resolvedById" TEXT,
    "resolvedByName" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningSignature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "signerId" TEXT,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "signatureType" TEXT NOT NULL DEFAULT 'Drawn',
    "signatureStorageProvider" TEXT,
    "signatureStorageKey" TEXT,
    "signatureStorageUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "revisionNumber" INTEGER,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "comment" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorkerSafetyEngagement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "engagementDate" TIMESTAMP(3) NOT NULL,
    "shift" TEXT,
    "foremanId" TEXT,
    "foremanName" TEXT NOT NULL,
    "workLocation" TEXT,
    "dailyRiskLevel" TEXT,
    "emergencyActionPlanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "emergencyNotes" TEXT,
    "changeStatus" TEXT NOT NULL DEFAULT 'No Changes',
    "foremanMorningAcknowledgedAt" TIMESTAMP(3),
    "endOfShiftIncidentsOrNearMisses" BOOLEAN,
    "endOfShiftConditionsChanged" BOOLEAN,
    "endOfShiftLessonsLearned" TEXT,
    "endOfShiftNotes" TEXT,
    "carryForwardStatus" TEXT,
    "ptpRevisionRecommended" BOOLEAN NOT NULL DEFAULT false,
    "foremanFinalSignatureStorageProvider" TEXT,
    "foremanFinalSignatureStorageKey" TEXT,
    "foremanFinalSignatureStorageUrl" TEXT,
    "foremanFinalSignedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkerSafetyEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorkerSafetyEngagementTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dailyWseId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "taskDescription" TEXT NOT NULL,
    "hazards" TEXT NOT NULL,
    "mitigations" TEXT NOT NULL,
    "riskLevel" TEXT,
    "safetyCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkerSafetyEngagementTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorkerSafetyEngagementSignature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dailyWseId" TEXT NOT NULL,
    "workerId" TEXT,
    "workerName" TEXT NOT NULL,
    "workerEmail" TEXT,
    "acknowledgementStatus" TEXT NOT NULL DEFAULT 'Pending',
    "signatureType" TEXT NOT NULL DEFAULT 'Drawn',
    "signatureStorageProvider" TEXT,
    "signatureStorageKey" TEXT,
    "signatureStorageUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedInAt" TIMESTAMP(3),
    "signedOutAt" TIMESTAMP(3),
    "signOutInitials" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkerSafetyEngagementSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorkerSafetyEngagementMoc" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dailyWseId" TEXT NOT NULL,
    "affectedTaskId" TEXT,
    "changeDescription" TEXT NOT NULL,
    "newHazards" TEXT,
    "newMitigations" TEXT,
    "revisedRiskLevel" TEXT,
    "requiresPtpRevision" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkerSafetyEngagementMoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningRecord_tenantId_idx" ON "PlanningRecord"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningRecord_companyId_idx" ON "PlanningRecord"("companyId");

-- CreateIndex
CREATE INDEX "PlanningRecord_projectId_idx" ON "PlanningRecord"("projectId");

-- CreateIndex
CREATE INDEX "PlanningRecord_contractorId_idx" ON "PlanningRecord"("contractorId");

-- CreateIndex
CREATE INDEX "PlanningRecord_planType_idx" ON "PlanningRecord"("planType");

-- CreateIndex
CREATE INDEX "PlanningRecord_status_idx" ON "PlanningRecord"("status");

-- CreateIndex
CREATE INDEX "PlanningRecord_revisionNumber_idx" ON "PlanningRecord"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningRecord_isArchived_idx" ON "PlanningRecord"("isArchived");

-- CreateIndex
CREATE INDEX "PlanningRecord_createdAt_idx" ON "PlanningRecord"("createdAt");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_tenantId_idx" ON "PlanningWorkStep"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_planningRecordId_idx" ON "PlanningWorkStep"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_riskLevel_idx" ON "PlanningWorkStep"("riskLevel");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_safetyCritical_idx" ON "PlanningWorkStep"("safetyCritical");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningWorkStep_planningRecordId_sequence_key" ON "PlanningWorkStep"("planningRecordId", "sequence");

-- CreateIndex
CREATE INDEX "PlanningQuestionResponse_tenantId_idx" ON "PlanningQuestionResponse"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningQuestionResponse_planningRecordId_idx" ON "PlanningQuestionResponse"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningQuestionResponse_category_idx" ON "PlanningQuestionResponse"("category");

-- CreateIndex
CREATE INDEX "PlanningQuestionResponse_isCritical_idx" ON "PlanningQuestionResponse"("isCritical");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningQuestionResponse_planningRecordId_questionId_key" ON "PlanningQuestionResponse"("planningRecordId", "questionId");

-- CreateIndex
CREATE INDEX "PlanningSourceDocument_tenantId_idx" ON "PlanningSourceDocument"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningSourceDocument_planningRecordId_idx" ON "PlanningSourceDocument"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningSourceDocument_contractorDocumentId_idx" ON "PlanningSourceDocument"("contractorDocumentId");

-- CreateIndex
CREATE INDEX "PlanningSourceDocument_sourceType_idx" ON "PlanningSourceDocument"("sourceType");

-- CreateIndex
CREATE INDEX "PlanningSourceDocument_isSelected_idx" ON "PlanningSourceDocument"("isSelected");

-- CreateIndex
CREATE INDEX "PlanningRevision_tenantId_idx" ON "PlanningRevision"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningRevision_planningRecordId_idx" ON "PlanningRevision"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningRevision_revisionNumber_idx" ON "PlanningRevision"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningRevision_createdAt_idx" ON "PlanningRevision"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningRevision_planningRecordId_revisionNumber_key" ON "PlanningRevision"("planningRecordId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningReview_tenantId_idx" ON "PlanningReview"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningReview_planningRecordId_idx" ON "PlanningReview"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningReview_revisionNumber_idx" ON "PlanningReview"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningReview_reviewerId_idx" ON "PlanningReview"("reviewerId");

-- CreateIndex
CREATE INDEX "PlanningReview_status_idx" ON "PlanningReview"("status");

-- CreateIndex
CREATE INDEX "PlanningReview_startedAt_idx" ON "PlanningReview"("startedAt");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_tenantId_idx" ON "PlanningReviewComment"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_planningRecordId_idx" ON "PlanningReviewComment"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_planningReviewId_idx" ON "PlanningReviewComment"("planningReviewId");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_revisionNumber_idx" ON "PlanningReviewComment"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_targetId_idx" ON "PlanningReviewComment"("targetId");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_status_idx" ON "PlanningReviewComment"("status");

-- CreateIndex
CREATE INDEX "PlanningReviewComment_createdAt_idx" ON "PlanningReviewComment"("createdAt");

-- CreateIndex
CREATE INDEX "PlanningSignature_tenantId_idx" ON "PlanningSignature"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningSignature_planningRecordId_idx" ON "PlanningSignature"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningSignature_revisionNumber_idx" ON "PlanningSignature"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningSignature_signerId_idx" ON "PlanningSignature"("signerId");

-- CreateIndex
CREATE INDEX "PlanningSignature_role_idx" ON "PlanningSignature"("role");

-- CreateIndex
CREATE INDEX "PlanningSignature_status_idx" ON "PlanningSignature"("status");

-- CreateIndex
CREATE INDEX "PlanningSignature_signedAt_idx" ON "PlanningSignature"("signedAt");

-- CreateIndex
CREATE INDEX "PlanningEvent_tenantId_idx" ON "PlanningEvent"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningEvent_planningRecordId_idx" ON "PlanningEvent"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningEvent_eventType_idx" ON "PlanningEvent"("eventType");

-- CreateIndex
CREATE INDEX "PlanningEvent_revisionNumber_idx" ON "PlanningEvent"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningEvent_actorId_idx" ON "PlanningEvent"("actorId");

-- CreateIndex
CREATE INDEX "PlanningEvent_createdAt_idx" ON "PlanningEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagement_tenantId_idx" ON "DailyWorkerSafetyEngagement"("tenantId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagement_planningRecordId_idx" ON "DailyWorkerSafetyEngagement"("planningRecordId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagement_revisionNumber_idx" ON "DailyWorkerSafetyEngagement"("revisionNumber");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagement_engagementDate_idx" ON "DailyWorkerSafetyEngagement"("engagementDate");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagement_status_idx" ON "DailyWorkerSafetyEngagement"("status");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementTask_tenantId_idx" ON "DailyWorkerSafetyEngagementTask"("tenantId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementTask_dailyWseId_idx" ON "DailyWorkerSafetyEngagementTask"("dailyWseId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementTask_riskLevel_idx" ON "DailyWorkerSafetyEngagementTask"("riskLevel");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementTask_safetyCritical_idx" ON "DailyWorkerSafetyEngagementTask"("safetyCritical");

-- CreateIndex
CREATE UNIQUE INDEX "DailyWorkerSafetyEngagementTask_dailyWseId_sequence_key" ON "DailyWorkerSafetyEngagementTask"("dailyWseId", "sequence");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementSignature_tenantId_idx" ON "DailyWorkerSafetyEngagementSignature"("tenantId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementSignature_dailyWseId_idx" ON "DailyWorkerSafetyEngagementSignature"("dailyWseId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementSignature_workerId_idx" ON "DailyWorkerSafetyEngagementSignature"("workerId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementSignature_acknowledgementStatus_idx" ON "DailyWorkerSafetyEngagementSignature"("acknowledgementStatus");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementSignature_signedAt_idx" ON "DailyWorkerSafetyEngagementSignature"("signedAt");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_tenantId_idx" ON "DailyWorkerSafetyEngagementMoc"("tenantId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_dailyWseId_idx" ON "DailyWorkerSafetyEngagementMoc"("dailyWseId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_affectedTaskId_idx" ON "DailyWorkerSafetyEngagementMoc"("affectedTaskId");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_requiresPtpRevision_idx" ON "DailyWorkerSafetyEngagementMoc"("requiresPtpRevision");

-- CreateIndex
CREATE INDEX "DailyWorkerSafetyEngagementMoc_createdAt_idx" ON "DailyWorkerSafetyEngagementMoc"("createdAt");

-- AddForeignKey
ALTER TABLE "PlanningRecord" ADD CONSTRAINT "PlanningRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRecord" ADD CONSTRAINT "PlanningRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRecord" ADD CONSTRAINT "PlanningRecord_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningWorkStep" ADD CONSTRAINT "PlanningWorkStep_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionResponse" ADD CONSTRAINT "PlanningQuestionResponse_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningSourceDocument" ADD CONSTRAINT "PlanningSourceDocument_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningSourceDocument" ADD CONSTRAINT "PlanningSourceDocument_contractorDocumentId_fkey" FOREIGN KEY ("contractorDocumentId") REFERENCES "ContractorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRevision" ADD CONSTRAINT "PlanningRevision_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningReview" ADD CONSTRAINT "PlanningReview_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningReviewComment" ADD CONSTRAINT "PlanningReviewComment_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningReviewComment" ADD CONSTRAINT "PlanningReviewComment_planningReviewId_fkey" FOREIGN KEY ("planningReviewId") REFERENCES "PlanningReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningSignature" ADD CONSTRAINT "PlanningSignature_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningEvent" ADD CONSTRAINT "PlanningEvent_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagement" ADD CONSTRAINT "DailyWorkerSafetyEngagement_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagementTask" ADD CONSTRAINT "DailyWorkerSafetyEngagementTask_dailyWseId_fkey" FOREIGN KEY ("dailyWseId") REFERENCES "DailyWorkerSafetyEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagementSignature" ADD CONSTRAINT "DailyWorkerSafetyEngagementSignature_dailyWseId_fkey" FOREIGN KEY ("dailyWseId") REFERENCES "DailyWorkerSafetyEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagementSignature" ADD CONSTRAINT "DailyWorkerSafetyEngagementSignature_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkerSafetyEngagementMoc" ADD CONSTRAINT "DailyWorkerSafetyEngagementMoc_dailyWseId_fkey" FOREIGN KEY ("dailyWseId") REFERENCES "DailyWorkerSafetyEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

