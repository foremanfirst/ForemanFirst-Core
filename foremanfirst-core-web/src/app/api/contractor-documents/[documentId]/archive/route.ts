import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "development-tenant";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { documentId } = await context.params;

    const cleanedDocumentId = documentId?.trim();

    if (!cleanedDocumentId) {
      return NextResponse.json(
        {
          message: "Document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const document =
      await prisma.contractorDocument.findFirst({
        where: {
          id: cleanedDocumentId,
          tenantId: DEFAULT_TENANT_ID,
          isArchived: false,
        },

        select: {
          id: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          message:
            "The document could not be found or is already archived.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.contractorDocument.update({
      where: {
        id: document.id,
      },

      data: {
        isArchived: true,
        isActive: false,
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document archived successfully.",
    });
  } catch (error) {
    console.error(
      "Archive contractor document error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to archive the contractor document.",
      },
      {
        status: 500,
      },
    );
  }
}