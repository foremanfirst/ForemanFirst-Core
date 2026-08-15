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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[var(--qoreva-border)] bg-[var(--qoreva-porcelain)] px-5 py-5 shadow-[var(--qoreva-shadow-sm)] sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 opacity-70 sm:block"
        aria-hidden="true"
      >
        <div className="absolute right-[-4rem] top-[-5rem] h-48 w-48 rounded-full bg-[rgba(102,87,232,0.08)] blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--qoreva-violet)]" />

              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                {eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="max-w-4xl text-3xl font-black tracking-[-0.035em] text-[var(--qoreva-obsidian)] sm:text-4xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[var(--qoreva-muted)] sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}