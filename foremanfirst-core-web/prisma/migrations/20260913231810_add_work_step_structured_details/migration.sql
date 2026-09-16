-- AlterTable
ALTER TABLE "PlanningWorkStep" ADD COLUMN     "equipmentTools" TEXT,
ADD COLUMN     "locationOverride" TEXT,
ADD COLUMN     "materialsChemicals" TEXT;

-- RenameIndex
ALTER INDEX "PlanningControlEvaluation_critical_class_idx" RENAME TO "PlanningControlEvaluation_criticalControlClassification_idx";
