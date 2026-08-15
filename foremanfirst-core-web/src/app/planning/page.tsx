"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PlanStatus =
  | "Draft"
  | "Awaiting Review"
  | "Needs Revision"
  | "Approved";

type PlanType =
  | "PTP"
  | "JHA"
  | "JSA"
  | "SFMEA"
  | "Lift Plan"
  | "LOTO Plan"
  | "Excavation Plan"
  | "Confined Space Plan"
  | "Hot Work Plan";

type PlanningRecord = {
  id: string;
  title: string;
  contractor: string;
  project: string;
  planType: PlanType;
  status: PlanStatus;
  location: string;
  startDate: string;
  revision: number;
};

const demoPlans: PlanningRecord[] = [
  {
    id: "plan-001",
    title: "Unit 2 Electrical Installation",
    contractor: "SEGLC Construction",
    project: "GM Lansing Delta Township",
    planType: "PTP",
    status: "Approved",
    location: "Building C • Zone 4",
    startDate: "2026-08-15",
    revision: 2,
  },
  {
    id: "plan-002",
    title: "Horizontal Directional Drilling",
    contractor: "Civil Contractor",
    project: "GM Lansing Delta Township",
    planType: "PTP",
    status: "Awaiting Review",
    location: "North Road Crossing",
    startDate: "2026-08-18",
    revision: 1,
  },
  {
    id: "plan-003",
    title: "Drone Flight Operations",
    contractor: "Rohrscheib Sons Caissons",
    project: "GM Lansing Delta Township",
    planType: "PTP",
    status: "Approved",
    location: "Caisson Layout Area",
    startDate: "2026-08-19",
    revision: 1,
  },
  {
    id: "plan-004",
    title: "Temporary Power Installation",
    contractor: "Electrical Contractor",
    project: "GM Lansing Delta Township",
    planType: "LOTO Plan",
    status: "Needs Revision",
    location: "Building B",
    startDate: "2026-08-20",
    revision: 3,
  },
];

export default function PlanningPage() {
  const [plans] =
    useState<PlanningRecord[]>(
      demoPlans,
    );

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    PlanStatus | "All"
  >("All");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    PlanType | "All"
  >("All");

  const visiblePlans =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return plans.filter(
        (plan) => {
          const matchesSearch =
            !normalizedSearch ||
            [
              plan.title,
              plan.contractor,
              plan.project,
              plan.planType,
              plan.location,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter ===
              "All" ||
            plan.status ===
              statusFilter;

          const matchesType =
            typeFilter === "All" ||
            plan.planType ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        },
      );
    }, [
      plans,
      search,
      statusFilter,
      typeFilter,
    ]);

  const activePlans =
    plans.length;

  const awaitingReview =
    plans.filter(
      (plan) =>
        plan.status ===
        "Awaiting Review",
    ).length;

  const needsRevision =
    plans.filter(
      (plan) =>
        plan.status ===
        "Needs Revision",
    ).length;

  const approved =
    plans.filter(
      (plan) =>
        plan.status ===
        "Approved",
    ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="
          relative
          overflow-hidden
          rounded-[1.75rem]
          border
          border-[var(--qoreva-border)]
          bg-white
          p-5
          shadow-[var(--qoreva-shadow-sm)]
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-[rgba(102,87,232,0.08)]
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[var(--qoreva-violet)]
                "
              />

              <p
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[var(--qoreva-violet)]
                "
              >
                Qoreva™ Planning
              </p>
            </div>

            <h1
              className="
                mt-2
                text-3xl
                font-black
                tracking-[-0.045em]
                text-[var(--qoreva-obsidian)]
                sm:text-4xl
              "
            >
              Planning
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                font-medium
                leading-6
                text-[var(--qoreva-muted)]
              "
            >
              Plan the work,
              identify the risk,
              meet project
              requirements, and get
              crews ready before
              work begins.
            </p>
          </div>

          <Link
            href="/planning/create"
            className="
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
              shadow-sm
              transition-all
              hover:-translate-y-px
              hover:bg-[var(--qoreva-violet-hover)]
              hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
            "
          >
            + Create Plan
          </Link>
        </div>
      </section>

      {/* KPIs */}
      <section
        className="
          grid
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <MetricCard
          label="Active Plans"
          value={activePlans}
          detail="Current planning records"
          tone="neutral"
        />

        <MetricCard
          label="Awaiting Review"
          value={awaitingReview}
          detail="Needs qualified review"
          tone={
            awaitingReview > 0
              ? "warning"
              : "neutral"
          }
        />

        <MetricCard
          label="Needs Revision"
          value={needsRevision}
          detail="Returned for updates"
          tone={
            needsRevision > 0
              ? "danger"
              : "neutral"
          }
        />

        <MetricCard
          label="Approved"
          value={approved}
          detail="Ready for field use"
          tone="success"
        />
      </section>

      {/* Quick Actions */}
      <section
        className="
          grid
          gap-4
          md:grid-cols-2
          xl:grid-cols-4
        "
      >
        <QuickAction
          title="Create PTP"
          description="Start a guided pre-task planning workflow."
          label="New PTP"
          href="/planning/create"
        />

        <QuickAction
          title="Review Plans"
          description="Open plans waiting for qualified review."
          label="Review Queue"
        />

        <QuickAction
          title="Owner Requirements"
          description="Manage project and owner requirement packs."
          label="Requirements"
        />

        <QuickAction
          title="Worker Signatures"
          description="Track acknowledgements and field signatures."
          label="Signatures"
        />
      </section>

      {/* Planning Directory */}
      <section
        className="
          overflow-hidden
          rounded-[1.75rem]
          border
          border-[var(--qoreva-border)]
          bg-white
          shadow-[var(--qoreva-shadow-sm)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            border-b
            border-[var(--qoreva-border)]
            p-5
            sm:p-6
            xl:flex-row
            xl:items-end
            xl:justify-between
          "
        >
          <div>
            <p
              className="
                text-[11px]
                font-black
                uppercase
                tracking-[0.18em]
                text-[var(--qoreva-violet)]
              "
            >
              Planning Directory
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-black
                tracking-[-0.03em]
                text-[var(--qoreva-obsidian)]
              "
            >
              Active Planning
              Records
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-[var(--qoreva-muted)]
              "
            >
              {visiblePlans.length}{" "}
              plan
              {visiblePlans.length ===
              1
                ? ""
                : "s"}{" "}
              shown
            </p>
          </div>

          <div
            className="
              grid
              gap-3
              md:grid-cols-3
            "
          >
            <input
              type="search"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search plans..."
              className={
                filterClassName
              }
            />

            <select
              value={
                statusFilter
              }
              onChange={(
                event,
              ) =>
                setStatusFilter(
                  event.target
                    .value as
                    | PlanStatus
                    | "All",
                )
              }
              className={
                filterClassName
              }
            >
              <option value="All">
                All statuses
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Awaiting Review">
                Awaiting Review
              </option>

              <option value="Needs Revision">
                Needs Revision
              </option>

              <option value="Approved">
                Approved
              </option>
            </select>

            <select
              value={typeFilter}
              onChange={(
                event,
              ) =>
                setTypeFilter(
                  event.target
                    .value as
                    | PlanType
                    | "All",
                )
              }
              className={
                filterClassName
              }
            >
              <option value="All">
                All plan types
              </option>

              <option value="PTP">
                PTP
              </option>

              <option value="JHA">
                JHA
              </option>

              <option value="JSA">
                JSA
              </option>

              <option value="SFMEA">
                SFMEA
              </option>

              <option value="Lift Plan">
                Lift Plan
              </option>

              <option value="LOTO Plan">
                LOTO Plan
              </option>

              <option value="Excavation Plan">
                Excavation Plan
              </option>

              <option value="Confined Space Plan">
                Confined Space Plan
              </option>

              <option value="Hot Work Plan">
                Hot Work Plan
              </option>
            </select>
          </div>
        </div>

        {visiblePlans.length ===
        0 ? (
          <div
            className="
              px-6
              py-16
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-[var(--qoreva-violet-soft)]
                font-black
                text-[var(--qoreva-violet-dark)]
              "
            >
              PL
            </div>

            <h3
              className="
                mt-4
                text-xl
                font-black
                text-[var(--qoreva-obsidian)]
              "
            >
              No plans match
              this view
            </h3>

            <p
              className="
                mx-auto
                mt-2
                max-w-xl
                text-sm
                font-medium
                leading-6
                text-[var(--qoreva-muted)]
              "
            >
              Change the filters
              or create a new
              planning record.
            </p>

            <div className="mt-6">
              <Link
                href="/planning/create"
                className="
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
                "
              >
                + Create Plan
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead
                  className="
                    bg-[var(--qoreva-surface-muted)]
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-[var(--qoreva-muted)]
                  "
                >
                  <tr>
                    <th className="px-6 py-4">
                      Plan
                    </th>

                    <th className="px-5 py-4">
                      Contractor
                    </th>

                    <th className="px-5 py-4">
                      Project
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Start
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-[var(--qoreva-border)]
                  "
                >
                  {visiblePlans.map(
                    (plan) => (
                      <tr
                        key={
                          plan.id
                        }
                        className="
                          transition
                          hover:bg-[var(--qoreva-violet-faint)]
                        "
                      >
                        <td className="px-6 py-5">
                          <p
                            className="
                              font-black
                              text-[var(--qoreva-obsidian)]
                            "
                          >
                            {
                              plan.title
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              font-medium
                              text-[var(--qoreva-muted)]
                            "
                          >
                            {
                              plan.location
                            }
                          </p>

                          <p
                            className="
                              mt-1
                              text-[10px]
                              font-black
                              uppercase
                              tracking-[0.08em]
                              text-[var(--qoreva-subtle)]
                            "
                          >
                            Revision{" "}
                            {
                              plan.revision
                            }
                          </p>
                        </td>

                        <td className="px-5 py-5 font-bold text-[var(--qoreva-text)]">
                          {
                            plan.contractor
                          }
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-[var(--qoreva-text)]">
                            {
                              plan.project
                            }
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className="
                              inline-flex
                              rounded-full
                              border
                              border-[rgba(102,87,232,0.18)]
                              bg-[var(--qoreva-violet-soft)]
                              px-3
                              py-1
                              text-xs
                              font-black
                              text-[var(--qoreva-violet-dark)]
                            "
                          >
                            {
                              plan.planType
                            }
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <PlanStatusBadge
                            status={
                              plan.status
                            }
                          />
                        </td>

                        <td className="px-5 py-5 text-sm font-bold text-[var(--qoreva-text)]">
                          {formatDate(
                            plan.startDate,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="
                                rounded-lg
                                border
                                border-[var(--qoreva-border-strong)]
                                bg-white
                                px-3
                                py-2
                                text-xs
                                font-black
                                text-[var(--qoreva-text)]
                                transition
                                hover:bg-[var(--qoreva-surface-muted)]
                              "
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="
                                rounded-lg
                                bg-[var(--qoreva-violet)]
                                px-3
                                py-2
                                text-xs
                                font-black
                                text-white
                                transition
                                hover:bg-[var(--qoreva-violet-hover)]
                              "
                            >
                              Open
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div
              className="
                grid
                gap-4
                bg-[var(--qoreva-surface-muted)]
                p-4
                lg:hidden
              "
            >
              {visiblePlans.map(
                (plan) => (
                  <article
                    key={
                      plan.id
                    }
                    className="
                      rounded-3xl
                      border
                      border-[var(--qoreva-border)]
                      bg-white
                      p-5
                      shadow-[var(--qoreva-shadow-sm)]
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.1em]
                            text-[var(--qoreva-violet)]
                          "
                        >
                          {
                            plan.planType
                          }
                        </p>

                        <h3
                          className="
                            mt-1
                            font-black
                            text-[var(--qoreva-obsidian)]
                          "
                        >
                          {
                            plan.title
                          }
                        </h3>

                        <p
                          className="
                            mt-1
                            text-sm
                            font-medium
                            text-[var(--qoreva-muted)]
                          "
                        >
                          {
                            plan.contractor
                          }
                        </p>
                      </div>

                      <PlanStatusBadge
                        status={
                          plan.status
                        }
                      />
                    </div>

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-3
                      "
                    >
                      <MobileDetail
                        label="Project"
                        value={
                          plan.project
                        }
                      />

                      <MobileDetail
                        label="Location"
                        value={
                          plan.location
                        }
                      />

                      <MobileDetail
                        label="Start"
                        value={formatDate(
                          plan.startDate,
                        )}
                      />

                      <MobileDetail
                        label="Revision"
                        value={String(
                          plan.revision,
                        )}
                      />
                    </div>

                    <div
                      className="
                        mt-5
                        grid
                        grid-cols-2
                        gap-3
                        border-t
                        border-[var(--qoreva-border)]
                        pt-4
                      "
                    >
                      <button
                        type="button"
                        className="
                          min-h-11
                          rounded-xl
                          border
                          border-[var(--qoreva-border-strong)]
                          bg-white
                          text-sm
                          font-black
                          text-[var(--qoreva-text)]
                        "
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="
                          min-h-11
                          rounded-xl
                          bg-[var(--qoreva-violet)]
                          text-sm
                          font-black
                          text-white
                        "
                      >
                        Open Plan
                      </button>
                    </div>
                  </article>
                ),
              )}
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
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone:
    | "success"
    | "warning"
    | "danger"
    | "neutral";
}) {
  const toneMap = {
    success: {
      border:
        "border-[#BDE8D4]",
      value:
        "text-[var(--qoreva-success)]",
      dot:
        "bg-[var(--qoreva-success)]",
    },

    warning: {
      border:
        "border-[#F0D5A4]",
      value:
        "text-[#9B6212]",
      dot:
        "bg-[var(--qoreva-warning)]",
    },

    danger: {
      border:
        "border-[#F0BDC4]",
      value:
        "text-[var(--qoreva-danger)]",
      dot:
        "bg-[var(--qoreva-danger)]",
    },

    neutral: {
      border:
        "border-[var(--qoreva-border)]",
      value:
        "text-[var(--qoreva-obsidian)]",
      dot:
        "bg-[var(--qoreva-muted)]",
    },
  } as const;

  const classes =
    toneMap[tone];

  return (
    <div
      className={`
        rounded-2xl
        border
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
        ${classes.border}
      `}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${classes.dot}
          `}
        />

        <p
          className="
            text-sm
            font-bold
            text-[var(--qoreva-muted)]
          "
        >
          {label}
        </p>
      </div>

      <p
        className={`
          mt-2
          text-3xl
          font-black
          tracking-[-0.04em]
          ${classes.value}
        `}
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-medium
          text-[var(--qoreva-muted)]
        "
      >
        {detail}
      </p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  label,
  href,
}: {
  title: string;
  description: string;
  label: string;
  href?: string;
}) {
  const content = (
    <>
      <p
        className="
          text-base
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-medium
          leading-5
          text-[var(--qoreva-muted)]
        "
      >
        {description}
      </p>

      <p
        className="
          mt-4
          text-xs
          font-black
          text-[var(--qoreva-violet)]
        "
      >
        {label} →
      </p>
    </>
  );

  const className = `
    rounded-2xl
    border
    border-[var(--qoreva-border)]
    bg-white
    p-5
    text-left
    shadow-[var(--qoreva-shadow-sm)]
    transition-all

    hover:-translate-y-px
    hover:border-[rgba(102,87,232,0.24)]
    hover:bg-[var(--qoreva-violet-faint)]
  `;

  if (href) {
    return (
      <Link
        href={href}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
    >
      {content}
    </button>
  );
}

function PlanStatusBadge({
  status,
}: {
  status: PlanStatus;
}) {
  const classes = {
    Draft:
      "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]",

    "Awaiting Review":
      "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",

    "Needs Revision":
      "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",

    Approved:
      "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",
  } as const;

  return (
    <span
      className={`
        inline-flex
        shrink-0
        rounded-full
        border
        px-3
        py-1
        text-[10px]
        font-black
        ${classes[status]}
      `}
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
    <div
      className="
        rounded-xl
        border
        border-[var(--qoreva-border)]
        bg-[var(--qoreva-surface-muted)]
        p-3
      "
    >
      <p
        className="
          text-[9px]
          font-black
          uppercase
          tracking-[0.1em]
          text-[var(--qoreva-muted)]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-sm
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(
  value: string,
) {
  if (!value) {
    return "Not entered";
  }

  const date = new Date(
    `${value}T12:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

const filterClassName = `
  h-12
  w-full
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  text-sm
  font-semibold
  text-[var(--qoreva-text)]
  outline-none
  transition-all
  duration-150

  placeholder:text-[var(--qoreva-subtle)]

  hover:border-[#BBB6C6]

  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]
`;