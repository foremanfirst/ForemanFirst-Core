"use client";

export type StepFiveTab =
  | "work-steps"
  | "hazards"
  | "controls"
  | "critical-controls"
  | "verification"
  | "risk-summary";

type StepFiveNavigationProps = {
  activeTab: StepFiveTab;
  onTabChange: (tab: StepFiveTab) => void;
};

const tabs: Array<{ id: StepFiveTab; label: string }> = [
  { id: "work-steps", label: "Work Steps" },
  { id: "hazards", label: "Hazards" },
  { id: "controls", label: "Controls" },
  { id: "critical-controls", label: "Critical Controls" },
  { id: "verification", label: "Verification" },
  { id: "risk-summary", label: "Risk Summary" },
];

export default function StepFiveNavigation({
  activeTab,
  onTabChange,
}: StepFiveNavigationProps) {
  return (
    <nav
      aria-label="Hazards and readiness navigation"
      className="overflow-x-auto border-b border-[var(--qoreva-border)]"
    >
      <div className="flex min-w-max gap-1 px-3 sm:px-5">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`min-h-12 whitespace-nowrap border-b-2 px-4 text-xs font-bold transition ${
                active
                  ? "border-[var(--qoreva-violet)] text-[var(--qoreva-violet-dark)]"
                  : "border-transparent text-[var(--qoreva-muted)] hover:text-[var(--qoreva-obsidian)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
