import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningReaderAuthorizationError,
  requireAuthorizedPlanningReader,
} from "@/lib/planning/planning-reader-authorization";

import {
  WseFieldActorAuthorizationError,
  requireAuthorizedWseFieldActor,
} from "@/lib/planning/wse-field-actor-authorization";

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
  tenantId: string,
) {
  return prisma.dailyWorkerSafetyEngagement.findFirst({
    where: {
      id:
        wseId,
      planningRecordId,
      tenantId,
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

    const authorization =
      await requireAuthorizedPlanningReader(
        planningRecordId,
      );

    const wse =
      await findWse(
        planningRecordId,
        wseId,
        authorization.planningRecord.tenantId,
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
    if (
      error instanceof
        PlanningReaderAuthorizationError
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

    const authorization =
      await requireAuthorizedWseFieldActor(
        planningRecordId,
      );

    const body =
      await request.json();

    const wse =
      await findWse(
        planningRecordId,
        wseId,
        authorization.planningRecord.tenantId,
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

    const workerId =
      toNullableString(
        body.workerId,
      );

    if (!workerId) {
      return NextResponse.json(
        {
          message:
            "Worker ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Resolve the worker exclusively from the authenticated
     * WSE tenant/project boundary.
     *
     * The browser may identify which Worker is signing, but
     * it cannot establish that Worker’s identity by supplying
     * arbitrary name/email values.
     */
    const worker =
      await prisma.worker.findFirst({
        where: {
          id:
            workerId,

          tenantId:
            authorization.planningRecord.tenantId,

          projectId:
            authorization.planningRecord.projectId,

          isActive:
            true,

          isArchived:
            false,
        },

        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          email: true,
        },
      });

    if (!worker) {
      return NextResponse.json(
        {
          message:
            "The selected worker is not an active worker assigned to this project.",
        },
        {
          status: 403,
        },
      );
    }

    const workerName = [
      worker.firstName,
      worker.middleName,
      worker.lastName,
      worker.suffix,
    ]
      .filter(
        (value) =>
          typeof value === "string" &&
          value.trim().length > 0,
      )
      .join(" ");

    if (!workerName) {
      return NextResponse.json(
        {
          message:
            "The selected worker does not have a valid name.",
        },
        {
          status: 409,
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

                /*
                 * Worker profiles do not require Qoreva
                 * authentication for MVP field adoption.
                 *
                 * The authenticated field actor controls the
                 * WSE operation, while the selected Worker
                 * remains the person represented by the
                 * acknowledgement.
                 *
                 * Future identity verification will bind this
                 * acknowledgement to a verified worker identity.
                 */
                /*
                 * Identity comes from the server-resolved Worker
                 * record, never from browser-supplied name/email.
                 */
                workerId:
                  worker.id,

                workerName,

                workerEmail:
                  worker.email,

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

              /*
               * The planning event records the authenticated
               * Qoreva actor. Worker identity remains part of
               * the signature evidence itself.
               */
              actorId:
                authorization.user.id,

              actorName:
                authorization.user.displayName,

              actorRole:
                authorization.membership.roleCodes.length >
                0
                  ? authorization.membership.roleCodes.join(
                      ", ",
                    )
                  : authorization.membership.canManagePlanning
                    ? "Planning Manager"
                    : "WSE Field Actor",

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
    if (
      error instanceof
        WseFieldActorAuthorizationError
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

    const authorization =
      await requireAuthorizedWseFieldActor(
        planningRecordId,
      );

    const body =
      await request.json();

    const wse =
      await findWse(
        planningRecordId,
        wseId,
        authorization.planningRecord.tenantId,
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
    if (
      error instanceof
        WseFieldActorAuthorizationError
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