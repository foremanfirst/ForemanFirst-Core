import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

import {
  analyzePlanningSourceDocument,
  PlanningDocumentAnalysisError,
} from "@/lib/planning/document-intelligence/analyze-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    sourceDocumentId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  let planningRecordId = "";
  let sourceDocumentId = "";

  try {
    const params =
      await context.params;

    planningRecordId =
      params.planningRecordId?.trim() ?? "";

    sourceDocumentId =
      params.sourceDocumentId?.trim() ?? "";

    if (!planningRecordId) {
      return NextResponse.json(
        {
          message:
            "Planning record ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!sourceDocumentId) {
      return NextResponse.json(
        {
          message:
            "Source document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const tenantId =
      authorization.planningRecord.tenantId;

    /*
     * Document Intelligence is currently a Draft-only
     * planning operation. This prevents analysis from
     * silently changing the intelligence associated with
     * an already-submitted PTP.
     */
    if (
      authorization.planningRecord.status !==
      "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Document Intelligence can only be run while the Planning record is in Draft status.",
        },
        {
          status: 409,
        },
      );
    }

    const document =
      await prisma.planningSourceDocument.findFirst({
        where: {
          id: sourceDocumentId,
          planningRecordId,
          tenantId,
        },

        select: {
          id: true,
          fileName: true,
          aiProcessingStatus: true,
          isAiReady: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          message:
            "The Planning source document could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Prevent two users or two UI requests from
     * simultaneously sending the same document
     * through the AI provider.
     */
    if (
      document.aiProcessingStatus
        ?.trim()
        .toLowerCase() ===
      "processing"
    ) {
      return NextResponse.json(
        {
          message:
            "This document is already being analyzed.",
          status: "Processing",
          documentId: document.id,
        },
        {
          status: 409,
        },
      );
    }

    await prisma.planningSourceDocument.update({
      where: {
        id: document.id,
      },

      data: {
        aiProcessingStatus:
          "Processing",

        /*
         * A new analysis must not automatically
         * become AI-ready. Human confirmation is
         * still required.
         */
        isAiReady:
          false,
      },
    });

    try {
      const result =
        await analyzePlanningSourceDocument({
          planningRecordId,
          sourceDocumentId,
          tenantId,
        });

      await prisma.planningSourceDocument.update({
        where: {
          id: document.id,
        },

        data: {
          aiProcessingStatus:
            "Complete",

          aiDocumentType:
            result.documentType ??
            null,

          aiConfidence:
            result.confidence,

          /*
           * AI analysis alone does not satisfy
           * the qualified-user confirmation boundary.
           */
          isAiReady:
            false,
        },
      });

      return NextResponse.json({
        status: result.status,

        document: {
          id: document.id,
          fileName:
            document.fileName,
          aiProcessingStatus:
            "Complete",
          isAiReady:
            false,
        },

        analysis: result,
      });
    } catch (error) {
      await prisma.planningSourceDocument.update({
        where: {
          id: document.id,
        },

        data: {
          aiProcessingStatus:
            "Failed",

          isAiReady:
            false,
        },
      });

      throw error;
    }
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

    if (
      error instanceof
      PlanningDocumentAnalysisError
    ) {
      return NextResponse.json(
        {
          message:
            error.message,
          code:
            error.code,
        },
        {
          status: 422,
        },
      );
    }

    console.error(
      "Qoreva Document Intelligence API error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to analyze the Planning source document.",
      },
      {
        status: 500,
      },
    );
  }
}
