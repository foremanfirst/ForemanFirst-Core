"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ConfirmDialog,
} from "@/components";

type ArchiveContractorDocumentButtonProps = {
  documentId: string;
  documentName: string;
};

export default function ArchiveContractorDocumentButton({
  documentId,
  documentName,
}: ArchiveContractorDocumentButtonProps) {
  const router = useRouter();

  const [
    isConfirmOpen,
    setIsConfirmOpen,
  ] = useState(false);

  const [
    isArchiving,
    setIsArchiving,
  ] = useState(false);

  const [error, setError] =
    useState("");

  function openConfirmDialog() {
    setError("");
    setIsConfirmOpen(true);
  }

  function closeConfirmDialog() {
    if (isArchiving) {
      return;
    }

    setError("");
    setIsConfirmOpen(false);
  }

  async function archiveDocument() {
    if (isArchiving) {
      return;
    }

    setError("");
    setIsArchiving(true);

    try {
      const response = await fetch(
        `/api/contractor-documents/${documentId}/archive`,
        {
          method: "POST",
        },
      );

      const responseData =
        (await response
          .json()
          .catch(() => null)) as
          | {
              message?: string;
            }
          | null;

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Unable to archive the document.",
        );
      }

      setIsConfirmOpen(false);
      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive the document.",
      );
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={openConfirmDialog}
          disabled={isArchiving}
          className="
            inline-flex
            items-center
            justify-center
            rounded-xl
            border
            border-[#F0BDC4]
            bg-white
            px-4
            py-2
            text-xs
            font-black
            text-[var(--qoreva-danger)]
            transition-all
            duration-150

            hover:border-[var(--qoreva-danger)]
            hover:bg-[var(--qoreva-danger-soft)]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isArchiving
            ? "Archiving..."
            : "Archive"}
        </button>

        {error ? (
          <p
            className="
              max-w-xs
              text-xs
              font-bold
              text-[var(--qoreva-danger)]
            "
          >
            {error}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Archive Document"
        eyebrow="Qoreva™ Contractor Documentation"
        description="Archive this document from the active contractor record while preserving it in the document history and audit trail."
        confirmLabel={
          isArchiving
            ? "Archiving..."
            : "Archive Document"
        }
        cancelLabel="Keep Document"
        danger
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          void archiveDocument();
        }}
      >
        <div className="space-y-4">
          <div
            className="
              rounded-2xl
              border
              border-[var(--qoreva-border)]
              bg-[var(--qoreva-surface-muted)]
              p-4
            "
          >
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.12em]
                text-[var(--qoreva-muted)]
              "
            >
              Document
            </p>

            <p
              className="
                mt-1
                break-words
                font-black
                text-[var(--qoreva-obsidian)]
              "
            >
              {documentName}
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-[#F0D5A4]
              bg-[var(--qoreva-warning-soft)]
              p-4
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/70
                  text-[#9B6212]
                "
              >
                <ArchiveIcon />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-black
                    text-[#9B6212]
                  "
                >
                  Historical records will be preserved.
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-[#9B6212]
                  "
                >
                  The document will no longer appear
                  in the active document list, but it
                  will remain available in Document
                  History for audit and recordkeeping.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="
                rounded-xl
                border
                border-[#F0BDC4]
                bg-[var(--qoreva-danger-soft)]
                px-4
                py-3
                text-sm
                font-black
                text-[var(--qoreva-danger)]
              "
            >
              {error}
            </div>
          ) : null}
        </div>
      </ConfirmDialog>
    </>
  );
}

function ArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5h16M5.5 7.5v11h13v-11M9 11.5h6M4 4.5h16v3H4z"
      />
    </svg>
  );
}