"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

type ModalShellProps = {
  isOpen: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
};

export default function ModalShell({
  isOpen,
  title,
  eyebrow,
  onClose,
  children,
  maxWidthClass = "max-w-4xl",
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[96vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${maxWidthClass}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B132B] px-5 py-4 text-white sm:px-7">
          <div>
            {eyebrow ? (
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                {eyebrow}
              </p>
            ) : null}

            <h2 className="mt-1 text-xl font-black">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl font-bold transition hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(96vh-76px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}