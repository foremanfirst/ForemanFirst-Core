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
      const response = await fetch(
        `/api/companies/${companyId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          result?.message ||
            "Unable to archive the company.",
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
      console.error(
        "Company archive failed:",
        error,
      );

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

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        !isPending
      ) {
        event.preventDefault();
        closeDialog();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isMounted, isPending]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

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

      {isMounted ? (
        <div
          className={`
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-[rgba(17,18,22,0.72)]
            p-0
            backdrop-blur-[6px]
            transition-opacity
            duration-200
            sm:items-center
            sm:p-5
            ${
              isVisible
                ? "opacity-100"
                : "opacity-0"
            }
          `}
          onMouseDown={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-company-title"
            aria-describedby="archive-company-description"
            className={`
              max-h-[96vh]
              w-full
              max-w-3xl
              overflow-hidden
              rounded-t-[1.75rem]
              border
              border-white/10
              bg-[var(--qoreva-porcelain)]
              shadow-[var(--qoreva-shadow-lg)]
              transition-all
              duration-200
              ease-out
              sm:rounded-[1.75rem]
              ${
                isVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-2 scale-[0.97] opacity-0"
              }
            `}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Header */}
            <header
              className="
                relative
                overflow-hidden
                border-b
                border-white/10
                bg-[var(--qoreva-obsidian)]
                px-5
                py-5
                text-white
                sm:px-7
                sm:py-6
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-12
                  -top-20
                  h-52
                  w-52
                  rounded-full
                  bg-[rgba(200,62,77,0.12)]
                  blur-3xl
                "
                aria-hidden="true"
              />

              <div className="relative flex items-start gap-4">
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-[rgba(200,62,77,0.20)]
                    bg-[rgba(200,62,77,0.14)]
                    text-[#FFB8C0]
                  "
                >
                  <ArchiveIcon />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-[var(--qoreva-danger)]
                      "
                      aria-hidden="true"
                    />

                    <p
                      className="
                        text-[11px]
                        font-black
                        uppercase
                        tracking-[0.18em]
                        text-[#FFB8C0]
                      "
                    >
                      Qoreva™ Companies
                    </p>
                  </div>

                  <h2
                    id="archive-company-title"
                    className="
                      mt-1.5
                      text-2xl
                      font-black
                      tracking-[-0.035em]
                      text-white
                      sm:text-3xl
                    "
                  >
                    Archive Company
                  </h2>

                  <p
                    id="archive-company-description"
                    className="
                      mt-2
                      max-w-2xl
                      text-sm
                      font-medium
                      leading-6
                      text-white/60
                    "
                  >
                    Remove this company from active operations
                    while preserving its connected records,
                    history, and audit trail.
                  </p>
                </div>
              </div>
            </header>

            <div
              className="
                max-h-[calc(96vh-132px)]
                overflow-y-auto
                px-5
                py-6
                sm:px-7
                sm:py-7
              "
            >
              <div className="space-y-6">
                {/* Company identity */}
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
                    Company
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
                        bg-[var(--qoreva-violet-soft)]
                        text-[var(--qoreva-violet-dark)]
                      "
                    >
                      <BuildingIcon />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          break-words
                          text-2xl
                          font-black
                          tracking-[-0.03em]
                          text-[var(--qoreva-obsidian)]
                        "
                      >
                        {companyName}
                      </p>

                      <span
                        className="
                          mt-2
                          inline-flex
                          rounded-full
                          border
                          border-[rgba(102,87,232,0.18)]
                          bg-[var(--qoreva-violet-soft)]
                          px-3
                          py-1
                          text-xs
                          font-black
                          text-[var(--qoreva-violet-dark)]
                        "
                      >
                        {companyType}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Preservation information */}
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
                      <InformationIcon />
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-[var(--qoreva-obsidian)]">
                        Historical records stay intact
                      </p>

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
                          Hidden from the active Companies directory
                        </ArchiveDetail>

                        <ArchiveDetail>
                          Projects, workers, documents, and relationships remain preserved
                        </ArchiveDetail>

                        <ArchiveDetail>
                          Historical records and audit information remain intact
                        </ArchiveDetail>

                        <ArchiveDetail>
                          The company can be restored from Archived Companies
                        </ArchiveDetail>
                      </ul>
                    </div>
                  </div>
                </section>

                {errorMessage ? (
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
                      font-bold
                      text-[var(--qoreva-danger)]
                    "
                  >
                    {errorMessage}
                  </div>
                ) : null}

                {isSuccessful ? (
                  <div
                    role="status"
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-[#BDE8D4]
                      bg-[var(--qoreva-success-soft)]
                      px-4
                      py-3
                      text-sm
                      font-black
                      text-[var(--qoreva-success)]
                    "
                  >
                    <SuccessIcon />

                    <span>
                      Company archived successfully.
                    </span>
                  </div>
                ) : null}

                {/* Footer */}
                <footer
                  className="
                    flex
                    flex-col-reverse
                    gap-4
                    border-t
                    border-[var(--qoreva-border)]
                    pt-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <p
                    className="
                      text-center
                      text-xs
                      font-medium
                      text-[var(--qoreva-subtle)]
                      sm:text-left
                    "
                  >
                    Press Esc or click outside the dialog to cancel.
                  </p>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      ref={cancelButtonRef}
                      type="button"
                      onClick={closeDialog}
                      disabled={
                        isPending ||
                        isSuccessful
                      }
                      className="
                        inline-flex
                        min-h-11
                        min-w-32
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-[var(--qoreva-border-strong)]
                        bg-white
                        px-5
                        py-2.5
                        text-sm
                        font-black
                        text-[var(--qoreva-text)]
                        transition-all
                        duration-150
                        hover:border-[#BBB6C6]
                        hover:bg-[var(--qoreva-surface-muted)]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={
                        isPending ||
                        isSuccessful
                      }
                      className="
                        inline-flex
                        min-h-11
                        min-w-44
                        items-center
                        justify-center
                        rounded-xl
                        bg-[var(--qoreva-danger)]
                        px-6
                        py-2.5
                        text-sm
                        font-black
                        text-white
                        shadow-sm
                        transition-all
                        duration-150
                        hover:-translate-y-px
                        hover:bg-[#B63341]
                        hover:shadow-[0_8px_20px_rgba(200,62,77,0.18)]
                        active:translate-y-0
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        disabled:hover:translate-y-0
                      "
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
        </div>
      ) : null}
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