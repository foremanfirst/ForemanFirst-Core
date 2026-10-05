import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

import {
  type EvaExistingAnswer,
  type EvaQuestionContext,
  type EvaWorkStepContext,
} from "@/lib/ai/eva";

import {
  buildEvaUserContext,
} from "@/lib/ai/eva/core/context-builder";

import {
  getEvaSkills,
} from "@/lib/ai/eva/core/skill-registry";

import {
  runEva,
} from "@/lib/ai/eva/core/orchestrator";

import type {
  EvaRuntimeContext,
} from "@/lib/ai/eva/core/context";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

function nullableString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    if (!planningRecordId) {
      return NextResponse.json(
        {
          message:
            "Planning Record ID is required.",
        },
        { status: 400 },
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body =
      await request.json();

    const questionCode =
      nullableString(
        body.questionCode,
      );

    const questionText =
      nullableString(
        body.questionText,
      );

    if (!questionText) {
      return NextResponse.json(
        {
          message:
            "Question text is required.",
        },
        { status: 400 },
      );
    }

    const userInstruction =
      nullableString(
        body.userInstruction,
      );

    if (
      !questionCode ||
      !userInstruction
    ) {
      return NextResponse.json(
        {
          message:
            "Question code and question text are required.",
        },
        { status: 400 },
      );
    }

    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,

          tenantId:
            authorization
              .planningRecord
              .tenantId,

          projectId:
            authorization
              .planningRecord
              .projectId,

          isArchived: false,
        },

        select: {
          id: true,
          tenantId: true,
          planType: true,
          title: true,

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
        },
      });

    if (!planningRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        { status: 404 },
      );
    }

    const workSteps: EvaWorkStepContext[] =
      planningRecord.workSteps.map(
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
      );

    const existingAnswers: EvaExistingAnswer[] =
      planningRecord.questionResponses.map(
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
      );

    const evaContext:
      EvaQuestionContext = {
        questionCode,

        questionText,

        questionType:
          nullableString(
            body.questionType,
          ) ?? "TextArea",

        helpText:
          nullableString(
            body.helpText,
          ),

        currentAnswer:
          nullableString(
            body.currentAnswer,
          ),

        currentNotes:
          nullableString(
            body.currentNotes,
          ),

        userInstruction,

        planTitle:
          planningRecord.title,

        planType:
          planningRecord.planType,

        workLocation:
          planningRecord.workLocation,

        crewSize:
          planningRecord.crewSize,

        shift:
          planningRecord.shift,

        scopeDescription:
          planningRecord.scopeDescription,

        equipmentTools:
          planningRecord.equipmentTools,

        materialsChemicals:
          planningRecord.materialsChemicals,

        adjacentWork:
          planningRecord.adjacentWork,

        specialConditions:
          planningRecord.specialConditions,

        requiredPpe:
          planningRecord.requiredPpe,

        requiredPermits:
          planningRecord.requiredPermits,

        emergencyPlan:
          planningRecord.emergencyPlan,

        stopWorkTriggers:
          planningRecord.stopWorkTriggers,

        workSteps,

        existingAnswers,
      };

    /*
     * ----------------------------------------------------------
     * Route the existing draft-answer capability through Eva.
     *
     * Authorization has already been established above through
     * requireAuthorizedPlanningEditor().
     *
     * The question-specific EvaQuestionContext remains owned by
     * this Planning route. Eva does not manufacture it.
     * ----------------------------------------------------------
     */

    const availableSkillIds =
      getEvaSkills().map(
        (skill) =>
          skill.id,
      );

    const {
      userContext,
      projectContext,
    } =
      await buildEvaUserContext(
        authorization.user,
        {
          tenantId:
            planningRecord.tenantId,

          projectId:
            authorization.planningRecord.projectId,

          userMessage:
            userInstruction,

          currentModule:
            "planning",

          currentRecordId:
            planningRecordId,

          availableSkillIds,
        },
      );

    const evaRuntimeContext:
      EvaRuntimeContext = {
        conversation: {
          user:
            userContext,

          project:
            projectContext,

          currentModule:
            "planning",

          currentRecordId:
            planningRecordId,

          userMessage:
            userInstruction,
        },

        user:
          userContext,

        project:
          projectContext,

        availableSkillIds,

        metadata: {
          requestId:
            crypto.randomUUID(),

          questionCode,
        },
      };

    const evaResponse =
      await runEva(
        evaRuntimeContext,
        {
          requestedToolId:
            "planning.generateDraftAnswer",

          toolInput:
            evaContext,
        },
      );

    return NextResponse.json({
      success: true,

      planningRecordId,

      questionCode,

      result:
        evaResponse.data,

      eva: {
        message:
          evaResponse.message,

        sourceSkill:
          evaResponse.sourceSkill,

        sourceTool:
          evaResponse.sourceTool,

        requiresConfirmation:
          evaResponse.requiresConfirmation,
      },
    });
  } catch (error) {
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
      "Eva draft-answer request failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Eva was unable to generate a response.",
      },
      {
        status: 500,
      },
    );
  }
}
