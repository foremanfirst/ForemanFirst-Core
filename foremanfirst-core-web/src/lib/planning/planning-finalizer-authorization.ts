import "server-only";

import { prisma } from "@/lib/prisma";

import {
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class PlanningFinalizerAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "PlanningFinalizerAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedPlanningFinalizer = {
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

export async function requireAuthorizedPlanningFinalizer(
  planningRecordId: string,
): Promise<AuthorizedPlanningFinalizer> {
  const user =
    await requireCurrentUser();

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
    throw new PlanningFinalizerAuthorizationError(
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
    throw new PlanningFinalizerAuthorizationError(
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
    throw new PlanningFinalizerAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  if (
    !projectMembership.canManagePlanning
  ) {
    throw new PlanningFinalizerAuthorizationError(
      "You are not authorized to finalize planning records on this project.",
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