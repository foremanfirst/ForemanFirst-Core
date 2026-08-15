-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "accessCompliance" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "activeContractors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contractValue" DECIMAL(14,2),
ADD COLUMN     "currentWorkforce" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "healthScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openActions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "permitsOpen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plannedWorkforce" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planningDocumentsPending" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "projectManager" TEXT,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "recordableIncidents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "safetyManager" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "superintendent" TEXT,
ADD COLUMN     "totalManHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trainingCompliance" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "workersOnsite" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "employeeNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "trade" TEXT,
    "jobTitle" TEXT,
    "crew" TEXT,
    "foreman" TEXT,
    "unionLocal" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactPhone" TEXT,
    "orientationStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "orientationDate" TIMESTAMP(3),
    "orientationExpiresAt" TIMESTAMP(3),
    "trainingStatus" TEXT NOT NULL DEFAULT 'Pending',
    "drugScreenStatus" TEXT NOT NULL DEFAULT 'Not Required',
    "drugScreenDate" TIMESTAMP(3),
    "drugScreenExpiresAt" TIMESTAMP(3),
    "badgeNumber" TEXT,
    "badgeStatus" TEXT NOT NULL DEFAULT 'Inactive',
    "badgeExpiresAt" TIMESTAMP(3),
    "qrCredentialId" TEXT,
    "accessStatus" TEXT NOT NULL DEFAULT 'Pending',
    "hireDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "contractorCode" TEXT,
    "trade" TEXT,
    "specialty" TEXT,
    "description" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "safetyContactName" TEXT,
    "safetyContactEmail" TEXT,
    "safetyContactPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "workforceCount" INTEGER NOT NULL DEFAULT 0,
    "emr" DECIMAL(5,2),
    "trir" DECIMAL(6,2),
    "insuranceProvider" TEXT,
    "insuranceExpiresAt" TIMESTAMP(3),
    "orientationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "complianceStatus" TEXT NOT NULL DEFAULT 'Pending',
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "projectId" TEXT,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending',
    "reviewStatus" TEXT NOT NULL DEFAULT 'Not Reviewed',
    "notes" TEXT,
    "aiProcessingStatus" TEXT NOT NULL DEFAULT 'Not Started',
    "aiDocumentType" TEXT,
    "aiConfidence" DECIMAL(5,4),
    "extractedData" JSONB,
    "confirmedData" JSONB,
    "uploadedBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorDocumentRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "expirationRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorDocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorDocumentEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractorDocumentId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousApprovalStatus" TEXT,
    "newApprovalStatus" TEXT,
    "previousReviewStatus" TEXT,
    "newReviewStatus" TEXT,
    "comment" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractorDocumentEvent_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "Worker_qrCredentialId_key" ON "Worker"("qrCredentialId");

-- CreateIndex
CREATE INDEX "Worker_tenantId_idx" ON "Worker"("tenantId");

-- CreateIndex
CREATE INDEX "Worker_companyId_idx" ON "Worker"("companyId");

-- CreateIndex
CREATE INDEX "Worker_projectId_idx" ON "Worker"("projectId");

-- CreateIndex
CREATE INDEX "Worker_isArchived_idx" ON "Worker"("isArchived");

-- CreateIndex
CREATE INDEX "Worker_accessStatus_idx" ON "Worker"("accessStatus");

-- CreateIndex
CREATE INDEX "Worker_badgeStatus_idx" ON "Worker"("badgeStatus");

-- CreateIndex
CREATE INDEX "Worker_lastName_firstName_idx" ON "Worker"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Contractor_tenantId_idx" ON "Contractor"("tenantId");

-- CreateIndex
CREATE INDEX "Contractor_companyId_idx" ON "Contractor"("companyId");

-- CreateIndex
CREATE INDEX "Contractor_projectId_idx" ON "Contractor"("projectId");

-- CreateIndex
CREATE INDEX "Contractor_isArchived_idx" ON "Contractor"("isArchived");

-- CreateIndex
CREATE INDEX "Contractor_approvalStatus_idx" ON "Contractor"("approvalStatus");

-- CreateIndex
CREATE INDEX "Contractor_complianceStatus_idx" ON "Contractor"("complianceStatus");

-- CreateIndex
CREATE INDEX "Contractor_name_idx" ON "Contractor"("name");

-- CreateIndex
CREATE INDEX "ContractorDocument_tenantId_idx" ON "ContractorDocument"("tenantId");

-- CreateIndex
CREATE INDEX "ContractorDocument_contractorId_idx" ON "ContractorDocument"("contractorId");

-- CreateIndex
CREATE INDEX "ContractorDocument_projectId_idx" ON "ContractorDocument"("projectId");

-- CreateIndex
CREATE INDEX "ContractorDocument_documentType_idx" ON "ContractorDocument"("documentType");

-- CreateIndex
CREATE INDEX "ContractorDocument_expirationDate_idx" ON "ContractorDocument"("expirationDate");

-- CreateIndex
CREATE INDEX "ContractorDocument_approvalStatus_idx" ON "ContractorDocument"("approvalStatus");

-- CreateIndex
CREATE INDEX "ContractorDocument_reviewStatus_idx" ON "ContractorDocument"("reviewStatus");

-- CreateIndex
CREATE INDEX "ContractorDocument_isArchived_idx" ON "ContractorDocument"("isArchived");

-- CreateIndex
CREATE INDEX "ContractorDocumentRequirement_tenantId_idx" ON "ContractorDocumentRequirement"("tenantId");

-- CreateIndex
CREATE INDEX "ContractorDocumentRequirement_projectId_idx" ON "ContractorDocumentRequirement"("projectId");

-- CreateIndex
CREATE INDEX "ContractorDocumentRequirement_documentType_idx" ON "ContractorDocumentRequirement"("documentType");

-- CreateIndex
CREATE INDEX "ContractorDocumentRequirement_isRequired_idx" ON "ContractorDocumentRequirement"("isRequired");

-- CreateIndex
CREATE INDEX "ContractorDocumentRequirement_isArchived_idx" ON "ContractorDocumentRequirement"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorDocumentRequirement_tenantId_projectId_documentTy_key" ON "ContractorDocumentRequirement"("tenantId", "projectId", "documentType");

-- CreateIndex
CREATE INDEX "ContractorDocumentEvent_tenantId_idx" ON "ContractorDocumentEvent"("tenantId");

-- CreateIndex
CREATE INDEX "ContractorDocumentEvent_contractorDocumentId_idx" ON "ContractorDocumentEvent"("contractorDocumentId");

-- CreateIndex
CREATE INDEX "ContractorDocumentEvent_contractorId_idx" ON "ContractorDocumentEvent"("contractorId");

-- CreateIndex
CREATE INDEX "ContractorDocumentEvent_eventType_idx" ON "ContractorDocumentEvent"("eventType");

-- CreateIndex
CREATE INDEX "ContractorDocumentEvent_createdAt_idx" ON "ContractorDocumentEvent"("createdAt");

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
CREATE INDEX "Company_isArchived_idx" ON "Company"("isArchived");

-- CreateIndex
CREATE INDEX "Project_isArchived_idx" ON "Project"("isArchived");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contractor" ADD CONSTRAINT "Contractor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDocument" ADD CONSTRAINT "ContractorDocument_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDocument" ADD CONSTRAINT "ContractorDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDocumentRequirement" ADD CONSTRAINT "ContractorDocumentRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDocumentEvent" ADD CONSTRAINT "ContractorDocumentEvent_contractorDocumentId_fkey" FOREIGN KEY ("contractorDocumentId") REFERENCES "ContractorDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

