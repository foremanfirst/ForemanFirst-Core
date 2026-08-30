/*
  Qoreva Planning
  Revision-scope persisted hazard/control review decisions.

  Existing PlanningHazardControlDecision rows were created before
  revisionNumber was stored directly on the decision.

  Existing rows are backfilled from the current revisionNumber
  on their parent PlanningRecord before revisionNumber is made
  required.

  This migration preserves all existing hazard/control decisions.
*/

-- ============================================================
-- 1. ADD revisionNumber AS NULLABLE
-- ============================================================

ALTER TABLE "PlanningHazardControlDecision"
ADD COLUMN "revisionNumber" INTEGER;


-- ============================================================
-- 2. BACKFILL EXISTING DECISIONS FROM PlanningRecord
-- ============================================================

UPDATE "PlanningHazardControlDecision" AS decision
SET "revisionNumber" = record."revisionNumber"
FROM "PlanningRecord" AS record
WHERE decision."planningRecordId" = record."id"
  AND decision."revisionNumber" IS NULL;


-- ============================================================
-- 3. SAFETY CHECK
--
-- Stop the migration if any decision could not be linked
-- to a PlanningRecord revision.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PlanningHazardControlDecision"
    WHERE "revisionNumber" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot scope PlanningHazardControlDecision records to revisions: one or more rows have no revisionNumber after backfill.';
  END IF;
END
$$;


-- ============================================================
-- 4. MAKE revisionNumber REQUIRED
-- ============================================================

ALTER TABLE "PlanningHazardControlDecision"
ALTER COLUMN "revisionNumber" SET NOT NULL;


-- ============================================================
-- 5. REMOVE OLD UNIQUE INDEX
--
-- Previously:
-- planningRecordId + recommendationId
--
-- We now need decisions scoped to a specific PTP revision.
-- ============================================================

DROP INDEX IF EXISTS
"PlanningHazardControlDecision_planningRecordId_recommendati_key";


-- ============================================================
-- 6. CREATE REVISION LOOKUP INDEX
-- ============================================================

CREATE INDEX
"PlanningHazardControlDecision_planningRecordId_revisionNumb_idx"
ON "PlanningHazardControlDecision"(
  "planningRecordId",
  "revisionNumber"
);


-- ============================================================
-- 7. CREATE revisionNumber INDEX
-- ============================================================

CREATE INDEX
"PlanningHazardControlDecision_revisionNumber_idx"
ON "PlanningHazardControlDecision"(
  "revisionNumber"
);


-- ============================================================
-- 8. CREATE REVISION-SCOPED UNIQUE INDEX
--
-- A recommendation may now have separate decisions across
-- different formal PTP revisions.
--
-- Example:
-- Revision 1 -> recommendation ABC -> Assign
-- Revision 2 -> recommendation ABC -> Modify
--
-- Those are now allowed because they belong to different
-- revisions.
-- ============================================================

CREATE UNIQUE INDEX
"PlanningHazardControlDecision_planningRecordId_revisionNumb_key"
ON "PlanningHazardControlDecision"(
  "planningRecordId",
  "revisionNumber",
  "recommendationId"
);