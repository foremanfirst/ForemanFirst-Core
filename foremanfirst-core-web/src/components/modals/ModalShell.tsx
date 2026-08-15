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

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-end
        justify-center
        bg-[rgba(17,18,22,0.72)]
        p-0
        backdrop-blur-[6px]
        sm:items-center
        sm:p-5
      "
      onMouseDown={(event) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qoreva-modal-title"
        className={`
          max-h-[96vh]
          w-full
          overflow-hidden
          rounded-t-[1.75rem]
          border
          border-white/10
          bg-[var(--qoreva-porcelain)]
          shadow-[var(--qoreva-shadow-lg)]
          sm:rounded-[1.75rem]
          ${maxWidthClass}
        `}
      >
        <div
          className="
            relative
            overflow-hidden
            border-b
            border-white/10
            bg-[var(--qoreva-obsidian)]
            px-5
            py-4
            text-white
            sm:px-7
            sm:py-5
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-10
              -top-16
              h-44
              w-44
              rounded-full
              bg-[rgba(102,87,232,0.18)]
              blur-3xl
            "
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow ? (
                <div className="flex items-center gap-2">
                  <span
                    className="
                      h-1.5
                      w-1.5
                      shrink-0
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
                      tracking-[0.18em]
                      text-[#B9B0FF]
                    "
                  >
                    {eyebrow}
                  </p>
                </div>
              ) : null}

              <h2
                id="qoreva-modal-title"
                className="
                  mt-1.5
                  text-xl
                  font-black
                  tracking-[-0.025em]
                  text-white
                  sm:text-2xl
                "
              >
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/[0.06]
                text-xl
                font-medium
                text-white
                transition-all
                duration-150

                hover:border-white/20
                hover:bg-white/[0.12]

                active:scale-95
              "
            >
              ×
            </button>
          </div>
        </div>

        <div
          className="
            max-h-[calc(96vh-82px)]
            overflow-y-auto
            bg-[var(--qoreva-porcelain)]
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}