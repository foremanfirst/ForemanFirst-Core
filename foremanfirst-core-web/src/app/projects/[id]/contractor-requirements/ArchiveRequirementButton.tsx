"use client";

import { useState } from "react";

import { archiveContractorRequirement } from "./actions";

type ArchiveRequirementButtonProps = {
  requirementId: string;
  projectId: string;
  requirementName: string;
};

export default function ArchiveRequirementButton({
  requirementId,
  projectId,
  requirementName,
}: ArchiveRequirementButtonProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchive() {
    const confirmed = window.confirm(
      `Archive "${requirementName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await archiveContractorRequirement(
        requirementId,
        projectId,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to archive requirement.",
      );

      setIsArchiving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleArchive}
        disabled={isArchiving}
        className="text-xs font-black text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isArchiving ? "Archiving..." : "Archive"}
      </button>

      {error ? (
        <p className="max-w-xs text-right text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}