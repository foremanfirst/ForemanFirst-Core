/*
  Warnings:

  - A unique constraint covering the columns `[scopeKey,activityCode]` on the table `PlanningActivityDefinition` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PlanningActivityDefinition_tenantId_activityCode_key";

-- AlterTable
ALTER TABLE "PlanningActivityDefinition" ADD COLUMN     "scopeKey" TEXT NOT NULL DEFAULT 'QOREVA',
ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PlanningActivityDefinition_scopeKey_idx" ON "PlanningActivityDefinition"("scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningActivityDefinition_scopeKey_activityCode_key" ON "PlanningActivityDefinition"("scopeKey", "activityCode");
