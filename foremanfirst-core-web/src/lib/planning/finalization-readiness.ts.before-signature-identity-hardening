import { prisma } from "@/lib/prisma";

export type PlanningFinalizationBlocker = {
  code:
    | "PLANNING_RECORD_NOT_SUBMITTED"
    | "REVISION_SNAPSHOT_REQUIRED"
    | "REVISION_TENANT_MISMATCH"
    | "REVISION_NOT_SUBMITTED"
    | "NO_REQUIRED_APPROVALS"
    | "REVISION_REQUIRED_DECISION"
    | "REJECTED_APPROVAL"
    | "REQUIRED_APPROVALS_INCOMPLETE"
    | "REQUIRED_SIGNATURE_LINK_MISSING"
    | "REQUIRED_SIGNATURE_NOT_VERIFIED"
    | "OPEN_REVIEW_COMMENTS"
    | "EFFECTIVE_DATES_REQUIRED"
    | "INVALID_EFFECTIVE_DATE_RANGE";

  message: string;
};

type FinalizationReadinessClient = Pick<
  typeof prisma,
  | "planningRecord"
  | "planningRevision"
  | "planningApproval"
  | "planningSignature"
  | "planningReviewComment"
>;

export async function evaluatePlanningFinalizationReadiness(
  planningRecordId: string,
  db: FinalizationReadinessClient = prisma,
) {
  const record =
    await db.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
        status: true,
        revisionNumber: true,

        approvedAt: true,
        activeAt: true,

        effectiveStartDate: true,
        effectiveEndDate: true,
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  const [
    revision,
    approvals,
    openReviewCommentCount,
  ] =
    await Promise.all([
      db.planningRevision.findUnique({
        where: {
          planningRecordId_revisionNumber:
            {
              planningRecordId:
                record.id,

              revisionNumber:
                record.revisionNumber,
            },
        },

        select: {
          id: true,
          tenantId: true,
          planningRecordId: true,
          revisionNumber: true,
          status: true,
        },
      }),

      db.planningApproval.findMany({
        where: {
          tenantId:
            record.tenantId,

          planningRecordId:
            record.id,

          revisionNumber:
            record.revisionNumber,
        },

        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],

        select: {
          id: true,

          roleCode: true,
          roleLabel: true,

          isRequired: true,
          status: true,

          approverId: true,

          signatureRequired: true,
          planningSignatureId: true,
        },
      }),

      db.planningReviewComment.count({
        where: {
          tenantId:
            record.tenantId,

          planningRecordId:
            record.id,

          revisionNumber:
            record.revisionNumber,

          status: "Open",
        },
      }),
    ]);

  const requiredApprovals =
    approvals.filter(
      (approval) =>
        approval.isRequired,
    );

  const approvedRequiredCount =
    requiredApprovals.filter(
      (approval) =>
        approval.status ===
        "Approved",
    ).length;

  const revisionRequiredCount =
    approvals.filter(
      (approval) =>
        approval.status ===
        "RevisionRequired",
    ).length;

  const rejectedCount =
    approvals.filter(
      (approval) =>
        approval.status ===
        "Rejected",
    ).length;

  const signatureRequiredApprovals =
    requiredApprovals.filter(
      (approval) =>
        approval.signatureRequired,
    );

  const linkedSignatureIds =
    Array.from(
      new Set(
        signatureRequiredApprovals
          .map(
            (approval) =>
              approval.planningSignatureId,
          )
          .filter(
            (
              signatureId,
            ): signatureId is string =>
              Boolean(signatureId),
          ),
      ),
    );

  const signatures =
    linkedSignatureIds.length > 0
      ? await db.planningSignature.findMany({
          where: {
            id: {
              in: linkedSignatureIds,
            },

            tenantId:
              record.tenantId,

            planningRecordId:
              record.id,

            revisionNumber:
              record.revisionNumber,
          },

          select: {
            id: true,
            signerId: true,
            status: true,
            signedAt: true,
          },
        })
      : [];

  const signaturesById =
    new Map(
      signatures.map(
        (signature) => [
          signature.id,
          signature,
        ]),
    );

  const verifiedSignatureApprovalIds =
    new Set<string>();

  for (
    const approval of
    signatureRequiredApprovals
  ) {
    if (
      !approval.planningSignatureId
    ) {
      continue;
    }

    const signature =
      signaturesById.get(
        approval.planningSignatureId,
      );

    if (!signature) {
      continue;
    }

    if (
      signature.status !== "Signed" ||
      !signature.signedAt
    ) {
      continue;
    }

    if (
      approval.approverId &&
      signature.signerId &&
      approval.approverId !==
        signature.signerId
    ) {
      continue;
    }

    verifiedSignatureApprovalIds.add(
      approval.id,
    );
  }

  const verifiedSignatureCount =
    verifiedSignatureApprovalIds.size;

  const blockers:
    PlanningFinalizationBlocker[] =
      [];

  if (
    record.status !== "Submitted"
  ) {
    blockers.push({
      code:
        "PLANNING_RECORD_NOT_SUBMITTED",

      message:
        record.status ===
        "Approved"
          ? "This PTP has already been finalized and approved."
          : "The PTP must be submitted before it can be finalized.",
    });
  }

  if (!revision) {
    blockers.push({
      code:
        "REVISION_SNAPSHOT_REQUIRED",

      message:
        "The current planning revision snapshot could not be found.",
    });
  } else if (
    revision.tenantId !==
    record.tenantId
  ) {
    blockers.push({
      code:
        "REVISION_TENANT_MISMATCH",

      message:
        "The planning revision does not belong to the current tenant.",
    });
  } else if (
    revision.status !==
    "Submitted"
  ) {
    blockers.push({
      code:
        "REVISION_NOT_SUBMITTED",

      message:
        "The current planning revision must be submitted before it can be finalized.",
    });
  }

  if (
    requiredApprovals.length === 0
  ) {
    blockers.push({
      code:
        "NO_REQUIRED_APPROVALS",

      message:
        "At least one required approval must exist before finalization.",
    });
  }

  if (
    revisionRequiredCount > 0
  ) {
    blockers.push({
      code:
        "REVISION_REQUIRED_DECISION",

      message:
        "A reviewer has returned this revision for revision.",
    });
  }

  if (rejectedCount > 0) {
    blockers.push({
      code:
        "REJECTED_APPROVAL",

      message:
        "A reviewer has rejected this revision.",
    });
  }

  if (
    requiredApprovals.length > 0 &&
    approvedRequiredCount !==
      requiredApprovals.length
  ) {
    blockers.push({
      code:
        "REQUIRED_APPROVALS_INCOMPLETE",

      message:
        `${approvedRequiredCount} of ${requiredApprovals.length} required approvals are complete.`,
    });
  }

  const missingSignatureLinks =
    signatureRequiredApprovals.filter(
      (approval) =>
        !approval.planningSignatureId,
    );

  if (
    missingSignatureLinks.length > 0
  ) {
    blockers.push({
      code:
        "REQUIRED_SIGNATURE_LINK_MISSING",

      message:
        `${missingSignatureLinks.length} required approval signature${missingSignatureLinks.length === 1 ? " is" : "s are"} not linked.`,
    });
  }

  const unverifiedSignatureCount =
    signatureRequiredApprovals.length -
    verifiedSignatureCount;

  if (
    unverifiedSignatureCount > 0
  ) {
    blockers.push({
      code:
        "REQUIRED_SIGNATURE_NOT_VERIFIED",

      message:
        `${unverifiedSignatureCount} required signature${unverifiedSignatureCount === 1 ? " has" : "s have"} not been verified.`,
    });
  }

  if (
    openReviewCommentCount > 0
  ) {
    blockers.push({
      code:
        "OPEN_REVIEW_COMMENTS",

      message:
        `${openReviewCommentCount} open review comment${openReviewCommentCount === 1 ? " remains" : "s remain"}.`,
    });
  }

  if (
    !record.effectiveStartDate ||
    !record.effectiveEndDate
  ) {
    blockers.push({
      code:
        "EFFECTIVE_DATES_REQUIRED",

      message:
        "Effective start and end dates are required before finalization.",
    });
  } else if (
    record.effectiveEndDate <
    record.effectiveStartDate
  ) {
    blockers.push({
      code:
        "INVALID_EFFECTIVE_DATE_RANGE",

      message:
        "The effective end date must be on or after the effective start date.",
    });
  }

  return {
    ready:
      blockers.length === 0,

    planningRecord: {
      id: record.id,
      tenantId:
        record.tenantId,
      status:
        record.status,
      revisionNumber:
        record.revisionNumber,
      approvedAt:
        record.approvedAt,
      activeAt:
        record.activeAt,
      effectiveStartDate:
        record.effectiveStartDate,
      effectiveEndDate:
        record.effectiveEndDate,
    },

    revision: {
      exists:
        Boolean(revision),

      tenantMatches:
        revision
          ? revision.tenantId ===
            record.tenantId
          : false,
    },

    approvals: {
      requiredCount:
        requiredApprovals.length,

      approvedRequiredCount,

      revisionRequiredCount,
      rejectedCount,
    },

    signatures: {
      requiredCount:
        signatureRequiredApprovals.length,

      verifiedCount:
        verifiedSignatureCount,
    },

    openReviewCommentCount,

    blockers,

    metadata: {
      workflowVersion:
        "qoreva-planning-finalization-readiness-v1",

      revisionScoped: true,

      advisoryOnly: false,

      serverAuthoritative: true,
    },
  };
}
