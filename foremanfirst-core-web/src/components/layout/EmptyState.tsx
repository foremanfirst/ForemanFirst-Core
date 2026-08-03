import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon,
  actions,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      {icon ? (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      ) : null}

      <h2 className="mt-5 text-xl font-black text-slate-950">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>

      {actions ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}