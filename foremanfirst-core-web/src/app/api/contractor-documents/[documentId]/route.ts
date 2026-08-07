import { readFile, stat } from "node:fs/promises";
import path from "node:path";

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

export async function GET(
  request: Request,
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
        },

        select: {
          id: true,
          fileName: true,
          documentName: true,
          mimeType: true,
          storageProvider: true,
          storageKey: true,
          isActive: true,
          isArchived: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          message: "The document could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    if (document.storageProvider !== "local") {
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

    const storageRoot = path.resolve(
      process.cwd(),
      "storage",
    );

    const absoluteFilePath = path.resolve(
      storageRoot,
      document.storageKey,
    );

    const relativePath = path.relative(
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
      const fileStats = await stat(
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

    const fileBuffer = await readFile(
      absoluteFilePath,
    );

    const requestUrl = new URL(request.url);

    const shouldDownload =
      requestUrl.searchParams.get("download") ===
      "1";

    const displayName =
      document.documentName ||
      document.fileName ||
      "contractor-document";

    const safeDisplayName =
      sanitizeHeaderFileName(displayName);

    const contentDisposition = shouldDownload
      ? `attachment; filename="${safeDisplayName}"`
      : `inline; filename="${safeDisplayName}"`;

    return new Response(fileBuffer, {
      status: 200,

      headers: {
        "Content-Type":
          document.mimeType ||
          "application/octet-stream",

        "Content-Length": String(
          fileBuffer.length,
        ),

        "Content-Disposition":
          contentDisposition,

        "Cache-Control":
          "private, no-store, max-age=0",

        "X-Content-Type-Options": "nosniff",
      },
    });
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

function sanitizeHeaderFileName(
  fileName: string,
) {
  const cleaned = fileName
    .replace(/[\r\n"]/g, "")
    .trim();

  return cleaned.length > 0
    ? cleaned
    : "contractor-document";
}