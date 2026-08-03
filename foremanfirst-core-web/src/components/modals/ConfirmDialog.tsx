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
  eyebrow = "ForemanFirst™",
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
        <p className="text-sm leading-6 text-slate-600">
          {description}
        </p>

        {children ? (
          <div className="mt-6">
            {children}
          </div>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-6 py-3 text-sm font-black text-white transition ${
              danger
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-[#0B132B] hover:bg-blue-950"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}