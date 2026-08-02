"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type ArchiveCompanyButtonProps = {
  companyId: string;
  companyName: string;
  companyType: string;
};

const DIALOG_ANIMATION_MS = 180;
const SUCCESS_DELAY_MS = 450;

export default function ArchiveCompanyButton({
  companyId,
  companyName,
  companyType,
}: ArchiveCompanyButtonProps) {
  const router = useRouter();

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function openDialog() {
    clearTimer();
    setErrorMessage("");
    setIsSuccessful(false);
    setIsMounted(true);

    window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }

  function closeDialog() {
    if (isPending) {
      return;
    }

    setIsVisible(false);
    setErrorMessage("");

    clearTimer();

    timerRef.current = window.setTimeout(() => {
      setIsMounted(false);
      setIsSuccessful(false);
    }, DIALOG_ANIMATION_MS);
  }

  async function handleArchive() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          result?.message || "Unable to archive the company.",
        );
        return;
      }

      setIsSuccessful(true);

      clearTimer();

      timerRef.current = window.setTimeout(() => {
        setIsVisible(false);

        timerRef.current = window.setTimeout(() => {
          setIsMounted(false);
          setIsSuccessful(false);
          router.refresh();
        }, DIALOG_ANIMATION_MS);
      }, SUCCESS_DELAY_MS);
    } catch (error) {
      console.error("Company archive failed:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        event.preventDefault();
        closeDialog();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMounted, isPending]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  return (
    <>
      {/* Dark-red action beside View and Edit */}
      <button
        type="button"
        onClick={openDialog}
        className="rounded-md px-1.5 py-1 text-sm font-semibold text-red-800 transition-colors duration-150 hover:bg-red-50 hover:text-red-950 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
      >
        Archive
      </button>

      {isMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md transition-opacity duration-200 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          onMouseDown={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-company-title"
            aria-describedby="archive-company-description"
            className={`max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out ${
              isVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.96] opacity-0"
            }`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <header className="border-b border-slate-300 bg-slate-50/80 px-6 py-7 sm:px-10 sm:py-9">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 shadow-sm">
                  <ArchiveIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                    Company Management
                  </p>

                  <h2
                    id="archive-company-title"
                    className="mt-1 text-3xl font-bold tracking-tight text-[#0B132B] sm:text-4xl"
                  >
                    Archive Company
                  </h2>

                  <p
                    id="archive-company-description"
                    className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base"
                  >
                    Archiving removes this company from active
                    operations while preserving its projects, workers,
                    documents, relationships, and historical records.
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-8 px-6 py-7 sm:px-10 sm:py-9">
              {/* Company identity card */}
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Company
                </p>

                <div className="mt-4 flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <BuildingIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-3xl font-bold tracking-tight text-[#0B132B] sm:text-4xl">
                      {companyName}
                    </p>

                    <span className="mt-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                      {companyType}
                    </span>
                  </div>
                </div>
              </section>

              {/* Preservation information */}
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                    <InformationIcon />
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#0B132B]">
                      Archiving preserves all historical company data
                    </p>

                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 sm:text-base">
                      <ArchiveDetail>
                        Hidden from the active Companies directory
                      </ArchiveDetail>

                      <ArchiveDetail>
                        Projects, workers, documents, and relationships
                        remain preserved
                      </ArchiveDetail>

                      <ArchiveDetail>
                        Historical records and audit information remain
                        intact
                      </ArchiveDetail>

                      <ArchiveDetail>
                        The company can be restored from Archived
                        Companies at any time
                      </ArchiveDetail>
                    </ul>
                  </div>
                </div>
              </section>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              {isSuccessful && (
                <div
                  role="status"
                  className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
                >
                  <SuccessIcon />

                  <span>Company archived successfully.</span>
                </div>
              )}

              {/* Footer */}
              <footer className="flex flex-col-reverse gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-slate-400 sm:text-left">
                  Press Esc or click outside the dialog to cancel.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    ref={cancelButtonRef}
                    type="button"
                    onClick={closeDialog}
                    disabled={isPending || isSuccessful}
                    className="min-h-12 min-w-36 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={isPending || isSuccessful}
                    className="min-h-12 min-w-48 rounded-xl bg-[#0B132B] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#132044] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2FF] focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSuccessful ? (
                        <>
                          <SuccessIcon />
                          Archived
                        </>
                      ) : isPending ? (
                        <>
                          <LoadingSpinner />
                          Archiving...
                        </>
                      ) : (
                        <>
                          <SmallArchiveIcon />
                          Archive Company
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArchiveDetail({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
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
      className="h-7 w-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5h16M5.5 7.5v11h13v-11M9 11.5h6M4 4.5h16v3H4z"
      />
    </svg>
  );
}

function SmallArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5h16M5.5 7.5v11h13v-11M9 11.5h6M4 4.5h16v3H4z"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 9h3v12M8 7h2M13 7h1M8 11h2M13 11h1M8 15h2M13 15h1M3 21h18"
      />
    </svg>
  );
}

function InformationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-9a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm0-4.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z"
        clipRule="evenodd"
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

function SuccessIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 1 1 1.408-1.408L8.5 12.086l6.796-6.79a1 1 0 0 1 1.408 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}