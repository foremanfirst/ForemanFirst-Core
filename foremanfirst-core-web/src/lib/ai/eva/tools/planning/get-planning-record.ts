/**
 * Eva Planning Tool
 *
 * Read-only access to a Planning Record.
 *
 * This tool MUST reuse Qoreva's existing Planning Reader
 * authorization boundary. Eva never bypasses normal
 * tenant/project authorization.
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import "server-only";

import { prisma } from "@/lib/prisma";

import {
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

export type EvaPlanningRecordResult = {
  planningRecord: {
    id: string;
    tenantId: string;
    projectId: string;

    title: string;
    planType: string;

    status: string;
    revisionNumber: number;

    responsibleSupervisor: string | null;

    plannedStartDate: Date | null;
    effectiveStartDate: Date | null;
    effectiveEndDate: Date | null;

    workLocation: string | null;
    crewSize: number | null;
    shift: string | null;

    scopeDescription: string | null;
    equipmentTools: string | null;
    materialsChemicals: string | null;
    adjacentWork: string | null;
    specialConditions: string | null;

    requiredPpe: string | null;
    requiredPermits: string | null;
    emergencyPlan: string | null;
    stopWorkTriggers: string | null;

    planningNotes: string | null;

    submittedAt: Date | null;
    approvedAt: Date | null;
    activeAt: Date | null;

    createdAt: Date;
    updatedAt: Date;

    company: {
      id: string;
      name: string;
    };

    project: {
      id: string;
      name: string;
      projectCode: string | null;
      clientName: string | null;
    };

    contractor: {
      id: string;
      name: string;
      legalName: string | null;
      trade: string | null;
    } | null;

    workSteps: Array<{
      sequence: number;
      title: string;
      description: string | null;
      equipmentTools: string | null;
      materialsChemicals: string | null;
      locationOverride: string | null;
      hazards: string | null;
      controls: string | null;
      safetyCritical: boolean;
    }>;

    existingAnswers: Array<{
      questionId: string;
      category: string;
      question: string;
      helpText: string | null;
      isCritical: boolean;
      responseValue: string | null;
      notes: string | null;
    }>;

    counts: {
      workSteps: number;
      activities: number;
      questions: number;
      sourceDocuments: number;
      reviews: number;
      signatures: number;
      dailyWseRecords: number;
      hazardControlDecisions: number;
      controlEvaluations: number;
      criticalControlDecisions: number;
    };
  };

  authorization: {
    roleCodes: string[];
    canCreatePlanning: boolean;
    canReviewPlanning: boolean;
    canApprovePlanning: boolean;
    canManagePlanning: boolean;
  };
};

export async function getEvaPlanningRecord(
  planningRecordId: string,
): Promise<EvaPlanningRecordResult> {
  if (!planningRecordId.trim()) {
    throw new Error(
      "Eva requires a planning record ID.",
    );
  }

  /*
   * IMPORTANT:
   *
   * Eva does not perform its own authorization.
   *
   * We reuse the exact same Planning Reader authorization
   * used by the Qoreva Planning API.
   */
  const authorization =
    await requireAuthorizedPlanningReader(
      planningRecordId,
    );

  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        tenantId:
          authorization.planningRecord.tenantId,
        projectId:
          authorization.planningRecord.projectId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
        projectId: true,

        title: true,
        planType: true,

        status: true,
        revisionNumber: true,

        responsibleSupervisor: true,

        plannedStartDate: true,
        effectiveStartDate: true,
        effectiveEndDate: true,

        workLocation: true,
        crewSize: true,
        shift: true,

        scopeDescription: true,
        equipmentTools: true,
        materialsChemicals: true,
        adjacentWork: true,
        specialConditions: true,

        requiredPpe: true,
        requiredPermits: true,
        emergencyPlan: true,
        stopWorkTriggers: true,

        planningNotes: true,

        submittedAt: true,
        approvedAt: true,
        activeAt: true,

        createdAt: true,
        updatedAt: true,

        company: {
          select: {
            id: true,
            name: true,
          },
        },

        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            clientName: true,
          },
        },

        contractor: {
          select: {
            id: true,
            name: true,
            legalName: true,
            trade: true,
          },
        },

        workSteps: {
          orderBy: {
            sequence: "asc",
          },

          select: {
            sequence: true,
            title: true,
            description: true,
            equipmentTools: true,
            materialsChemicals: true,
            locationOverride: true,
            hazards: true,
            controls: true,
            safetyCritical: true,
          },
        },

        questionResponses: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            questionId: true,
            category: true,
            question: true,
            helpText: true,
            isCritical: true,
            responseValue: true,
            notes: true,
          },
        },

        _count: {
          select: {
            workSteps: true,
            activities: true,
            questionResponses: true,
            sourceDocuments: true,
            reviews: true,
            signatures: true,
            dailyWseRecords: true,
            hazardControlDecisions: true,
            controlEvaluations: true,
            criticalControlDecisions: true,
          },
        },
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  return {
    planningRecord: {
      id: record.id,
      tenantId: record.tenantId,
      projectId: record.projectId,

      title: record.title,
      planType: record.planType,

      status: record.status,
      revisionNumber:
        record.revisionNumber,

      responsibleSupervisor:
        record.responsibleSupervisor,

      plannedStartDate:
        record.plannedStartDate,
      effectiveStartDate:
        record.effectiveStartDate,
      effectiveEndDate:
        record.effectiveEndDate,

      workLocation:
        record.workLocation,
      crewSize:
        record.crewSize,
      shift:
        record.shift,

      scopeDescription:
        record.scopeDescription,
      equipmentTools:
        record.equipmentTools,
      materialsChemicals:
        record.materialsChemicals,
      adjacentWork:
        record.adjacentWork,
      specialConditions:
        record.specialConditions,

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

      submittedAt:
        record.submittedAt,
      approvedAt:
        record.approvedAt,
      activeAt:
        record.activeAt,

      createdAt:
        record.createdAt,
      updatedAt:
        record.updatedAt,

      company:
        record.company,

      project:
        record.project,

      contractor:
        record.contractor,

      workSteps:
        record.workSteps.map(
          (step) => ({
            sequence:
              step.sequence,

            title:
              step.title,

            description:
              step.description,

            equipmentTools:
              step.equipmentTools,

            materialsChemicals:
              step.materialsChemicals,

            locationOverride:
              step.locationOverride,

            hazards:
              step.hazards,

            controls:
              step.controls,

            safetyCritical:
              step.safetyCritical,
          }),
        ),

      existingAnswers:
        record.questionResponses.map(
          (response) => ({
            questionId:
              response.questionId,

            category:
              response.category,

            question:
              response.question,

            helpText:
              response.helpText,

            isCritical:
              response.isCritical,

            responseValue:
              response.responseValue,

            notes:
              response.notes,
          }),
        ),

      counts: {
        workSteps:
          record._count.workSteps,

        activities:
          record._count.activities,

        questions:
          record._count.questionResponses,

        sourceDocuments:
          record._count.sourceDocuments,

        reviews:
          record._count.reviews,

        signatures:
          record._count.signatures,

        dailyWseRecords:
          record._count.dailyWseRecords,

        hazardControlDecisions:
          record._count.hazardControlDecisions,

        controlEvaluations:
          record._count.controlEvaluations,

        criticalControlDecisions:
          record._count.criticalControlDecisions,
      },
    },

    authorization: {
      roleCodes:
        authorization.membership.roleCodes,

      canCreatePlanning:
        authorization.membership
          .canCreatePlanning,

      canReviewPlanning:
        authorization.membership
          .canReviewPlanning,

      canApprovePlanning:
        authorization.membership
          .canApprovePlanning,

      canManagePlanning:
        authorization.membership
          .canManagePlanning,
    },
  };
}
