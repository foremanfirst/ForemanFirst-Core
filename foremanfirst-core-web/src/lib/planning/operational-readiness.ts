import { prisma } from "@/lib/prisma";

import {
  evaluatePlanningSubmissionReadiness,
} from "@/lib/planning/submission-readiness";

import {
  resolvePlanningApprovalRouting,
} from "@/lib/planning/approval-routing";

export type PlanningOperationalState =
  | "PlanningIncomplete"
  | "SubmissionSetupRequired"
  | "AwaitingApproval"
  | "RevisionRequired"
  | "ApprovedNotYetEffective"
  | "ReadyForFieldUse"
  | "Expired"
  | "Closed";

export type PlanningOperationalSeverity =
  | "Ready"
  | "Attention"
  | "Blocked"
  | "Informational";

export type PlanningOperationalActionCode =
  | "CONTINUE_PLANNING"
  | "COMPLETE_PRE_SUBMISSION_REVIEW"
  | "CONFIGURE_APPROVALS"
  | "SUBMIT_FOR_REVIEW"
  | "VIEW_APPROVALS"
  | "START_REVISION"
  | "WAIT_FOR_EFFECTIVE_DATE"
  | "START_DAILY_WSE"
  | "NONE";

type OperationalBlocker = {
  code: string;
  message: string;
};

type OperationalNextAction = {
  code: PlanningOperationalActionCode;
  label: string;
};

function startOfUtcDay(
  value: Date,
): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

export async function evaluatePlanningOperationalReadiness(
  planningRecordId: string,
  now = new Date(),
) {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id: planningRecordId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
        title: true,
        planType: true,
        status: true,
        revisionNumber: true,

        submittedAt: true,
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

  const today =
    startOfUtcDay(now);

  const effectiveStartDate =
    record.effectiveStartDate
      ? startOfUtcDay(
          record.effectiveStartDate,
        )
      : null;

  const effectiveEndDate =
    record.effectiveEndDate
      ? startOfUtcDay(
          record.effectiveEndDate,
        )
      : null;

  let state:
    PlanningOperationalState;

  let severity:
    PlanningOperationalSeverity;

  let headline: string;
  let message: string;

  let blockers:
    OperationalBlocker[] = [];

  let nextAction:
    OperationalNextAction;

  let submissionReadiness:
    Awaited<
      ReturnType<
        typeof evaluatePlanningSubmissionReadiness
      >
    > | null = null;

  /*
   * Draft is the only lifecycle state that
   * evaluates submission readiness here.
   *
   * This avoids treating submission compliance
   * as the authority for later approval and
   * field-use lifecycle states.
   */
  if (record.status === "Draft") {
    submissionReadiness =
      await evaluatePlanningSubmissionReadiness(
        record.id,
      );

    if (!submissionReadiness.ready) {
      state =
        "PlanningIncomplete";

      severity =
        "Blocked";

      headline =
        "Planning Incomplete";

      message =
        `${submissionReadiness.blockers.length} blocking requirement${submissionReadiness.blockers.length === 1 ? " remains" : "s remain"} before this PTP can continue toward submission.`;

      blockers =
        submissionReadiness.blockers.map(
          (blocker) => ({
            code:
              blocker.requirementRuleCode,

            message:
              blocker.message ??
              `${blocker.requirementTitle} requires attention before submission.`,
          }),
        );

      nextAction = {
        code:
          "CONTINUE_PLANNING",

        label:
          "Continue Planning",
      };
    } else {
      /*
       * Compliance readiness is only one part of
       * actual submission eligibility.
       *
       * Check the other persisted server-authoritative
       * prerequisites enforced by the submit endpoint.
       *
       * Creator-selected approval assignments and the
       * final submission acknowledgement are request-
       * scoped inputs, so this GET evaluator must not
       * claim the record is fully submittable before
       * those actions occur.
       */
      const [
        revision,
        completedReview,
        openCommentCount,
        approvalRouting,
      ] =
        await Promise.all([
          prisma.planningRevision.findFirst({
            where: {
              planningRecordId:
                record.id,

              tenantId:
                record.tenantId,

              revisionNumber:
                record.revisionNumber,
            },

            select: {
              id: true,
            },
          }),

          prisma.planningReview.findFirst({
            where: {
              planningRecordId:
                record.id,

              tenantId:
                record.tenantId,

              revisionNumber:
                record.revisionNumber,

              status:
                "Completed",
            },

            select: {
              id: true,
              completedAt: true,
            },

            orderBy: {
              completedAt:
                "desc",
            },
          }),

          prisma.planningReviewComment.count({
            where: {
              planningRecordId:
                record.id,

              tenantId:
                record.tenantId,

              revisionNumber:
                record.revisionNumber,

              status:
                "Open",
            },
          }),

          resolvePlanningApprovalRouting(
            record.id,
          ),
        ]);

      if (!revision) {
        state =
          "SubmissionSetupRequired";

        severity =
          "Blocked";

        headline =
          "Draft Revision Must Be Saved";

        message =
          `Revision ${record.revisionNumber} must exist as a saved draft revision before submission.`;

        blockers = [
          {
            code:
              "SAVED_REVISION_REQUIRED",

            message:
              "A saved draft revision is required before submission.",
          },
        ];

        nextAction = {
          code:
            "CONTINUE_PLANNING",

          label:
            "Save Draft Revision",
        };
      } else if (!completedReview) {
        state =
          "SubmissionSetupRequired";

        severity =
          "Blocked";

        headline =
          "Pre-Submission Review Required";

        message =
          `Revision ${record.revisionNumber} must complete Pre-Submission Review before it can be submitted.`;

        blockers = [
          {
            code:
              "PRE_SUBMISSION_REVIEW_REQUIRED",

            message:
              "A completed Pre-Submission Review is required before submission.",
          },
        ];

        nextAction = {
          code:
            "COMPLETE_PRE_SUBMISSION_REVIEW",

          label:
            "Complete Pre-Submission Review",
        };
      } else if (
        openCommentCount > 0
      ) {
        state =
          "SubmissionSetupRequired";

        severity =
          "Blocked";

        headline =
          "Review Comments Require Resolution";

        message =
          `${openCommentCount} open Pre-Submission Review comment${openCommentCount === 1 ? " remains" : "s remain"}.`;

        blockers = [
          {
            code:
              "OPEN_PRE_SUBMISSION_REVIEW_COMMENTS",

            message:
              `${openCommentCount} open review comment${openCommentCount === 1 ? " must" : "s must"} be resolved before submission.`,
          },
        ];

        nextAction = {
          code:
            "COMPLETE_PRE_SUBMISSION_REVIEW",

          label:
            "Resolve Review Comments",
        };
      } else if (
        approvalRouting.revisionNumber !==
        record.revisionNumber
      ) {
        state =
          "SubmissionSetupRequired";

        severity =
          "Blocked";

        headline =
          "Approval Workflow Requires Attention";

        message =
          "The resolved approval workflow does not match the active planning revision.";

        blockers = [
          {
            code:
              "APPROVAL_ROUTING_REVISION_MISMATCH",

            message:
              "Approval routing must match the active planning revision before submission.",
          },
        ];

        nextAction = {
          code:
            "CONFIGURE_APPROVALS",

          label:
            "Review Approval Workflow",
        };
      } else if (
        approvalRouting.roles.length ===
        0
      ) {
        state =
          "SubmissionSetupRequired";

        severity =
          "Blocked";

        headline =
          "Approval Workflow Required";

        message =
          "At least one approval role must be resolved before this PTP can be submitted.";

        blockers = [
          {
            code:
              "APPROVAL_ROUTING_REQUIRED",

            message:
              "At least one approval role is required before submission.",
          },
        ];

        nextAction = {
          code:
            "CONFIGURE_APPROVALS",

          label:
            "Configure Approvals",
        };
      } else {
        /*
         * Persisted planning prerequisites are complete,
         * but approver assignment and final acknowledgement
         * still happen during the submission interaction.
         *
         * Do not present this as fully ReadyForSubmission
         * until those request-scoped requirements become
         * persisted or independently evaluable.
         */
        state =
          "SubmissionSetupRequired";

        severity =
          "Attention";

        headline =
          "Approval Setup Required";

        message =
          `Revision ${record.revisionNumber} has passed persisted planning and review gates. Assign eligible approvers and confirm submission to continue.`;

        nextAction = {
          code:
            "CONFIGURE_APPROVALS",

          label:
            "Assign Approvers",
        };
      }
    }
  } else if (
    record.status ===
    "Revision Needed"
  ) {
    state =
      "RevisionRequired";

    severity =
      "Blocked";

    headline =
      "Revision Required";

    message =
      `Revision ${record.revisionNumber} requires changes before it can continue through approval.`;

    nextAction = {
      code:
        "START_REVISION",
      label:
        "Revise PTP",
    };
  } else if (
    record.status ===
      "Submitted" ||
    record.status ===
      "In Review"
  ) {
    state =
      "AwaitingApproval";

    severity =
      "Attention";

    headline =
      "Awaiting Approval";

    message =
      `Revision ${record.revisionNumber} is in the controlled review and approval workflow.`;

    nextAction = {
      code:
        "VIEW_APPROVALS",
      label:
        "View Approvals",
    };
  } else if (
    record.status ===
    "Approved"
  ) {
    if (
      !effectiveStartDate ||
      !effectiveEndDate
    ) {
      state =
        "ApprovedNotYetEffective";

      severity =
        "Blocked";

      headline =
        "Approved — Effective Dates Required";

      message =
        "This PTP is approved but does not have a complete effective date range for field use.";

      blockers = [
        {
          code:
            "EFFECTIVE_DATES_REQUIRED",
          message:
            "Effective start and end dates are required for field use.",
        },
      ];

      nextAction = {
        code:
          "START_REVISION",
        label:
          "Revise PTP",
      };
    } else if (
      today <
      effectiveStartDate
    ) {
      state =
        "ApprovedNotYetEffective";

      severity =
        "Informational";

      headline =
        "Approved — Not Yet Effective";

      message =
        `Revision ${record.revisionNumber} is approved but its field-use period has not started.`;

      nextAction = {
        code:
          "WAIT_FOR_EFFECTIVE_DATE",
        label:
          "View Effective Dates",
      };
    } else if (
      today >
      effectiveEndDate
    ) {
      state =
        "Expired";

      severity =
        "Blocked";

      headline =
        "PTP Expired";

      message =
        `Approved Revision ${record.revisionNumber} is outside its effective field-use period.`;

      blockers = [
        {
          code:
            "EFFECTIVE_PERIOD_EXPIRED",
          message:
            "The approved PTP effective end date has passed.",
        },
      ];

      nextAction = {
        code:
          "START_REVISION",
        label:
          "Start Revision",
      };
    } else {
      state =
        "ReadyForFieldUse";

      severity =
        "Ready";

      headline =
        "Ready for Field Use";

      message =
        `Approved Revision ${record.revisionNumber} is effective for field use.`;

      nextAction = {
        code:
          "START_DAILY_WSE",
        label:
          "Start Today's WSE",
      };
    }
  } else if (
    record.status ===
    "Closed"
  ) {
    state =
      "Closed";

    severity =
      "Informational";

    headline =
      "PTP Closed";

    message =
      "This controlled PTP is closed and is not available for new field work.";

    nextAction = {
      code:
        "NONE",
      label:
        "No Action",
    };
  } else {
    /*
     * Fail closed for any unexpected lifecycle
     * value. Unknown states must never be presented
     * as ready for field use.
     */
    state =
      "PlanningIncomplete";

    severity =
      "Blocked";

    headline =
      "Planning Status Requires Attention";

    message =
      `Planning status "${record.status}" is not recognized as field-ready.`;

    blockers = [
      {
        code:
          "UNRECOGNIZED_PLANNING_STATUS",
        message:
          "The current planning lifecycle state cannot be verified for field use.",
      },
    ];

    nextAction = {
      code:
        "CONTINUE_PLANNING",
      label:
        "Review Planning Record",
    };
  }

  return {
    planningRecord: {
      id: record.id,
      title: record.title,
      planType: record.planType,
      status: record.status,
      revisionNumber:
        record.revisionNumber,

      submittedAt:
        record.submittedAt,

      approvedAt:
        record.approvedAt,

      activeAt:
        record.activeAt,

      effectiveStartDate:
        record.effectiveStartDate,

      effectiveEndDate:
        record.effectiveEndDate,
    },

    state,
    severity,
    headline,
    message,

    fieldUse: {
      ready:
        state ===
        "ReadyForFieldUse",

      effectiveToday:
        state ===
        "ReadyForFieldUse",
    },

    submission: {
      compliance: {
        evaluated:
          submissionReadiness !==
          null,

        ready:
          submissionReadiness
            ?.ready ?? null,

        blockerCount:
          submissionReadiness
            ?.blockers.length ??
          null,
      },

      ready:
        false,

      setupRequired:
        state ===
        "SubmissionSetupRequired",
    },

    blockers,

    nextAction,

    metadata: {
      workflowVersion:
        "qoreva-planning-operational-readiness-v1",

      advisoryOnly: false,

      serverAuthoritative:
        true,

      evaluatedAt:
        now,
    },
  };
}
