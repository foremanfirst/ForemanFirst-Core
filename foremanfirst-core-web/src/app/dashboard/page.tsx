export default function DashboardPage() {
  const metrics = [
    {
      label: "Active Projects",
      value: "3",
      note: "Across the current portfolio",
    },
    {
      label: "Workers Onsite",
      value: "74",
      note: "Live project headcount",
    },
    {
      label: "Open Observations",
      value: "6",
      note: "Awaiting review or closure",
    },
    {
      label: "Open Actions",
      value: "6",
      note: "2 due this week",
    },
    {
      label: "Inspections Due",
      value: "3",
      note: "Scheduled within 48 hours",
    },
    {
      label: "Days Since Recordable",
      value: "117",
      note: "50,240 safe man-hours",
    },
  ];

  const quickActions = [
    "Create PTP",
    "Record Observation",
    "Start Inspection",
    "Report Incident",
    "Add Worker",
    "Issue Permit",
  ];

  const activity = [
    {
      title: "AI PTP approved",
      detail: "Electrical conduit installation plan approved.",
      time: "18 minutes ago",
    },
    {
      title: "Observation submitted",
      detail: "Positive recognition submitted for coordinated field work.",
      time: "42 minutes ago",
    },
    {
      title: "Worker credential updated",
      detail: "Training and project access eligibility refreshed.",
      time: "1 hour ago",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src="/foremanfirst-logo-v2.jpeg"
                alt="ForemanFirst logo"
                className="h-full w-full object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                ForemanFirst™ Command Center
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Good afternoon, Robert
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Safety, workforce, planning, access, and field intelligence.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">
                Dashboard View
              </span>

              <select className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-bold">
                <option>Project View</option>
                <option>Portfolio View</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">
                Project
              </span>

              <select className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 font-bold">
                <option>GM Lansing Delta Township</option>
                <option>North Campus Data Center</option>
                <option>Industrial Energy Modernization</option>
              </select>
            </label>
          </div>
        </header>

        <section className="rounded-3xl bg-gradient-to-br from-[#081426] via-[#123B75] to-[#00A6E8] p-7 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Project Operations Snapshot
          </p>

          <h2 className="mt-2 text-3xl font-black sm:text-5xl">
            GM Lansing Delta Township
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
            Monitor project safety, workforce readiness, planning approvals,
            corrective actions, training, access, and field activity.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Project Health"
              value="92%"
              note="Strong overall condition"
            />

            <SummaryCard
              label="Current Status"
              value="Active"
              note="General Motors • Lansing, Michigan"
            />

            <SummaryCard
              label="Training Compliance"
              value="96%"
              note="4 credentials require review"
            />

            <SummaryCard
              label="Access Eligibility"
              value="94%"
              note="Live worker readiness"
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {metric.label}
              </p>

              <p className="mt-5 text-4xl font-black">{metric.value}</p>

              <p className="mt-2 text-sm text-slate-500">{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Executive Intelligence
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Safety and Operations Overview
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ProgressCard label="Training Compliance" value={96} />

              <ProgressCard label="Access Eligibility" value={94} />

              <ProgressCard label="Planning Approval Rate" value={91} />

              <ProgressCard label="Inspection Completion" value={88} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SmallCard label="Total Man-Hours" value="50,240" />
              <SmallCard label="Recordables" value="0" />
              <SmallCard label="Open Permits" value="4" />
              <SmallCard label="Pending PTPs" value="3" />
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Quick Actions
            </p>

            <h2 className="mt-1 text-2xl font-black">Start Field Work</h2>

            <div className="mt-6 space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-black hover:border-cyan-300 hover:bg-cyan-50"
                >
                  {action}
                  <span>→</span>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Vision™ AI
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Priority Intelligence
            </h2>

            <div className="mt-6 space-y-4">
              <AlertCard
                title="Planning document mismatch"
                detail="One work scope references roof access but does not describe roof work in the task analysis."
                level="High"
              />

              <AlertCard
                title="Credentials approaching expiration"
                detail="Four workers require updated training or eligibility verification."
                level="Medium"
              />

              <AlertCard
                title="Workforce trend"
                detail="Current onsite workforce is higher than last week's average."
                level="Advisory"
              />
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
              Recent Activity
            </p>

            <h2 className="mt-1 text-2xl font-black">What Changed Today</h2>

            <div className="mt-6 space-y-4">
              {activity.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-cyan-500 ring-4 ring-cyan-100" />

                  <div>
                    <p className="font-black">{item.title}</p>

                    <p className="mt-1 text-sm text-slate-600">
                      {item.detail}
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-cyan-100">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>

      <p className="mt-1 text-xs text-blue-100">{note}</p>
    </div>
  );
}

function ProgressCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="font-black">{label}</p>

        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-blue-700">
          {value}%
        </span>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0B132B] to-[#00C2FF]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function SmallCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function AlertCard({
  title,
  detail,
  level,
}: {
  title: string;
  detail: string;
  level: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-black">{title}</p>

        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
          {level}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}