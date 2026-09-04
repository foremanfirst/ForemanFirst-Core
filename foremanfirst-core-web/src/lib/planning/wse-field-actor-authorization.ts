import "server-only";

import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

const WSE_FIELD_ROLE_CODES =
  new Set([
    "FOREMAN",
    "SUPERINTENDENT",
    "SAFETY_MANAGER",
  ]);

export class WseFieldActorAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "WseFieldActorAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedWseFieldActor = {
  user: QorevaCurrentUser;

  planningRecord: {
    id: string;
    tenantId: string;
    projectId: string;
    status: string;
    revisionNumber: number;
  };

  membership: {
    tenantMembershipId: string;
    projectMembershipId: string;
    roleCodes: string[];
    canManagePlanning: boolean;
  };
};

export async function requireAuthorizedWseFieldActor(
  planningRecordId: string,
): Promise<AuthorizedWseFieldActor> {
  let user: QorevaCurrentUser;

  try {
    user =
      await requireCurrentUser();
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      throw new WseFieldActorAuthorizationError(
        error.message,
        401,
      );
    }

    throw error;
  }

  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
        projectId: true,
        status: true,
        revisionNumber: true,
      },
    });

  if (!record) {
    throw new WseFieldActorAuthorizationError(
      "Planning record was not found.",
      404,
    );
  }

  const tenantMembership =
    await prisma.tenantMembership.findFirst({
      where: {
        tenantId:
          record.tenantId,
        userId:
          user.id,
        isActive:
          true,
      },

      select: {
        id: true,
      },
    });

  if (!tenantMembership) {
    throw new WseFieldActorAuthorizationError(
      "You do not have an active membership in this Qoreva tenant.",
      403,
    );
  }

  const projectMembership =
    await prisma.projectMembership.findFirst({
      where: {
        tenantId:
          record.tenantId,
        projectId:
          record.projectId,
        tenantMembershipId:
          tenantMembership.id,
        isActive:
          true,
      },

      select: {
        id: true,
        roleCodes: true,
        canManagePlanning: true,
      },
    });

  if (!projectMembership) {
    throw new WseFieldActorAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  const hasFieldRole =
    projectMembership.roleCodes.some(
      (roleCode) =>
        WSE_FIELD_ROLE_CODES.has(
          roleCode,
        ),
    );

  if (
    !hasFieldRole &&
    !projectMembership.canManagePlanning
  ) {
    throw new WseFieldActorAuthorizationError(
      "You are not authorized to manage Daily WSE records on this project.",
      403,
    );
  }

  return {
    user,

    planningRecord: {
      id:
        record.id,
      tenantId:
        record.tenantId,
      projectId:
        record.projectId,
      status:
        record.status,
      revisionNumber:
        record.revisionNumber,
    },

    membership: {
      tenantMembershipId:
        tenantMembership.id,
      projectMembershipId:
        projectMembership.id,
      roleCodes:
        projectMembership.roleCodes,
      canManagePlanning:
        projectMembership.canManagePlanning,
    },
  };
}
