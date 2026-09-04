import "server-only";

import { prisma } from "@/lib/prisma";

export class MocApproverAssignmentError extends Error {
  status: number;

  constructor(
    message: string,
    status = 409,
  ) {
    super(message);
    this.name =
      "MocApproverAssignmentError";
    this.status = status;
  }
}

export type ResolvedMocApprover = {
  userId: string;
  displayName: string;
  email: string;

  projectMembershipId: string;

  roleCode: string;
  roleLabel: string;
};

export type ResolvedMocApproverPool = {
  roleCode: string;
  roleLabel: string;

  /*
   * Qoreva MVP MOC policy:
   *
   * Multiple designated approvers form an eligible
   * approver pool. They are NOT multiple required
   * approvals.
   *
   * Any one eligible approver may satisfy the
   * approval requirement.
   */
  minimumApprovalsRequired: 1;

  approvers: ResolvedMocApprover[];
};

export async function resolveDesignatedMocApprovers({
  tenantId,
  projectId,
  roleCode,
  roleLabel,
}: {
  tenantId: string;
  projectId: string;
  roleCode: string;
  roleLabel: string;
}): Promise<ResolvedMocApproverPool> {
  const memberships =
    await prisma.projectMembership.findMany({
      where: {
        tenantId,
        projectId,
        isActive: true,

        approvalRoleCodes: {
          has: roleCode,
        },

        OR: [
          {
            canApprovePlanning: true,
          },
          {
            canManagePlanning: true,
          },
        ],

        tenantMembership: {
          tenantId,
          isActive: true,

          user: {
            isActive: true,
            status: "Active",
          },
        },
      },

      select: {
        id: true,

        tenantMembership: {
          select: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        assignedAt: "asc",
      },
    });

  if (memberships.length === 0) {
    throw new MocApproverAssignmentError(
      `No active project member is assigned to the ${roleLabel} MOC approval role.`,
      409,
    );
  }

  return {
    roleCode,
    roleLabel,

    minimumApprovalsRequired:
      1,

    approvers:
      memberships.map(
        (membership) => ({
          userId:
            membership.tenantMembership.user.id,

          displayName:
            membership.tenantMembership.user.displayName,

          email:
            membership.tenantMembership.user.email,

          projectMembershipId:
            membership.id,

          roleCode,

          roleLabel,
        }),
      ),
  };
}
