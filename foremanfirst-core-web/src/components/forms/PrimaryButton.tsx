type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
};

export default function PrimaryButton({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex
        min-h-11
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        border-transparent
        bg-[var(--qoreva-violet)]
        px-5
        py-2.5
        text-sm
        font-black
        text-white
        shadow-sm
        transition-all
        duration-150
        hover:-translate-y-px
        hover:bg-[var(--qoreva-violet-hover)]
        hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
        active:translate-y-0
        active:bg-[var(--qoreva-violet-dark)]
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:hover:translate-y-0
        disabled:hover:shadow-sm
        ${className}
      `}
    >
      {children}
    </button>
  );
}