import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "development-tenant";

type RouteContext = {
  params: Promise<{
    contractorId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { contractorId } = await context.params;

    const cleanedContractorId =
      contractorId?.trim();

    if (!cleanedContractorId) {
      return NextResponse.json(
        {
          message: "Contractor ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const contractor =
      await prisma.contractor.findFirst({
        where: {
          id: cleanedContractorId,
          tenantId: DEFAULT_TENANT_ID,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!contractor) {
      return NextResponse.json(
        {
          message:
            "The contractor could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const archivedDocuments =
      await prisma.contractorDocument.findMany({
        where: {
          contractorId: contractor.id,
          tenantId: DEFAULT_TENANT_ID,
          isArchived: true,
        },

        select: {
          id: true,
          tenantId: true,

          contractorId: true,
          projectId: true,

          documentType: true,
          documentName: true,

          fileName: true,
          mimeType: true,
          fileSize: true,

          storageProvider: true,
          storageKey: true,
          storageUrl: true,

          effectiveDate: true,
          expirationDate: true,

          approvalStatus: true,
          reviewStatus: true,

          notes: true,

          aiProcessingStatus: true,
          aiDocumentType: true,
          aiConfidence: true,
          extractedData: true,
          confirmedData: true,

          uploadedBy: true,
          reviewedBy: true,
          reviewedAt: true,

          isActive: true,
          isArchived: true,
          archivedAt: true,

          createdAt: true,
          updatedAt: true,
        },

        orderBy: [
          {
            archivedAt: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],
      });

    const documents = archivedDocuments.map(
      (document) => ({
        ...document,

        effectiveDate:
          document.effectiveDate?.toISOString() ??
          null,

        expirationDate:
          document.expirationDate?.toISOString() ??
          null,

        reviewedAt:
          document.reviewedAt?.toISOString() ??
          null,

        archivedAt:
          document.archivedAt?.toISOString() ??
          null,

        createdAt:
          document.createdAt.toISOString(),

        updatedAt:
          document.updatedAt.toISOString(),

        aiConfidence:
          document.aiConfidence === null
            ? null
            : Number(document.aiConfidence),
      }),
    );

    return NextResponse.json(
      {
        contractor: {
          id: contractor.id,
          name: contractor.name,
        },

        total: documents.length,
        documents,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Load contractor document history error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load contractor document history.",
      },
      {
        status: 500,
      },
    );
  }
}