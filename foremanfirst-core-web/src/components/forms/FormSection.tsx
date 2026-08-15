import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="relative">
      <div
        className="
          flex
          flex-col
          gap-1
          border-b
          border-[var(--qoreva-border)]
          pb-4
        "
      >
        <div className="flex items-center gap-2.5">
          <span
            className="
              h-5
              w-1
              shrink-0
              rounded-full
              bg-[var(--qoreva-violet)]
            "
            aria-hidden="true"
          />

          <h3
            className="
              text-lg
              font-black
              tracking-[-0.02em]
              text-[var(--qoreva-obsidian)]
            "
          >
            {title}
          </h3>
        </div>

        {description ? (
          <p
            className="
              ml-3.5
              max-w-3xl
              pl-0
              text-sm
              font-medium
              leading-5
              text-[var(--qoreva-muted)]
            "
          >
            {description}
          </p>
        ) : null}
      </div>

      <div
        className="
          mt-5
          grid
          gap-x-5
          gap-y-5
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {children}
      </div>
    </section>
  );
}