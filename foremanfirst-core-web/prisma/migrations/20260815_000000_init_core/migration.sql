-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyType" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectCode" TEXT,
    "clientName" TEXT,
    "projectType" TEXT,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "projectManager" TEXT,
    "superintendent" TEXT,
    "safetyManager" TEXT,
    "contractValue" DECIMAL(14,2),
    "plannedWorkforce" INTEGER NOT NULL DEFAULT 0,
    "currentWorkforce" INTEGER NOT NULL DEFAULT 0,
    "workersOnsite" INTEGER NOT NULL DEFAULT 0,
    "activeContractors" INTEGER NOT NULL DEFAULT 0,
    "totalManHours" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "openActions" INTEGER NOT NULL DEFAULT 0,
    "recordableIncidents" INTEGER NOT NULL DEFAULT 0,
    "permitsOpen" INTEGER NOT NULL DEFAULT 0,
    "planningDocumentsPending" INTEGER NOT NULL DEFAULT 0,
    "trainingCompliance" INTEGER NOT NULL DEFAULT 100,
    "accessCompliance" INTEGER NOT NULL DEFAULT 100,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE INDEX "Company_tenantId_idx" ON "Company"("tenantId");

-- CreateIndex
CREATE INDEX "Company_isArchived_idx" ON "Company"("isArchived");

-- CreateIndex
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE INDEX "Project_isArchived_idx" ON "Project"("isArchived");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

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

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

