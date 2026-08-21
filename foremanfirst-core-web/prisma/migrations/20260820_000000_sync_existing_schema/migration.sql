-- Bring migration history up to the schema already present in Supabase.
-- This migration is intended for migration-history replay/shadow databases.
-- The live database already contains these changes.

-- Project emergency information
ALTER TABLE "Project"
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;

-- Planning effective dates
ALTER TABLE "PlanningRecord"
ADD COLUMN "effectiveStartDate" TIMESTAMP(3),
ADD COLUMN "effectiveEndDate" TIMESTAMP(3);

CREATE INDEX "PlanningRecord_effectiveStartDate_idx"
ON "PlanningRecord"("effectiveStartDate");

CREATE INDEX "PlanningRecord_effectiveEndDate_idx"
ON "PlanningRecord"("effectiveEndDate");

-- Daily WSE end-of-shift fields
ALTER TABLE "DailyWorkerSafetyEngagement"
ADD COLUMN "endOfShiftAdditionalHazards" BOOLEAN,
ADD COLUMN "endOfShiftControlsEffective" BOOLEAN,
ADD COLUMN "endOfShiftLessonsToShare" BOOLEAN,
ADD COLUMN "endOfShiftWorkedSafely" BOOLEAN;

-- Daily WSE task source tracking
ALTER TABLE "DailyWorkerSafetyEngagementTask"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'Daily',
ADD COLUMN "sourceWorkStepId" TEXT;

CREATE INDEX "DailyWorkerSafetyEngagementTask_source_idx"
ON "DailyWorkerSafetyEngagementTask"("source");

CREATE INDEX "DailyWorkerSafetyEngagementTask_sourceWorkStepId_idx"
ON "DailyWorkerSafetyEngagementTask"("sourceWorkStepId");
