-- Add direct source-document provenance to PlanningQuestionCandidate.
--
-- Existing question candidates store their originating
-- PlanningSourceDocument ID in sourceMetadata.documentId.
--
-- Legacy candidates whose originating source document has already
-- been deleted cannot retain valid document provenance and are
-- removed before the new FK is enforced.

ALTER TABLE "PlanningQuestionCandidate"
ADD COLUMN "sourceDocumentId" TEXT;

-- Backfill direct provenance from the existing immutable analysis metadata.
UPDATE "PlanningQuestionCandidate"
SET "sourceDocumentId" =
  "sourceMetadata"->>'documentId'
WHERE
  "sourceDocumentId" IS NULL
  AND "sourceMetadata" IS NOT NULL
  AND "sourceMetadata"->>'documentId' IS NOT NULL;

-- Remove only legacy candidates whose recorded source document
-- no longer exists.
DELETE FROM "PlanningQuestionCandidate" q
WHERE
  q."sourceDocumentId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PlanningSourceDocument" d
    WHERE d."id" = q."sourceDocumentId"
  );

-- Do not continue if any candidate still lacks document provenance.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PlanningQuestionCandidate"
    WHERE "sourceDocumentId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot make PlanningQuestionCandidate.sourceDocumentId required: candidate without document provenance remains.';
  END IF;
END
$$;

-- Defensive FK validation before schema enforcement.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PlanningQuestionCandidate" q
    LEFT JOIN "PlanningSourceDocument" d
      ON d."id" = q."sourceDocumentId"
    WHERE d."id" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot add PlanningQuestionCandidate source-document FK: invalid sourceDocumentId remains.';
  END IF;
END
$$;

ALTER TABLE "PlanningQuestionCandidate"
ALTER COLUMN "sourceDocumentId" SET NOT NULL;

CREATE INDEX
"PlanningQuestionCandidate_sourceDocumentId_idx"
ON "PlanningQuestionCandidate"("sourceDocumentId");

ALTER TABLE "PlanningQuestionCandidate"
ADD CONSTRAINT
"PlanningQuestionCandidate_sourceDocumentId_fkey"
FOREIGN KEY ("sourceDocumentId")
REFERENCES "PlanningSourceDocument"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
