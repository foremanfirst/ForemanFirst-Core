"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components";
import { archiveContractor } from "./actions";

type DeleteContractorButtonProps = {
  contractorId: string;
  contractorName: string;
  companyName: string;
  projectName?: string | null;
};

export default function DeleteContractorButton({
  contractorId,
  contractorName,
  companyName,
  projectName,
}: DeleteContractorButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState("");

  function openDialog() {
    setError("");
    setIsOpen(true);
  }

  function closeDialog() {
    if (isArchiving) {
      return;
    }

    setError("");
    setIsOpen(false);
  }

  async function handleArchive() {
    if (isArchiving) {
      return;
    }

    setIsArchiving(true);
    setError("");

    try {
      await archiveContractor(contractorId);

      setIsOpen(false);
      router.refresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Unable to archive the contractor.",
      );
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="font-semibold text-red-800 transition hover:text-red-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
      >
        Archive
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Archive Contractor"
        eyebrow="Contractor Management"
        description="Archiving removes this contractor from active operations while preserving its company relationship, project assignment, safety information, compliance history, workforce records, and audit history."
        confirmLabel={
          isArchiving
            ? "Archiving Contractor..."
            : "Archive Contractor"
        }
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onCancel={closeDialog}
        danger
      >
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Contractor
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-sm font-black text-cyan-800">
                {getInitials(contractorName)}
              </div>

              <div className="min-w-0">
                <h3 className="break-words text-xl font-black text-slate-950">
                  {contractorName}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {companyName}
                  {projectName ? ` • ${projectName}` : ""}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <h4 className="font-black text-[#0B132B]">
              Archiving preserves contractor records
            </h4>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <ArchiveDetail>
                Hidden from the active Contractor Directory
              </ArchiveDetail>

              <ArchiveDetail>
                Company and project relationships remain preserved
              </ArchiveDetail>

              <ArchiveDetail>
                Compliance, insurance, EMR, TRIR, and contact information
                remain intact
              </ArchiveDetail>

              <ArchiveDetail>
                The contractor can be restored later
              </ArchiveDetail>
            </ul>
          </section>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            >
              {error}
            </div>
          ) : null}
        </div>
      </ConfirmDialog>
    </>
  );
}

function ArchiveDetail({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800">
        ✓
      </span>

      <span>{children}</span>
    </li>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}