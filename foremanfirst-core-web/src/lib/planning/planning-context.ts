import { prisma } from "@/lib/prisma";

import {
  isAiProcessingReady,
} from "@/lib/planning/document-intelligence";

import {
  resolveApplicablePlanningRequirements,
} from "@/lib/planning/requirement-resolver";

import type {
  PlanningActivityContext,
  PlanningGenerationContext,
  PlanningQuestionAnswerContext,
  PlanningWorkStepContext,
} from "./planning-types";

function decimalToNumber(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export type ProposedPlanningActivityInput = {
  activityCode: string;
  name: string;
  category: string | null;
  detectionSource: string;
  confidence: number | null;
};

export type ProposedPlanningQuestionInput = {
  questionCode: string;
  category: string;
  questionText: string;
  responseValue: string | null;
  notes: string | null;
};

export async function buildProposedPlanningGenerationContext({
  baseContext,
  activities,
  questions,
  workSteps,
}: {
  baseContext: PlanningGenerationContext;
  activities: ProposedPlanningActivityInput[];
  questions: ProposedPlanningQuestionInput[];
  workSteps: PlanningWorkStepContext[];
}): Promise<PlanningGenerationContext> {
  /*
   * Guided Planning may evaluate a proposed state before that state
   * has been persisted.
   *
   * Planner-authored selections/answers are therefore overlaid onto
   * the authoritative server context, while safety intelligence is
   * rebuilt from trusted Qoreva/tenant definitions.
   */

  const activityCodes =
    Array.from(
      new Set(
        activities.map(
          (activity) =>
            activity.activityCode,
        ),
      ),
    );

  const activityDefinitions =
    activityCodes.length > 0
      ? await prisma.planningActivityDefinition.findMany({
          where: {
            activityCode: {
              in: activityCodes,
            },

            isActive: true,
            isArchived: false,

            OR: [
              {
                scopeKey:
                  "QOREVA",
              },
              {
                tenantId:
                  baseContext.tenantId,
              },
            ],
          },
        })
      : [];

  const activityDefinitionMap =
    new Map<
      string,
      (typeof activityDefinitions)[number]
    >();

  for (
    const definition of
    activityDefinitions
  ) {
    const existing =
      activityDefinitionMap.get(
        definition.activityCode,
      );

    /*
     * Tenant intelligence overrides the Qoreva base definition when
     * both define the same activity code.
     */
    if (
      !existing ||
      (
        definition.tenantId ===
          baseContext.tenantId &&
        existing.tenantId !==
          baseContext.tenantId
      )
    ) {
      activityDefinitionMap.set(
        definition.activityCode,
        definition,
      );
    }
  }

  const proposedActivities:
    PlanningActivityContext[] =
      activities.map(
        (activity) => {
          const definition =
            activityDefinitionMap.get(
              activity.activityCode,
            );

          return {
            activityCode:
              activity.activityCode,

            /*
             * Prefer trusted definition metadata when available.
             * The persisted planner selection remains the fallback so
             * legacy/custom activity selections continue to round-trip.
             */
            name:
              definition?.name ??
              activity.name,

            category:
              definition?.category ??
              activity.category,

            isHighRisk:
              definition?.isHighRisk ??
              false,

            detectionSource:
              activity.detectionSource,

            confidence:
              activity.confidence,
          };
        },
      );

  const questionCodes =
    Array.from(
      new Set(
        questions.map(
          (question) =>
            question.questionCode,
        ),
      ),
    );

  const questionDefinitions =
    questionCodes.length > 0
      ? await prisma.planningQuestionDefinition.findMany({
          where: {
            tenantId:
              baseContext.tenantId,

            questionCode: {
              in: questionCodes,
            },

            isActive: true,
            isArchived: false,
          },

          orderBy: [
            {
              questionCode:
                "asc",
            },
            {
              version:
                "desc",
            },
          ],
        })
      : [];

  const questionDefinitionMap =
    new Map<
      string,
      (typeof questionDefinitions)[number]
    >();

  for (
    const definition of
    questionDefinitions
  ) {
    /*
     * Results are newest-version-first within each question code.
     * Preserve the first authoritative active definition.
     */
    if (
      !questionDefinitionMap.has(
        definition.questionCode,
      )
    ) {
      questionDefinitionMap.set(
        definition.questionCode,
        definition,
      );
    }
  }

  const proposedQuestions:
    PlanningQuestionAnswerContext[] =
      questions.map(
        (question) => {
          const definition =
            questionDefinitionMap.get(
              question.questionCode,
            );

          return {
            questionCode:
              question.questionCode,

            category:
              definition?.category ??
              question.category,

            section:
              definition?.section ??
              null,

            questionText:
              definition?.questionText ??
              question.questionText,

            questionType:
              definition?.questionType ??
              "Text",

            isRequired:
              definition?.isRequired ??
              false,

            /*
             * Criticality is server-owned whenever an authoritative
             * definition exists. Unknown legacy/custom questions are
             * not promoted to safety-critical merely because the
             * browser says so.
             */
            isCritical:
              definition?.isCritical ??
              false,

            responseValue:
              question.responseValue,

            notes:
              question.notes,
          };
        },
      );

  return {
    ...baseContext,
    activities:
      proposedActivities,
    questions:
      proposedQuestions,
    workSteps,
  };
}

export async function buildPlanningGenerationContext(
  planningRecordId: string,
): Promise<PlanningGenerationContext> {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      include: {
        project: true,

        contractor: true,

        activities: {
          where: {
            isActive: true,
            confirmationStatus:
              "Confirmed",
          },

          orderBy: [
            {
              createdAt: "asc",
            },
          ],
        },

        workSteps: {
          orderBy: {
            sequence: "asc",
          },
        },

        questionResponses: {
          orderBy: {
            createdAt: "asc",
          },
        },

        sourceDocuments: {
          where: {
            isSelected: true,
          },

          include: {
            contractorDocument:
              true,
          },
        },

        /*
         * Hazard/control decisions are loaded here
         * and revision-scoped below after the parent
         * PlanningRecord revisionNumber is known.
         *
         * Prisma nested relation filters cannot
         * directly reference the parent record's
         * revisionNumber. Filtering the already
         * loaded decision collection below keeps
         * draft generation deterministic while
         * preserving prior-revision decisions for
         * audit/history.
         */
        hazardControlDecisions: {
          include: {
            targets: {
              orderBy: [
                {
                  isPrimary: "desc",
                },
                {
                  createdAt: "asc",
                },
              ],
            },
          },
          orderBy: [
            {
              revisionNumber: "asc",
            },
            {
              decidedAt: "asc",
            },
          ],
        },

        /*
         * User-authored hazard/control overrides are
         * loaded across revisions and filtered below
         * to the active formal PTP revision.
         */
        hazardControlOverrides: {
          orderBy: [
            {
              revisionNumber: "asc",
            },
            {
              changedAt: "asc",
            },
          ],
        },
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  /*
   * Formal PTP revision boundary.
   *
   * Only decisions belonging to the active
   * PlanningRecord revision may influence draft
   * generation.
   *
   * Decisions from earlier revisions remain in the
   * database for history/audit purposes but are not
   * silently carried into a newer revision.
   */
  const activeHazardControlDecisions =
    record.hazardControlDecisions.filter(
      (decision) =>
        decision.revisionNumber ===
        record.revisionNumber,
    );

  const activeHazardControlOverrides =
    record.hazardControlOverrides.filter(
      (override) =>
        override.revisionNumber ===
        record.revisionNumber,
    );

  const questionDefinitionCodes =
    record.questionResponses
      .map(
        (response) =>
          response.questionId,
      )
      .filter(Boolean);

  const questionDefinitions =
    questionDefinitionCodes.length > 0
      ? await prisma.planningQuestionDefinition.findMany({
          where: {
            tenantId:
              record.tenantId,

            questionCode: {
              in:
                questionDefinitionCodes,
            },

            isActive: true,
            isArchived: false,
          },

          orderBy: [
            {
              questionCode: "asc",
            },
            {
              version: "desc",
            },
          ],
        })
      : [];

  const questionDefinitionMap =
    new Map<
      string,
      (typeof questionDefinitions)[number]
    >();

  for (
    const definition of
    questionDefinitions
  ) {
    if (
      !questionDefinitionMap.has(
        definition.questionCode,
      )
    ) {
      questionDefinitionMap.set(
        definition.questionCode,
        definition,
      );
    }
  }

  const activityCodes =
    record.activities.map(
      (activity) =>
        activity.activityCode,
    );

  const activityDefinitions =
    activityCodes.length > 0
      ? await prisma.planningActivityDefinition.findMany({
          where: {
            activityCode: {
              in: activityCodes,
            },

            isActive: true,
            isArchived: false,

            OR: [
              {
                scopeKey:
                  "QOREVA",
              },
              {
                tenantId:
                  record.tenantId,
              },
            ],
          },
        })
      : [];

  const activityDefinitionMap =
    new Map<
      string,
      (typeof activityDefinitions)[number]
    >();

  for (
    const definition of
    activityDefinitions
  ) {
    const existing =
      activityDefinitionMap.get(
        definition.activityCode,
      );

    if (
      !existing ||
      (
        definition.tenantId ===
          record.tenantId &&
        existing.tenantId !==
          record.tenantId
      )
    ) {
      activityDefinitionMap.set(
        definition.activityCode,
        definition,
      );
    }
  }

  /*
   * Requirements Intelligence
   *
   * Do not load every active requirement in the
   * tenant into the Planning generation context.
   *
   * The shared resolver determines:
   *
   * 1. Which Requirement Packs apply to this
   *    company/project/contractor/plan context.
   *
   * 2. Which individual Requirement Rules apply
   *    based on deterministic trigger conditions.
   *
   * Only resolved applicable rules are passed
   * downstream to draft generation.
   */
  const requirementResolution =
    await resolveApplicablePlanningRequirements(
      record.id,
    );

  const requirements =
    requirementResolution.rules.map(
      (rule) => ({
        id:
          rule.id,

        name:
          rule.title,

        description:
          null,

        sourceType:
          rule.packType,

        sourceOrganization:
          rule.organizationName,

        severity:
          rule.severity,

        requirementText:
          rule.requirementText,

        requiredInformation:
          rule.requiredInformation,

        requiredControls:
          rule.requiredControls,

        sourceDocumentName:
          rule.sourceDocumentName,

        sourcePage:
          rule.sourcePage,
      }),
    );

  return {
    planningRecordId:
      record.id,

    tenantId:
      record.tenantId,

    planType:
      record.planType,

    title:
      record.title,

    status:
      record.status,

    revisionNumber:
      record.revisionNumber,

    project: {
      id:
        record.project.id,

      name:
        record.project.name,

      projectCode:
        record.project.projectCode,

      clientName:
        record.project.clientName,

      location:
        record.project.location,

      city:
        record.project.city,

      state:
        record.project.state,
    },

    contractor: {
      id:
        record.contractor?.id ??
        null,

      name:
        record.contractor?.name ??
        null,

      trade:
        record.contractor?.trade ??
        null,
    },

    assignment: {
      responsibleSupervisor:
        record.responsibleSupervisor,

      plannedStartDate:
        record.plannedStartDate
          ? record.plannedStartDate.toISOString()
          : null,

      workLocation:
        record.workLocation,

      crewSize:
        record.crewSize,

      shift:
        record.shift,
    },

    scope: {
      description:
        record.scopeDescription,

      equipmentTools:
        record.equipmentTools,

      materialsChemicals:
        record.materialsChemicals,

      adjacentWork:
        record.adjacentWork,

      specialConditions:
        record.specialConditions,
    },

    activities:
      record.activities.map(
        (activity) => {
          const definition =
            activityDefinitionMap.get(
              activity.activityCode,
            );

          return {
            activityCode:
              activity.activityCode,

            name:
              activity.name,

            category:
              activity.category,

            isHighRisk:
              definition?.isHighRisk ??
              false,

            detectionSource:
              activity.detectionSource,

            confidence:
              decimalToNumber(
                activity.aiConfidence,
              ),
          };
        },
      ),

    questions:
      record.questionResponses.map(
        (response) => {
          const definition =
            questionDefinitionMap.get(
              response.questionId,
            );

          return {
            questionCode:
              response.questionId,

            category:
              response.category,

            section:
              definition?.section ??
              null,

            questionText:
              response.question,

            questionType:
              definition?.questionType ??
              "Text",

            isRequired:
              definition?.isRequired ??
              false,

            isCritical:
              response.isCritical,

            responseValue:
              response.responseValue,

            notes:
              response.notes,
          };
        },
      ),

    workSteps:
      record.workSteps.map(
        (step) => ({
          workStepId:
            step.id,

          sequence:
            step.sequence,

          title:
            step.title,

          description:
            step.description,

          hazards:
            step.hazards,

          controls:
            step.controls,

          safetyCritical:
            step.safetyCritical,

          riskLevel:
            step.riskLevel,

          inherentRiskLevel:
            step.inherentRiskLevel,

          recommendedControlledRiskLevel:
            step.recommendedControlledRiskLevel,

          controlledRiskLevel:
            step.controlledRiskLevel,
        }),
      ),

    requirements,

    sourceDocuments:
      record.sourceDocuments.map(
        (source) => {
          const contractorDocument =
            source.contractorDocument;

          /*
           * PlanningSourceDocument is the authoritative
           * Planning-level source reference.
           *
           * Contractor documents retain their own document-
           * intelligence lifecycle. Direct Planning uploads
           * use the lifecycle stored directly on the
           * PlanningSourceDocument.
           *
           * AI-generated extraction is never treated as
           * confirmed safety information merely because a
           * document is present in this context.
           */
          return {
            id:
              source.id,

            sourceType:
              source.sourceType,

            label:
              source.label,

            contractorDocumentId:
              source.contractorDocumentId,

            documentType:
              contractorDocument
                ?.documentType ??
              source.aiDocumentType ??
              null,

            documentName:
              contractorDocument
                ?.documentName ??
              source.label ??
              source.fileName ??
              null,

            fileName:
              source.fileName ??
              contractorDocument
                ?.fileName ??
              null,

            mimeType:
              source.mimeType ??
              contractorDocument
                ?.mimeType ??
              null,

            approvalStatus:
              contractorDocument
                ?.approvalStatus ??
              source
                .approvalStatusAtSelection ??
              null,

            reviewStatus:
              contractorDocument
                ?.reviewStatus ??
              source
                .reviewStatusAtSelection ??
              null,

            aiProcessingStatus:
              contractorDocument
                ?.aiProcessingStatus ??
              source.aiProcessingStatus,

            aiDocumentType:
              contractorDocument
                ?.aiDocumentType ??
              source.aiDocumentType,

            aiConfidence:
              decimalToNumber(
                contractorDocument
                  ?.aiConfidence ??
                source.aiConfidence,
              ),

            isAiReady:
              contractorDocument
                ? isAiProcessingReady(
                    contractorDocument
                      .aiProcessingStatus,
                  )
                : source.isAiReady,
          };
        },
      ),

    hazardControlDecisions:
      activeHazardControlDecisions.map(
        (decision) => ({
          id:
            decision.id,

          revisionNumber:
            decision.revisionNumber,

          recommendationId:
            decision.recommendationId,

          itemType:
            decision.itemType as
              | "Hazard"
              | "Control",

          originalText:
            decision.originalText,

          decision:
            decision.decision as
              | "Assign"
              | "Accept"
              | "Modify"
              | "NotApplicable",

          modifiedText:
            decision.modifiedText,

          targetHazardId:
            decision.targetHazardId,

          targetHazards:
            decision.targets.map(
              (target) => ({
                hazardId:
                  target.hazardId,
                isPrimary:
                  target.isPrimary,
              }),
            ),

          canonicalHazardConceptId:
            decision.canonicalHazardConceptId,

          sourceType:
            decision.sourceType,

          sourceMetadata:
            decision.sourceMetadata,

          decidedById:
            decision.decidedById,

          decidedByName:
            decision.decidedByName,

          decidedByRole:
            decision.decidedByRole,

          decidedAt:
            decision.decidedAt.toISOString(),
        }),
      ),

    hazardControlOverrides:
      activeHazardControlOverrides.map(
        (override) => ({
          id:
            override.id,

          revisionNumber:
            override.revisionNumber,

          operationKey:
            override.operationKey,

          workStepId:
            override.workStepId,

          workStepSequence:
            override.workStepSequence,

          workStepTitle:
            override.workStepTitle,

          itemType:
            override.itemType as
              | "Hazard"
              | "Control",

          action:
            override.action as
              | "Add"
              | "Edit"
              | "Change"
              | "Remove",

          targetItemId:
            override.targetItemId,

          parentHazardId:
            override.parentHazardId,

          originalText:
            override.originalText,

          finalText:
            override.finalText,

          canonicalHazardConceptId:
            override.canonicalHazardConceptId,

          sourceType:
            override.sourceType,

          sourceMetadata:
            override.sourceMetadata,

          reason:
            override.reason,

          changedById:
            override.changedById,

          changedByName:
            override.changedByName,

          changedByRole:
            override.changedByRole,

          changedAt:
            override.changedAt.toISOString(),
        }),
      ),

    existingControls: {
      requiredPpe:
        record.requiredPpe,

      requiredPermits:
        record.requiredPermits,

      emergencyPlan:
        record.emergencyPlan,

      stopWorkTriggers:
        record.stopWorkTriggers,

      planningNotes:
        record.planningNotes,
    },
  };
}