import {
  readFile,
  stat,
} from "node:fs/promises";

import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID =
  "development-tenant";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

type ReviewAction =
  | "approve"
  | "needs-revision"
  | "reject";

type ReviewRequestBody = {
  action?: ReviewAction;
  comment?: string;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { documentId } =
      await context.params;

    const cleanedDocumentId =
      documentId?.trim();

    if (!cleanedDocumentId) {
      return NextResponse.json(
        {
          message:
            "Document ID is required.",
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
          tenantId:
            DEFAULT_TENANT_ID,
        },

        select: {
          id: true,
          tenantId: true,
          contractorId: true,

          fileName: true,
          documentName: true,

          mimeType: true,

          storageProvider: true,
          storageKey: true,

          approvalStatus: true,
          reviewStatus: true,

          reviewedBy: true,

          isActive: true,
          isArchived: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          message:
            "The document could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    if (document.isArchived) {
      return NextResponse.json(
        {
          message:
            "This document has been archived.",
        },
        {
          status: 410,
        },
      );
    }

    if (!document.isActive) {
      return NextResponse.json(
        {
          message:
            "This document is not active.",
        },
        {
          status: 410,
        },
      );
    }

    if (
      document.storageProvider !==
      "local"
    ) {
      return NextResponse.json(
        {
          message:
            "This document is not stored using the local storage provider.",
        },
        {
          status: 400,
        },
      );
    }

    const storageRoot =
      path.resolve(
        process.cwd(),
        "storage",
      );

    const absoluteFilePath =
      path.resolve(
        storageRoot,
        document.storageKey,
      );

    const relativePath =
      path.relative(
        storageRoot,
        absoluteFilePath,
      );

    const pointsOutsideStorage =
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath);

    if (pointsOutsideStorage) {
      console.error(
        "Blocked invalid contractor-document storage path:",
        document.storageKey,
      );

      return NextResponse.json(
        {
          message:
            "The document storage path is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    try {
      const fileStats =
        await stat(
          absoluteFilePath,
        );

      if (!fileStats.isFile()) {
        return NextResponse.json(
          {
            message:
              "The stored document is not a valid file.",
          },
          {
            status: 404,
          },
        );
      }
    } catch {
      return NextResponse.json(
        {
          message:
            "The document record exists, but the stored file could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const fileBuffer =
      await readFile(
        absoluteFilePath,
      );

    const requestUrl =
      new URL(
        request.url,
      );

    const shouldDownload =
      requestUrl.searchParams.get(
        "download",
      ) === "1";

    /*
     * Viewing:
     *
     * Not Reviewed -> Viewed
     *
     * Downloading does not affect review status.
     *
     * We use a transaction so the document status
     * update and VIEWED audit event stay together.
     */
    if (
      !shouldDownload &&
      normalizeStatus(
        document.reviewStatus,
      ) === "not reviewed"
    ) {
      const viewedAt =
        new Date();

      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.contractorDocument.updateMany({
              where: {
                id:
                  cleanedDocumentId,

                tenantId:
                  DEFAULT_TENANT_ID,

                reviewStatus:
                  "Not Reviewed",

                isArchived:
                  false,

                isActive:
                  true,
              },

              data: {
                reviewStatus:
                  "Viewed",

                reviewedAt:
                  viewedAt,
              },
            });

          /*
           * Only create the event if this request
           * actually performed the state transition.
           *
           * This prevents duplicate Viewed events
           * when the file is opened repeatedly.
           */
          if (
            updated.count > 0
          ) {
            await transaction.contractorDocumentEvent.create({
              data: {
                tenantId:
                  document.tenantId,

                contractorDocumentId:
                  document.id,

                contractorId:
                  document.contractorId,

                eventType:
                  "VIEWED",

                previousApprovalStatus:
                  document.approvalStatus,

                newApprovalStatus:
                  document.approvalStatus,

                previousReviewStatus:
                  document.reviewStatus,

                newReviewStatus:
                  "Viewed",

                comment:
                  null,

                performedBy:
                  document.reviewedBy ??
                  null,

                createdAt:
                  viewedAt,
              },
            });
          }
        },
      );
    }

    const displayName =
      document.documentName ||
      document.fileName ||
      "contractor-document";

    const safeDisplayName =
      sanitizeHeaderFileName(
        displayName,
      );

    const contentDisposition =
      shouldDownload
        ? `attachment; filename="${safeDisplayName}"`
        : `inline; filename="${safeDisplayName}"`;

    return new Response(
      fileBuffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            document.mimeType ||
            "application/octet-stream",

          "Content-Length":
            String(
              fileBuffer.length,
            ),

          "Content-Disposition":
            contentDisposition,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "Serve contractor document error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to open the contractor document.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { documentId } =
      await context.params;

    const cleanedDocumentId =
      documentId?.trim();

    if (!cleanedDocumentId) {
      return NextResponse.json(
        {
          message:
            "Document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    let body:
      ReviewRequestBody;

    try {
      body =
        (await request.json()) as ReviewRequestBody;
    } catch {
      return NextResponse.json(
        {
          message:
            "A valid JSON request body is required.",
        },
        {
          status: 400,
        },
      );
    }

    const action =
      body.action;

    const comment =
      body.comment?.trim() ??
      "";

    if (
      action !== "approve" &&
      action !==
        "needs-revision" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          message:
            "A valid review action is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      (
        action ===
          "needs-revision" ||
        action === "reject"
      ) &&
      !comment
    ) {
      return NextResponse.json(
        {
          message:
            action ===
            "needs-revision"
              ? "A comment is required when requesting a revision."
              : "A comment is required when rejecting a document.",
        },
        {
          status: 400,
        },
      );
    }

    const document =
      await prisma.contractorDocument.findFirst({
        where: {
          id:
            cleanedDocumentId,

          tenantId:
            DEFAULT_TENANT_ID,
        },

        select: {
          id: true,
          tenantId: true,
          contractorId: true,

          documentName: true,
          fileName: true,

          approvalStatus: true,
          reviewStatus: true,

          notes: true,

          reviewedBy: true,

          isActive: true,
          isArchived: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          message:
            "The document could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    if (document.isArchived) {
      return NextResponse.json(
        {
          message:
            "Archived documents cannot be reviewed.",
        },
        {
          status: 409,
        },
      );
    }

    if (!document.isActive) {
      return NextResponse.json(
        {
          message:
            "Inactive documents cannot be reviewed.",
        },
        {
          status: 409,
        },
      );
    }

    const currentReviewStatus =
      normalizeStatus(
        document.reviewStatus,
      );

    /*
     * Backend safeguard:
     *
     * A brand-new document cannot receive a
     * decision until it has actually been opened.
     *
     * Existing decisions may later be changed.
     */
    const hasReachedReviewStage =
      currentReviewStatus ===
        "viewed" ||
      currentReviewStatus ===
        "reviewed" ||
      currentReviewStatus ===
        "approved" ||
      currentReviewStatus ===
        "needs revision" ||
      currentReviewStatus ===
        "needs-revision" ||
      currentReviewStatus ===
        "rejected";

    if (!hasReachedReviewStage) {
      return NextResponse.json(
        {
          message:
            "Open and view this document before making a review decision.",
        },
        {
          status: 409,
        },
      );
    }

    const reviewDecision =
      getReviewDecision(
        action,
      );

    const eventType =
      getReviewEventType(
        action,
      );

    const reviewedAt =
      new Date();

    /*
     * Current document state and historical event
     * are written together in one transaction.
     *
     * Document notes are NOT modified.
     */
    const updatedDocument =
      await prisma.$transaction(
        async (transaction) => {
          const updated =
            await transaction.contractorDocument.update({
              where: {
                id:
                  document.id,
              },

              data: {
                approvalStatus:
                  reviewDecision.approvalStatus,

                reviewStatus:
                  reviewDecision.reviewStatus,

                reviewedAt:
                  reviewedAt,
              },

              select: {
                id: true,

                documentName: true,
                fileName: true,

                approvalStatus: true,
                reviewStatus: true,

                notes: true,

                reviewedBy: true,
                reviewedAt: true,

                updatedAt: true,
              },
            });

          await transaction.contractorDocumentEvent.create({
            data: {
              tenantId:
                document.tenantId,

              contractorDocumentId:
                document.id,

              contractorId:
                document.contractorId,

              eventType,

              previousApprovalStatus:
                document.approvalStatus,

              newApprovalStatus:
                reviewDecision.approvalStatus,

              previousReviewStatus:
                document.reviewStatus,

              newReviewStatus:
                reviewDecision.reviewStatus,

              comment:
                comment ||
                null,

              performedBy:
                document.reviewedBy ??
                null,

              createdAt:
                reviewedAt,
            },
          });

          return updated;
        },
      );

    return NextResponse.json(
      {
        message:
          reviewDecision.message,

        previousDecision: {
          approvalStatus:
            document.approvalStatus,

          reviewStatus:
            document.reviewStatus,
        },

        currentDecision: {
          approvalStatus:
            updatedDocument.approvalStatus,

          reviewStatus:
            updatedDocument.reviewStatus,
        },

        document: {
          ...updatedDocument,

          reviewedAt:
            updatedDocument.reviewedAt?.toISOString() ??
            null,

          updatedAt:
            updatedDocument.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Review contractor document error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to review the contractor document.",
      },
      {
        status: 500,
      },
    );
  }
}

function getReviewDecision(
  action:
    ReviewAction,
) {
  switch (action) {
    case "approve":
      return {
        approvalStatus:
          "Approved",

        reviewStatus:
          "Approved",

        message:
          "Document approved successfully.",
      };

    case "needs-revision":
      return {
        approvalStatus:
          "Needs Revision",

        reviewStatus:
          "Needs Revision",

        message:
          "Document returned for revision.",
      };

    case "reject":
      return {
        approvalStatus:
          "Rejected",

        reviewStatus:
          "Rejected",

        message:
          "Document rejected.",
      };
  }
}

function getReviewEventType(
  action:
    ReviewAction,
) {
  switch (action) {
    case "approve":
      return "APPROVED";

    case "needs-revision":
      return "NEEDS_REVISION";

    case "reject":
      return "REJECTED";
  }
}

function normalizeStatus(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .toLowerCase() ??
    ""
  );
}

function sanitizeHeaderFileName(
  fileName:
    string,
) {
  const cleaned =
    fileName
      .replace(
        /[\r\n"]/g,
        "",
      )
      .trim();

  return cleaned.length > 0
    ? cleaned
    : "contractor-document";
}