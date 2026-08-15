type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function SelectField({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
}: SelectFieldProps) {
  return (
    <label className="group block">
      <span
        className="
          mb-2
          flex
          items-center
          gap-1
          text-sm
          font-bold
          text-[var(--qoreva-text)]
        "
      >
        {label}

        {required ? (
          <span
            className="text-[var(--qoreva-danger)]"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </span>

      <div className="relative">
        <select
          value={value}
          required={required}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="
            min-h-12
            w-full
            appearance-none
            rounded-xl
            border
            border-[var(--qoreva-border-strong)]
            bg-white
            px-4
            py-3
            pr-11
            text-sm
            font-medium
            text-[var(--qoreva-ink)]
            shadow-[0_1px_2px_rgba(17,18,22,0.02)]
            outline-none
            transition-all
            duration-150

            hover:border-[#BBB6C6]

            focus:border-[var(--qoreva-violet)]
            focus:ring-4
            focus:ring-[rgba(102,87,232,0.10)]

            disabled:cursor-not-allowed
            disabled:border-[var(--qoreva-border)]
            disabled:bg-[var(--qoreva-surface-muted)]
            disabled:text-[var(--qoreva-muted)]
            disabled:shadow-none
          "
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div
          className="
            pointer-events-none
            absolute
            inset-y-0
            right-4
            flex
            items-center
            text-[var(--qoreva-muted)]
          "
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5.5 7.5L10 12L14.5 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </label>
  );
}