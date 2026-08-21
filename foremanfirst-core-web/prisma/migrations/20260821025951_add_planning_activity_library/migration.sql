-- CreateTable
CREATE TABLE "PlanningActivityDefinition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "keywords" JSONB,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'Qoreva',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningActivityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_tenantId_idx" ON "PlanningActivityDefinition"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_activityCode_idx" ON "PlanningActivityDefinition"("activityCode");

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_category_idx" ON "PlanningActivityDefinition"("category");

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_isHighRisk_idx" ON "PlanningActivityDefinition"("isHighRisk");

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_isActive_idx" ON "PlanningActivityDefinition"("isActive");

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_isArchived_idx" ON "PlanningActivityDefinition"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningActivityDefinition_tenantId_activityCode_key" ON "PlanningActivityDefinition"("tenantId", "activityCode");
