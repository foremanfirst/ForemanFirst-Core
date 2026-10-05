import type {
  DocumentProcessingKind,
} from "../types";

export type DocumentAnalysisRequest = {
  fileName: string | null;
  mimeType: string | null;
  bytes: Buffer;
  processingKind: DocumentProcessingKind;
};

export type DocumentEvidence = {
  pageNumber: number | null;
  excerpt: string | null;
  description: string;
  sourceType: string;
  confidence: number | null;
};

export type DocumentFinding = {
  findingType:
    | "SafetyCritical"
    | "MissingInformation"
    | "RequirementGap"
    | "DocumentConflict"
    | "PlanningConcern"
    | "Informational";

  severity:
    | "Critical"
    | "High"
    | "Medium"
    | "Low"
    | "Informational";

  title: string;
  description: string;

  evidence: DocumentEvidence[];

  confidence: number | null;
};

export type DocumentQuestionCandidate = {
  questionText: string;
  helpText: string | null;

  category: string;
  section: string | null;

  questionType:
    | "Text"
    | "TextArea"
    | "Boolean"
    | "SingleSelect"
    | "MultiSelect"
    | "Number"
    | "Date"
    | "Person"
    | "Equipment";

  isCritical: boolean;

  generationReason: string;

  evidence: DocumentEvidence[];

  confidence: number | null;
};

export type DocumentAnalysisResult = {
  provider: string;
  model: string;

  documentType: string | null;

  evidence: DocumentEvidence[];

  findings: DocumentFinding[];

  questionCandidates:
    DocumentQuestionCandidate[];

  confidence: number | null;
};

export interface DocumentIntelligenceProvider {
  analyzeDocument(
    request: DocumentAnalysisRequest,
  ): Promise<DocumentAnalysisResult>;
}
