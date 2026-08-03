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
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700",
  info:
    "border-cyan-200 bg-cyan-50 text-cyan-800",
  neutral:
    "border-slate-200 bg-slate-100 text-slate-600",
};

export default function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}