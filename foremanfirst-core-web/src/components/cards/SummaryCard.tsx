type SummaryCardProps = {
  label: string;
  value: number | string;
  detail?: string;
};

export default function SummaryCard({
  label,
  value,
  detail,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-950">
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