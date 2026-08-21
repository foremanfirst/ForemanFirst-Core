-- CreateTable
CREATE TABLE "PlanningActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "detectionSource" TEXT NOT NULL DEFAULT 'User',
    "aiConfidence" DECIMAL(5,4),
    "confirmationStatus" TEXT NOT NULL DEFAULT 'Pending',
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningQuestionDefinition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "section" TEXT,
    "questionText" TEXT NOT NULL,
    "helpText" TEXT,
    "questionType" TEXT NOT NULL,
    "options" JSONB,
    "unit" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL DEFAULT 'Qoreva',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningQuestionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningQuestionRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionDefinitionId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'Show',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningQuestionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementPack" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "packType" TEXT NOT NULL,
    "organizationName" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "applicability" JSONB,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requirementPackId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requirementText" TEXT NOT NULL,
    "category" TEXT,
    "triggerConditions" JSONB,
    "requiredInformation" JSONB,
    "requiredControls" JSONB,
    "severity" TEXT,
    "sourceDocumentName" TEXT,
    "sourcePage" TEXT,
    "sourceReference" JSONB,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningQuestionRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questionDefinitionId" TEXT NOT NULL,
    "requirementRuleId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'Information',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningQuestionRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningActivity_tenantId_idx" ON "PlanningActivity"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningActivity_planningRecordId_idx" ON "PlanningActivity"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningActivity_activityCode_idx" ON "PlanningActivity"("activityCode");

-- CreateIndex
CREATE INDEX "PlanningActivity_category_idx" ON "PlanningActivity"("category");

-- CreateIndex
CREATE INDEX "PlanningActivity_confirmationStatus_idx" ON "PlanningActivity"("confirmationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningActivity_planningRecordId_activityCode_key" ON "PlanningActivity"("planningRecordId", "activityCode");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_tenantId_idx" ON "PlanningQuestionDefinition"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_category_idx" ON "PlanningQuestionDefinition"("category");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_section_idx" ON "PlanningQuestionDefinition"("section");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_questionCode_idx" ON "PlanningQuestionDefinition"("questionCode");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_isActive_idx" ON "PlanningQuestionDefinition"("isActive");

-- CreateIndex
CREATE INDEX "PlanningQuestionDefinition_isArchived_idx" ON "PlanningQuestionDefinition"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningQuestionDefinition_tenantId_questionCode_version_key" ON "PlanningQuestionDefinition"("tenantId", "questionCode", "version");

-- CreateIndex
CREATE INDEX "PlanningQuestionRule_tenantId_idx" ON "PlanningQuestionRule"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningQuestionRule_questionDefinitionId_idx" ON "PlanningQuestionRule"("questionDefinitionId");

-- CreateIndex
CREATE INDEX "PlanningQuestionRule_ruleType_idx" ON "PlanningQuestionRule"("ruleType");

-- CreateIndex
CREATE INDEX "PlanningQuestionRule_isActive_idx" ON "PlanningQuestionRule"("isActive");

-- CreateIndex
CREATE INDEX "RequirementPack_tenantId_idx" ON "RequirementPack"("tenantId");

-- CreateIndex
CREATE INDEX "RequirementPack_packType_idx" ON "RequirementPack"("packType");

-- CreateIndex
CREATE INDEX "RequirementPack_organizationName_idx" ON "RequirementPack"("organizationName");

-- CreateIndex
CREATE INDEX "RequirementPack_status_idx" ON "RequirementPack"("status");

-- CreateIndex
CREATE INDEX "RequirementPack_version_idx" ON "RequirementPack"("version");

-- CreateIndex
CREATE INDEX "RequirementPack_isArchived_idx" ON "RequirementPack"("isArchived");

-- CreateIndex
CREATE INDEX "RequirementRule_tenantId_idx" ON "RequirementRule"("tenantId");

-- CreateIndex
CREATE INDEX "RequirementRule_requirementPackId_idx" ON "RequirementRule"("requirementPackId");

-- CreateIndex
CREATE INDEX "RequirementRule_category_idx" ON "RequirementRule"("category");

-- CreateIndex
CREATE INDEX "RequirementRule_status_idx" ON "RequirementRule"("status");

-- CreateIndex
CREATE INDEX "RequirementRule_isActive_idx" ON "RequirementRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementRule_requirementPackId_ruleCode_key" ON "RequirementRule"("requirementPackId", "ruleCode");

-- CreateIndex
CREATE INDEX "PlanningQuestionRequirement_tenantId_idx" ON "PlanningQuestionRequirement"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningQuestionRequirement_questionDefinitionId_idx" ON "PlanningQuestionRequirement"("questionDefinitionId");

-- CreateIndex
CREATE INDEX "PlanningQuestionRequirement_requirementRuleId_idx" ON "PlanningQuestionRequirement"("requirementRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningQuestionRequirement_questionDefinitionId_requiremen_key" ON "PlanningQuestionRequirement"("questionDefinitionId", "requirementRuleId");

-- AddForeignKey
ALTER TABLE "PlanningActivity" ADD CONSTRAINT "PlanningActivity_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionRule" ADD CONSTRAINT "PlanningQuestionRule_questionDefinitionId_fkey" FOREIGN KEY ("questionDefinitionId") REFERENCES "PlanningQuestionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementRule" ADD CONSTRAINT "RequirementRule_requirementPackId_fkey" FOREIGN KEY ("requirementPackId") REFERENCES "RequirementPack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionRequirement" ADD CONSTRAINT "PlanningQuestionRequirement_questionDefinitionId_fkey" FOREIGN KEY ("questionDefinitionId") REFERENCES "PlanningQuestionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningQuestionRequirement" ADD CONSTRAINT "PlanningQuestionRequirement_requirementRuleId_fkey" FOREIGN KEY ("requirementRuleId") REFERENCES "RequirementRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
