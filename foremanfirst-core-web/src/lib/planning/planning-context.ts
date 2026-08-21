import { prisma } from "@/lib/prisma";

import type {
  PlanningGenerationContext,
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
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

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

  const applicableRequirementRules =
    await prisma.requirementRule.findMany({
      where: {
        tenantId:
          record.tenantId,

        isActive: true,

        status: {
          in: [
            "Active",
            "Approved",
          ],
        },

        requirementPack: {
          isActive: true,
          isArchived: false,
          status: {
            in: [
              "Active",
              "Approved",
            ],
          },
        },
      },

      include: {
        requirementPack: true,
      },

      orderBy: [
        {
          category: "asc",
        },
        {
          ruleCode: "asc",
        },
      ],
    });

  const requirements =
    applicableRequirementRules.map(
      (rule) => ({
        id: rule.id,

        name:
          rule.title,

        description: null,

        sourceType:
          rule.requirementPack
            .packType,

        sourceOrganization:
          rule.requirementPack
            .organizationName,

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
        }),
      ),

    requirements,

    sourceDocuments:
      record.sourceDocuments
        .filter(
          (source) =>
            Boolean(
              source.contractorDocument,
            ),
        )
        .map((source) => {
          const document =
            source.contractorDocument!;

          return {
            id:
              document.id,

            documentType:
              document.documentType,

            documentName:
              document.documentName,

            fileName:
              document.fileName,

            approvalStatus:
              document.approvalStatus,

            reviewStatus:
              document.reviewStatus,

            aiProcessingStatus:
              document.aiProcessingStatus,

            aiDocumentType:
              document.aiDocumentType,

            aiConfidence:
              decimalToNumber(
                document.aiConfidence,
              ),
          };
        }),

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