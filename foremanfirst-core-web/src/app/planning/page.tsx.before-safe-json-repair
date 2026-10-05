"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PlanningRecord = {
  id: string;
  planType: string;
  title: string;
  status: string;
  revisionNumber: number;
  responsibleSupervisor: string | null;
  plannedStartDate: string | null;
  workLocation: string | null;
  qualityScore: number;
  submittedAt: string | null;
  approvedAt: string | null;
  activeAt: string | null;
  project: {
    id: string;
    name: string;
    projectCode: string | null;
  };
  contractor: {
    id: string;
    name: string;
    legalName: string | null;
    trade: string | null;
  } | null;
  _count: {
    workSteps: number;
    questionResponses: number;
    reviews: number;
    reviewComments: number;
    signatures: number;
    dailyWseRecords: number;
  };
};

const TENANT_ID = "development-tenant";

export default function PlanningPage() {
  const [plans, setPlans] = useState<PlanningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `/api/planning?tenantId=${encodeURIComponent(TENANT_ID)}`,
          { cache: "no-store" },
        );

        const data = (await response.json()) as {
          records?: PlanningRecord[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message || "Unable to load planning records.");
        }

        if (!cancelled) {
          setPlans(data.records ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load planning records.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const statuses = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.status))).sort(),
    [plans],
  );

  const planTypes = useMemo(
    () => Array.from(new Set(plans.map((plan) => plan.planType))).sort(),
    [plans],
  );

  const visiblePlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const searchable = [
        plan.title,
        plan.planType,
        plan.status,
        plan.project.name,
        plan.project.projectCode ?? "",
        plan.contractor?.name ?? "",
        plan.contractor?.trade ?? "",
        plan.workLocation ?? "",
        plan.responsibleSupervisor ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "All" || plan.status === statusFilter) &&
        (typeFilter === "All" || plan.planType === typeFilter)
      );
    });
  }, [plans, search, statusFilter, typeFilter]);

  const draftCount = plans.filter((plan) => plan.status === "Draft").length;
  const submittedCount = plans.filter(
    (plan) => plan.status === "Submitted",
  ).length;
  const approvedCount = plans.filter(
    (plan) => plan.status === "Approved",
  ).length;
  const activeCount = plans.filter((plan) => plan.status === "Active").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
              Qoreva™ Planning
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--qoreva-obsidian)] sm:text-4xl">
              Planning
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
              Live planning records from PostgreSQL. Open a plan to review its
              scope, hazards, signatures, revisions, WSE records, and audit
              history.
            </p>
          </div>

          <Link
            href="/planning/create"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
          >
            + Create Plan
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Drafts" value={draftCount} detail="Plans in progress" />
        <MetricCard
          label="Submitted"
          value={submittedCount}
          detail="Ready for approval workflow"
        />
        <MetricCard
          label="Approved"
          value={approvedCount}
          detail="Approved planning records"
        />
        <MetricCard
          label="Active"
          value={activeCount}
          detail="Ready for field execution"
        />
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--qoreva-border)] bg-white shadow-[var(--qoreva-shadow-sm)]">
        <div className="flex flex-col gap-5 border-b border-[var(--qoreva-border)] p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
              Planning Directory
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--qoreva-obsidian)]">
              Planning Records
            </h2>
            <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
              {loading
                ? "Loading records..."
                : `${visiblePlans.length} plan${
                    visiblePlans.length === 1 ? "" : "s"
                  } shown`}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans..."
              className={filterClassName}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={filterClassName}
            >
              <option value="All">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={filterClassName}
            >
              <option value="All">All plan types</option>
              {planTypes.map((planType) => (
                <option key={planType} value={planType}>
                  {planType}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="px-6 py-14 text-center">
            <p className="font-black text-[var(--qoreva-danger)]">
              Unable to load Planning
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
              {loadError}
            </p>
          </div>
        ) : loading ? (
          <div className="px-6 py-16 text-center text-sm font-bold text-[var(--qoreva-muted)]">
            Loading planning records...
          </div>
        ) : visiblePlans.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-xl font-black text-[var(--qoreva-obsidian)]">
              No plans match this view
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--qoreva-muted)]">
              Change the filters or create a new planning record.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--qoreva-surface-muted)] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-muted)]">
                  <tr>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-5 py-4">Contractor</th>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Quality</th>
                    <th className="px-5 py-4">Start</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--qoreva-border)]">
                  {visiblePlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="transition hover:bg-[var(--qoreva-violet-faint)]"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-[var(--qoreva-obsidian)]">
                          {plan.title}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                          {plan.workLocation || "Location not entered"}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--qoreva-subtle)]">
                          Revision {plan.revisionNumber} •{" "}
                          {plan._count.signatures} signature
                          {plan._count.signatures === 1 ? "" : "s"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold text-[var(--qoreva-text)]">
                          {plan.contractor?.name || "Not assigned"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                          {plan.contractor?.trade || "Trade not entered"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold text-[var(--qoreva-text)]">
                          {plan.project.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                          {plan.project.projectCode || "No project code"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="inline-flex rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-3 py-1 text-xs font-black text-[var(--qoreva-violet-dark)]">
                          {plan.planType}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={plan.status} />
                      </td>

                      <td className="px-5 py-5">
                        <span className="font-black text-[var(--qoreva-obsidian)]">
                          {plan.qualityScore}%
                        </span>
                      </td>

                      <td className="px-5 py-5 font-bold text-[var(--qoreva-text)]">
                        {formatDate(plan.plannedStartDate)}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={
                            plan.status === "Draft"
                              ? `/planning/create?planningRecordId=${plan.id}`
                              : `/planning/${plan.id}`
                          }
                          className="inline-flex rounded-lg bg-[var(--qoreva-violet)] px-4 py-2 text-xs font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
                        >
                          {plan.status === "Draft"
                            ? "Continue Draft"
                            : "Open Plan"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 bg-[var(--qoreva-surface-muted)] p-4 lg:hidden">
              {visiblePlans.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-violet)]">
                        {plan.planType}
                      </p>
                      <h3 className="mt-1 font-black text-[var(--qoreva-obsidian)]">
                        {plan.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
                        {plan.contractor?.name || "Contractor not assigned"}
                      </p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileDetail label="Project" value={plan.project.name} />
                    <MobileDetail
                      label="Location"
                      value={plan.workLocation || "Not entered"}
                    />
                    <MobileDetail
                      label="Start"
                      value={formatDate(plan.plannedStartDate)}
                    />
                    <MobileDetail
                      label="Revision"
                      value={String(plan.revisionNumber)}
                    />
                  </div>

                  <Link
                    href={
                      plan.status === "Draft"
                        ? `/planning/create?planningRecordId=${plan.id}`
                        : `/planning/${plan.id}`
                    }
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--qoreva-violet)] text-sm font-black text-white"
                  >
                    {plan.status === "Draft"
                      ? "Continue Draft"
                      : "Open Plan"}
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
      <p className="text-sm font-bold text-[var(--qoreva-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--qoreva-obsidian)]">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
        {detail}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let classes =
    "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]";

  if (status === "Submitted" || status === "In Review") {
    classes =
      "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]";
  } else if (
    status === "Revision Needed" ||
    status === "Needs Revision" ||
    status === "Rejected"
  ) {
    classes =
      "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]";
  } else if (status === "Approved" || status === "Active") {
    classes =
      "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]";
  }

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${classes}`}
    >
      {status}
    </span>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--qoreva-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[var(--qoreva-obsidian)]">
        {value}
      </p>
    </div>
  );
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

const filterClassName = `
  h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)]
  bg-white px-4 text-sm font-semibold text-[var(--qoreva-text)]
  outline-none transition-all duration-150
  placeholder:text-[var(--qoreva-subtle)]
  focus:border-[var(--qoreva-violet)]
  focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]
`;
