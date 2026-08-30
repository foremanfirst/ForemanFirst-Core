import "server-only";

import { prisma } from "@/lib/prisma";
import {
  requireCurrentUser,
  type QorevaCurrentUser,
} from "@/lib/auth/current-user";

export class PlanningReviewerAuthorizationError extends Error {
  status: number;

  constructor(
    message: string,
    status = 403,
  ) {
    super(message);
    this.name =
      "PlanningReviewerAuthorizationError";
    this.status = status;
  }
}

export type AuthorizedPlanningReviewer = {
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
    roleCode: string;
    roleLabel: string;
    status: string;
    signatureRequired: boolean;
  };

  membership: {
    projectMembershipId: string;
    roleCodes: string[];
    approvalRoleCodes: string[];
  };
};

export async function requireAuthorizedPlanningReviewer(
  planningRecordId: string,
  approvalId: string,
): Promise<AuthorizedPlanningReviewer> {
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
    throw new PlanningReviewerAuthorizationError(
      "Planning record was not found.",
      404,
    );
  }

  if (record.status !== "Submitted") {
    throw new PlanningReviewerAuthorizationError(
      "Only a submitted planning record can be reviewed.",
      409,
    );
  }

  const approval =
    await prisma.planningApproval.findFirst({
      where: {
        id: approvalId,
        planningRecordId: record.id,
        tenantId: record.tenantId,
        revisionNumber:
          record.revisionNumber,
      },

      select: {
        id: true,
        roleCode: true,
        roleLabel: true,
        approverId: true,
        status: true,
        signatureRequired: true,
      },
    });

  if (!approval) {
    throw new PlanningReviewerAuthorizationError(
      "Approval assignment was not found for the current planning revision.",
      404,
    );
  }

  if (!approval.approverId) {
    throw new PlanningReviewerAuthorizationError(
      "This approval requirement does not have an assigned approver.",
      409,
    );
  }

  if (approval.approverId !== user.id) {
    throw new PlanningReviewerAuthorizationError(
      "You are not the assigned approver for this review.",
      403,
    );
  }

  if (approval.status !== "Pending") {
    throw new PlanningReviewerAuthorizationError(
      `This approval has already been resolved with status ${approval.status}.`,
      409,
    );
  }

  const tenantMembership =
    await prisma.tenantMembership.findFirst({
      where: {
        tenantId: record.tenantId,
        userId: user.id,
        isActive: true,
      },

      select: {
        id: true,
      },
    });

  if (!tenantMembership) {
    throw new PlanningReviewerAuthorizationError(
      "You do not have an active membership in this Qoreva tenant.",
      403,
    );
  }

  const projectMembership =
    await prisma.projectMembership.findFirst({
      where: {
        tenantId: record.tenantId,
        projectId: record.projectId,
        tenantMembershipId:
          tenantMembership.id,
        isActive: true,
      },

      select: {
        id: true,
        roleCodes: true,
        approvalRoleCodes: true,
        canApprovePlanning: true,
      },
    });

  if (!projectMembership) {
    throw new PlanningReviewerAuthorizationError(
      "You do not have an active membership on this project.",
      403,
    );
  }

  if (
    !projectMembership.canApprovePlanning
  ) {
    throw new PlanningReviewerAuthorizationError(
      "You are not authorized to approve planning records on this project.",
      403,
    );
  }

  if (
    !projectMembership.approvalRoleCodes.includes(
      approval.roleCode,
    )
  ) {
    throw new PlanningReviewerAuthorizationError(
      `You are not authorized for the ${approval.roleLabel} approval role.`,
      403,
    );
  }

  return {
    user,

    planningRecord: {
      id: record.id,
      tenantId: record.tenantId,
      projectId: record.projectId,
      status: record.status,
      revisionNumber:
        record.revisionNumber,
    },

    approval: {
      id: approval.id,
      roleCode: approval.roleCode,
      roleLabel: approval.roleLabel,
      status: approval.status,
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
    },
  };
}