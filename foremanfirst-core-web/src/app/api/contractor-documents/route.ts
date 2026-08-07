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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const contractorId = getRequiredString(
      formData.get("contractorId"),
      "Contractor ID",
    );

    const requestedProjectId = getOptionalString(
      formData.get("projectId"),
    );

    const documentType =
      getOptionalString(formData.get("documentType")) ??
      "Other";

    const customDocumentName = getOptionalString(
      formData.get("documentName"),
    );

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

    const files = formData
      .getAll("files")
      .filter(
        (value): value is File =>
          value instanceof File,
      );

    if (files.length === 0) {
      return NextResponse.json(
        {
          message: "Select at least one document.",
        },
        {
          status: 400,
        },
      );
    }

    for (const file of files) {
      validateFile(file);
    }

    const contractor =
      await prisma.contractor.findFirst({
        where: {
          id: contractorId,
          tenantId: DEFAULT_TENANT_ID,
          isArchived: false,
        },

        select: {
          id: true,
          projectId: true,
        },
      });

    if (!contractor) {
      return NextResponse.json(
        {
          message:
            "The selected contractor could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const resolvedProjectId =
      requestedProjectId ??
      contractor.projectId ??
      null;

    if (resolvedProjectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: resolvedProjectId,
          tenantId: DEFAULT_TENANT_ID,
          isArchived: false,
        },

        select: {
          id: true,
        },
      });

      if (!project) {
        return NextResponse.json(
          {
            message:
              "The selected project could not be found.",
          },
          {
            status: 404,
          },
        );
      }
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "storage",
      "contractor-documents",
      contractorId,
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const createdDocuments = [];

    for (const file of files) {
      const safeFileName = createSafeFileName(
        file.name,
      );

      const uniqueFileName =
        `${crypto.randomUUID()}-${safeFileName}`;

      const storageKey = path.posix.join(
        "contractor-documents",
        contractorId,
        uniqueFileName,
      );

      const absoluteFilePath = path.join(
        process.cwd(),
        "storage",
        storageKey,
      );

      const bytes = Buffer.from(
        await file.arrayBuffer(),
      );

      await writeFile(absoluteFilePath, bytes);

      try {
        const documentName =
          customDocumentName &&
          files.length === 1
            ? customDocumentName
            : file.name;

        const document =
          await prisma.contractorDocument.create({
            data: {
              tenantId: DEFAULT_TENANT_ID,

              contractorId,
              projectId: resolvedProjectId,

              documentType,
              documentName,

              fileName: file.name,
              mimeType:
                file.type ||
                "application/octet-stream",
              fileSize: file.size,

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

        createdDocuments.push({
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
        });
      } catch (databaseError) {
        await unlink(absoluteFilePath).catch(
          () => undefined,
        );

        throw databaseError;
      }
    }

    return NextResponse.json(
      {
        message: `${createdDocuments.length} document${
          createdDocuments.length === 1
            ? ""
            : "s"
        } uploaded successfully.`,

        documents: createdDocuments,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Upload contractor documents error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to upload contractor documents.",
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

function getRequiredString(
  value: FormDataEntryValue | null,
  fieldName: string,
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
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