import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

import {
  routePlanningSourceDocument,
} from "./document-router";

import {
  OpenAIDocumentIntelligenceProvider,
} from "./providers/openai";

import type {
  DocumentAnalysisResult,
} from "./providers/types";

export class PlanningDocumentAnalysisError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "PlanningDocumentAnalysisError";

    this.code =
      code;
  }
}

function createAnalysisKey(
  bytes: Buffer,
): string {
  return crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function clampConfidence(
  value: number | null,
): number | null {
  if (value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(
    1,
    Math.max(0, value),
  );
}

function normalizeResult(
  result: DocumentAnalysisResult,
): DocumentAnalysisResult {
  return {
    ...result,

    confidence:
      clampConfidence(
        result.confidence,
      ),

    evidence:
      Array.isArray(result.evidence)
        ? result.evidence
        : [],

    findings:
      Array.isArray(result.findings)
        ? result.findings
        : [],

    questionCandidates:
      Array.isArray(
        result.questionCandidates,
      )
        ? result.questionCandidates
        : [],
  };
}

export async function analyzePlanningSourceDocument(
  {
    planningRecordId,
    sourceDocumentId,
    tenantId,
  }: {
    planningRecordId: string;
    sourceDocumentId: string;
    tenantId: string;
  },
) {
  /*
   * The router performs the tenant-, planning-record-,
   * storage-, and file-level security checks before the
   * document reaches the AI provider.
   */
  const routedDocument =
    await routePlanningSourceDocument({
      planningRecordId,
      sourceDocumentId,
      tenantId,
    });

  const {
    document,
    processingKind,
  } = routedDocument;

  const analysisKey =
    createAnalysisKey(
      document.bytes,
    );

  /*
   * Idempotency:
   *
   * If this exact document content has already been
   * analyzed, return the existing analysis rather than
   * generating duplicate AI findings/questions.
   */
  const existingFindings =
    await prisma.planningDocumentFinding.findMany({
      where: {
        tenantId,
        planningRecordId,
        sourceDocumentId:
          document.id,
        analysisKey,
      },

      orderBy: {
        createdAt: "asc",
      },

      include: {
        questionCandidates: true,
      },
    });

  if (
    existingFindings.length > 0
  ) {
    return {
      status: "existing" as const,
      analysisKey,

      document: {
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
      },

      findings:
        existingFindings,

      questionCandidates:
        existingFindings.flatMap(
          (finding) =>
            finding.questionCandidates,
        ),
    };
  }

  /*
   * The AI provider is intentionally behind an
   * abstraction so Qoreva can add other providers
   * later without changing Planning persistence.
   */
  const provider =
    new OpenAIDocumentIntelligenceProvider();

  let analysis;

  try {
    analysis =
      await provider.analyzeDocument({
        fileName:
          document.fileName,

        mimeType:
          document.mimeType,

        bytes:
          document.bytes,

        processingKind,
      });
  } catch (error) {
    console.error(
      "Qoreva Document Intelligence analysis failed:",
      error,
    );

    throw new PlanningDocumentAnalysisError(
      "DOCUMENT_ANALYSIS_FAILED",
      "Qoreva could not analyze the source document.",
    );
  }

  const normalized =
    normalizeResult(
      analysis,
    );

  const planningRecord =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        tenantId,
      },

      select: {
        id: true,
        revisionNumber: true,
      },
    });

  if (!planningRecord) {
    throw new PlanningDocumentAnalysisError(
      "PLANNING_RECORD_NOT_FOUND",
      "The Planning record could not be found.",
    );
  }

  /*
   * Persist the entire AI analysis atomically.
   *
   * A question candidate is deliberately NOT written to
   * PlanningQuestionResponse. It remains a proposed AI
   * candidate until a qualified user reviews it.
   */
  const persisted =
    await prisma.$transaction(
      async (tx) => {
        const createdFindings = [];

        for (
          const finding of
            normalized.findings
        ) {
          const created =
            await tx.planningDocumentFinding.create({
              data: {
                tenantId,

                planningRecordId,

                sourceDocumentId:
                  document.id,

                revisionNumber:
                  planningRecord.revisionNumber,

                findingType:
                  finding.findingType,

                severity:
                  finding.severity,

                title:
                  finding.title,

                description:
                  finding.description,

                evidence:
                  finding.evidence,

                confidence:
                  clampConfidence(
                    finding.confidence,
                  ),

                status:
                  "Proposed",

                analysisKey,
              },
            });

          createdFindings.push(
            created,
          );
        }

        /*
         * Question candidates may originate directly
         * from document analysis or from a specific
         * finding.
         *
         * We associate a candidate with the matching
         * finding when possible by comparing the evidence
         * and generation reason.
         *
         * The candidate remains Proposed.
         */
        const createdQuestions = [];

        for (
          const candidate of
            normalized.questionCandidates
        ) {
          const matchingFinding =
            createdFindings.find(
              (finding) => {
                if (
                  !candidate.generationReason
                ) {
                  return false;
                }

                const reason =
                  candidate.generationReason
                    .toLowerCase();

                const findingTitle =
                  finding.title
                    .toLowerCase();

                return (
                  reason.includes(
                    findingTitle,
                  ) ||
                  candidate.evidence.some(
                    (candidateEvidence) =>
                      Array.isArray(
                        finding.evidence,
                      ) &&
                      finding.evidence.some(
                        (findingEvidence) =>
                          typeof findingEvidence ===
                            "object" &&
                          findingEvidence !== null &&
                          "description" in
                            findingEvidence &&
                          typeof
                            findingEvidence.description ===
                            "string" &&
                          candidateEvidence
                            .description ===
                          findingEvidence
                            .description,
                      ),
                  )
                );
              },
            );

          const created =
            await tx.planningQuestionCandidate.create({
              data: {
                tenantId,

                planningRecordId,

                sourceDocumentId:
                  document.id,

                revisionNumber:
                  planningRecord.revisionNumber,

                findingId:
                  matchingFinding?.id ??
                  null,

                questionText:
                  candidate.questionText,

                helpText:
                  candidate.helpText,

                category:
                  candidate.category,

                section:
                  candidate.section,

                questionType:
                  candidate.questionType,

                isCritical:
                  candidate.isCritical,

                status:
                  "Proposed",

                generationReason:
                  candidate.generationReason,

                sourceMetadata: {
                  provider:
                    normalized.provider,

                  model:
                    normalized.model,

                  evidence:
                    candidate.evidence,

                  documentId:
                    document.id,

                  analysisKey,
                },

                confidence:
                  clampConfidence(
                    candidate.confidence,
                  ),
              },
            });

          createdQuestions.push(
            created,
          );
        }

        return {
          findings:
            createdFindings,

          questionCandidates:
            createdQuestions,
        };
      },
    );

  return {
    status: "analyzed" as const,

    analysisKey,

    document: {
      id: document.id,
      fileName:
        document.fileName,
      mimeType:
        document.mimeType,
    },

    provider:
      normalized.provider,

    model:
      normalized.model,

    documentType:
      normalized.documentType,

    findings:
      persisted.findings,

    questionCandidates:
      persisted.questionCandidates,

    confidence:
      normalized.confidence,
  };
}
