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

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    isArchiving,
    setIsArchiving,
  ] = useState(false);

  const [error, setError] =
    useState("");

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
      await archiveContractor(
        contractorId,
      );

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
        className="
          rounded-lg
          px-1.5
          py-1
          text-sm
          font-black
          text-[var(--qoreva-danger)]
          transition-colors
          duration-150
          hover:bg-[var(--qoreva-danger-soft)]
          hover:text-[#A72F3C]
          hover:underline
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-[rgba(200,62,77,0.35)]
          focus-visible:ring-offset-2
        "
      >
        Archive
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Archive Contractor"
        eyebrow="Qoreva™ Contractor Management"
        description="Archive this contractor from active operations while preserving its project relationships, qualification records, documents, workforce information, and audit history."
        confirmLabel={
          isArchiving
            ? "Archiving Contractor..."
            : "Archive Contractor"
        }
        cancelLabel="Keep Contractor"
        onConfirm={handleArchive}
        onCancel={closeDialog}
        danger
      >
        <div className="space-y-5">
          {/* Contractor */}
          <section
            className="
              rounded-2xl
              border
              border-[var(--qoreva-border)]
              bg-white
              p-5
              shadow-[var(--qoreva-shadow-sm)]
            "
          >
            <p
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.14em]
                text-[var(--qoreva-muted)]
              "
            >
              Contractor
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[var(--qoreva-obsidian)]
                  text-sm
                  font-black
                  text-[#B9B0FF]
                "
              >
                {getInitials(
                  contractorName,
                )}
              </div>

              <div className="min-w-0">
                <h3
                  className="
                    break-words
                    text-xl
                    font-black
                    tracking-[-0.025em]
                    text-[var(--qoreva-obsidian)]
                  "
                >
                  {contractorName}
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-[var(--qoreva-muted)]
                  "
                >
                  {companyName}

                  {projectName
                    ? ` • ${projectName}`
                    : ""}
                </p>
              </div>
            </div>
          </section>

          {/* Preservation */}
          <section
            className="
              rounded-2xl
              border
              border-[rgba(102,87,232,0.16)]
              bg-[var(--qoreva-violet-faint)]
              p-5
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--qoreva-violet-soft)]
                  text-[var(--qoreva-violet-dark)]
                "
              >
                <ArchiveIcon />
              </div>

              <div className="min-w-0">
                <h4
                  className="
                    font-black
                    text-[var(--qoreva-obsidian)]
                  "
                >
                  Qoreva preserves the contractor record.
                </h4>

                <ul
                  className="
                    mt-4
                    space-y-3
                    text-sm
                    font-medium
                    leading-6
                    text-[var(--qoreva-text)]
                  "
                >
                  <ArchiveDetail>
                    Removed from the active Contractor Directory
                  </ArchiveDetail>

                  <ArchiveDetail>
                    Company and project relationships remain preserved
                  </ArchiveDetail>

                  <ArchiveDetail>
                    Qualification, compliance, insurance, EMR, TRIR, and contact information remain intact
                  </ArchiveDetail>

                  <ArchiveDetail>
                    Contractor documents and document history remain preserved
                  </ArchiveDetail>

                  <ArchiveDetail>
                    Workforce and historical records remain available for audit purposes
                  </ArchiveDetail>

                  <ArchiveDetail>
                    The contractor can be restored later
                  </ArchiveDetail>
                </ul>
              </div>
            </div>
          </section>

          {/* Warning */}
          <section
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
                <WarningIcon />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-black
                    text-[#9B6212]
                  "
                >
                  This contractor will no longer appear in active operations.
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
                  Archive only when the contractor should no longer be used for current project activity.
                </p>
              </div>
            </div>
          </section>

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

function ArchiveDetail({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="
          mt-0.5
          flex
          h-5
          w-5
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-[var(--qoreva-violet-soft)]
          text-[var(--qoreva-violet-dark)]
        "
      >
        <CheckIcon />
      </span>

      <span>{children}</span>
    </li>
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

function WarningIcon() {
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
        d="M12 4 3.5 19h17L12 4Z"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4M12 16.5h.01"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 1 1 1.408-1.408L8.5 12.086l6.796-6.79a1 1 0 0 1 1.408 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getInitials(
  name: string,
): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word[0]?.toUpperCase() ??
          "",
      )
      .join("") || "CT"
  );
}