"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type PlanningRecord = {
  id: string;
  planType: string;
  title: string;
  status: string;
  revisionNumber: number;
  responsibleSupervisor: string | null;
  plannedStartDate: string | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
  workLocation: string | null;
  crewSize: number | null;
  shift: string | null;
  scopeDescription: string | null;
  equipmentTools: string | null;
  materialsChemicals: string | null;
  adjacentWork: string | null;
  specialConditions: string | null;
  requiredPpe: string | null;
  requiredPermits: string | null;
  emergencyPlan: string | null;
  stopWorkTriggers: string | null;
  planningNotes: string | null;
  qualityScore: number;
  submittedAt: string | null;
  approvedAt: string | null;
  activeAt: string | null;
  company: { id: string; name: string };
  project: {
    id: string;
    name: string;
    projectCode: string | null;
    clientName: string | null;
  };
  contractor: {
    id: string;
    name: string;
    legalName: string | null;
    trade: string | null;
  } | null;
  workSteps: Array<{
    id: string;
    sequence: number;
    title: string;
    description: string | null;
    hazards: string | null;
    controls: string | null;
    safetyCritical: boolean;
    riskLevel: string | null;
  }>;
  questionResponses: Array<{
    id: string;
    category: string;
    question: string;
    isCritical: boolean;
    responseValue: string | null;
    notes: string | null;
  }>;
  reviews: Array<{
    id: string;
    reviewerName: string;
    reviewerRole: string;
    status: string;
    reviewNotes: string | null;
    completedAt: string | null;
  }>;
  reviewComments: Array<{
    id: string;
    status: string;
  }>;
  signatures: Array<{
    id: string;
    role: string;
    signerName: string;
    status: string;
    signedAt: string | null;
  }>;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    status: string;
    revisionReason: string | null;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    comment: string | null;
    createdAt: string;
  }>;
  dailyWseRecords: Array<{
    id: string;
    revisionNumber: number;
    engagementDate: string;
    foremanName: string;
    shift: string | null;
    workLocation?: string | null;
    dailyRiskLevel?: string | null;
    status?: string;
  }>;
};


type ReviewWorkItem = {
  planningRecord: {
    id: string;
    title: string;
    planType: string;
    status: string;
    revisionNumber: number;
    submittedAt: string | null;
    qualityScore: number;
    project: {
      id: string;
      name: string;
      projectCode: string | null;
    };
    contractor: {
      id: string;
      name: string;
    } | null;
  };

  revision: {
    revisionNumber: number;
    isSubmitted: boolean;
  };

  summary: {
    totalApprovals: number;
    requiredApprovals: number;
    approvedRequired: number;
    pendingRequired: number;
    revisionRequired: number;
    rejected: number;
    openComments: number;
    allRequiredApproved: boolean;
    hasBlockingDecision: boolean;
  };

  approvals: Array<{
    id: string;
    revisionNumber: number;
    roleCode: string;
    roleLabel: string;
    isRequired: boolean;
    sortOrder: number;

    approver: {
      id: string | null;
      name: string | null;
      email: string | null;
      currentIdentity: {
        displayName: string;
        email: string;
        status: string;
        isActive: boolean;
      } | null;
    };

    eligibility: {
      hasActiveProjectMembership: boolean;
      canReviewPlanning: boolean;
      canApprovePlanning: boolean;
      approvalRoleCodes: string[];
      assignedRoleIsEligible: boolean;
    };

    status: string;
    decisionComment: string | null;

    decision: {
      decidedById: string | null;
      decidedByName: string | null;
      decidedByRole: string | null;
      decidedAt: string | null;
    };

    signature: {
      required: boolean;
      planningSignatureId: string | null;
    };

    notification: {
      status: string | null;
      notifiedAt: string | null;
      reminderSentAt: string | null;
    };

    createdAt: string;
    updatedAt: string;
  }>;

  capabilities: {
    reviewerIdentityResolved: boolean;
    currentReviewerApprovalId: string | null;
    currentReviewerRoleCode: string | null;
    currentReviewerRoleLabel: string | null;
    canApproveAndSign: boolean;
    canReturnForRevision: boolean;
  };

  metadata: {
    workflowVersion: string;
    revisionScoped: boolean;
    advisoryOnly: boolean;
    requiresAuthenticatedReviewerForDecision: boolean;
  };
};

export default function PlanningRecordPage() {
  const params = useParams<{ planningRecordId: string }>();
  const planningRecordId = params.planningRecordId;

  const [record, setRecord] = useState<PlanningRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [reviewWorkItem, setReviewWorkItem] =
    useState<ReviewWorkItem | null>(null);
  const [reviewWorkItemLoading, setReviewWorkItemLoading] =
    useState(false);
  const [reviewerDecisionSaving, setReviewerDecisionSaving] =
    useState(false);
  const [reviewerDecisionError, setReviewerDecisionError] =
    useState("");
  const [reviewerDecisionComment, setReviewerDecisionComment] =
    useState("");
  const [approvalAttestationAccepted, setApprovalAttestationAccepted] =
    useState(false);

  const [lifecycleSaving, setLifecycleSaving] =
    useState(false);
  const [lifecycleError, setLifecycleError] =
    useState("");
  const [lifecycleComment, setLifecycleComment] =
    useState("");

  const [wseCreating, setWseCreating] =
    useState(false);
  const [wseError, setWseError] =
    useState("");
  const [wseSuccess, setWseSuccess] =
    useState("");
  const [wseForemanName, setWseForemanName] =
    useState("");
  const [wseDate, setWseDate] =
    useState(() => localDateInputValue());
  const [wseShift, setWseShift] =
    useState("");
  const [wseWorkLocation, setWseWorkLocation] =
    useState("");


  async function loadReviewWorkItem(
    recordId: string,
  ) {
    setReviewWorkItemLoading(true);
    setReviewerDecisionError("");

    try {
      const response = await fetch(
        `/api/planning/${recordId}/review-work-item`,
        { cache: "no-store" },
      );

      const data =
        (await response.json()) as {
          workItem?: ReviewWorkItem;
          message?: string;
        };

      if (!response.ok || !data.workItem) {
        throw new Error(
          data.message ||
            "Unable to load reviewer workflow.",
        );
      }

      setReviewWorkItem(data.workItem);
    } catch (error) {
      setReviewWorkItem(null);
      setReviewerDecisionError(
        error instanceof Error
          ? error.message
          : "Unable to load reviewer workflow.",
      );
    } finally {
      setReviewWorkItemLoading(false);
    }
  }

  async function loadRecord(
    options?: {
      showLoading?: boolean;
    },
  ) {
    if (!planningRecordId) {
      return;
    }

    if (options?.showLoading !== false) {
      setLoading(true);
    }

    setLoadError("");

    try {
      const response = await fetch(
        `/api/planning/${planningRecordId}`,
        { cache: "no-store" },
      );

      const data = (await response.json()) as {
        record?: PlanningRecord;
        message?: string;
      };

      if (!response.ok || !data.record) {
        throw new Error(
          data.message ||
            "Unable to load planning record.",
        );
      }

      setRecord(data.record);

      if (
        data.record.status === "Submitted" ||
        data.record.status === "Revision Needed"
      ) {
        await loadReviewWorkItem(data.record.id);
      } else {
        setReviewWorkItem(null);
      }


      setWseForemanName((current) =>
        current || data.record?.responsibleSupervisor || "",
      );
      setWseShift((current) =>
        current || data.record?.shift || "",
      );
      setWseWorkLocation((current) =>
        current || data.record?.workLocation || "",
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load planning record.",
      );
    } finally {
      if (options?.showLoading !== false) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadRecord();
    // planningRecordId is the only route dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningRecordId]);

  const openComments = useMemo(
    () =>
      record?.reviewComments.filter((comment) => comment.status === "Open")
        .length ?? 0,
    [record],
  );

  async function approveAndSign() {
    if (!record || !reviewWorkItem) {
      return;
    }

    const approvalId =
      reviewWorkItem.capabilities
        .currentReviewerApprovalId;

    if (
      !approvalId ||
      !reviewWorkItem.capabilities
        .canApproveAndSign
    ) {
      setReviewerDecisionError(
        "This signed-in user is not authorized to approve this review assignment.",
      );
      return;
    }

    if (!approvalAttestationAccepted) {
      setReviewerDecisionError(
        "Confirm the electronic approval attestation before signing.",
      );
      return;
    }

    if (
      !window.confirm(
        `Approve and electronically sign Revision ${record.revisionNumber}?`,
      )
    ) {
      return;
    }

    setReviewerDecisionSaving(true);
    setReviewerDecisionError("");

    try {
      const response = await fetch(
        `/api/planning/${record.id}/approvals/${approvalId}/approve-and-sign`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            attestationAccepted: true,
            decisionComment:
              reviewerDecisionComment.trim() ||
              null,
          }),
        },
      );

      const data =
        (await response.json()) as {
          workflow?: {
            readyForFinalization?: boolean;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to approve and sign this planning review.",
        );
      }

      setReviewerDecisionComment("");
      setApprovalAttestationAccepted(false);

      await loadRecord({
        showLoading: false,
      });
    } catch (error) {
      setReviewerDecisionError(
        error instanceof Error
          ? error.message
          : "Unable to approve and sign this planning review.",
      );
    } finally {
      setReviewerDecisionSaving(false);
    }
  }

  async function returnForRevision() {
    if (!record || !reviewWorkItem) {
      return;
    }

    const approvalId =
      reviewWorkItem.capabilities
        .currentReviewerApprovalId;

    if (
      !approvalId ||
      !reviewWorkItem.capabilities
        .canReturnForRevision
    ) {
      setReviewerDecisionError(
        "This signed-in user is not authorized to return this review assignment.",
      );
      return;
    }

    if (!reviewerDecisionComment.trim()) {
      setReviewerDecisionError(
        "Enter the revision instructions before returning the PTP.",
      );
      return;
    }

    if (
      !window.confirm(
        `Return Revision ${record.revisionNumber} for revision? The submitted revision and review history will remain preserved.`,
      )
    ) {
      return;
    }

    setReviewerDecisionSaving(true);
    setReviewerDecisionError("");

    try {
      const response = await fetch(
        `/api/planning/${record.id}/approvals/${approvalId}/return-for-revision`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            decisionComment:
              reviewerDecisionComment.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as {
          record?: {
            id: string;
            status: string;
            revisionNumber: number;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to return this planning record for revision.",
        );
      }

      setReviewerDecisionComment("");
      setApprovalAttestationAccepted(false);

      await loadRecord({
        showLoading: false,
      });
    } catch (error) {
      setReviewerDecisionError(
        error instanceof Error
          ? error.message
          : "Unable to return this planning record for revision.",
      );
    } finally {
      setReviewerDecisionSaving(false);
    }
  }

  async function startRevision() {
    if (!record) {
      return;
    }

    if (!lifecycleComment.trim()) {
      setLifecycleError(
        "Enter the revision reason before starting a new revision.",
      );
      return;
    }

    if (
      !window.confirm(
        `Start Revision ${record.revisionNumber + 1}? Revision ${record.revisionNumber} will remain preserved in the audit history.`,
      )
    ) {
      return;
    }

    setLifecycleSaving(true);
    setLifecycleError("");

    try {
      const response = await fetch(
        `/api/planning/${record.id}/revision/start`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            revisionReason:
              lifecycleComment.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as {
          record?: {
            id: string;
            status: string;
            revisionNumber: number;
          };
          revision?: {
            previousRevisionNumber: number;
            currentRevisionNumber: number;
          };
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to start the new planning revision.",
        );
      }

      setLifecycleComment("");

      await loadRecord({
        showLoading: false,
      });
    } catch (error) {
      setLifecycleError(
        error instanceof Error
          ? error.message
          : "Unable to start the new planning revision.",
      );
    } finally {
      setLifecycleSaving(false);
    }
  }


  async function startDailyWse() {
    if (!record) {
      return;
    }

    setWseError("");
    setWseSuccess("");

    if (record.status !== "Approved") {
      setWseError(
        "A Daily WSE can only be started from an Approved planning record.",
      );
      return;
    }

    const eligibility =
      fieldEligibility(record);

    if (eligibility === "Upcoming") {
      setWseError(
        `This PTP is approved, but it does not become effective until ${formatDate(
          record.effectiveStartDate,
        )}.`,
      );
      return;
    }

    if (eligibility === "Expired") {
      setWseError(
        `This PTP expired for field use on ${formatDate(
          record.effectiveEndDate,
        )}. Revise or extend the PTP before starting another Daily WSE.`,
      );
      return;
    }

    if (eligibility !== "Effective") {
      setWseError(
        "Effective start and end dates are required before a Daily WSE can be started.",
      );
      return;
    }

    if (!wseForemanName.trim()) {
      setWseError(
        "Enter the foreman / supervisor name.",
      );
      return;
    }

    if (!wseDate) {
      setWseError(
        "Select the Daily WSE date.",
      );
      return;
    }

    const selectedWseDate =
      new Date(
        `${wseDate}T12:00:00`,
      );

    const effectiveStart =
      record.effectiveStartDate
        ? new Date(
            record.effectiveStartDate,
          )
        : null;

    const effectiveEnd =
      record.effectiveEndDate
        ? new Date(
            record.effectiveEndDate,
          )
        : null;

    if (
      effectiveStart &&
      selectedWseDate <
        effectiveStart
    ) {
      setWseError(
        `The selected WSE date is before this PTP becomes effective on ${formatDate(
          record.effectiveStartDate,
        )}.`,
      );
      return;
    }

    if (
      effectiveEnd &&
      selectedWseDate >
        effectiveEnd
    ) {
      setWseError(
        `The selected WSE date is after this PTP expires on ${formatDate(
          record.effectiveEndDate,
        )}. Revise or extend the PTP before starting another Daily WSE.`,
      );
      return;
    }

    setWseCreating(true);

    try {
      const response =
        await fetch(
          `/api/planning/${record.id}/wse`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              engagementDate:
                `${wseDate}T12:00:00`,

              foremanName:
                wseForemanName.trim(),

              foremanRole:
                "Foreman / Supervisor",

              shift:
                wseShift.trim() ||
                null,

              workLocation:
                wseWorkLocation.trim() ||
                null,

            }),
          },
        );

      const data =
        (await response.json()) as {
          wse?: {
            id: string;
            revisionNumber: number;
          };

          existing?: boolean;

          message?: string;
        };

      if (!response.ok) {
        if (
          response.status === 409 &&
          data.existing === true &&
          data.wse?.id
        ) {
          setWseError("");

          setWseSuccess(
            "A Daily WSE already exists for this date, shift, and PTP revision.",
          );

          await loadRecord({
            showLoading: false,
          });

          return;
        }

        throw new Error(
          data.message ||
            "Unable to start the Daily WSE.",
        );
      }

      if (!data.wse?.id) {
        throw new Error(
          "The Daily WSE was not confirmed as created.",
        );
      }

      setWseError("");

      setWseSuccess(
        `Daily WSE created from Approved PTP Revision ${data.wse.revisionNumber}.`,
      );

      await loadRecord({
        showLoading: false,
      });
    } catch (error) {
      setWseSuccess("");

      setWseError(
        error instanceof Error
          ? error.message
          : "Unable to start the Daily WSE.",
      );
    } finally {
      setWseCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-8 text-center">
        Loading planning record...
      </div>
    );
  }

  if (!record || loadError) {
    return (
      <div className="space-y-4">
        <Link href="/planning" className="font-black text-[var(--qoreva-violet)]">
          ← Back to Planning
        </Link>
        <div className="rounded-[1.75rem] border border-[#F0BDC4] bg-white p-8 text-center">
          <p className="font-black text-[var(--qoreva-danger)]">
            Unable to open plan
          </p>
          <p className="mt-2 text-sm text-[var(--qoreva-muted)]">
            {loadError || "Planning record was not found."}
          </p>
        </div>
      </div>
    );
  }

  const latestReview = record.reviews[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <Link href="/planning" className="text-xs font-black text-[var(--qoreva-violet)]">
          ← Planning
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-violet-dark)]">
            {record.planType}
          </span>
          <StatusBadge status={record.status} />
          <span className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-[10px] font-black text-[var(--qoreva-muted)]">
            Rev. {record.revisionNumber}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--qoreva-obsidian)] sm:text-4xl">
          {record.title}
        </h1>

        <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
          {record.project.name}
          {record.project.projectCode ? ` • ${record.project.projectCode}` : ""}
          {" • "}
          {record.contractor?.name || "Contractor not assigned"}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Quality" value={`${record.qualityScore}%`} />
          <Summary label="Work Steps" value={String(record.workSteps.length)} />
          <Summary label="Signatures" value={String(record.signatures.length)} />
          <Summary
            label="Daily WSE"
            value={String(record.dailyWseRecords.length)}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Supervisor / Foreman" value={record.responsibleSupervisor} />
        <Info label="Work Location" value={record.workLocation} />
        <Info label="Planned Start" value={formatDate(record.plannedStartDate)} />
        <Info
          label="Effective Period"
          value={
            record.effectiveStartDate && record.effectiveEndDate
              ? `${formatDate(record.effectiveStartDate)} → ${formatDate(
                  record.effectiveEndDate,
                )}`
              : "Not approved / dates not set"
          }
        />
        <Info
          label="Crew / Shift"
          value={`${record.crewSize ?? "—"} • ${record.shift || "Not entered"}`}
        />
      </section>

      <Section eyebrow="Work Scope" title="Scope & Conditions">
        <div className="grid gap-4 lg:grid-cols-2">
          <Info label="Task Description" value={record.scopeDescription} />
          <Info label="Equipment / Tools" value={record.equipmentTools} />
          <Info label="Materials / Chemicals" value={record.materialsChemicals} />
          <Info label="Adjacent Work" value={record.adjacentWork} />
          <Info label="Special Conditions" value={record.specialConditions} />
          <Info label="Planning Notes" value={record.planningNotes} />
        </div>
      </Section>

      <Section eyebrow="Work Sequence" title="Hazards & Controls">
        {record.workSteps.length === 0 ? (
          <Empty text="No persisted work steps are attached to this record." />
        ) : (
          <div className="space-y-4">
            {record.workSteps.map((step) => (
              <article
                key={step.id}
                className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-[var(--qoreva-violet)]">
                    Step {step.sequence}
                  </span>
                  {step.riskLevel ? (
                    <span className="rounded-full border border-[var(--qoreva-border)] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-muted)]">
                      {step.riskLevel} Risk
                    </span>
                  ) : null}
                  {step.safetyCritical ? (
                    <span className="rounded-full border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-2.5 py-1 text-[10px] font-black text-[var(--qoreva-danger)]">
                      Safety Critical
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2 font-black text-[var(--qoreva-obsidian)]">
                  {step.title}
                </h3>
                {step.description ? (
                  <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                    {step.description}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Info label="Hazards" value={step.hazards} />
                  <Info label="Controls" value={step.controls} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="Controls" title="PPE, Permits & Emergency Planning">
        <div className="grid gap-4 lg:grid-cols-2">
          <Info label="Required PPE" value={record.requiredPpe} />
          <Info label="Required Permits" value={record.requiredPermits} />
          <Info label="Emergency Plan" value={record.emergencyPlan} />
          <Info label="Stop-Work Triggers" value={record.stopWorkTriggers} />
        </div>
      </Section>

      <Section eyebrow="Guided Planning" title="Planning Questions">
        {record.questionResponses.length === 0 ? (
          <Empty text="No guided-planning responses are attached to this record." />
        ) : (
          <div className="space-y-3">
            {record.questionResponses.map((response) => (
              <div
                key={response.id}
                className="rounded-2xl border border-[var(--qoreva-border)] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                  {response.category}
                </p>
                <p className="mt-2 text-sm font-black text-[var(--qoreva-obsidian)]">
                  {response.question}
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--qoreva-text)]">
                  Answer: {response.responseValue || "Not entered"}
                </p>
                {response.notes ? (
                  <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                    Notes: {response.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Section eyebrow="Qualified Review" title="Review Status">
          {latestReview ? (
            <div className="space-y-3">
              <Info label="Reviewer" value={latestReview.reviewerName} />
              <Info label="Role" value={latestReview.reviewerRole} />
              <Info label="Status" value={latestReview.status} />
              <Info label="Review Notes" value={latestReview.reviewNotes} />
              <p className="text-xs font-bold text-[var(--qoreva-muted)]">
                Completed: {formatDateTime(latestReview.completedAt)}
              </p>
            </div>
          ) : (
            <Empty text="No qualified review has been persisted." />
          )}
        </Section>

        <Section eyebrow="Signatures" title="Submission Signatures">
          {record.signatures.length === 0 ? (
            <Empty text="No signatures are attached to this planning record." />
          ) : (
            <div className="space-y-3">
              {record.signatures.map((signature) => (
                <div
                  key={signature.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--qoreva-border)] p-4"
                >
                  <div>
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      {signature.role}
                    </p>
                    <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                      {signature.signerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={signature.status} />
                    <p className="mt-1 text-[10px] text-[var(--qoreva-muted)]">
                      {formatDateTime(signature.signedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </section>

      <Section eyebrow="Field Engagement" title="Daily Worker Safety Engagement">
        {record.status === "Approved" &&
        fieldEligibility(record) === "Effective" ? (
          <div className="mb-5 rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                  Start Today&apos;s WSE
                </p>
                <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                  Create from Approved PTP Revision {record.revisionNumber}
                </h3>
                <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                  Qoreva will copy the approved/effective PTP work steps, hazards, controls,
                  risk levels, and safety-critical flags into a new Daily WSE.
                  The approved PTP remains unchanged.
                </p>
              </div>

              <StatusBadge status="Active" />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Foreman / Supervisor
                </span>
                <input
                  value={wseForemanName}
                  onChange={(event) => {
                    setWseForemanName(event.target.value);
                    setWseError("");
                    setWseSuccess("");
                  }}
                  placeholder="Enter name"
                  className={lifecycleInputClassName}
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  WSE Date
                </span>
                <input
                  type="date"
                  value={wseDate}
                  onChange={(event) => {
                    setWseDate(event.target.value);
                    setWseError("");
                    setWseSuccess("");
                  }}
                  className={lifecycleInputClassName}
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Shift
                </span>
                <select
                  value={wseShift}
                  onChange={(event) => {
                    setWseShift(event.target.value);
                    setWseError("");
                    setWseSuccess("");
                  }}
                  className={lifecycleInputClassName}
                >
                  <option value="">Use PTP shift / Not entered</option>
                  <option value="Day">Day</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Night">Night</option>
                  <option value="Shutdown / Outage">Shutdown / Outage</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="block md:col-span-2 xl:col-span-4">
                <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                  Task Location
                </span>
                <input
                  value={wseWorkLocation}
                  onChange={(event) => {
                    setWseWorkLocation(event.target.value);
                    setWseError("");
                    setWseSuccess("");
                  }}
                  placeholder="Building / column / bay / work area"
                  className={lifecycleInputClassName}
                />
              </label>
            </div>

            {wseError ? (
              <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-danger)]">
                {wseError}
              </div>
            ) : null}

            {wseSuccess ? (
              <div className="mt-4 rounded-xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-success)]">
                {wseSuccess}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void startDailyWse()
                }
                disabled={wseCreating}
                className={primaryLifecycleButtonClassName}
              >
                {wseCreating
                  ? "Creating Daily WSE..."
                  : "Start Daily WSE"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
            <p className="text-sm font-bold text-[var(--qoreva-muted)]">
              {record.status !== "Approved"
                ? "The PTP must be approved before a Daily WSE can be created."
                : fieldEligibility(record) === "Upcoming"
                  ? `Daily WSE creation opens on ${formatDate(
                      record.effectiveStartDate,
                    )}.`
                  : fieldEligibility(record) === "Expired"
                    ? `This PTP expired for field use on ${formatDate(
                        record.effectiveEndDate,
                      )}. A revised approval period is required before another Daily WSE can be created.`
                    : "Effective start and end dates are required before a Daily WSE can be created."}
            </p>
          </div>
        )}

        {record.dailyWseRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-6">
            <p className="font-black text-[var(--qoreva-obsidian)]">
              No Daily WSE records yet
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--qoreva-muted)]">
              Start the first Daily WSE above. It will remain linked to this
              exact PTP revision for worker acknowledgement, MOC, closeout, and
              the future combined PTP + WSE package.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {record.dailyWseRecords.map((wse) => (
              <div
                key={wse.id}
                className="rounded-2xl border border-[var(--qoreva-border)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-[var(--qoreva-obsidian)]">
                      {formatDate(wse.engagementDate)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                      {wse.foremanName} • {wse.shift || "Shift not entered"} • Rev.{" "}
                      {wse.revisionNumber}
                    </p>
                    {wse.workLocation ? (
                      <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                        {wse.workLocation}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={wse.status || "Open"}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/planning/${record.id}/wse/${wse.id}`;
                      }}
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--qoreva-border-strong)] bg-white px-3 py-2 text-xs font-black text-[var(--qoreva-obsidian)] transition hover:border-[var(--qoreva-violet)] hover:text-[var(--qoreva-violet)]"
                    >
                      Open WSE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-[var(--qoreva-violet-faint)] p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
              Planning Lifecycle
            </p>
            <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
              {record.status}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
              {record.status === "Submitted"
                ? "This revision is submitted and locked for formal review. Assigned reviewers make their decisions directly against this exact revision."
                : record.status === "Revision Needed"
                  ? "This submitted revision was returned for revision and remains preserved. An authorized planning creator can start the next editable revision."
                  : record.status === "Approved"
                    ? fieldEligibility(record) === "Effective"
                      ? "This revision is approved and currently effective for field use. Daily WSE records can be created against this exact revision."
                      : fieldEligibility(record) === "Upcoming"
                        ? "This revision is approved but its effective start date has not arrived yet."
                        : fieldEligibility(record) === "Expired"
                          ? "This revision is approved but its effective end date has passed. New Daily WSE records are blocked."
                          : "This revision is approved but effective dates are missing."
                    : record.status === "Closed"
                      ? "This planning record is closed and retained as part of the permanent audit history."
                      : record.status === "Draft" && record.revisionNumber > 1
                        ? `Revision ${record.revisionNumber} is the editable working revision. The prior submitted revision remains preserved in Qoreva's audit history.`
                        : "Complete and submit the planning record before formal approval actions become available."}
            </p>

            <p className="mt-3 text-xs font-bold text-[var(--qoreva-muted)]">
              Open review comments: {openComments}
            </p>
          </div>

          <StatusBadge status={record.status} />
        </div>

        {record.status === "Submitted" ? (
          <div className="mt-6 space-y-4">
            {reviewWorkItemLoading ? (
              <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 text-sm font-bold text-[var(--qoreva-muted)]">
                Loading assigned reviewer workflow...
              </div>
            ) : reviewWorkItem ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Summary
                    label="Required Approvals"
                    value={String(
                      reviewWorkItem.summary
                        .requiredApprovals,
                    )}
                  />
                  <Summary
                    label="Approved"
                    value={String(
                      reviewWorkItem.summary
                        .approvedRequired,
                    )}
                  />
                  <Summary
                    label="Pending"
                    value={String(
                      reviewWorkItem.summary
                        .pendingRequired,
                    )}
                  />
                  <Summary
                    label="Open Comments"
                    value={String(
                      reviewWorkItem.summary
                        .openComments,
                    )}
                  />
                </div>

                <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                        Approval Routing
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                        Revision {reviewWorkItem.revision.revisionNumber} Reviewers
                      </h3>
                    </div>

                    {reviewWorkItem.summary
                      .allRequiredApproved ? (
                      <StatusBadge status="Completed" />
                    ) : reviewWorkItem.summary
                        .hasBlockingDecision ? (
                      <StatusBadge status="Revision Needed" />
                    ) : (
                      <StatusBadge status="Pending" />
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    {reviewWorkItem.approvals.map(
                      (approval) => {
                        const isCurrentReviewer =
                          approval.id ===
                          reviewWorkItem.capabilities
                            .currentReviewerApprovalId;

                        return (
                          <div
                            key={approval.id}
                            className={`rounded-xl border p-4 ${
                              isCurrentReviewer
                                ? "border-[rgba(102,87,232,0.28)] bg-[var(--qoreva-violet-faint)]"
                                : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                                    {approval.roleLabel}
                                  </p>

                                  {approval.isRequired ? (
                                    <span className="rounded-full border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[#9B6212]">
                                      Required
                                    </span>
                                  ) : null}

                                  {isCurrentReviewer ? (
                                    <span className="rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] text-[var(--qoreva-violet-dark)]">
                                      Your Review
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                                  {approval.approver.name ||
                                    approval.approver
                                      .currentIdentity
                                      ?.displayName ||
                                    "Approver not assigned"}
                                  {approval.approver.email
                                    ? ` • ${approval.approver.email}`
                                    : ""}
                                </p>

                                {approval.decisionComment ? (
                                  <p className="mt-2 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                                    Decision note: {approval.decisionComment}
                                  </p>
                                ) : null}
                              </div>

                              <StatusBadge status={approval.status} />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>

                {reviewWorkItem.capabilities
                  .reviewerIdentityResolved &&
                reviewWorkItem.capabilities
                  .currentReviewerApprovalId &&
                (reviewWorkItem.capabilities
                  .canApproveAndSign ||
                  reviewWorkItem.capabilities
                    .canReturnForRevision) ? (
                  <div className="rounded-2xl border border-[rgba(102,87,232,0.22)] bg-white p-4 sm:p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-violet)]">
                      Your Assigned Review
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
                      {reviewWorkItem.capabilities
                        .currentReviewerRoleLabel ||
                        "Assigned Reviewer"}
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      Review the submitted PTP above. Approve only when the plan is acceptable for the responsibilities assigned to your role. Return it for revision when changes are required.
                    </p>

                    <label className="mt-4 block">
                      <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                        Review Comment
                        <span className="font-semibold text-[var(--qoreva-muted)]">
                          {" "}— optional for approval, required when returning for revision
                        </span>
                      </span>
                      <textarea
                        value={reviewerDecisionComment}
                        onChange={(event) => {
                          setReviewerDecisionComment(
                            event.target.value,
                          );
                          setReviewerDecisionError("");
                        }}
                        rows={4}
                        placeholder="Add approval notes or clearly describe the changes required..."
                        className={`${lifecycleInputClassName} min-h-28 py-3`}
                      />
                    </label>

                    {reviewWorkItem.capabilities
                      .canApproveAndSign ? (
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
                        <input
                          type="checkbox"
                          checked={approvalAttestationAccepted}
                          onChange={(event) => {
                            setApprovalAttestationAccepted(
                              event.target.checked,
                            );
                            setReviewerDecisionError("");
                          }}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--qoreva-violet)]"
                        />
                        <span className="text-sm font-semibold leading-6 text-[var(--qoreva-text)]">
                          I have reviewed this PTP for the responsibilities assigned to my role and approve this submitted revision. I understand this electronic approval action constitutes my signature.
                        </span>
                      </label>
                    ) : null}

                    {reviewerDecisionError ? (
                      <div className="mt-4 rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-danger)]">
                        {reviewerDecisionError}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {reviewWorkItem.capabilities
                        .canReturnForRevision ? (
                        <button
                          type="button"
                          onClick={() =>
                            void returnForRevision()
                          }
                          disabled={reviewerDecisionSaving}
                          className={dangerLifecycleButtonClassName}
                        >
                          {reviewerDecisionSaving
                            ? "Saving Decision..."
                            : "Return for Revision"}
                        </button>
                      ) : null}

                      {reviewWorkItem.capabilities
                        .canApproveAndSign ? (
                        <button
                          type="button"
                          onClick={() =>
                            void approveAndSign()
                          }
                          disabled={
                            reviewerDecisionSaving ||
                            !approvalAttestationAccepted
                          }
                          className={successLifecycleButtonClassName}
                        >
                          {reviewerDecisionSaving
                            ? "Signing Approval..."
                            : "Approve & Sign"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4">
                    <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                      Awaiting assigned reviewer action
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                      This signed-in user does not currently have a pending approval assignment for this revision. Review authority is controlled by the project approval routing.
                    </p>
                  </div>
                )}

                {reviewWorkItem.summary
                  .allRequiredApproved ? (
                  <div className="rounded-xl border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] px-4 py-3 text-sm font-black text-[var(--qoreva-success)]">
                    ✓ All required reviewers have approved and signed Revision {record.revisionNumber}. This PTP is ready for the finalization gate.
                  </div>
                ) : null}
              </>
            ) : reviewerDecisionError ? (
              <div className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-danger)]">
                {reviewerDecisionError}
              </div>
            ) : null}
          </div>
        ) : null}

        {record.status === "Revision Needed" ? (
          <div className="mt-6 space-y-4">
            {reviewWorkItem?.approvals.some(
              (approval) =>
                approval.status ===
                "RevisionRequired",
            ) ? (
              <div className="rounded-2xl border border-[#F0BDC4] bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[var(--qoreva-danger)]">
                  Revision Instructions
                </p>

                <div className="mt-3 space-y-3">
                  {reviewWorkItem.approvals
                    .filter(
                      (approval) =>
                        approval.status ===
                        "RevisionRequired",
                    )
                    .map((approval) => (
                      <div
                        key={approval.id}
                        className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] p-4"
                      >
                        <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                          {approval.roleLabel}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--qoreva-text)]">
                          {approval.decisionComment ||
                            "Revision was requested without a visible comment."}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] px-4 py-3 text-sm font-black text-[#9B6212]">
              Revision {record.revisionNumber} remains preserved. Starting Revision {record.revisionNumber + 1} creates a new editable working revision without overwriting prior approvals, signatures, or audit history.
            </div>

            <label className="block rounded-2xl border border-[var(--qoreva-border)] bg-white p-4">
              <span className="text-xs font-black text-[var(--qoreva-obsidian)]">
                New Revision Reason
              </span>
              <textarea
                value={lifecycleComment}
                onChange={(event) => {
                  setLifecycleComment(
                    event.target.value,
                  );
                  setLifecycleError("");
                }}
                rows={3}
                placeholder="Summarize what will be corrected or updated in the next revision..."
                className={`${lifecycleInputClassName} min-h-24 py-3`}
              />
            </label>

            {lifecycleError ? (
              <div className="rounded-xl border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--qoreva-danger)]">
                {lifecycleError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                void startRevision()
              }
              disabled={lifecycleSaving}
              className={primaryLifecycleButtonClassName}
            >
              {lifecycleSaving
                ? "Starting Revision..."
                : `Start Revision ${record.revisionNumber + 1}`}
            </button>
          </div>
        ) : null}

        {record.status === "Approved" ? (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm font-black ${
              fieldEligibility(record) === "Effective"
                ? "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]"
                : fieldEligibility(record) === "Expired"
                  ? "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]"
                  : "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]"
            }`}
          >
            {fieldEligibility(record) === "Effective"
              ? `✓ Approved and effective for field use through ${formatDate(
                  record.effectiveEndDate,
                )}. Daily WSEs can now be started from this PTP.`
              : fieldEligibility(record) === "Upcoming"
                ? `Approved. Field use begins ${formatDate(
                    record.effectiveStartDate,
                  )}.`
                : fieldEligibility(record) === "Expired"
                  ? `Expired for field use on ${formatDate(
                      record.effectiveEndDate,
                    )}.`
                  : "Approved, but effective dates are missing."}
          </div>
        ) : null}

        {record.status === "Draft" &&
        record.revisionNumber > 1 ? (
          <div className="mt-5">
            <Link
              href={`/planning/create?planningRecordId=${record.id}`}
              className={primaryLifecycleButtonClassName}
            >
              Edit Revision {record.revisionNumber}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--qoreva-violet)]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-text)]">
        {value || "Not entered"}
      </p>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-[var(--qoreva-obsidian)]">
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-surface-muted)] p-5 text-sm leading-6 text-[var(--qoreva-muted)]">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let classes =
    "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]";

  if (status === "Submitted" || status === "In Review" || status === "Pending") {
    classes =
      "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]";
  } else if (
    status === "Revision Needed" ||
    status === "Needs Revision" ||
    status === "Rejected"
  ) {
    classes =
      "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]";
  } else if (
    status === "Approved" ||
    status === "Active" ||
    status === "Signed" ||
    status === "Completed"
  ) {
    classes =
      "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${classes}`}
    >
      {status}
    </span>
  );
}

const lifecycleInputClassName = `
  mt-2
  w-full
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  py-2.5
  text-sm
  font-semibold
  text-[var(--qoreva-text)]
  outline-none
  transition
  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]
`;

const primaryLifecycleButtonClassName = `
  inline-flex
  min-h-11
  items-center
  justify-center
  rounded-xl
  bg-[var(--qoreva-violet)]
  px-5
  py-2.5
  text-sm
  font-black
  text-white
  transition
  hover:bg-[var(--qoreva-violet-hover)]
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

const dangerLifecycleButtonClassName = `
  inline-flex
  min-h-11
  items-center
  justify-center
  rounded-xl
  border
  border-[#F0BDC4]
  bg-[var(--qoreva-danger-soft)]
  px-5
  py-2.5
  text-sm
  font-black
  text-[var(--qoreva-danger)]
  transition
  hover:opacity-90
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

const successLifecycleButtonClassName = `
  inline-flex
  min-h-11
  items-center
  justify-center
  rounded-xl
  border
  border-[#BDE8D4]
  bg-[var(--qoreva-success-soft)]
  px-5
  py-2.5
  text-sm
  font-black
  text-[var(--qoreva-success)]
  transition
  hover:opacity-90
  disabled:cursor-not-allowed
  disabled:opacity-60
`;


function fieldEligibility(
  record: {
    status: string;
    effectiveStartDate: string | null;
    effectiveEndDate: string | null;
  },
):
  | "Effective"
  | "Upcoming"
  | "Expired"
  | "Missing Dates"
  | "Not Approved" {
  if (record.status !== "Approved") {
    return "Not Approved";
  }

  if (
    !record.effectiveStartDate ||
    !record.effectiveEndDate
  ) {
    return "Missing Dates";
  }

  const now = new Date();
  const start =
    new Date(record.effectiveStartDate);
  const end =
    new Date(record.effectiveEndDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return "Missing Dates";
  }

  if (now < start) {
    return "Upcoming";
  }

  if (now > end) {
    return "Expired";
  }

  return "Effective";
}

function localDateInputValue() {
  const now = new Date();
  const offset =
    now.getTimezoneOffset() * 60_000;

  return new Date(
    now.getTime() - offset,
  )
    .toISOString()
    .slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "Not entered";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not completed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}