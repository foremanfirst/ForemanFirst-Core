import "server-only";

import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class PlanningQualifiedReviewerAuthorizationError
  extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);

    this.name =
      "PlanningQualifiedReviewerAuthorizationError";

    this.status =
      status;
  }
}

export type AuthorizedPlanningQualifiedReviewer = {
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
    canReviewPlanning: boolean;
    canManagePlanning: boolean;
  };
};

export type PlanningQualifiedReviewerCapability = {
  canReview: boolean;
  authorization: AuthorizedPlanningQualifiedReviewer | null;
};

export async function getPlanningQualifiedReviewerCapability(
  planningRecordId: string,
): Promise<PlanningQualifiedReviewerCapability> {
  try {
    const authorization =
      await requireAuthorizedPlanningQualifiedReviewer(
        planningRecordId,
      );

    return {
      canReview: true,
      authorization,
    };
  } catch (error) {
    if (
      error instanceof
      PlanningQualifiedReviewerAuthorizationError &&
      (error.status === 403 ||
        error.status === 404)
    ) {
      return {
        canReview: false,
        authorization: null,
      };
    }

    throw error;
  }
}

export async function requireAuthorizedPlanningQualifiedReviewer(
  planningRecordId: string,
): Promise<AuthorizedPlanningQualifiedReviewer> {
  let user: QorevaCurrentUser;

  try {
    user =
      await requireCurrentUser();
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      throw new PlanningQualifiedReviewerAuthorizationError(
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
    throw new PlanningQualifiedReviewerAuthorizationError(
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
    throw new PlanningQualifiedReviewerAuthorizationError(
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
        canReviewPlanning: true,
        canManagePlanning: true,
      },
    });

  if (!projectMembership) {
    throw new PlanningQualifiedReviewerAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  if (
    !projectMembership.canReviewPlanning &&
    !projectMembership.canManagePlanning
  ) {
    throw new PlanningQualifiedReviewerAuthorizationError(
      "You are not authorized to perform qualified planning review on this project.",
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

      canReviewPlanning:
        projectMembership.canReviewPlanning,

      canManagePlanning:
        projectMembership.canManagePlanning,
    },
  };
}
