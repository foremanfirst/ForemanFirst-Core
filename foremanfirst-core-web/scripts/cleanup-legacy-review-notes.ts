import { prisma } from "../src/lib/prisma";

const DEFAULT_TENANT_ID =
  "development-tenant";

const shouldApply =
  process.argv.includes("--apply");

/*
 * Legacy review entries were previously written
 * directly into ContractorDocument.notes.
 *
 * Examples:
 *
 * [Review - Approved] Aug 10, 2026 ...
 * [Review - Rejected] Aug 10, 2026 ... Expired
 * [Review - Needs Revision] Aug 10, 2026 ... Must be GM specific
 *
 * Review activity is now stored properly in
 * ContractorDocumentEvent, so these legacy lines
 * should no longer remain in document notes.
 */
function cleanLegacyReviewNotes(
  notes: string | null,
) {
  if (!notes) {
    return null;
  }

  const cleanedLines =
    notes
      .split(/\r?\n/)
      .filter((line) => {
        const trimmed =
          line.trim();

        return !trimmed.startsWith(
          "[Review -",
        );
      });

  const cleaned =
    cleanedLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  return cleaned.length > 0
    ? cleaned
    : null;
}

async function main() {
  console.log(
    shouldApply
      ? "\nAPPLY MODE\n"
      : "\nDRY RUN — NO DATABASE CHANGES\n",
  );

  const documents =
    await prisma.contractorDocument.findMany({
      where: {
        tenantId:
          DEFAULT_TENANT_ID,

        notes: {
          not: null,
        },
      },

      select: {
        id: true,
        contractorId: true,
        documentName: true,
        fileName: true,
        notes: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    });

  let affectedDocuments = 0;

  for (const document of documents) {
    const originalNotes =
      document.notes;

    const cleanedNotes =
      cleanLegacyReviewNotes(
        originalNotes,
      );

    if (
      originalNotes === cleanedNotes
    ) {
      continue;
    }

    affectedDocuments += 1;

    const displayName =
      document.documentName ||
      document.fileName;

    console.log(
      "\n----------------------------------------",
    );

    console.log(
      `Document: ${displayName}`,
    );

    console.log(
      `ID: ${document.id}`,
    );

    console.log(
      "\nBEFORE:",
    );

    console.log(
      originalNotes ||
        "(empty)",
    );

    console.log(
      "\nAFTER:",
    );

    console.log(
      cleanedNotes ||
        "(empty)",
    );

    if (shouldApply) {
      await prisma.contractorDocument.update({
        where: {
          id: document.id,
        },

        data: {
          notes:
            cleanedNotes,
        },
      });

      console.log(
        "\n✓ Updated",
      );
    }
  }

  console.log(
    "\n========================================",
  );

  console.log(
    `${affectedDocuments} document(s) contain legacy review-note entries.`,
  );

  if (!shouldApply) {
    console.log(
      "\nNo database records were changed.",
    );

    console.log(
      "Review the BEFORE / AFTER output above.",
    );

    console.log(
      "\nIf everything looks correct, run:",
    );

    console.log(
      "npx tsx scripts/cleanup-legacy-review-notes.ts --apply",
    );
  } else {
    console.log(
      "\n✓ Cleanup complete.",
    );
  }
}

main()
  .catch((error) => {
    console.error(
      "\nCleanup failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });