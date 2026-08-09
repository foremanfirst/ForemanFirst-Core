"use client";

import { useState } from "react";

import { restoreContractorRequirement } from "./actions";

type RestoreRequirementButtonProps = {
  requirementId: string;
  projectId: string;
  requirementName: string;
};

export default function RestoreRequirementButton({
  requirementId,
  projectId,
  requirementName,
}: RestoreRequirementButtonProps) {
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    const confirmed = window.confirm(
      `Restore "${requirementName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setRestoring(true);
    setError(null);

    try {
      await restoreContractorRequirement(
        requirementId,
        projectId,
      );

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to restore requirement.",
      );

      setRestoring(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRestore}
        disabled={restoring}
        className="text-xs font-black text-emerald-700 transition hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {restoring ? "Restoring..." : "Restore"}
      </button>

      {error ? (
        <p className="max-w-xs text-right text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}