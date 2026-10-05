export type PlanningDocumentFile = {
  id: string;
  tenantId: string;
  planningRecordId: string;

  sourceType: string;
  label: string | null;

  fileName: string | null;
  mimeType: string | null;

  storageProvider: string | null;
  storageKey: string | null;

  bytes: Buffer;
  fileSize: number;
};

export type DocumentProcessingKind =
  | "pdf"
  | "image";

export type RoutedPlanningDocument = {
  document: PlanningDocumentFile;
  processingKind: DocumentProcessingKind;
};

export type DocumentIntelligenceErrorCode =
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_FILE_NOT_FOUND"
  | "UNSUPPORTED_STORAGE_PROVIDER"
  | "UNSUPPORTED_DOCUMENT_TYPE"
  | "INVALID_STORAGE_PATH"
  | "INVALID_DOCUMENT_FILE";
