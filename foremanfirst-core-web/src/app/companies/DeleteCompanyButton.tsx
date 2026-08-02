"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteCompanyButtonProps = {
  companyId: string;
  companyName: string;
};

export default function DeleteCompanyButton({
  companyId,
  companyName,
}: DeleteCompanyButtonProps) {
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

  async function handleDelete() {
    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/companies/${companyId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message || "Unable to delete the company.",
        );
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Company deletion failed:", error);

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
        className="text-sm font-semibold text-red-600 transition hover:text-red-800 hover:underline"
      >
        Delete
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-company-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <h2
                id="delete-company-title"
                className="text-xl font-bold text-slate-950"
              >
                Delete Company
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {companyName}
                </span>
                ?
              </p>

              <p className="mt-2 text-sm font-medium text-red-600">
                This action cannot be undone.
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
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Deleting..." : "Delete Company"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}