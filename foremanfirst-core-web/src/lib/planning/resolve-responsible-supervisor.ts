import { prisma } from "@/lib/prisma";

type ResolveResponsibleSupervisorInput = {
  tenantId: string;
  projectId: string;
  responsibleSupervisorId: unknown;
  responsibleSupervisor: unknown;
};

type ResolvedResponsibleSupervisor =
  | {
      valid: true;
      responsibleSupervisorId: string | null;
      responsibleSupervisor: string | null;
    }
  | {
      valid: false;
      message: string;
    };

function toNullableString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

/*
 * Resolves the authoritative identity behind a Planning
 * Responsible Supervisor / Foreman assignment.
 *
 * Identity-backed assignment:
 * - User must be active.
 * - TenantMembership must be active and belong to the target tenant.
 * - ProjectMembership must be active and belong to the target project.
 * - The display-name snapshot is always resolved server-side.
 *
 * Manual assignment:
 * - No User identity is asserted.
 * - The human-entered name is retained as a historical snapshot.
 *
 * Assignment intentionally does NOT require planning approval,
 * review, create, or manage permissions. Field responsibility and
 * Planning authorization are separate concepts.
 */
export async function resolveResponsibleSupervisor(
  input: ResolveResponsibleSupervisorInput,
): Promise<ResolvedResponsibleSupervisor> {
  const requestedUserId =
    toNullableString(
      input.responsibleSupervisorId,
    );

  const manualName =
    toNullableString(
      input.responsibleSupervisor,
    );

  if (!requestedUserId) {
    return {
      valid: true,
      responsibleSupervisorId: null,
      responsibleSupervisor:
        manualName,
    };
  }

  const membership =
    await prisma.projectMembership.findFirst({
      where: {
        tenantId: input.tenantId,
        projectId: input.projectId,
        isActive: true,

        tenantMembership: {
          tenantId: input.tenantId,
          userId: requestedUserId,
          isActive: true,

          user: {
            isActive: true,
            status: "Active",
          },
        },
      },

      select: {
        tenantMembership: {
          select: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

  if (!membership) {
    return {
      valid: false,
      message:
        "Selected responsible supervisor is not an active member of this project.",
    };
  }

  return {
    valid: true,

    responsibleSupervisorId:
      membership.tenantMembership.user.id,

    responsibleSupervisor:
      membership.tenantMembership.user.displayName,
  };
}
