import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  );
}