const overviewMetrics = [
  {
    label: "Workers Onsite",
    value: "74",
    detail: "Live project headcount",
    trend: "+8 today",
    tone: "success",
  },
  {
    label: "Contractors",
    value: "2",
    detail: "Active on this project",
    trend: "2 reporting",
    tone: "neutral",
  },
  {
    label: "Active Work",
    value: "3",
    detail: "Work packages underway",
    trend: "All staffed",
    tone: "success",
  },
  {
    label: "Project Ready",
    value: "94%",
    detail: "Overall work readiness",
    trend: "+2% this week",
    tone: "success",
  },
];

const nextActions = [
  {
    title: "COI needs revision",
    detail: "SEGLC Construction",
    meta: "Insurance documentation",
    action: "Review",
    severity: "danger",
  },
  {
    title: "PTP awaiting approval",
    detail: "Unit 2 – Electrical Installation",
    meta: "Submitted today",
    action: "Approve",
    severity: "warning",
  },
  {
    title: "3 worker credentials expire soon",
    detail: "Across 2 contractors",
    meta: "Within 14 days",
    action: "Review",
    severity: "warning",
  },
];

const activeWork = [
  {
    scope: "Unit 2 – Electrical Installation",
    contractor: "SEGLC Construction",
    location: "Building C • Zone 4",
    workers: "28",
    ptp: "Approved",
    permits: "2 / 2",
    status: "Ready",
  },
  {
    scope: "Site Civil & Underground",
    contractor: "Niles",
    location: "Exterior • North Area",
    workers: "19",
    ptp: "Approved",
    permits: "1 / 1",
    status: "Ready",
  },
  {
    scope: "Caisson Layout Verification",
    contractor: "Rohrscheib Sons",
    location: "Building A • East",
    workers: "6",
    ptp: "Review",
    permits: "0 / 1",
    status: "Attention",
  },
];

const pulse = [
  {
    label: "Observations",
    value: "128",
    change: "+23%",
  },
  {
    label: "Good Catches",
    value: "57",
    change: "+18%",
  },
  {
    label: "PTPs Approved",
    value: "15",
    change: "+36%",
  },
  {
    label: "Incidents",
    value: "1",
    change: "-50%",
  },
];

const visionInsights = [
  {
    title: "Insurance expiration approaching",
    detail:
      "One contractor insurance document expires within 18 days. Review replacement documentation.",
    tone: "violet",
  },
  {
    title: "Higher foot traffic detected",
    detail:
      "Gate 5 activity is elevated during the morning start window. Consider reviewing traffic controls.",
    tone: "warning",
  },
  {
    title: "Observation activity increased",
    detail:
      "Observation participation is up 23% this week compared with the previous period.",
    tone: "info",
  },
  {
    title: "Permits currently valid",
    detail:
      "No expired active permits are currently identified for today's work.",
    tone: "success",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Welcome / Project Context */}
      <section
        className="
          flex
          flex-col
          gap-5
          rounded-2xl
          border
          border-[var(--qoreva-border)]
          bg-white
          p-5
          shadow-[var(--qoreva-shadow-sm)]
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.18em]
              text-[var(--qoreva-violet)]
            "
          >
            Qoreva Command™
          </p>

          <h2
            className="
              mt-1
              text-2xl
              font-black
              tracking-[-0.035em]
              text-[var(--qoreva-obsidian)]
              sm:text-3xl
            "
          >
            Good afternoon, Robert
          </h2>

          <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
            Here&apos;s what needs attention across your project today.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
          <label>
            <span
              className="
                mb-1.5
                block
                text-[9px]
                font-black
                uppercase
                tracking-[0.14em]
                text-[var(--qoreva-subtle)]
              "
            >
              View
            </span>

            <select
              className="
                h-11
                w-full
                rounded-xl
                border
                border-[var(--qoreva-border)]
                bg-white
                px-3
                text-sm
                font-bold
                text-[var(--qoreva-text)]
                outline-none
                transition
                focus:border-[var(--qoreva-violet)]
                focus:ring-4
                focus:ring-[rgba(102,87,232,0.10)]
              "
            >
              <option>Project Command</option>
              <option>Portfolio Overview</option>
            </select>
          </label>

          <label>
            <span
              className="
                mb-1.5
                block
                text-[9px]
                font-black
                uppercase
                tracking-[0.14em]
                text-[var(--qoreva-subtle)]
              "
            >
              Active Project
            </span>

            <select
              className="
                h-11
                w-full
                rounded-xl
                border
                border-[var(--qoreva-border)]
                bg-white
                px-3
                text-sm
                font-bold
                text-[var(--qoreva-text)]
                outline-none
                transition
                focus:border-[var(--qoreva-violet)]
                focus:ring-4
                focus:ring-[rgba(102,87,232,0.10)]
              "
            >
              <option>GM Lansing Delta Township</option>
              <option>North Campus Data Center</option>
              <option>Industrial Energy Modernization</option>
            </select>
          </label>
        </div>
      </section>

      {/* Primary Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {/* Command Workspace */}
      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Project Command Map */}
        <article
          className="
            overflow-hidden
            rounded-2xl
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
              gap-3
              border-b
              border-[var(--qoreva-border)]
              px-5
              py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-[var(--qoreva-violet)]
                "
              >
                Project Command Map
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                GM Lansing Delta Township
              </h3>
            </div>

            <button
              type="button"
              className="
                inline-flex
                h-9
                items-center
                justify-center
                rounded-lg
                border
                border-[var(--qoreva-border)]
                bg-white
                px-3
                text-xs
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:border-[rgba(102,87,232,0.25)]
                hover:text-[var(--qoreva-violet)]
              "
            >
              Manage Layers
            </button>
          </div>

          <div
            className="
              relative
              flex
              min-h-[410px]
              items-center
              justify-center
              overflow-hidden
              bg-[#F5F3EE]
              p-6
            "
          >
            {/* Background grid only — not a fake project drawing */}
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-[0.35]
              "
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            <div
              className="
                relative
                z-10
                max-w-lg
                rounded-2xl
                border
                border-[var(--qoreva-border)]
                bg-white/95
                p-7
                text-center
                shadow-[var(--qoreva-shadow)]
                backdrop-blur
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--qoreva-violet-soft)]
                  text-[var(--qoreva-violet)]
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M4 19V5l5-2 6 2 5-2v14l-5 2-6-2-5 2Z" />
                  <path d="M9 3v14M15 5v14" />
                </svg>
              </div>

              <h4
                className="
                  mt-4
                  text-lg
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                Project drawing not configured
              </h4>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-[var(--qoreva-muted)]
                "
              >
                Upload the project&apos;s architectural, engineering, site,
                or floor-plan drawing to activate the live Command Map.
              </p>

              <button
                type="button"
                className="
                  mt-5
                  rounded-xl
                  bg-[var(--qoreva-violet)]
                  px-4
                  py-2.5
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:bg-[var(--qoreva-violet-dark)]
                "
              >
                Configure Project Map
              </button>
            </div>

            <div
              className="
                absolute
                bottom-4
                left-4
                right-4
                z-10
                flex
                flex-wrap
                gap-2
              "
            >
              {[
                "Work Areas",
                "Contractors",
                "Workers",
                "PTPs",
                "Permits",
                "LOTO",
                "Hazards",
              ].map((layer) => (
                <span
                  key={layer}
                  className="
                    rounded-lg
                    border
                    border-[var(--qoreva-border)]
                    bg-white/90
                    px-2.5
                    py-1.5
                    text-[10px]
                    font-black
                    text-[var(--qoreva-muted)]
                    shadow-sm
                    backdrop-blur
                  "
                >
                  {layer}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Next Actions */}
        <article
          className="
            rounded-2xl
            border
            border-[var(--qoreva-border)]
            bg-white
            shadow-[var(--qoreva-shadow-sm)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[var(--qoreva-border)]
              px-5
              py-4
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-[var(--qoreva-violet)]
                "
              >
                Priority Queue
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                Your Next Actions
              </h3>
            </div>

            <span
              className="
                flex
                h-7
                min-w-7
                items-center
                justify-center
                rounded-full
                bg-[var(--qoreva-violet-soft)]
                px-2
                text-xs
                font-black
                text-[var(--qoreva-violet)]
              "
            >
              {nextActions.length}
            </span>
          </div>

          <div className="divide-y divide-[var(--qoreva-border)]">
            {nextActions.map((item) => (
              <ActionItem key={item.title} {...item} />
            ))}
          </div>

          <div className="p-4">
            <button
              type="button"
              className="
                w-full
                rounded-xl
                border
                border-[var(--qoreva-border)]
                px-4
                py-2.5
                text-xs
                font-black
                text-[var(--qoreva-text)]
                transition
                hover:bg-[var(--qoreva-bone)]
              "
            >
              View All Actions
            </button>
          </div>
        </article>
      </section>

      {/* Active Work */}
      <section
        className="
          overflow-hidden
          rounded-2xl
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
            gap-3
            border-b
            border-[var(--qoreva-border)]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.16em]
                text-[var(--qoreva-violet)]
              "
            >
              Field Operations
            </p>

            <h3
              className="
                mt-1
                text-lg
                font-black
                text-[var(--qoreva-obsidian)]
              "
            >
              Active Work Today
            </h3>
          </div>

          <button
            type="button"
            className="
              text-xs
              font-black
              text-[var(--qoreva-violet)]
              hover:text-[var(--qoreva-violet-dark)]
            "
          >
            View All Work
          </button>
        </div>

        <div className="grid gap-3 p-4 xl:grid-cols-3">
          {activeWork.map((work) => (
            <WorkCard key={work.scope} {...work} />
          ))}
        </div>
      </section>

      {/* Safety + Vision */}
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Safety Pulse */}
        <article
          className="
            rounded-2xl
            border
            border-[var(--qoreva-border)]
            bg-white
            p-5
            shadow-[var(--qoreva-shadow-sm)]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-[var(--qoreva-violet)]
                "
              >
                Safety
              </p>

              <h3
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                Project Pulse
              </h3>
            </div>

            <span
              className="
                rounded-lg
                bg-[var(--qoreva-bone)]
                px-3
                py-1.5
                text-[10px]
                font-black
                text-[var(--qoreva-muted)]
              "
            >
              This Week
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {pulse.map((item) => (
              <div
                key={item.label}
                className="
                  rounded-xl
                  border
                  border-[var(--qoreva-border)]
                  p-4
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    text-[var(--qoreva-muted)]
                  "
                >
                  {item.label}
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <span
                    className="
                      text-2xl
                      font-black
                      text-[var(--qoreva-obsidian)]
                    "
                  >
                    {item.value}
                  </span>

                  <span
                    className="
                      text-[10px]
                      font-black
                      text-emerald-700
                    "
                  >
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              rounded-xl
              bg-[var(--qoreva-bone)]
              px-4
              py-3
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  text-[var(--qoreva-muted)]
                "
              >
                Days Since Last Recordable
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                117
              </p>
            </div>

            <div className="text-right">
              <p
                className="
                  text-[10px]
                  font-bold
                  text-[var(--qoreva-muted)]
                "
              >
                Safe Man-Hours
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-black
                  text-emerald-700
                "
              >
                50,240
              </p>
            </div>
          </div>
        </article>

        {/* Vision */}
        <article
          className="
            rounded-2xl
            border
            border-[var(--qoreva-border)]
            bg-white
            shadow-[var(--qoreva-shadow-sm)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[var(--qoreva-border)]
              px-5
              py-4
            "
          >
            <div>
              <div className="flex items-center gap-2">
                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-[var(--qoreva-violet)]
                  "
                >
                  Qoreva Vision™
                </p>

                <span
                  className="
                    rounded-full
                    bg-[var(--qoreva-violet-soft)]
                    px-2
                    py-0.5
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.10em]
                    text-[var(--qoreva-violet)]
                  "
                >
                  AI
                </span>
              </div>

              <h3
                className="
                  mt-1
                  text-lg
                  font-black
                  text-[var(--qoreva-obsidian)]
                "
              >
                Project Insights
              </h3>
            </div>

            <button
              type="button"
              className="
                text-xs
                font-black
                text-[var(--qoreva-violet)]
              "
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-[var(--qoreva-border)] px-5">
            {visionInsights.map((insight) => (
              <VisionInsight key={insight.title} {...insight} />
            ))}
          </div>

          <div
            className="
              border-t
              border-[var(--qoreva-border)]
              p-4
            "
          >
            <button
              type="button"
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                bg-[var(--qoreva-violet-soft)]
                px-4
                py-3
                text-left
                text-xs
                font-black
                text-[var(--qoreva-violet-dark)]
                transition
                hover:bg-[rgba(102,87,232,0.14)]
              "
            >
              <span>Ask Vision™ about this project</span>
              <span>→</span>
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  trend,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: string;
}) {
  return (
    <article
      className="
        rounded-2xl
        border
        border-[var(--qoreva-border)]
        bg-white
        p-4
        shadow-[var(--qoreva-shadow-sm)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.14em]
              text-[var(--qoreva-subtle)]
            "
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-3xl
              font-black
              tracking-[-0.04em]
              text-[var(--qoreva-obsidian)]
            "
          >
            {value}
          </p>
        </div>

        <div
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            ${
              tone === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet)]"
            }
          `}
        >
          <span className="text-sm font-black">✓</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-[var(--qoreva-muted)]">
          {detail}
        </p>

        <span
          className="
            shrink-0
            text-[9px]
            font-black
            text-emerald-700
          "
        >
          {trend}
        </span>
      </div>
    </article>
  );
}

function ActionItem({
  title,
  detail,
  meta,
  action,
  severity,
}: {
  title: string;
  detail: string;
  meta: string;
  action: string;
  severity: string;
}) {
  const danger = severity === "danger";

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div
          className={`
            mt-0.5
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${
              danger
                ? "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-700"
            }
          `}
        >
          <span className="text-sm font-black">!</span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
              text-sm
              font-black
              text-[var(--qoreva-obsidian)]
            "
          >
            {title}
          </p>

          <p className="mt-0.5 text-xs text-[var(--qoreva-muted)]">
            {detail}
          </p>

          <p className="mt-1 text-[9px] font-bold text-[var(--qoreva-subtle)]">
            {meta}
          </p>

          <button
            type="button"
            className={`
              mt-3
              rounded-lg
              px-3
              py-1.5
              text-[10px]
              font-black
              transition
              ${
                danger
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }
            `}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkCard({
  scope,
  contractor,
  location,
  workers,
  ptp,
  permits,
  status,
}: {
  scope: string;
  contractor: string;
  location: string;
  workers: string;
  ptp: string;
  permits: string;
  status: string;
}) {
  const ready = status === "Ready";

  return (
    <article
      className="
        rounded-xl
        border
        border-[var(--qoreva-border)]
        p-4
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4
            className="
              truncate
              text-sm
              font-black
              text-[var(--qoreva-obsidian)]
            "
          >
            {scope}
          </h4>

          <p className="mt-1 text-[10px] text-[var(--qoreva-muted)]">
            {contractor}
          </p>

          <p className="mt-0.5 text-[10px] text-[var(--qoreva-subtle)]">
            {location}
          </p>
        </div>

        <span
          className={`
            rounded-full
            px-2.5
            py-1
            text-[9px]
            font-black
            ${
              ready
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }
          `}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <WorkStat label="Workers" value={workers} />
        <WorkStat label="PTP" value={ptp} />
        <WorkStat label="Permits" value={permits} />
      </div>

      <button
        type="button"
        className="
          mt-4
          w-full
          rounded-lg
          bg-[var(--qoreva-bone)]
          px-3
          py-2
          text-[10px]
          font-black
          text-[var(--qoreva-text)]
          transition
          hover:bg-[var(--qoreva-violet-soft)]
          hover:text-[var(--qoreva-violet)]
        "
      >
        Open Work Package
      </button>
    </article>
  );
}

function WorkStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--qoreva-bone)] p-2.5">
      <p className="text-[8px] font-bold uppercase text-[var(--qoreva-subtle)]">
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-[10px]
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {value}
      </p>
    </div>
  );
}

function VisionInsight({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: string;
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : tone === "info"
          ? "bg-sky-50 text-sky-700"
          : "bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet)]";

  return (
    <div className="flex gap-3 py-4">
      <div
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          ${toneClass}
        `}
      >
        <span className="text-xs font-black">✦</span>
      </div>

      <div>
        <p
          className="
            text-sm
            font-black
            text-[var(--qoreva-obsidian)]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-[var(--qoreva-muted)]
          "
        >
          {detail}
        </p>
      </div>
    </div>
  );
}