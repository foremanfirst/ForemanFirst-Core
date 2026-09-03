import "server-only";

import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class PlanningReaderAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "PlanningReaderAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedPlanningReader = {
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
    canCreatePlanning: boolean;
    canReviewPlanning: boolean;
    canApprovePlanning: boolean;
    canManagePlanning: boolean;
  };
};

export async function requireAuthorizedPlanningReader(
  planningRecordId: string,
): Promise<AuthorizedPlanningReader> {
  let user: QorevaCurrentUser;

  try {
    user =
      await requireCurrentUser();
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      throw new PlanningReaderAuthorizationError(
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
    throw new PlanningReaderAuthorizationError(
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
    throw new PlanningReaderAuthorizationError(
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
        canCreatePlanning: true,
        canReviewPlanning: true,
        canApprovePlanning: true,
        canManagePlanning: true,
      },
    });

  if (!projectMembership) {
    throw new PlanningReaderAuthorizationError(
      "You do not have an active membership on this project.",
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
      canCreatePlanning:
        projectMembership.canCreatePlanning,
      canReviewPlanning:
        projectMembership.canReviewPlanning,
      canApprovePlanning:
        projectMembership.canApprovePlanning,
      canManagePlanning:
        projectMembership.canManagePlanning,
    },
  };
}
