import {
  getPlanningSourceDocumentFile,
  PlanningDocumentIntelligenceError,
} from "./document-access";

import type {
  DocumentProcessingKind,
  RoutedPlanningDocument,
} from "./types";

function getProcessingKind(
  mimeType: string | null,
  fileName: string | null,
): DocumentProcessingKind {
  const normalizedMimeType =
    mimeType?.trim().toLowerCase();

  if (
    normalizedMimeType ===
    "application/pdf"
  ) {
    return "pdf";
  }

  if (
    normalizedMimeType ===
      "image/jpeg" ||
    normalizedMimeType ===
      "image/png"
  ) {
    return "image";
  }

  /*
   * MIME type should be authoritative.
   *
   * The extension fallback exists for older
   * source-document records that may not have
   * a reliable MIME type persisted.
   */
  const extension =
    fileName
      ?.split(".")
      .pop()
      ?.trim()
      .toLowerCase();

  if (extension === "pdf") {
    return "pdf";
  }

  if (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png"
  ) {
    return "image";
  }

  throw new PlanningDocumentIntelligenceError(
    "UNSUPPORTED_DOCUMENT_TYPE",
    "This source document type is not currently supported by Qoreva Document Intelligence.",
  );
}

/**
 * Loads a Planning source document and determines
 * which Document Intelligence processing path should
 * handle it.
 *
 * This function does not perform AI analysis.
 */
export async function routePlanningSourceDocument(
  {
    planningRecordId,
    sourceDocumentId,
    tenantId,
  }: {
    planningRecordId: string;
    sourceDocumentId: string;
    tenantId: string;
  },
): Promise<RoutedPlanningDocument> {
  const document =
    await getPlanningSourceDocumentFile({
      planningRecordId,
      sourceDocumentId,
      tenantId,
    });

  const processingKind =
    getProcessingKind(
      document.mimeType,
      document.fileName,
    );

  return {
    document,
    processingKind,
  };
}
