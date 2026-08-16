import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

type SignatureInput = {
  role?: string;
  signerId?: string | null;
  signerName?: string;
  signerEmail?: string | null;
  isRequired?: boolean;
  sortOrder?: number;
  status?: string;
  signatureType?: string;
  signatureDataUrl?: string | null;
  signedAt?: string | null;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function toPositiveInt(
  value: unknown,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function toNonNegativeInt(
  value: unknown,
  fallback: number,
) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return parsed;
}

function toNullableDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const parsed =
    new Date(value);

  return Number.isNaN(
    parsed.getTime(),
  )
    ? null
    : parsed;
}

function isPngDataUrl(
  value: string,
) {
  return value.startsWith(
    "data:image/png;base64,",
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const body =
      await request.json();

    if (body.acknowledged !== true) {
      return NextResponse.json(
        {
          message:
            "Final submission acknowledgement is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingRecord =
      await prisma.planningRecord.findFirst({
        where: {
          id: planningRecordId,
          isArchived: false,
        },
        select: {
          id: true,
          tenantId: true,
          status: true,
          revisionNumber: true,
          submittedAt: true,
        },
      });

    if (!existingRecord) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingRecord.status ===
      "Submitted"
    ) {
      const record =
        await prisma.planningRecord.findUnique({
          where: {
            id: planningRecordId,
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        });

      return NextResponse.json({
        record,
        saved: {
          signatures:
            await prisma.planningSignature.count({
              where: {
                planningRecordId,
                revisionNumber:
                  existingRecord.revisionNumber,
              },
            }),
        },
      });
    }

    if (
      existingRecord.status !== "Draft"
    ) {
      return NextResponse.json(
        {
          message:
            "Only Draft planning records can be submitted.",
        },
        {
          status: 409,
        },
      );
    }

    const revisionNumber =
      toPositiveInt(
        body.revisionNumber,
        existingRecord.revisionNumber,
      );

    if (
      revisionNumber !==
      existingRecord.revisionNumber
    ) {
      return NextResponse.json(
        {
          message:
            "Submission revision does not match the planning record's active revision.",
        },
        {
          status: 409,
        },
      );
    }

    const [
      revision,
      completedReview,
    ] = await Promise.all([
      prisma.planningRevision.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
        },
        select: {
          id: true,
        },
      }),

      prisma.planningReview.findFirst({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
          status: "Completed",
        },
        orderBy: {
          completedAt: "desc",
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!revision) {
      return NextResponse.json(
        {
          message:
            "A saved draft revision is required before submission.",
        },
        {
          status: 409,
        },
      );
    }

    if (!completedReview) {
      return NextResponse.json(
        {
          message:
            "A completed qualified review is required before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const openCommentCount =
      await prisma.planningReviewComment.count({
        where: {
          planningRecordId,
          tenantId:
            existingRecord.tenantId,
          revisionNumber,
          status: "Open",
        },
      });

    if (openCommentCount > 0) {
      return NextResponse.json(
        {
          message:
            "Resolve all open review comments before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const signatures =
      Array.isArray(body.signatures)
        ? (body.signatures as SignatureInput[])
        : [];

    if (signatures.length === 0) {
      return NextResponse.json(
        {
          message:
            "At least one signature is required.",
        },
        {
          status: 400,
        },
      );
    }

    const invalidSignature =
      signatures.find(
        (signature) => {
          const role =
            toNullableString(
              signature.role,
            );
          const signerName =
            toNullableString(
              signature.signerName,
            );
          const status =
            toNullableString(
              signature.status,
            ) ?? "Pending";

          if (
            !role ||
            !signerName
          ) {
            return true;
          }

          if (
            ![
              "Pending",
              "Signed",
            ].includes(status)
          ) {
            return true;
          }

          if (
            status === "Signed"
          ) {
            const image =
              toNullableString(
                signature.signatureDataUrl,
              );

            if (
              !image ||
              !isPngDataUrl(image)
            ) {
              return true;
            }

            // Keep inline signature payloads bounded for MVP.
            if (
              image.length >
              1_500_000
            ) {
              return true;
            }
          }

          return false;
        },
      );

    if (invalidSignature) {
      return NextResponse.json(
        {
          message:
            "One or more signature records are incomplete or invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const pendingRequired =
      signatures.filter(
        (signature) =>
          signature.isRequired ===
            true &&
          (
            toNullableString(
              signature.status,
            ) ?? "Pending"
          ) !== "Signed",
      );

    if (
      pendingRequired.length > 0
    ) {
      return NextResponse.json(
        {
          message:
            "All required signatures must be completed before submission.",
        },
        {
          status: 409,
        },
      );
    }

    const submittedAt =
      new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          await tx.planningSignature.deleteMany({
            where: {
              planningRecordId,
              tenantId:
                existingRecord.tenantId,
              revisionNumber,
            },
          });

          await tx.planningSignature.createMany({
            data:
              signatures.map(
                (
                  signature,
                  index,
                ) => {
                  const status =
                    toNullableString(
                      signature.status,
                    ) ?? "Pending";

                  return {
                    tenantId:
                      existingRecord.tenantId,
                    planningRecordId,
                    revisionNumber,

                    role:
                      toNullableString(
                        signature.role,
                      )!,
                    signerId:
                      toNullableString(
                        signature.signerId,
                      ),
                    signerName:
                      toNullableString(
                        signature.signerName,
                      )!,
                    signerEmail:
                      toNullableString(
                        signature.signerEmail,
                      ),

                    isRequired:
                      signature.isRequired !==
                      false,
                    sortOrder:
                      toNonNegativeInt(
                        signature.sortOrder,
                        index,
                      ),

                    status,
                    signatureType:
                      toNullableString(
                        signature.signatureType,
                      ) ??
                      "Drawn",

                    // MVP persistence: store the PNG data URL directly in the
                    // URL field. Move this to S3/Azure Blob before broad rollout.
                    signatureStorageProvider:
                      status === "Signed"
                        ? "inline-data-url"
                        : null,
                    signatureStorageKey:
                      null,
                    signatureStorageUrl:
                      status === "Signed"
                        ? toNullableString(
                            signature.signatureDataUrl,
                          )
                        : null,

                    signedAt:
                      status === "Signed"
                        ? toNullableDate(
                            signature.signedAt,
                          ) ??
                          submittedAt
                        : null,

                    userAgent:
                      request.headers.get(
                        "user-agent",
                      ),
                  };
                },
              ),
          });

          const record =
            await tx.planningRecord.update({
              where: {
                id: planningRecordId,
              },
              data: {
                status:
                  "Submitted",
                submittedAt,
              },
              select: {
                id: true,
                status: true,
                submittedAt: true,
                revisionNumber: true,
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                existingRecord.tenantId,
              planningRecordId,
              eventType:
                "Planning Record Submitted",
              previousStatus:
                existingRecord.status,
              newStatus:
                "Submitted",
              revisionNumber,
              actorName:
                toNullableString(
                  body.submittedByName,
                ),
              actorRole:
                toNullableString(
                  body.submittedByRole,
                ),
              comment:
                "Planning record submitted after completed qualified review and required signatures.",
              metadata: {
                planningRevisionId:
                  revision.id,
                planningReviewId:
                  completedReview.id,
                signatureCount:
                  signatures.length,
                requiredSignatureCount:
                  signatures.filter(
                    (signature) =>
                      signature.isRequired ===
                      true,
                  ).length,
                acknowledgement:
                  true,
              },
            },
          });

          return record;
        },
      );

    return NextResponse.json({
      record: result,
      saved: {
        signatures:
          signatures.length,
      },
    });
  } catch (error) {
    console.error(
      "Unable to submit planning record:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to submit planning record.",
      },
      {
        status: 500,
      },
    );
  }
}