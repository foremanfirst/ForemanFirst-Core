"use client";

type ToastProps = {
  message: string;
  visible: boolean;
};

export default function Toast({
  message,
  visible,
}: ToastProps) {
  if (!visible || !message) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-cyan-200 bg-[#0B132B] px-5 py-4 text-sm font-bold text-white shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00C2FF] font-black text-[#0B132B]">
          ✓
        </span>

        <span>{message}</span>
      </div>
    </div>
  );
}