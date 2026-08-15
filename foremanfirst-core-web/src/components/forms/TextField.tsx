type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "number" | "date";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}: TextFieldProps) {
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

      <input
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="
          min-h-12
          w-full
          rounded-xl
          border
          border-[var(--qoreva-border-strong)]
          bg-white
          px-4
          py-3
          text-sm
          font-medium
          text-[var(--qoreva-ink)]
          shadow-[0_1px_2px_rgba(17,18,22,0.02)]
          outline-none
          transition-all
          duration-150

          placeholder:text-[var(--qoreva-subtle)]

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
      />
    </label>
  );
}