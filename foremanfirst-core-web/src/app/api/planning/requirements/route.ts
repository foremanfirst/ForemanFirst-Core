import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  isAiProcessingReady,
} from "@/lib/planning/document-intelligence";
import {
  PlanningCreatorAuthorizationError,
  requireAuthorizedPlanningCreator,
} from "@/lib/planning/planning-creator-authorization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const projectId = searchParams.get("projectId");
    const contractorId = searchParams.get("contractorId");

    if (!projectId) {
      return NextResponse.json(
        {
          message: "Project ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!contractorId) {
      return NextResponse.json(
        {
          message: "Contractor ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningCreator(
        projectId,
      );

    /*
     * Confirm that the selected project and contractor exist.
     *
     * We also verify that the contractor belongs to the selected
     * project before returning planning information.
     */
    const [project, contractor] = await Promise.all([
      prisma.project.findFirst({
        where: {
          id: projectId,
          tenantId:
            authorization.project.tenantId,
          isArchived: false,
          isActive: true,
        },
        select: {
          id: true,
          tenantId: true,
          name: true,
          projectCode: true,
          clientName: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.contractor.findFirst({
        where: {
          id: contractorId,
          tenantId:
            authorization.project.tenantId,
          projectId:
            authorization.project.id,
          isArchived: false,
          isActive: true,
        },
        select: {
          id: true,
          tenantId: true,
          name: true,
          legalName: true,
          trade: true,
          projectId: true,
          companyId: true,
          approvalStatus: true,
          complianceStatus: true,
        },
      }),
    ]);

    if (!project) {
      return NextResponse.json(
        {
          message: "Project not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!contractor) {
      return NextResponse.json(
        {
          message: "Contractor not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Multi-tenant protection.
     *
     * Never allow planning information to be combined across
     * different tenants.
     */
    if (project.tenantId !== contractor.tenantId) {
      return NextResponse.json(
        {
          message:
            "The selected project and contractor do not belong to the same tenant.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * The contractor must be assigned to the selected project.
     */
    if (contractor.projectId !== project.id) {
      return NextResponse.json(
        {
          message:
            "The selected contractor is not assigned to this project.",
        },
        {
          status: 400,
        },
      );
    }

    const tenantId = project.tenantId;

    /*
     * Load:
     *
     * 1. Project document requirements
     * 2. Contractor documents
     *
     * Archived/inactive records are excluded.
     */
    const [requirements, documents] = await Promise.all([
      prisma.contractorDocumentRequirement.findMany({
        where: {
          tenantId,
          projectId: project.id,
          isActive: true,
          isArchived: false,
        },
        select: {
          id: true,
          documentType: true,
          name: true,
          description: true,
          isRequired: true,
          expirationRequired: true,
          reviewRequired: true,
          sortOrder: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      }),

      prisma.contractorDocument.findMany({
        where: {
          tenantId,
          contractorId: contractor.id,
          isActive: true,
          isArchived: false,

          /*
           * Include:
           * - company-level contractor documents
           * - documents specifically assigned to this project
           *
           * Do not bring documents belonging to another project
           * into this planning workflow.
           */
          OR: [
            {
              projectId: null,
            },
            {
              projectId: project.id,
            },
          ],
        },
        select: {
          id: true,
          projectId: true,

          documentType: true,
          documentName: true,

          fileName: true,
          mimeType: true,
          fileSize: true,

          effectiveDate: true,
          expirationDate: true,

          approvalStatus: true,
          reviewStatus: true,

          notes: true,

          aiProcessingStatus: true,
          aiDocumentType: true,
          aiConfidence: true,

          uploadedBy: true,
          reviewedBy: true,
          reviewedAt: true,

          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          {
            documentType: "asc",
          },
          {
            documentName: "asc",
          },
        ],
      }),
    ]);

    const now = new Date();

    /*
     * Add planning-specific status information without modifying
     * the underlying contractor document record.
     */
    const planningDocuments = documents.map((document) => {
      const isExpired =
        document.expirationDate !== null &&
        document.expirationDate.getTime() < now.getTime();

      const isAiReady =
        isAiProcessingReady(
          document.aiProcessingStatus,
        );

      /*
       * Safe default:
       *
       * Qoreva may display every available document, but only
       * recommends automatic inclusion when the document is:
       *
       * - not expired
       * - approved
       * - reviewed
       * - AI processed
       *
       * The user still makes the final selection.
       */
      const recommendedForAi =
        !isExpired &&
        document.approvalStatus.toLowerCase() === "approved" &&
        ["reviewed", "approved", "complete", "completed"].includes(
          document.reviewStatus.toLowerCase(),
        ) &&
        isAiReady;

      return {
        ...document,

        planningStatus: {
          isExpired,
          isAiReady,
          recommendedForAi,
        },
      };
    });

    /*
     * Match project requirements against the contractor's
     * available document types.
     */
    const requirementResults = requirements.map((requirement) => {
      const matchingDocuments = planningDocuments.filter(
        (document) =>
          document.documentType.trim().toLowerCase() ===
          requirement.documentType.trim().toLowerCase(),
      );

      const currentMatchingDocuments = matchingDocuments.filter(
        (document) => !document.planningStatus.isExpired,
      );

      const approvedMatchingDocuments = currentMatchingDocuments.filter(
        (document) =>
          document.approvalStatus.toLowerCase() === "approved",
      );

      return {
        ...requirement,

        status: {
          hasDocument: matchingDocuments.length > 0,

          hasCurrentDocument:
            currentMatchingDocuments.length > 0,

          hasApprovedDocument:
            approvedMatchingDocuments.length > 0,

          matchingDocumentIds: matchingDocuments.map(
            (document) => document.id,
          ),
        },
      };
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        clientName: project.clientName,
        company: project.company,
      },

      contractor: {
        id: contractor.id,
        name: contractor.name,
        legalName: contractor.legalName,
        trade: contractor.trade,
        approvalStatus: contractor.approvalStatus,
        complianceStatus: contractor.complianceStatus,
      },

      requirements: requirementResults,

      documents: planningDocuments,

      summary: {
        totalRequirements: requirementResults.length,

        requiredRequirements: requirementResults.filter(
          (requirement) => requirement.isRequired,
        ).length,

        requirementsWithDocuments: requirementResults.filter(
          (requirement) => requirement.status.hasDocument,
        ).length,

        requirementsWithApprovedDocuments: requirementResults.filter(
          (requirement) =>
            requirement.status.hasApprovedDocument,
        ).length,

        totalDocuments: planningDocuments.length,

        aiReadyDocuments: planningDocuments.filter(
          (document) => document.planningStatus.isAiReady,
        ).length,

        recommendedAiDocuments: planningDocuments.filter(
          (document) =>
            document.planningStatus.recommendedForAi,
        ).length,

        expiredDocuments: planningDocuments.filter(
          (document) => document.planningStatus.isExpired,
        ).length,
      },
    });
  } catch (error) {
    if (
      error instanceof
        PlanningCreatorAuthorizationError
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
      "Planning requirements load failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load planning requirements and safety documents.",
      },
      {
        status: 500,
      },
    );
  }
}