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
      className={`
        group
        relative
        overflow-hidden
        rounded-[1.4rem]
        border
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-[var(--qoreva-shadow)]
        ${
          danger
            ? "border-[rgba(200,62,77,0.24)]"
            : "border-[var(--qoreva-border)] hover:border-[rgba(102,87,232,0.22)]"
        }
      `}
    >
      <div
        className={`
          absolute
          inset-y-0
          left-0
          w-[3px]
          ${
            danger
              ? "bg-[var(--qoreva-danger)]"
              : "bg-[var(--qoreva-violet)]"
          }
        `}
        aria-hidden="true"
      />

      <div
        className={`
          pointer-events-none
          absolute
          -right-10
          -top-10
          h-28
          w-28
          rounded-full
          blur-3xl
          ${
            danger
              ? "bg-[rgba(200,62,77,0.08)]"
              : "bg-[rgba(102,87,232,0.07)]"
          }
        `}
        aria-hidden="true"
      />

      <div className="relative pl-1">
        <p
          className="
            text-[11px]
            font-black
            uppercase
            tracking-[0.14em]
            text-[var(--qoreva-muted)]
          "
        >
          {label}
        </p>

        <div className="mt-2 flex items-end gap-2">
          <p
            className={`
              text-3xl
              font-black
              tracking-[-0.045em]
              sm:text-[2rem]
              ${
                danger
                  ? "text-[var(--qoreva-danger)]"
                  : "text-[var(--qoreva-obsidian)]"
              }
            `}
          >
            {value}
          </p>

          {danger ? (
            <span
              className="
                mb-1
                inline-flex
                rounded-full
                border
                border-[rgba(200,62,77,0.18)]
                bg-[var(--qoreva-danger-soft)]
                px-2
                py-0.5
                text-[10px]
                font-black
                uppercase
                tracking-[0.08em]
                text-[var(--qoreva-danger)]
              "
            >
              Attention
            </span>
          ) : null}
        </div>

        {detail ? (
          <p
            className="
              mt-1.5
              text-sm
              font-medium
              leading-5
              text-[var(--qoreva-muted)]
            "
          >
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}