"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RestoreCompanyButtonProps = {
  companyId: string;
  companyName: string;
};

export default function RestoreCompanyButton({
  companyId,
  companyName,
}: RestoreCompanyButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function openDialog() {
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeDialog() {
    if (!isPending) {
      setErrorMessage("");
      setIsOpen(false);
    }
  }

  async function handleRestore() {
    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/companies/${companyId}/restore`,
        {
          method: "PATCH",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message || "Unable to restore the company.",
        );
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Company restore failed:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="font-semibold text-cyan-600 transition hover:text-cyan-800 hover:underline"
      >
        Restore
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-company-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <h2
                id="restore-company-title"
                className="text-xl font-bold text-slate-950"
              >
                Restore Company
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Restore{" "}
                <span className="font-semibold text-slate-900">
                  {companyName}
                </span>{" "}
                to the active company directory?
              </p>
            </div>

            <div className="space-y-4 p-6">
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isPending}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={isPending}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Restoring..." : "Restore Company"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}