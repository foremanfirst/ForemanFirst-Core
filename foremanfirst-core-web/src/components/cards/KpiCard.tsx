type KpiCardProps = {
  label: string;
  value: number | string;
  detail?: string;
  danger?: boolean;
};

export default function KpiCard({
  label,
  value,
  detail,
  danger = false,
}: KpiCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        danger ? "border-rose-200" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-3xl font-black ${
          danger ? "text-rose-700" : "text-[#0B132B]"
        }`}
      >
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-sm text-slate-500">
          {detail}
        </p>
      ) : null}
    </div>
  );
}