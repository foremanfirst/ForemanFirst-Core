import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

function nullableString(
  value: unknown,
) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed
    ? trimmed
    : null;
}

type AuthoritativeQuestion = {
  category: string;
  question: string;
  helpText: string | null;
  isCritical: boolean;
};

/*
 * Resolve definition-owned question metadata on the server.
 *
 * The browser owns only the planner's responseValue and notes.
 * It does not get to define the question, category, help text,
 * criticality, tenant, revision, or document provenance.
 */
async function resolveAuthoritativeQuestion({
  planningRecordId,
  tenantId,
  revisionNumber,
  questionCode,
}: {
  planningRecordId: string;
  tenantId: string;
  revisionNumber: number;
  questionCode: string;
}): Promise<AuthoritativeQuestion | null> {
  if (questionCode.startsWith("DOC_")) {
    const candidateId =
      questionCode.slice(4).trim();

    if (!candidateId) {
      return null;
    }

    const candidate =
      await prisma.planningQuestionCandidate.findFirst({
        where: {
          id: candidateId,
          tenantId,
          planningRecordId,
          revisionNumber,

          status: {
            in: [
              "Proposed",
              "Accepted",
            ],
          },

          sourceDocument: {
            is: {
              planningRecordId,
              tenantId,
              isSelected: true,
              aiProcessingStatus:
                "Complete",
            },
          },
        },

        select: {
          category: true,
          questionText: true,
          helpText: true,
          isCritical: true,
        },
      });

    if (!candidate) {
      return null;
    }

    return {
      category:
        candidate.category,
      question:
        candidate.questionText,
      helpText:
        candidate.helpText,
      isCritical:
        candidate.isCritical,
    };
  }

  /*
   * Deterministic question visibility remains context-sensitive
   * and is evaluated by the normal question-evaluation pipeline.
   *
   * For autosave, we validate that the supplied stable code maps
   * to an active Qoreva or tenant-owned definition, then take all
   * definition-owned metadata from that server record.
   *
   * We deliberately do not recompute visibility on every keystroke;
   * doing so could reject a legitimate newly-visible question while
   * other live Planning context is still being persisted.
   */
  const definition =
    await prisma.planningQuestionDefinition.findFirst({
      where: {
        questionCode,
        isActive: true,
        isArchived: false,

        OR: [
          {
            tenantId: "QOREVA",
          },
          {
            tenantId,
          },
        ],
      },

      orderBy: {
        version: "desc",
      },

      select: {
        category: true,
        questionText: true,
        helpText: true,
        isCritical: true,
      },
    });

  if (!definition) {
    return null;
  }

  return {
    category:
      definition.category,
    question:
      definition.questionText,
    helpText:
      definition.helpText,
    isCritical:
      definition.isCritical,
  };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

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

    if (!questionCode) {
      return NextResponse.json(
        {
          error:
            "Question code is required.",
        },
        {
          status: 400,
        },
      );
    }

    const planningRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,

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
          id: true,
          tenantId: true,
          revisionNumber: true,
          status: true,
        },
      });

    if (!planningRecord) {
      return NextResponse.json(
        {
          error:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Autosave currently belongs to the editable Draft workflow.
     * Later lifecycle states should use their own explicit revision /
     * change-management workflows rather than silently modifying an
     * approved or submitted Planning record.
     */
    if (
      planningRecord.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          error:
            "Guided Planning answers can only be edited while the Planning record is in Draft.",
        },
        {
          status: 409,
        },
      );
    }

    const existingResponse =
      await prisma.planningQuestionResponse.findUnique({
        where: {
          planningRecordId_questionId: {
            planningRecordId,
            questionId:
              questionCode,
          },
        },

        select: {
          id: true,
          category: true,
          question: true,
          helpText: true,
          isCritical: true,
        },
      });

    /*
     * Existing persisted responses already have definition metadata.
     * Preserve that metadata and update only planner-owned fields.
     *
     * New responses must first resolve against an authoritative
     * server-side question definition or eligible current-revision
     * Document Intelligence candidate.
     */
    const authoritativeQuestion =
      existingResponse
        ? {
            category:
              existingResponse.category,
            question:
              existingResponse.question,
            helpText:
              existingResponse.helpText,
            isCritical:
              existingResponse.isCritical,
          }
        : await resolveAuthoritativeQuestion({
            planningRecordId,
            tenantId:
              planningRecord.tenantId,
            revisionNumber:
              planningRecord.revisionNumber,
            questionCode,
          });

    if (!authoritativeQuestion) {
      return NextResponse.json(
        {
          error:
            "Question is not available for this Planning record.",
        },
        {
          status: 400,
        },
      );
    }

    const responseValue =
      nullableString(
        body.responseValue,
      );

    const notes =
      nullableString(
        body.notes,
      );

    const saved =
      await prisma.planningQuestionResponse.upsert({
        where: {
          planningRecordId_questionId: {
            planningRecordId,
            questionId:
              questionCode,
          },
        },

        create: {
          tenantId:
            planningRecord.tenantId,
          planningRecordId,
          questionId:
            questionCode,
          category:
            authoritativeQuestion.category,
          question:
            authoritativeQuestion.question,
          helpText:
            authoritativeQuestion.helpText,
          isCritical:
            authoritativeQuestion.isCritical,
          responseValue,
          notes,
        },

        update: {
          responseValue,
          notes,
        },

        select: {
          id: true,
          questionId: true,
          responseValue: true,
          notes: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      response: saved,
    });
  } catch (error) {
    if (
      error instanceof
      PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Unable to autosave Guided Planning answer:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to autosave Guided Planning answer.",
      },
      {
        status: 500,
      },
    );
  }
}
