"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ArchiveContractorDocumentButtonProps = {
  documentId: string;
  documentName: string;
};

export default function ArchiveContractorDocumentButton({
  documentId,
  documentName,
}: ArchiveContractorDocumentButtonProps) {
  const router = useRouter();

  const [isArchiving, setIsArchiving] =
    useState(false);

  const [error, setError] = useState("");

  async function archiveDocument() {
    const confirmed = window.confirm(
      `Archive ${documentName}? The document will be removed from the current list but preserved for audit history.`,
    );

    if (!confirmed) {
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

      const responseData = (await response
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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={archiveDocument}
        disabled={isArchiving}
        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isArchiving
          ? "Archiving..."
          : "Archive"}
      </button>

      {error ? (
        <p className="max-w-xs text-xs font-bold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}