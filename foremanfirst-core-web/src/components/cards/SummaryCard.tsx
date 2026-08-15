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
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[1.4rem]
        border
        border-[var(--qoreva-border)]
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[rgba(102,87,232,0.22)]
        hover:shadow-[var(--qoreva-shadow)]
      "
    >
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-[3px]
          origin-left
          scale-x-0
          bg-[var(--qoreva-violet)]
          transition-transform
          duration-200
          group-hover:scale-x-100
        "
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-[var(--qoreva-violet)]
            "
            aria-hidden="true"
          />

          <p
            className="
              text-[11px]
              font-black
              uppercase
              tracking-[0.12em]
              text-[var(--qoreva-muted)]
            "
          >
            {label}
          </p>
        </div>

        <p
          className="
            mt-3
            text-3xl
            font-black
            tracking-[-0.04em]
            text-[var(--qoreva-obsidian)]
            sm:text-[2rem]
          "
        >
          {value}
        </p>

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