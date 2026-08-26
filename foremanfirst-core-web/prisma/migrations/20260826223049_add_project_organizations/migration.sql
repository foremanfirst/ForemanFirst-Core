-- CreateTable
CREATE TABLE "ProjectOrganization" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "organizationType" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "effectiveStartDate" TIMESTAMP(3),
    "effectiveEndDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectOrganization_tenantId_idx" ON "ProjectOrganization"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectOrganization_projectId_idx" ON "ProjectOrganization"("projectId");

-- CreateIndex
CREATE INDEX "ProjectOrganization_role_idx" ON "ProjectOrganization"("role");

-- CreateIndex
CREATE INDEX "ProjectOrganization_organizationName_idx" ON "ProjectOrganization"("organizationName");

-- CreateIndex
CREATE INDEX "ProjectOrganization_isActive_idx" ON "ProjectOrganization"("isActive");

-- AddForeignKey
ALTER TABLE "ProjectOrganization" ADD CONSTRAINT "ProjectOrganization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
