import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluatePlanningQuestions,
} from "@/lib/planning/question-evaluator";
import {
  evaluatePlanningCompliance,
} from "@/lib/planning/compliance-evaluator";
import {
  resolveApplicablePlanningRequirements,
} from "@/lib/planning/requirement-resolver";
import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic =
  "force-dynamic";

function nullableString(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

function normalizeQuestionTextForDeduplication(
  value: string,
) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\\s+/g, " ");
}

function sanitizePlanningAnswers(
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([questionCode, answer]) => {
      if (typeof answer !== "string") {
        return [];
      }

      const code = questionCode.trim();
      const normalized = answer.trim();

      if (
        !code ||
        !normalized ||
        /^(dd+|test|testing|asdf|xxx+|tbd|unknown|n\/?a|na)$/i.test(normalized)
      ) {
        return [];
      }

      return [[code, normalized]];
    }),
  );
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const planningRecordId =
      nullableString(
        body.planningRecordId,
      );

    if (!planningRecordId) {
      return NextResponse.json(
        {
          message:
            "Planning Record ID is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const activityCodes =
      Array.isArray(
        body.activityCodes,
      )
        ? body.activityCodes.filter(
            (
              value: unknown,
            ): value is string =>
              typeof value ===
              "string",
          )
        : [];

    /*
     * The API is the trust boundary. Placeholder, empty, and
     * non-string answers must not influence requirement logic.
     */
    const answers =
      sanitizePlanningAnswers(
        body.answers,
      );

    /*
     * Server-side trust boundary:
     *
     * The browser does not choose the tenant or
     * decide which Requirement Rules apply.
     *
     * Qoreva loads the Planning Record, resolves
     * its tenant, evaluates Requirement Pack
     * applicability, and evaluates individual
     * Requirement Rule triggers on the server.
     */
    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id:
            planningRecordId,

          tenantId:
            authorization.planningRecord
              .tenantId,

          projectId:
            authorization.planningRecord
              .projectId,

          isArchived:
            false,
        },

        select: {
          id:
            true,

          tenantId:
            true,

          revisionNumber:
            true,
        },
      });

    if (!planningRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status:
            404,
        },
      );
    }

    const requirementResolution =
      await resolveApplicablePlanningRequirements(
        planningRecordId,
        {
          /*
           * Use the live Guided Intake state so
           * requirement-driven questions can appear
           * immediately rather than one save later.
           */
          activityCodes,
          answers,
        },
      );

    const requirementRuleCodes =
      requirementResolution.rules.map(
        (rule) =>
          rule.ruleCode,
      );

    const deterministicQuestions =
      await evaluatePlanningQuestions({
        tenantId:
          planningRecord.tenantId,

        activityCodes,

        requirementRuleCodes,

        answers,
      });

    /*
     * Document Intelligence questions are Planning-record-specific
     * advisory prompts generated from selected project documents.
     *
     * They remain separate from reusable PlanningQuestionDefinitions
     * and Requirement Rules. A document-generated question therefore
     * does not become an official requirement merely because Qoreva
     * surfaces it in Guided Planning.
     *
     * Only current-revision candidates from selected, successfully
     * analyzed source documents are eligible. Dismissed and superseded
     * candidates are intentionally excluded. Qualified-user confirmation
     * remains separate from document analysis completion.
     */
    const documentQuestionCandidates =
      await prisma.planningQuestionCandidate.findMany({
        where: {
          tenantId:
            planningRecord.tenantId,

          planningRecordId,

          revisionNumber:
            planningRecord.revisionNumber,

          status: {
            in: [
              "Proposed",
              "Accepted",
            ],
          },

          sourceDocument: {
            isSelected:
              true,

            /*
             * Analysis completion makes the generated questions
             * eligible for Guided Planning review.
             *
             * isAiReady is intentionally NOT used here because it
             * represents the separate qualified-user confirmation
             * boundary for document intelligence.
             */
            aiProcessingStatus:
              "Complete",
          },
        },

        orderBy: [
          {
            sourceDocumentId:
              "asc",
          },
          {
            createdAt:
              "asc",
          },
        ],

        select: {
          id:
            true,

          questionText:
            true,

          helpText:
            true,

          category:
            true,

          section:
            true,

          questionType:
            true,

          isCritical:
            true,

          generationReason:
            true,

          sourceMetadata:
            true,

          confidence:
            true,

          sourceDocument: {
            select: {
              id:
                true,

              label:
                true,

              fileName:
                true,
            },
          },

          finding: {
            select: {
              id:
                true,

              title:
                true,

              findingType:
                true,

              severity:
                true,
            },
          },
        },
      });

    /*
     * Deterministic Qoreva/project questions remain authoritative.
     *
     * Document Intelligence may independently discover the same planning
     * need from a source document. Suppress equivalent document prompts so
     * the field user is not asked the same question twice.
     *
     * This MVP intentionally uses deterministic text normalization rather
     * than another AI call. That keeps evaluation fast, inexpensive, and
     * repeatable. More advanced semantic deduplication can later live in
     * the shared Safety Intelligence layer.
     */
    const seenQuestionTexts =
      new Set(
        deterministicQuestions.map(
          (question) =>
            normalizeQuestionTextForDeduplication(
              question.questionText,
            ),
        ),
      );

    const uniqueDocumentQuestionCandidates =
      documentQuestionCandidates.filter(
        (candidate) => {
          const normalizedQuestion =
            normalizeQuestionTextForDeduplication(
              candidate.questionText,
            );

          if (
            !normalizedQuestion ||
            seenQuestionTexts.has(
              normalizedQuestion,
            )
          ) {
            return false;
          }

          /*
           * Also suppress duplicate prompts generated by multiple
           * selected documents in this same Planning record.
           * The first eligible candidate remains stable because the
           * database query has deterministic ordering.
           */
          seenQuestionTexts.add(
            normalizedQuestion,
          );

          return true;
        },
      );

    const documentQuestions =
      uniqueDocumentQuestionCandidates.map(
        (candidate, index) => ({
          id:
            candidate.id,

          questionCode:
            `DOC_${candidate.id}`,

          category:
            candidate.category,

          section:
            candidate.section,

          questionText:
            candidate.questionText,

          helpText:
            candidate.helpText,

          questionType:
            candidate.questionType,

          options:
            null,

          unit:
            null,

          /*
           * Document Intelligence may identify a safety-critical issue,
           * but an AI-generated candidate does not independently create
           * a mandatory project requirement.
           *
           * Requiredness remains controlled by authoritative requirement
           * logic or a future qualified-user acceptance workflow.
           */
          isRequired:
            false,

          isCritical:
            candidate.isCritical,

          sortOrder:
            100000 + index,

          sourceType:
            "DocumentIntelligence",

          requirementSources:
            [],

          /*
           * Keep Document Intelligence provenance separate from
           * authoritative Requirement provenance.
           *
           * The field experience may present both through the same
           * "Why Qoreva is asking" pattern, but their authority is
           * intentionally different.
           */
          documentSource: {
            documentId:
              candidate.sourceDocument.id,

            documentName:
              candidate.sourceDocument.fileName ??
              candidate.sourceDocument.label ??
              "Selected project document",

            generationReason:
              candidate.generationReason,

            findingId:
              candidate.finding?.id ??
              null,

            findingTitle:
              candidate.finding?.title ??
              null,

            findingType:
              candidate.finding?.findingType ??
              null,

            severity:
              candidate.finding?.severity ??
              null,

            confidence:
              candidate.confidence === null
                ? null
                : Number(candidate.confidence),

            evidence:
              (() => {
                const metadata =
                  candidate.sourceMetadata;

                if (
                  typeof metadata !== "object" ||
                  metadata === null ||
                  Array.isArray(metadata)
                ) {
                  return [];
                }

                const rawEvidence =
                  (metadata as Record<string, unknown>)
                    .evidence;

                if (!Array.isArray(rawEvidence)) {
                  return [];
                }

                return rawEvidence.flatMap(
                  (item) => {
                    if (
                      typeof item !== "object" ||
                      item === null ||
                      Array.isArray(item)
                    ) {
                      return [];
                    }

                    const evidence =
                      item as Record<string, unknown>;

                    const pageNumber =
                      typeof evidence.pageNumber ===
                        "number" &&
                      Number.isFinite(
                        evidence.pageNumber,
                      )
                        ? evidence.pageNumber
                        : null;

                    const excerpt =
                      typeof evidence.excerpt ===
                      "string"
                        ? evidence.excerpt.trim() ||
                          null
                        : null;

                    const description =
                      typeof evidence.description ===
                      "string"
                        ? evidence.description.trim()
                        : "";

                    const sourceType =
                      typeof evidence.sourceType ===
                      "string"
                        ? evidence.sourceType.trim() ||
                          null
                        : null;

                    if (
                      pageNumber === null &&
                      !excerpt &&
                      !description
                    ) {
                      return [];
                    }

                    return [
                      {
                        pageNumber,
                        excerpt,
                        description:
                          description || null,
                        sourceType,
                      },
                    ];
                  },
                );
              })(),
          },
        }),
      );

    /*
     * Keep the existing deterministic engine authoritative for core,
     * activity, and requirement-driven questions, then append unique
     * record-specific Document Intelligence prompts.
     */
    const questions = [
      ...deterministicQuestions,
      ...documentQuestions,
    ];

    const compliance =
      await evaluatePlanningCompliance({
        tenantId:
          planningRecord.tenantId,

        requirementRuleCodes,

        answers,
      });

    return NextResponse.json({
      planningRecordId,

      activityCodes,

      answers,

      requirementRuleCodes,

      requirements: {
        rules:
          requirementResolution.rules,

        applicablePacks:
          requirementResolution
            .applicablePacks,

        metadata:
          requirementResolution
            .metadata,
      },

      questions,

      compliance,

      count:
        questions.length,
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
        },
        {
          status:
            error.status,
        },
      );
    }

    console.error(
      "Unable to evaluate planning questions:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to evaluate planning questions.",
      },
      {
        status:
          500,
      },
    );
  }
}