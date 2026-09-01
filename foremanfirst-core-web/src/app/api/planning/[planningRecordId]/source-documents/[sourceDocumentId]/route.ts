import {
  readFile,
  stat,
} from "node:fs/promises";

import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    sourceDocumentId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      sourceDocumentId,
    } = await context.params;

    const cleanedPlanningRecordId =
      planningRecordId?.trim();

    const cleanedSourceDocumentId =
      sourceDocumentId?.trim();

    if (!cleanedPlanningRecordId) {
      return NextResponse.json(
        {
          message:
            "Planning Record ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!cleanedSourceDocumentId) {
      return NextResponse.json(
        {
          message:
            "Source Document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        cleanedPlanningRecordId,
      );

    const document =
      await prisma.planningSourceDocument.findFirst({
        where: {
          id:
            cleanedSourceDocumentId,

          planningRecordId:
            cleanedPlanningRecordId,

          tenantId:
            authorization.planningRecord.tenantId,
        },

        select: {
          id: true,
          tenantId: true,
          planningRecordId: true,
          sourceType: true,
          label: true,
          fileName: true,
          mimeType: true,
          storageProvider: true,
          storageKey: true,
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

    if (
      document.storageProvider !==
      "local"
    ) {
      return NextResponse.json(
        {
          message:
            "This source document is not stored using the local storage provider.",
        },
        {
          status: 400,
        },
      );
    }

    if (!document.storageKey) {
      return NextResponse.json(
        {
          message:
            "This source document does not have a stored file.",
        },
        {
          status: 404,
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
      path.isAbsolute(
        relativePath,
      );

    if (pointsOutsideStorage) {
      console.error(
        "Blocked invalid Planning source-document storage path:",
        document.storageKey,
      );

      return NextResponse.json(
        {
          message:
            "The source-document storage path is invalid.",
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
              "The stored source document is not a valid file.",
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
            "The source-document record exists, but the stored file could not be found.",
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

    const displayName =
      document.label ||
      document.fileName ||
      "planning-source-document";

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
      "Serve Planning source document error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to open the Planning source document.",
      },
      {
        status: 500,
      },
    );
  }
}

function sanitizeHeaderFileName(
  value: string,
) {
  const sanitized =
    value
      .replace(
        /[\r\n"]/g,
        "",
      )
      .trim();

  return (
    sanitized ||
    "planning-source-document"
  );
}
