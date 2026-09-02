import {
  mkdir,
  unlink,
  writeFile,
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

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ALLOWED_FILE_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type AllowedExtension =
  keyof typeof ALLOWED_FILE_TYPES;

type PendingPlanningUpload = {
  originalFileName: string;
  safeFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  absoluteFilePath: string;
  bytes: Buffer;
  label: string | null;
};

class PlanningSourceDocumentRequestError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400,
  ) {
    super(message);

    this.name =
      "PlanningSourceDocumentRequestError";

    this.status =
      status;
  }
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
    } = await context.params;

    const cleanedPlanningRecordId =
      planningRecordId?.trim();

    if (!cleanedPlanningRecordId) {
      throw new PlanningSourceDocumentRequestError(
        "Planning record ID is required.",
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        cleanedPlanningRecordId,
      );

    const sourceDocuments =
      await prisma.planningSourceDocument.findMany({
        where: {
          planningRecordId:
            authorization
              .planningRecord.id,

          tenantId:
            authorization
              .planningRecord
              .tenantId,
        },

        orderBy: [
          {
            createdAt:
              "asc",
          },
          {
            id:
              "asc",
          },
        ],

        select: {
          id: true,
          planningRecordId: true,
          contractorDocumentId:
            true,

          sourceType: true,
          label: true,

          fileName: true,
          mimeType: true,
          fileSize: true,

          storageProvider:
            true,
          storageKey: true,
          storageUrl: true,

          isSelected: true,

          aiProcessingStatus:
            true,

          aiDocumentType:
            true,

          aiConfidence:
            true,

          isAiReady: true,

          approvalStatusAtSelection:
            true,

          reviewStatusAtSelection:
            true,

          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      planningRecordId:
        authorization
          .planningRecord.id,

      revisionNumber:
        authorization
          .planningRecord
          .revisionNumber,

      documents:
        sourceDocuments.map(
          (document) => ({
            ...document,

            createdAt:
              document.createdAt.toISOString(),

            updatedAt:
              document.updatedAt.toISOString(),
          }),
        ),
    });
  } catch (error) {
    return handleRouteError(
      error,
      "Unable to load Planning source documents.",
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const writtenFiles:
    string[] = [];

  try {
    const {
      planningRecordId,
    } = await context.params;

    const cleanedPlanningRecordId =
      planningRecordId?.trim();

    if (!cleanedPlanningRecordId) {
      throw new PlanningSourceDocumentRequestError(
        "Planning record ID is required.",
      );
    }

    const authorization =
      await requireAuthorizedPlanningEditor(
        cleanedPlanningRecordId,
      );

    /*
     * Source-document changes are part of
     * authoring the official Planning revision.
     *
     * Once submitted, evidence must remain
     * stable for review, approvals,
     * signatures, finalization, and audit.
     */
    if (
      authorization
        .planningRecord
        .status !== "Draft"
    ) {
      throw new PlanningSourceDocumentRequestError(
        "Planning source documents can only be uploaded while the planning record is in Draft status.",
        409,
      );
    }

    const formData =
      await request.formData();

    const files =
      formData
        .getAll("files")
        .filter(
          (
            value,
          ): value is File =>
            value instanceof File,
        );

    if (
      files.length === 0
    ) {
      throw new PlanningSourceDocumentRequestError(
        "Select at least one Planning source document.",
      );
    }

    const requestedLabel =
      getOptionalString(
        formData.get(
          "label",
        ),
      );

    const uploadDirectory =
      path.join(
        process.cwd(),
        "storage",
        "planning-documents",
        authorization
          .planningRecord.id,
      );

    await mkdir(
      uploadDirectory,
      {
        recursive:
          true,
      },
    );

    const pendingUploads:
      PendingPlanningUpload[] =
      [];

    for (
      const file of files
    ) {
      const {
        extension,
        mimeType,
      } = validateFile(
        file,
      );

      const safeFileName =
        createSafeFileName(
          file.name,
          extension,
        );

      const uniqueFileName =
        `${crypto.randomUUID()}-${safeFileName}`;

      const storageKey =
        path.posix.join(
          "planning-documents",
          authorization
            .planningRecord.id,
          uniqueFileName,
        );

      const absoluteFilePath =
        path.join(
          process.cwd(),
          "storage",
          storageKey,
        );

      const bytes =
        Buffer.from(
          await file.arrayBuffer(),
        );

      pendingUploads.push({
        originalFileName:
          file.name,

        safeFileName,

        mimeType,
        fileSize:
          file.size,

        storageKey,
        absoluteFilePath,
        bytes,

        label:
          requestedLabel &&
          files.length === 1
            ? requestedLabel
            : null,
      });
    }

    /*
     * Write the physical files first.
     *
     * If any later database operation fails,
     * every file written by this request is
     * removed in the catch block below.
     */
    for (
      const upload of
      pendingUploads
    ) {
      await writeFile(
        upload.absoluteFilePath,
        upload.bytes,
      );

      writtenFiles.push(
        upload.absoluteFilePath,
      );
    }

    const createdDocuments =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Re-read authoritative lifecycle
           * state inside the transaction so a
           * concurrent submit cannot silently
           * turn these files into post-submit
           * evidence.
           */
          const currentRecord =
            await tx.planningRecord.findFirst({
              where: {
                id:
                  authorization
                    .planningRecord.id,

                tenantId:
                  authorization
                    .planningRecord
                    .tenantId,

                projectId:
                  authorization
                    .planningRecord
                    .projectId,

                isArchived:
                  false,
              },

              select: {
                id: true,
                tenantId: true,
                projectId: true,
                status: true,
                revisionNumber:
                  true,
              },
            });

          if (
            !currentRecord
          ) {
            throw new PlanningSourceDocumentRequestError(
              "Planning record was not found.",
              404,
            );
          }

          if (
            currentRecord.status !==
            "Draft"
          ) {
            throw new PlanningSourceDocumentRequestError(
              "The planning record changed before the source documents could be saved. Only Draft planning records can accept new source documents.",
              409,
            );
          }

          if (
            currentRecord
              .revisionNumber !==
            authorization
              .planningRecord
              .revisionNumber
          ) {
            throw new PlanningSourceDocumentRequestError(
              "The Planning revision changed before the source documents could be saved. Refresh the planning record and try again.",
              409,
            );
          }

          const results =
            [];

          for (
            const upload of
            pendingUploads
          ) {
            const document =
              await tx.planningSourceDocument.create({
                data: {
                  tenantId:
                    currentRecord
                      .tenantId,

                  planningRecordId:
                    currentRecord.id,

                  contractorDocumentId:
                    null,

                  sourceType:
                    "PlanUpload",

                  label:
                    upload.label,

                  fileName:
                    upload.originalFileName,

                  mimeType:
                    upload.mimeType,

                  fileSize:
                    upload.fileSize,

                  storageProvider:
                    "local",

                  storageKey:
                    upload.storageKey,

                  storageUrl:
                    null,

                  isSelected:
                    true,

                  /*
                   * Upload persistence does not
                   * imply AI extraction,
                   * human confirmation, or
                   * requirements ingestion has
                   * occurred.
                   */
                  aiProcessingStatus:
                    "Not Started",

                  aiDocumentType:
                    null,

                  aiConfidence:
                    null,

                  /*
                   * extractedData and confirmedData
                   * intentionally remain unset until
                   * document intelligence processing
                   * and qualified-user confirmation
                   * occur.
                   */
                  isAiReady:
                    false,

                  approvalStatusAtSelection:
                    null,

                  reviewStatusAtSelection:
                    null,
                },

                /*
                 * Generic upload responses expose document
                 * lifecycle metadata only. AI extraction and
                 * confirmed intelligence require a dedicated
                 * controlled review endpoint.
                 */
                select: {
                  id: true,
                  planningRecordId: true,
                  contractorDocumentId:
                    true,

                  sourceType: true,
                  label: true,

                  fileName: true,
                  mimeType: true,
                  fileSize: true,

                  storageProvider:
                    true,
                  storageKey: true,
                  storageUrl: true,

                  isSelected: true,

                  aiProcessingStatus:
                    true,
                  aiDocumentType:
                    true,
                  aiConfidence:
                    true,
                  isAiReady: true,

                  approvalStatusAtSelection:
                    true,
                  reviewStatusAtSelection:
                    true,

                  createdAt: true,
                  updatedAt: true,
                },
              });

            await tx.planningEvent.create({
              data: {
                tenantId:
                  currentRecord
                    .tenantId,

                planningRecordId:
                  currentRecord.id,

                eventType:
                  "Planning Source Document Uploaded",

                previousStatus:
                  currentRecord
                    .status,

                newStatus:
                  currentRecord
                    .status,

                revisionNumber:
                  currentRecord
                    .revisionNumber,

                actorId:
                  authorization
                    .user.id,

                actorRole:
                  authorization
                    .membership
                    .roleCodes
                    .join(", ") ||
                  null,

                comment:
                  null,

                metadata: {
                  sourceDocumentId:
                    document.id,

                  sourceType:
                    document.sourceType,

                  fileName:
                    document.fileName,

                  mimeType:
                    document.mimeType,

                  fileSize:
                    document.fileSize,

                  storageProvider:
                    document.storageProvider,

                  aiProcessingStatus:
                    document.aiProcessingStatus,

                  isAiReady:
                    document.isAiReady,
                },
              },
            });

            results.push(
              document,
            );
          }

          return results;
        },
      );

    return NextResponse.json(
      {
        message:
          `${createdDocuments.length} Planning source document${
            createdDocuments.length ===
            1
              ? ""
              : "s"
          } uploaded successfully.`,

        planningRecordId:
          authorization
            .planningRecord.id,

        revisionNumber:
          authorization
            .planningRecord
            .revisionNumber,

        documents:
          createdDocuments.map(
            (document) => ({
              ...document,

              createdAt:
                document.createdAt.toISOString(),

              updatedAt:
                document.updatedAt.toISOString(),
            }),
          ),
      },
      {
        status:
          201,
      },
    );
  } catch (error) {
    /*
     * Database persistence is transactional.
     * Filesystem writes are not, so explicitly
     * compensate if anything after the write
     * fails.
     */
    await Promise.all(
      writtenFiles.map(
        (filePath) =>
          unlink(
            filePath,
          ).catch(
            () =>
              undefined,
          ),
      ),
    );

    return handleRouteError(
      error,
      "Unable to upload Planning source documents.",
    );
  }
}

function validateFile(
  file: File,
): {
  extension: AllowedExtension;
  mimeType: string;
} {
  if (
    file.size <= 0
  ) {
    throw new PlanningSourceDocumentRequestError(
      `${file.name} is empty.`,
    );
  }

  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new PlanningSourceDocumentRequestError(
      `${file.name} exceeds the 20 MB file-size limit.`,
    );
  }

  const rawExtension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    !rawExtension ||
    !Object.prototype.hasOwnProperty.call(
      ALLOWED_FILE_TYPES,
      rawExtension,
    )
  ) {
    throw new PlanningSourceDocumentRequestError(
      `${file.name} is not a supported document type. Upload a PDF, JPG, JPEG, or PNG file.`,
    );
  }

  const extension =
    rawExtension as AllowedExtension;

  const expectedMimeType =
    ALLOWED_FILE_TYPES[
      extension
    ];

  /*
   * Browser MIME metadata is useful but
   * should not be the only validation.
   *
   * Empty/octet-stream is tolerated because
   * some clients do not provide a useful
   * MIME type. A conflicting MIME type is
   * rejected.
   */
  if (
    file.type &&
    file.type !==
      "application/octet-stream" &&
    file.type !==
      expectedMimeType
  ) {
    throw new PlanningSourceDocumentRequestError(
      `${file.name} has a file type that does not match its extension.`,
    );
  }

  return {
    extension,
    mimeType:
      expectedMimeType,
  };
}

function createSafeFileName(
  fileName: string,
  extension: AllowedExtension,
) {
  const extensionSuffix =
    `.${extension}`;

  const withoutExtension =
    fileName
      .slice(
        0,
        Math.max(
          0,
          fileName.length -
            extensionSuffix.length,
        ),
      )
      .trim();

  const cleanedBase =
    withoutExtension
      .replace(
        /[^a-zA-Z0-9._-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^[-.]+|[-.]+$/g,
        "",
      )
      .slice(
        0,
        160,
      );

  return `${
    cleanedBase ||
    "planning-document"
  }.${extension}`;
}

function getOptionalString(
  value:
    | FormDataEntryValue
    | null,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned.length >
    0
    ? cleaned
    : null;
}

function handleRouteError(
  error: unknown,
  fallbackMessage: string,
) {
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
    PlanningSourceDocumentRequestError
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
    fallbackMessage,
    error,
  );

  return NextResponse.json(
    {
      message:
        error instanceof Error
          ? error.message
          : fallbackMessage,
    },
    {
      status:
        500,
    },
  );
}
