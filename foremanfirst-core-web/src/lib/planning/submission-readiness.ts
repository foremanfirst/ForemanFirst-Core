import { prisma } from "@/lib/prisma";

import {
  evaluatePlanningCompliance,
} from "@/lib/planning/compliance-evaluator";

import {
  resolveApplicablePlanningRequirements,
} from "@/lib/planning/requirement-resolver";

/*
 * Planning Submission Readiness
 *
 * This service is the server-authoritative
 * readiness boundary for moving a Planning
 * record from Draft toward Submitted.
 *
 * Browser-provided compliance state is never
 * trusted here.
 */

export async function evaluatePlanningSubmissionReadiness(
  planningRecordId: string,
) {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,

        questionResponses: {
          select: {
            questionId: true,
            responseValue: true,
          },
        },
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  const requirementResolution =
    await resolveApplicablePlanningRequirements(
      planningRecordId,
    );

  /*
   * PlanningQuestionResponse.questionId may
   * contain either:
   *
   * - stable questionCode
   * - PlanningQuestionDefinition database ID
   *
   * Normalize both forms to stable questionCode
   * before deterministic compliance evaluation.
   */
  const responseIdentifiers =
    Array.from(
      new Set(
        record.questionResponses
          .map(
            (response) =>
              response.questionId.trim(),
          )
          .filter(Boolean),
      ),
    );

  const questionDefinitions =
    responseIdentifiers.length > 0
      ? await prisma
          .planningQuestionDefinition
          .findMany({
            where: {
              tenantId: {
                in: [
                  "QOREVA",
                  record.tenantId,
                ],
              },

              isActive: true,
              isArchived: false,

              OR: [
                {
                  id: {
                    in:
                      responseIdentifiers,
                  },
                },

                {
                  questionCode: {
                    in:
                      responseIdentifiers,
                  },
                },
              ],
            },

            select: {
              id: true,
              questionCode: true,
              version: true,
            },

            orderBy: {
              version: "desc",
            },
          })
      : [];

  const definitionById =
    new Map(
      questionDefinitions.map(
        (definition) => [
          definition.id,
          definition,
        ],
      ),
    );

  const definitionByCode =
    new Map<
      string,
      (typeof questionDefinitions)[number]
    >();

  for (
    const definition of
    questionDefinitions
  ) {
    if (
      !definitionByCode.has(
        definition.questionCode,
      )
    ) {
      definitionByCode.set(
        definition.questionCode,
        definition,
      );
    }
  }

  const persistedAnswers:
    Record<
      string,
      string | null
    > = {};

  for (
    const response of
    record.questionResponses
  ) {
    const definition =
      definitionById.get(
        response.questionId,
      ) ??
      definitionByCode.get(
        response.questionId,
      );

    const questionCode =
      definition?.questionCode ??
      response.questionId;

    persistedAnswers[
      questionCode
    ] =
      response.responseValue;
  }

  const compliance =
    await evaluatePlanningCompliance({
      tenantId:
        record.tenantId,

      requirementRuleCodes:
        requirementResolution.rules.map(
          (rule) =>
            rule.ruleCode,
        ),

      answers:
        persistedAnswers,
    });

  /*
   * Explicit Submission gates fail closed.
   *
   * Only Satisfied may pass.
   *
   * Unresolved and NotEvaluated both remain
   * blockers because the server cannot prove
   * compliance.
   */
  const blockers =
    compliance.results.filter(
      (result) =>
        result.status !==
          "Satisfied" &&
        result.blockingLevel
          ?.trim()
          .toLowerCase() ===
          "submission",
    );

  return {
    ready:
      blockers.length === 0,

    requirementResolution,

    compliance,

    blockers,
  };
}
