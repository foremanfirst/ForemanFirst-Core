import {
  mkdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TENANT_ID = "development-tenant";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
]);

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(
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

    const formData = await request.formData();

    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          message:
            "Select one replacement document.",
        },
        {
          status: 400,
        },
      );
    }

    validateFile(fileEntry);

    const documentName =
      getOptionalString(
        formData.get("documentName"),
      ) ?? fileEntry.name;

    const effectiveDate = parseOptionalDate(
      formData.get("effectiveDate"),
      "Effective date",
    );

    const expirationDate = parseOptionalDate(
      formData.get("expirationDate"),
      "Expiration date",
    );

    const notes = getOptionalString(
      formData.get("notes"),
    );

    const uploadedBy = getOptionalString(
      formData.get("uploadedBy"),
    );

    if (
      effectiveDate &&
      expirationDate &&
      expirationDate.getTime() <
        effectiveDate.getTime()
    ) {
      return NextResponse.json(
        {
          message:
            "Expiration date cannot be before the effective date.",
        },
        {
          status: 400,
        },
      );
    }

    const existingDocument =
      await prisma.contractorDocument.findFirst({
        where: {
          id: cleanedDocumentId,
          tenantId: DEFAULT_TENANT_ID,
          isArchived: false,
          isActive: true,
        },

        select: {
          id: true,
          contractorId: true,
          projectId: true,
          documentType: true,
          storageProvider: true,
          storageKey: true,
        },
      });

    if (!existingDocument) {
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

    const uploadDirectory = path.join(
      process.cwd(),
      "storage",
      "contractor-documents",
      existingDocument.contractorId,
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const safeFileName = createSafeFileName(
      fileEntry.name,
    );

    const uniqueFileName =
      `${crypto.randomUUID()}-${safeFileName}`;

    const storageKey = path.posix.join(
      "contractor-documents",
      existingDocument.contractorId,
      uniqueFileName,
    );

    const absoluteFilePath = path.join(
      process.cwd(),
      "storage",
      storageKey,
    );

    const bytes = Buffer.from(
      await fileEntry.arrayBuffer(),
    );

    await writeFile(absoluteFilePath, bytes);

    try {
      const replacementDocument =
        await prisma.$transaction(
          async (transaction) => {
            const created =
              await transaction.contractorDocument.create({
                data: {
                  tenantId: DEFAULT_TENANT_ID,

                  contractorId:
                    existingDocument.contractorId,

                  projectId:
                    existingDocument.projectId,

                  documentType:
                    existingDocument.documentType,

                  documentName,

                  fileName: fileEntry.name,

                  mimeType:
                    fileEntry.type ||
                    "application/octet-stream",

                  fileSize: fileEntry.size,

                  storageProvider: "local",
                  storageKey,
                  storageUrl: null,

                  effectiveDate,
                  expirationDate,

                  approvalStatus: "Pending",
                  reviewStatus: "Not Reviewed",

                  notes,

                  aiProcessingStatus:
                    "Not Started",

                  uploadedBy,

                  isActive: true,
                  isArchived: false,
                  archivedAt: null,
                },
              });

            await transaction.contractorDocument.update({
              where: {
                id: existingDocument.id,
              },

              data: {
                isActive: false,
                isArchived: true,
                archivedAt: new Date(),
              },
            });

            return created;
          },
        );

      return NextResponse.json(
        {
          success: true,

          message:
            "Document replaced successfully. The previous version was archived.",

          document: {
            ...replacementDocument,

            effectiveDate:
              replacementDocument.effectiveDate?.toISOString() ??
              null,

            expirationDate:
              replacementDocument.expirationDate?.toISOString() ??
              null,

            reviewedAt:
              replacementDocument.reviewedAt?.toISOString() ??
              null,

            archivedAt:
              replacementDocument.archivedAt?.toISOString() ??
              null,

            createdAt:
              replacementDocument.createdAt.toISOString(),

            updatedAt:
              replacementDocument.updatedAt.toISOString(),

            aiConfidence:
              replacementDocument.aiConfidence === null
                ? null
                : Number(
                    replacementDocument.aiConfidence,
                  ),
          },
        },
        {
          status: 201,
        },
      );
    } catch (databaseError) {
      await unlink(absoluteFilePath).catch(
        () => undefined,
      );

      throw databaseError;
    }
  } catch (error) {
    console.error(
      "Replace contractor document error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to replace the contractor document.",
      },
      {
        status: 500,
      },
    );
  }
}

function validateFile(file: File) {
  if (file.size <= 0) {
    throw new Error(`${file.name} is empty.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `${file.name} exceeds the 20 MB file-size limit.`,
    );
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  const allowedExtension =
    ALLOWED_EXTENSIONS.has(extension ?? "");

  const allowedMimeType =
    ALLOWED_MIME_TYPES.has(file.type);

  if (!allowedExtension && !allowedMimeType) {
    throw new Error(
      `${file.name} is not a supported document type.`,
    );
  }
}

function createSafeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);

  return cleaned || "contractor-document";
}

function getOptionalString(
  value: FormDataEntryValue | null,
) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0
    ? cleaned
    : null;
}

function parseOptionalDate(
  value: FormDataEntryValue | null,
  fieldName: string,
) {
  const cleaned = getOptionalString(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(
    `${cleaned}T12:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${fieldName} contains an invalid date.`,
    );
  }

  return date;
}