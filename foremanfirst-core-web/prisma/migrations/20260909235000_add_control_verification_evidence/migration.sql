ALTER TABLE "PlanningControlEvaluation"
ADD COLUMN "verificationRequiredForCurrentContext" BOOLEAN,
ADD COLUMN "verificationEvidenceMethod" TEXT,
ADD COLUMN "verificationEvidence" TEXT,
ADD COLUMN "verificationCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "verifiedById" TEXT,
ADD COLUMN "verifiedByName" TEXT,
ADD COLUMN "verifiedByRole" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);
