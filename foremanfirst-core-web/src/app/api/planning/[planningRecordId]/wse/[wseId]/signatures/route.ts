import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
    wseId: string;
  }>;
};

function toNullableString(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

async function findWse(
  planningRecordId: string,
  wseId: string,
) {
  return prisma.dailyWorkerSafetyEngagement.findFirst({
    where: {
      id:
        wseId,
      planningRecordId,
    },

    select: {
      id: true,
      tenantId: true,
      planningRecordId: true,
      revisionNumber: true,
      status: true,
    },
  });
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      wseId,
    } =
      await context.params;

    const wse =
      await findWse(
        planningRecordId,
        wseId,
      );

    if (!wse) {
      return NextResponse.json(
        {
          message:
            "Daily WSE was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const signatures =
      await prisma.dailyWorkerSafetyEngagementSignature.findMany({
        where: {
          dailyWseId:
            wseId,
          tenantId:
            wse.tenantId,
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    return NextResponse.json({
      signatures,
    });
  } catch (error) {
    console.error(
      "Unable to load Daily WSE worker acknowledgements:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load Daily WSE worker acknowledgements.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      planningRecordId,
      wseId,
    } =
      await context.params;

    const body =
      await request.json();

    const wse =
      await findWse(
        planningRecordId,
        wseId,
      );

    if (!wse) {
      return NextResponse.json(
        {
          message:
            "Daily WSE was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      wse.status ===
      "Completed"
    ) {
      return NextResponse.json(
        {
          message:
            "Completed Daily WSE records are locked.",
        },
        {
          status: 409,
        },
      );
    }

    const workerName =
      toNullableString(
        body.workerName,
      );

    if (!workerName) {
      return NextResponse.json(
        {
          message:
            "Worker name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      body.acknowledged !==
      true
    ) {
      return NextResponse.json(
        {
          message:
            "The worker must acknowledge the Daily WSE before signing.",
        },
        {
          status: 400,
        },
      );
    }

    const now =
      new Date();

    const signature =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.dailyWorkerSafetyEngagementSignature.create({
              data: {
                tenantId:
                  wse.tenantId,

                dailyWseId:
                  wseId,

                workerId:
                  toNullableString(
                    body.workerId,
                  ),

                workerName,

                workerEmail:
                  toNullableString(
                    body.workerEmail,
                  ),

                acknowledgementStatus:
                  "Signed",

                /*
                 * MVP identity capture.
                 * Future: Drawn signature + face verification token.
                 */
                signatureType:
                  "Electronic Acknowledgement",

                signedAt:
                  now,

                signedInAt:
                  now,

                ipAddress:
                  toNullableString(
                    body.ipAddress,
                  ),

                userAgent:
                  toNullableString(
                    body.userAgent,
                  ),

                deviceInfo:
                  toNullableString(
                    body.deviceInfo,
                  ),
              },
            });

          await tx.planningEvent.create({
            data: {
              tenantId:
                wse.tenantId,

              planningRecordId:
                wse.planningRecordId,

              eventType:
                "Daily WSE Worker Acknowledged",

              revisionNumber:
                wse.revisionNumber,

              actorId:
                toNullableString(
                  body.workerId,
                ),

              actorName:
                workerName,

              actorRole:
                "Worker",

              comment:
                "Worker acknowledged the Daily Worker Safety Engagement.",

              metadata: {
                dailyWseId:
                  wseId,

                signatureId:
                  created.id,

                signatureType:
                  created.signatureType,
              },
            },
          });

          return created;
        },
      );

    return NextResponse.json(
      {
        signature,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to capture Daily WSE worker acknowledgement:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to capture Daily WSE worker acknowledgement.",
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
    const {
      planningRecordId,
      wseId,
    } =
      await context.params;

    const body =
      await request.json();

    const wse =
      await findWse(
        planningRecordId,
        wseId,
      );

    if (!wse) {
      return NextResponse.json(
        {
          message:
            "Daily WSE was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      wse.status ===
      "Completed"
    ) {
      return NextResponse.json(
        {
          message:
            "Completed Daily WSE records are locked.",
        },
        {
          status: 409,
        },
      );
    }

    const signatureId =
      toNullableString(
        body.signatureId,
      );

    if (!signatureId) {
      return NextResponse.json(
        {
          message:
            "Signature ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existingSignature =
      await prisma.dailyWorkerSafetyEngagementSignature.findFirst({
        where: {
          id:
            signatureId,

          dailyWseId:
            wseId,

          tenantId:
            wse.tenantId,
        },
      });

    if (!existingSignature) {
      return NextResponse.json(
        {
          message:
            "Worker acknowledgement was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const signOutInitials =
      toNullableString(
        body.signOutInitials,
      );

    if (!signOutInitials) {
      return NextResponse.json(
        {
          message:
            "Worker initials are required for sign-out.",
        },
        {
          status: 400,
        },
      );
    }

    const updated =
      await prisma.dailyWorkerSafetyEngagementSignature.update({
        where: {
          id:
            existingSignature.id,
        },

        data: {
          signOutInitials,
          signedOutAt:
            new Date(),
        },
      });

    return NextResponse.json({
      signature:
        updated,
    });
  } catch (error) {
    console.error(
      "Unable to sign worker out of Daily WSE:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign worker out of Daily WSE.",
      },
      {
        status: 500,
      },
    );
  }
}