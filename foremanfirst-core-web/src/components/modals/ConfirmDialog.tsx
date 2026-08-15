"use client";

import type { ReactNode } from "react";

import ModalShell from "./ModalShell";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  eyebrow?: string;
  cancelLabel?: string;
  children?: ReactNode;
  danger?: boolean;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  eyebrow = "Qoreva™",
  cancelLabel = "Cancel",
  children,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      title={title}
      eyebrow={eyebrow}
      onClose={onCancel}
      maxWidthClass="max-w-2xl"
    >
      <div className="p-6 sm:p-8">
        <p
          className="
            max-w-xl
            text-sm
            font-medium
            leading-6
            text-[var(--qoreva-muted)]
          "
        >
          {description}
        </p>

        {children ? (
          <div className="mt-6">
            {children}
          </div>
        ) : null}

        <div
          className="
            mt-7
            flex
            flex-col-reverse
            gap-3
            border-t
            border-[var(--qoreva-border)]
            pt-5
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            onClick={onCancel}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--qoreva-border-strong)]
              bg-white
              px-5
              py-2.5
              text-sm
              font-black
              text-[var(--qoreva-text)]
              transition-all
              duration-150

              hover:border-[#BBB6C6]
              hover:bg-[var(--qoreva-surface-muted)]

              active:scale-[0.99]
            "
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-xl
              border
              border-transparent
              px-6
              py-2.5
              text-sm
              font-black
              text-white
              shadow-sm
              transition-all
              duration-150

              hover:-translate-y-px
              active:translate-y-0

              ${
                danger
                  ? `
                    bg-[var(--qoreva-danger)]
                    hover:bg-[#B63341]
                    hover:shadow-[0_8px_20px_rgba(200,62,77,0.16)]
                  `
                  : `
                    bg-[var(--qoreva-violet)]
                    hover:bg-[var(--qoreva-violet-hover)]
                    hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
                  `
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}