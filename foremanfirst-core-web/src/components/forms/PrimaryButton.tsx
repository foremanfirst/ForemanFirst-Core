type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export default function PrimaryButton({
  children,
  onClick,
  type = "button",
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-700 ${className}`}
    >
      {children}
    </button>
  );
}