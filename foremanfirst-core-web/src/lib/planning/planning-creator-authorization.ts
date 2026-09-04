import "server-only";

import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class PlanningCreatorAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "PlanningCreatorAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedPlanningCreator = {
  user: QorevaCurrentUser;

  project: {
    id: string;
    tenantId: string;
    companyId: string;
  };

  membership: {
    tenantMembershipId: string;
    projectMembershipId: string;
    roleCodes: string[];
    canCreatePlanning: boolean;
    canManagePlanning: boolean;
  };
};

export async function requireAuthorizedPlanningCreator(
  projectId: string,
): Promise<AuthorizedPlanningCreator> {
  let user: QorevaCurrentUser;

  try {
    user =
      await requireCurrentUser();
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      throw new PlanningCreatorAuthorizationError(
        error.message,
        401,
      );
    }

    throw error;
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        isArchived: false,
        isActive: true,
      },

      select: {
        id: true,
        tenantId: true,
        companyId: true,
      },
    });

  if (!project) {
    throw new PlanningCreatorAuthorizationError(
      "Selected project was not found.",
      404,
    );
  }

  const tenantMembership =
    await prisma.tenantMembership.findFirst({
      where: {
        tenantId:
          project.tenantId,
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
    throw new PlanningCreatorAuthorizationError(
      "You do not have an active membership in this Qoreva tenant.",
      403,
    );
  }

  const projectMembership =
    await prisma.projectMembership.findFirst({
      where: {
        tenantId:
          project.tenantId,

        projectId:
          project.id,

        tenantMembershipId:
          tenantMembership.id,

        isActive:
          true,
      },

      select: {
        id: true,
        roleCodes: true,
        canCreatePlanning: true,
        canManagePlanning: true,
      },
    });

  if (!projectMembership) {
    throw new PlanningCreatorAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  if (
    !projectMembership.canCreatePlanning &&
    !projectMembership.canManagePlanning
  ) {
    throw new PlanningCreatorAuthorizationError(
      "You are not authorized to create or manage planning records on this project.",
      403,
    );
  }

  return {
    user,

    project: {
      id:
        project.id,
      tenantId:
        project.tenantId,
      companyId:
        project.companyId,
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

      canManagePlanning:
        projectMembership.canManagePlanning,
    },
  };
}
