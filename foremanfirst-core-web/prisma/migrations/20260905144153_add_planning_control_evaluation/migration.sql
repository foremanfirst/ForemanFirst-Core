-- AlterTable
ALTER TABLE "PlanningWorkStep" ADD COLUMN     "recommendedControlledRiskLevel" TEXT;

-- CreateTable
CREATE TABLE "PlanningControlEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planningRecordId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "workStepId" TEXT NOT NULL,
    "workStepSequence" INTEGER,
    "workStepTitle" TEXT,
    "hazardId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "hazardText" TEXT NOT NULL,
    "controlText" TEXT NOT NULL,
    "controlHierarchy" TEXT,
    "effectiveness" TEXT,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "riskCreditEligible" BOOLEAN NOT NULL DEFAULT false,
    "criticalControlRecommended" BOOLEAN NOT NULL DEFAULT false,
    "evaluationReason" TEXT,
    "evaluatorVersion" TEXT NOT NULL,
    "evaluatedById" TEXT,
    "evaluatedByName" TEXT,
    "evaluatedByRole" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningControlEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_tenantId_idx" ON "PlanningControlEvaluation"("tenantId");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_planningRecordId_idx" ON "PlanningControlEvaluation"("planningRecordId");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_planningRecordId_revisionNumber_idx" ON "PlanningControlEvaluation"("planningRecordId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_revisionNumber_idx" ON "PlanningControlEvaluation"("revisionNumber");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_workStepId_idx" ON "PlanningControlEvaluation"("workStepId");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_hazardId_idx" ON "PlanningControlEvaluation"("hazardId");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_controlId_idx" ON "PlanningControlEvaluation"("controlId");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_controlHierarchy_idx" ON "PlanningControlEvaluation"("controlHierarchy");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_effectiveness_idx" ON "PlanningControlEvaluation"("effectiveness");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_riskCreditEligible_idx" ON "PlanningControlEvaluation"("riskCreditEligible");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_criticalControlRecommended_idx" ON "PlanningControlEvaluation"("criticalControlRecommended");

-- CreateIndex
CREATE INDEX "PlanningControlEvaluation_evaluatedAt_idx" ON "PlanningControlEvaluation"("evaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningControlEvaluation_planningRecordId_revisionNumber_w_key" ON "PlanningControlEvaluation"("planningRecordId", "revisionNumber", "workStepId", "hazardId", "controlId");

-- CreateIndex
CREATE INDEX "PlanningWorkStep_recommendedControlledRiskLevel_idx" ON "PlanningWorkStep"("recommendedControlledRiskLevel");

-- AddForeignKey
ALTER TABLE "PlanningControlEvaluation" ADD CONSTRAINT "PlanningControlEvaluation_planningRecordId_fkey" FOREIGN KEY ("planningRecordId") REFERENCES "PlanningRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
