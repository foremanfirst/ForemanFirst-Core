import "server-only";

import { prisma } from "@/lib/prisma";

import {
  QorevaAuthenticationError,
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class MocApproverAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "MocApproverAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedMocApprover = {
  user: QorevaCurrentUser;

  planningRecord: {
    id: string;
    tenantId: string;
    projectId: string;
    status: string;
    revisionNumber: number;
  };

  approval: {
    id: string;
    mocId: string;
    roleCode: string;
    roleLabel: string;
    status: string;
    signatureRequired: boolean;
  };

  membership: {
    projectMembershipId: string;
    roleCodes: string[];
    approvalRoleCodes: string[];
    canApprovePlanning: boolean;
    canManagePlanning: boolean;
  };
};

type EligibleApproverSnapshot = {
  userId: string;
  projectMembershipId?: string;
};

type MocApprovalPolicySnapshot = {
  type?: string;
  minimumApprovalsRequired?: number;
  roleCode?: string;
  eligibleApprovers?: EligibleApproverSnapshot[];
};

function readApprovalPolicy(
  approvalRouting: unknown,
): MocApprovalPolicySnapshot | null {
  if (
    !approvalRouting ||
    typeof approvalRouting !==
      "object" ||
    Array.isArray(
      approvalRouting,
    )
  ) {
    return null;
  }

  const routing =
    approvalRouting as Record<
      string,
      unknown
    >;

  const rawPolicy =
    routing.approvalPolicy;

  if (
    !rawPolicy ||
    typeof rawPolicy !==
      "object" ||
    Array.isArray(
      rawPolicy,
    )
  ) {
    return null;
  }

  const policy =
    rawPolicy as Record<
      string,
      unknown
    >;

  const rawEligibleApprovers =
    policy.eligibleApprovers;

  const eligibleApprovers =
    Array.isArray(
      rawEligibleApprovers,
    )
      ? rawEligibleApprovers
          .filter(
            (
              item,
            ): item is Record<
              string,
              unknown
            > =>
              Boolean(
                item,
              ) &&
              typeof item ===
                "object" &&
              !Array.isArray(
                item,
              ),
          )
          .map(
            (
              item,
            ): EligibleApproverSnapshot | null => {
              const userId =
                typeof item.userId ===
                "string"
                  ? item.userId
                  : null;

              if (!userId) {
                return null;
              }

              return {
                userId,

                projectMembershipId:
                  typeof item.projectMembershipId ===
                  "string"
                    ? item.projectMembershipId
                    : undefined,
              };
            },
          )
          .filter(
            (
              item,
            ): item is EligibleApproverSnapshot =>
              item !==
              null,
          )
      : [];

  return {
    type:
      typeof policy.type ===
      "string"
        ? policy.type
        : undefined,

    minimumApprovalsRequired:
      typeof policy.minimumApprovalsRequired ===
      "number"
        ? policy.minimumApprovalsRequired
        : undefined,

    roleCode:
      typeof policy.roleCode ===
      "string"
        ? policy.roleCode
        : undefined,

    eligibleApprovers,
  };
}

export async function requireAuthorizedMocApprover(
  planningRecordId: string,
  wseId: string,
  mocId: string,
  approvalId: string,
): Promise<AuthorizedMocApprover> {
  let user: QorevaCurrentUser;

  try {
    user =
      await requireCurrentUser();
  } catch (error) {
    if (
      error instanceof
        QorevaAuthenticationError
    ) {
      throw new MocApproverAuthorizationError(
        error.message,
        401,
      );
    }

    throw error;
  }

  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id:
          planningRecordId,
        isArchived:
          false,
      },

      select: {
        id:
          true,
        tenantId:
          true,
        projectId:
          true,
        status:
          true,
        revisionNumber:
          true,
      },
    });

  if (!record) {
    throw new MocApproverAuthorizationError(
      "Planning record was not found.",
      404,
    );
  }

  const approval =
    await prisma.dailyWorkerSafetyEngagementMocApproval.findFirst({
      where: {
        id:
          approvalId,
        mocId:
          mocId,
        tenantId:
          record.tenantId,

        moc: {
          dailyWseId:
            wseId,

          dailyWse: {
            planningRecordId:
              record.id,
            tenantId:
              record.tenantId,
          },
        },
      },

      select: {
        id:
          true,
        mocId:
          true,
        roleCode:
          true,
        roleLabel:
          true,
        approverId:
          true,
        status:
          true,
        signatureRequired:
          true,

        moc: {
          select: {
            approvalRouting:
              true,
          },
        },
      },
    });

  if (!approval) {
    throw new MocApproverAuthorizationError(
      "MOC approval assignment was not found.",
      404,
    );
  }

  if (
    approval.status !==
    "Pending"
  ) {
    throw new MocApproverAuthorizationError(
      `This MOC approval has already been resolved with status ${approval.status}.`,
      409,
    );
  }

  /*
   * Backward compatibility:
   *
   * Existing MOCs created before the
   * Any-One approver-pool policy may
   * already contain one assigned approver.
   */
  if (
    approval.approverId
  ) {
    if (
      approval.approverId !==
      user.id
    ) {
      throw new MocApproverAuthorizationError(
        "You are not the assigned approver for this MOC.",
        403,
      );
    }
  } else {
    const policy =
      readApprovalPolicy(
        approval.moc.approvalRouting,
      );

    if (
      !policy ||
      policy.type !==
        "AnyOneOfEligibleApprovers" ||
      policy.minimumApprovalsRequired !==
        1 ||
      policy.roleCode !==
        approval.roleCode
    ) {
      throw new MocApproverAuthorizationError(
        "This MOC approval requirement does not contain a valid eligible approver policy.",
        409,
      );
    }

    const isEligible =
      policy.eligibleApprovers?.some(
        (
          approver,
        ) =>
          approver.userId ===
          user.id,
      ) ??
      false;

    if (
      !isEligible
    ) {
      throw new MocApproverAuthorizationError(
        "You are not an eligible approver for this MOC.",
        403,
      );
    }
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
        id:
          true,
      },
    });

  if (!tenantMembership) {
    throw new MocApproverAuthorizationError(
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
        id:
          true,
        roleCodes:
          true,
        approvalRoleCodes:
          true,
        canApprovePlanning:
          true,
        canManagePlanning:
          true,
      },
    });

  if (!projectMembership) {
    throw new MocApproverAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  if (
    !projectMembership.canApprovePlanning &&
    !projectMembership.canManagePlanning
  ) {
    throw new MocApproverAuthorizationError(
      "You are not authorized to approve MOC records on this project.",
      403,
    );
  }

  /*
   * Having planning-management authority
   * does not make somebody part of the
   * submitted MOC approver pool.
   *
   * Pool membership was checked above.
   * This capability check only confirms
   * that the snapshotted approver remains
   * currently qualified to act.
   */
  if (
    !projectMembership.approvalRoleCodes.includes(
      approval.roleCode,
    ) &&
    !projectMembership.canManagePlanning
  ) {
    throw new MocApproverAuthorizationError(
      `You are not authorized for the ${approval.roleLabel} MOC approval role.`,
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

    approval: {
      id:
        approval.id,
      mocId:
        approval.mocId,
      roleCode:
        approval.roleCode,
      roleLabel:
        approval.roleLabel,
      status:
        approval.status,
      signatureRequired:
        approval.signatureRequired,
    },

    membership: {
      projectMembershipId:
        projectMembership.id,
      roleCodes:
        projectMembership.roleCodes,
      approvalRoleCodes:
        projectMembership.approvalRoleCodes,
      canApprovePlanning:
        projectMembership.canApprovePlanning,
      canManagePlanning:
        projectMembership.canManagePlanning,
    },
  };
}
