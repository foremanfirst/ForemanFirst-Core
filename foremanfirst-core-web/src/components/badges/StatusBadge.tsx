type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  success:
    "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",

  warning:
    "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",

  danger:
    "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",

  info:
    "border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

  neutral:
    "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-[var(--qoreva-success)]",
  warning: "bg-[var(--qoreva-warning)]",
  danger: "bg-[var(--qoreva-danger)]",
  info: "bg-[var(--qoreva-violet)]",
  neutral: "bg-[var(--qoreva-subtle)]",
};

export default function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex
        min-h-7
        items-center
        gap-1.5
        whitespace-nowrap
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-black
        leading-none
        tracking-[0.01em]
        ${toneClasses[tone]}
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          shrink-0
          rounded-full
          ${dotClasses[tone]}
        `}
        aria-hidden="true"
      />

      {label}
    </span>
  );
}