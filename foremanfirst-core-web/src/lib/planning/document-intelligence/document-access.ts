import {
  readFile,
  stat,
} from "node:fs/promises";

import path from "node:path";

import { prisma } from "@/lib/prisma";

import type {
  PlanningDocumentFile,
} from "./types";

const MAX_DOCUMENT_SIZE =
  20 * 1024 * 1024;

export class PlanningDocumentIntelligenceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "PlanningDocumentIntelligenceError";

    this.code =
      code;
  }
}

/**
 * Retrieves a Planning source document for
 * Document Intelligence processing.
 *
 * Security boundaries:
 * - tenant-scoped
 * - planning-record-scoped
 * - source-document-scoped
 * - storage path validated against the Qoreva
 *   application storage root
 *
 * This service deliberately hides filesystem
 * implementation details from the AI layer.
 */
export async function getPlanningSourceDocumentFile(
  {
    planningRecordId,
    sourceDocumentId,
    tenantId,
  }: {
    planningRecordId: string;
    sourceDocumentId: string;
    tenantId: string;
  },
): Promise<PlanningDocumentFile> {
  const document =
    await prisma.planningSourceDocument.findFirst({
      where: {
        id: sourceDocumentId,
        planningRecordId,
        tenantId,
      },

      select: {
        id: true,
        tenantId: true,
        planningRecordId: true,

        sourceType: true,
        label: true,

        fileName: true,
        mimeType: true,

        storageProvider: true,
        storageKey: true,
      },
    });

  if (!document) {
    throw new PlanningDocumentIntelligenceError(
      "DOCUMENT_NOT_FOUND",
      "The Planning source document could not be found.",
    );
  }

  if (!document.storageKey) {
    throw new PlanningDocumentIntelligenceError(
      "DOCUMENT_FILE_NOT_FOUND",
      "The Planning source document does not have a stored file.",
    );
  }

  const storageProvider =
    document.storageProvider ?? "local";

  /*
   * Local storage is the current development
   * provider. S3/Azure Blob will be added
   * behind this same abstraction later.
   */
  if (storageProvider !== "local") {
    throw new PlanningDocumentIntelligenceError(
      "UNSUPPORTED_STORAGE_PROVIDER",
      `Document Intelligence does not yet support the "${storageProvider}" storage provider.`,
    );
  }

  const storageRoot =
    path.resolve(
      process.cwd(),
      "storage",
    );

  const absoluteFilePath =
    path.resolve(
      storageRoot,
      document.storageKey,
    );

  /*
   * Never allow a database-controlled storageKey
   * to escape the application storage directory.
   */
  const relativePath =
    path.relative(
      storageRoot,
      absoluteFilePath,
    );

  const pointsOutsideStorage =
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath);

  if (pointsOutsideStorage) {
    throw new PlanningDocumentIntelligenceError(
      "INVALID_STORAGE_PATH",
      "The source-document storage path is invalid.",
    );
  }

  let fileStats;

  try {
    fileStats =
      await stat(
        absoluteFilePath,
      );
  } catch {
    throw new PlanningDocumentIntelligenceError(
      "DOCUMENT_FILE_NOT_FOUND",
      "The source-document record exists, but the stored file could not be found.",
    );
  }

  if (!fileStats.isFile()) {
    throw new PlanningDocumentIntelligenceError(
      "INVALID_DOCUMENT_FILE",
      "The stored source document is not a valid file.",
    );
  }

  if (
    fileStats.size >
    MAX_DOCUMENT_SIZE
  ) {
    throw new PlanningDocumentIntelligenceError(
      "INVALID_DOCUMENT_FILE",
      "The source document exceeds the maximum supported processing size.",
    );
  }

  const bytes =
    await readFile(
      absoluteFilePath,
    );

  return {
    id: document.id,
    tenantId: document.tenantId,
    planningRecordId:
      document.planningRecordId,

    sourceType:
      document.sourceType,
    label:
      document.label,

    fileName:
      document.fileName,
    mimeType:
      document.mimeType,

    storageProvider:
      storageProvider,
    storageKey:
      document.storageKey,

    bytes,
    fileSize:
      bytes.length,
  };
}
