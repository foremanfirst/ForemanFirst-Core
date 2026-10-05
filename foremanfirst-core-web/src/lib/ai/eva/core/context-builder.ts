/**
 * Eva Context Builder
 *
 * Builds Eva's server-side runtime context from Qoreva's
 * authenticated identity and existing tenant/project memberships.
 *
 * Eva does not create a parallel authorization system.
 * Existing domain authorization remains authoritative.
 *
 * Eva's context is used for:
 * - skill selection
 * - tool availability
 * - conversational context
 * - user-specific personalization
 *
 * Domain tools must still enforce their own authorization
 * before reading or modifying records.
 */

import { getEvaSkills } from "./skill-registry";

import "server-only";

import { prisma } from "@/lib/prisma";

import {
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

import type {
  EvaPermission,
  EvaProjectContext,
  EvaUserContext,
  EvaUserRole,
} from "./types";

import type {
  EvaRuntimeContext,
} from "./context";

import type {
  EvaConversationContext,
} from "./types";

function normalizeRole(
  value: string,
): EvaUserRole {
  switch (value.trim().toUpperCase()) {
    case "TENANT_ADMIN":
      return "TENANT_ADMIN";

    case "SAFETY_MANAGER":
      return "SAFETY_MANAGER";

    case "PROJECT_MANAGER":
      return "PROJECT_MANAGER";

    case "SUPERINTENDENT":
      return "SUPERINTENDENT";

    case "FOREMAN":
      return "FOREMAN";

    case "QUALIFIED_PERSON":
      return "QUALIFIED_PERSON";

    default:
      return "OTHER";
  }
}

function normalizeRoles(
  values: string[],
): EvaUserRole[] {
  return Array.from(
    new Set(
      values.map(normalizeRole),
    ),
  );
}

function buildPermissions(input: {
  hasTenantMembership: boolean;
  tenantCanManageUsers: boolean;
  tenantCanManageProjects: boolean;
  tenantCanManageRequirements: boolean;

  projectCanCreatePlanning: boolean;
  projectCanReviewPlanning: boolean;
  projectCanApprovePlanning: boolean;
  projectCanManagePlanning: boolean;
}): EvaPermission[] {
  const permissions = new Set<EvaPermission>();

  /*
   * An active tenant/project membership gives Eva the ability
   * to reason about authorized read context.
   *
   * This does NOT replace record-level authorization.
   */
  if (input.hasTenantMembership) {
    permissions.add("READ");
  }

  /*
   * These are capability hints for Eva's tool selection.
   *
   * Actual tools must still call the appropriate Qoreva
   * authorization service before performing the operation.
   */
  if (
    input.projectCanCreatePlanning ||
    input.tenantCanManageProjects
  ) {
    permissions.add("CREATE");
  }

  if (
    input.projectCanManagePlanning ||
    input.tenantCanManageProjects ||
    input.tenantCanManageRequirements
  ) {
    permissions.add("UPDATE");
  }

  if (
    input.projectCanApprovePlanning ||
    input.projectCanReviewPlanning
  ) {
    permissions.add("APPROVE");
  }

  /*
   * ADMIN is intentionally conservative.
   *
   * Eva should not infer administrative authority simply
   * because a user has a safety or management role.
   */
  if (
    input.tenantCanManageUsers &&
    input.tenantCanManageProjects &&
    input.tenantCanManageRequirements
  ) {
    permissions.add("ADMIN");
  }

  return Array.from(permissions);
}

export type BuildEvaContextOptions = {
  tenantId: string;
  projectId?: string | null;
  userMessage: string;
  currentModule?: string | null;
  currentRecordId?: string | null;
  availableSkillIds?: string[];
};

export async function buildEvaUserContext(
  user: QorevaCurrentUser,
  options: BuildEvaContextOptions,
): Promise<{
  userContext: EvaUserContext;
  projectContext: EvaProjectContext | null;
}> {
  const tenantMembership =
    await prisma.tenantMembership.findFirst({
      where: {
        tenantId: options.tenantId,
        userId: user.id,
        isActive: true,
      },

      select: {
        id: true,
        roleCodes: true,
        canManageUsers: true,
        canManageProjects: true,
        canManageRequirements: true,
      },
    });

  if (!tenantMembership) {
    throw new Error(
      "Eva could not establish an active tenant membership for the authenticated user.",
    );
  }

  let projectContext:
    EvaProjectContext | null = null;

  let projectRoles: EvaUserRole[] = [];

  let projectPermissions = {
    canCreatePlanning: false,
    canReviewPlanning: false,
    canApprovePlanning: false,
    canManagePlanning: false,
  };

  if (options.projectId) {
    const projectMembership =
      await prisma.projectMembership.findFirst({
        where: {
          tenantId: options.tenantId,
          projectId: options.projectId,
          tenantMembershipId: tenantMembership.id,
          isActive: true,
        },

        select: {
          roleCodes: true,
          canCreatePlanning: true,
          canReviewPlanning: true,
          canApprovePlanning: true,
          canManagePlanning: true,
        },
      });

    if (projectMembership) {
      projectRoles =
        normalizeRoles(
          projectMembership.roleCodes,
        );

      projectPermissions = {
        canCreatePlanning:
          projectMembership.canCreatePlanning,

        canReviewPlanning:
          projectMembership.canReviewPlanning,

        canApprovePlanning:
          projectMembership.canApprovePlanning,

        canManagePlanning:
          projectMembership.canManagePlanning,
      };
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: options.projectId,
          tenantId: options.tenantId,
        },

        select: {
          id: true,
          tenantId: true,
          name: true,
          projectCode: true,
          clientName: true,
          location: true,
        },
      });

    if (project) {
      projectContext = {
        projectId:
          project.id,

        tenantId:
          project.tenantId,

        name:
          project.name,

        projectCode:
          project.projectCode,

        clientName:
          project.clientName,

        location:
          project.location,
      };
    }
  }

  const tenantRoles =
    normalizeRoles(
      tenantMembership.roleCodes,
    );

  const permissions =
    buildPermissions({
      hasTenantMembership: true,

      tenantCanManageUsers:
        tenantMembership.canManageUsers,

      tenantCanManageProjects:
        tenantMembership.canManageProjects,

      tenantCanManageRequirements:
        tenantMembership.canManageRequirements,

      projectCanCreatePlanning:
        projectPermissions.canCreatePlanning,

      projectCanReviewPlanning:
        projectPermissions.canReviewPlanning,

      projectCanApprovePlanning:
        projectPermissions.canApprovePlanning,

      projectCanManagePlanning:
        projectPermissions.canManagePlanning,
    });

  const userContext: EvaUserContext = {
    userId:
      user.id,

    email:
      user.email,

    displayName:
      user.displayName,

    tenantId:
      options.tenantId,

    tenantRoles,

    projectId:
      options.projectId ?? null,

    projectRoles,

    permissions,
  };

  return {
    userContext,
    projectContext,
  };
}

export async function buildEvaRuntimeContext(
  options: BuildEvaContextOptions,
): Promise<EvaRuntimeContext> {
  const user =
    await requireCurrentUser();

  const {
    userContext,
    projectContext,
  } =
    await buildEvaUserContext(
      user,
      options,
    );

  const conversation:
    EvaConversationContext = {
    user:
      userContext,

    project:
      projectContext,

    currentModule:
      options.currentModule ?? null,

    currentRecordId:
      options.currentRecordId ?? null,

    userMessage:
      options.userMessage,
  };

  return {
    conversation,

    user:
      userContext,

    project:
      projectContext,

    /*
     * Eva determines installed capabilities from the
     * authoritative Skill Registry.
     *
     * Callers must not be able to invent or suppress
     * Eva capabilities through request input.
     */
    availableSkillIds:
      getEvaSkills().map(
        (skill) => skill.id,
      ),

    metadata: {},
  };
}
