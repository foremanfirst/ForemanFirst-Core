"use client";

import {
  type ReactNode,
  useState,
} from "react";

import { ModalShell } from "@/components";

import type {
  ContractorDocumentRecord,
} from "./types";

type ContractorDocumentHistoryModalProps = {
  contractorId: string;
  contractorName: string;
};

type ContractorDocumentHistoryEvent = {
  id: string;
  tenantId: string;

  contractorDocumentId: string;
  contractorId: string;

  eventType: string;

  previousApprovalStatus:
    | string
    | null;

  newApprovalStatus:
    | string
    | null;

  previousReviewStatus:
    | string
    | null;

  newReviewStatus:
    | string
    | null;

  comment:
    | string
    | null;

  performedBy:
    | string
    | null;

  createdAt: string;

  document: {
    id: string;

    documentType: string;
    documentName: string;
    fileName: string;

    approvalStatus: string;
    reviewStatus: string;

    isActive: boolean;
    isArchived: boolean;

    archivedAt:
      | string
      | null;

    createdAt: string;
  };
};

type HistoryResponse = {
  contractor: {
    id: string;
    name: string;
  };

  total: number;

  documentTotal?: number;
  eventTotal?: number;

  documents:
    ContractorDocumentRecord[];

  events:
    ContractorDocumentHistoryEvent[];

  message?: string;
};

export default function ContractorDocumentHistoryModal({
  contractorId,
  contractorName,
}: ContractorDocumentHistoryModalProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    documents,
    setDocuments,
  ] = useState<
    ContractorDocumentRecord[]
  >([]);

  const [
    events,
    setEvents,
  ] = useState<
    ContractorDocumentHistoryEvent[]
  >([]);

  const [
    error,
    setError,
  ] = useState("");

  const [
    hasLoaded,
    setHasLoaded,
  ] = useState(false);

  async function openModal() {
    setIsOpen(true);

    if (hasLoaded) {
      return;
    }

    await loadDocumentHistory();
  }

  function closeModal() {
    setIsOpen(false);
  }

  async function loadDocumentHistory() {
    setError("");
    setIsLoading(true);

    try {
      const response =
        await fetch(
          `/api/contractors/${contractorId}/document-history`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

      const responseData =
        (await response
          .json()
          .catch(
            () => null,
          )) as
          | HistoryResponse
          | null;

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Unable to load document history.",
        );
      }

      setDocuments(
        responseData?.documents ??
          [],
      );

      setEvents(
        responseData?.events ??
          [],
      );

      setHasLoaded(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load document history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshHistory() {
    setHasLoaded(false);

    await loadDocumentHistory();
  }

  const hasHistory =
    documents.length > 0 ||
    events.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2.5 text-sm font-black text-[var(--qoreva-text)] transition-all duration-150 hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-faint)] hover:text-[var(--qoreva-violet-dark)]"
      >
        Document History
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Document History"
        eyebrow="Qoreva™ Contractor Documentation"
        onClose={closeModal}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-6 bg-[var(--qoreva-porcelain)] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 shadow-[var(--qoreva-shadow-sm)] sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                Contractor
              </p>

              <p className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                {contractorName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-xs font-black text-[var(--qoreva-muted)]">
                {events.length}{" "}
                {events.length === 1
                  ? "event"
                  : "events"}
              </div>

              <div className="rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-xs font-black text-[var(--qoreva-muted)]">
                {documents.length}{" "}
                historical{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}
              </div>

              <button
                type="button"
                onClick={
                  refreshHistory
                }
                disabled={
                  isLoading
                }
                className="rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition-all duration-150 hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-faint)] hover:text-[var(--qoreva-violet-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(102,87,232,0.16)] bg-[var(--qoreva-violet-faint)] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]">
                <AuditIcon />
              </div>

              <div>
                <p className="text-sm font-black text-[var(--qoreva-obsidian)]">
                  Qoreva™ Audit Trail
                </p>

                <p className="mt-1 text-xs font-medium leading-5 text-[var(--qoreva-muted)]">
                  Review decisions, replacements, archived versions, comments, and status changes remain preserved for contractor recordkeeping.
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white py-12 text-center">
              <p className="font-black text-[var(--qoreva-text)]">
                Loading document
                history...
              </p>

              <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                Retrieving document
                activity and historical
                versions.
              </p>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          !hasHistory ? (
            <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white py-12 text-center">
              <p className="font-black text-[var(--qoreva-text)]">
                No document history
              </p>

              <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                Review activity,
                archived documents, and
                replaced versions will
                appear here.
              </p>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          events.length > 0 ? (
            <section className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]">
              <div className="border-b border-[var(--qoreva-border)] pb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                  Lifecycle Timeline
                </p>

                <h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                  Document Activity
                </h3>

                <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                  Review decisions and
                  document activity are
                  retained as part of the
                  contractor audit
                  history.
                </p>
              </div>

              <div className="mt-5 space-y-0">
                {events.map(
                  (
                    event,
                    index,
                  ) => {
                    const eventDisplay =
                      getEventDisplay(
                        event.eventType,
                      );

                    const displayName =
                      event.document
                        .documentName ||
                      event.document
                        .fileName;

                    const isLast =
                      index ===
                      events.length -
                        1;

                    return (
                      <div
                        key={
                          event.id
                        }
                        className="relative flex gap-4"
                      >
                        <div className="relative flex w-8 shrink-0 justify-center">
                          {!isLast ? (
                            <div className="absolute bottom-0 top-8 w-px bg-[var(--qoreva-surface-muted)]" />
                          ) : null}

                          <div
                            className={`relative z-10 mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${eventDisplay.circleClassName}`}
                          >
                            {
                              eventDisplay.symbol
                            }
                          </div>
                        </div>

                        <div
                          className={`min-w-0 flex-1 ${
                            isLast
                              ? ""
                              : "pb-6"
                          }`}
                        >
                          <div className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-4 shadow-[var(--qoreva-shadow-sm)]">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${eventDisplay.badgeClassName}`}
                                  >
                                    {
                                      eventDisplay.label
                                    }
                                  </span>

                                  {event
                                    .document
                                    .isArchived ? (
                                    <span className="inline-flex rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-xs font-black text-[var(--qoreva-muted)]">
                                      Historical
                                      Version
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-3 break-words font-black text-[var(--qoreva-obsidian)]">
                                  {
                                    displayName
                                  }
                                </p>

                                <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                                  {
                                    event
                                      .document
                                      .documentType
                                  }
                                </p>
                              </div>

                              <div className="shrink-0 text-left sm:text-right">
                                <p className="text-sm font-black text-[var(--qoreva-text)]">
                                  {formatDateTime(
                                    event.createdAt,
                                  )}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-[var(--qoreva-muted)]">
                                  Eastern
                                  Time
                                </p>
                              </div>
                            </div>

                            {shouldShowStatusTransition(
                              event,
                            ) ? (
                              <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                                  Status
                                  Change
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--qoreva-text)]">
                                  <span>
                                    {getPreviousStatus(
                                      event,
                                    )}
                                  </span>

                                  <span className="text-[var(--qoreva-subtle)]">
                                    →
                                  </span>

                                  <span
                                    className={
                                      eventDisplay.textClassName
                                    }
                                  >
                                    {getNewStatus(
                                      event,
                                    )}
                                  </span>
                                </div>
                              </div>
                            ) : null}

                            {event.comment ? (
                              <div className="mt-4 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                                  Reviewer
                                  Comment
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-text)]">
                                  {
                                    event.comment
                                  }
                                </p>
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--qoreva-muted)]">
                              <span>
                                <span className="font-black text-[var(--qoreva-muted)]">
                                  Performed
                                  By:
                                </span>{" "}
                                {event.performedBy ||
                                  "Not recorded"}
                              </span>

                              <span>
                                <span className="font-black text-[var(--qoreva-muted)]">
                                  Document
                                  Status:
                                </span>{" "}
                                {event
                                  .document
                                  .isArchived
                                  ? "Historical"
                                  : "Active"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          ) : null}

          {!isLoading &&
          !error &&
          events.length === 0 &&
          documents.length > 0 ? (
            <div className="rounded-2xl border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-faint)] px-4 py-3">
              <p className="text-sm font-black text-[var(--qoreva-violet-dark)]">
                Lifecycle tracking is
                ready
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-[var(--qoreva-violet-dark)]">
                These documents were
                created before structured
                document-event tracking
                was enabled. New review
                activity will appear in
                the lifecycle timeline.
              </p>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          documents.length > 0 ? (
            <section className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--qoreva-muted)]">
                  Historical Files
                </p>

                <h3 className="mt-1 text-lg font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
                  Archived & Replaced
                  Documents
                </h3>

                <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                  Previous file versions
                  remain preserved for
                  audit and recordkeeping.
                </p>
              </div>

              {documents.map(
                (document) => {
                  const viewUrl =
                    `/api/contractor-documents/${document.id}`;

                  const downloadUrl =
                    `/api/contractor-documents/${document.id}?download=1`;

                  const displayName =
                    document.documentName ||
                    document.fileName;

                  return (
                    <article
                      key={
                        document.id
                      }
                      className="rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="break-words font-black text-[var(--qoreva-obsidian)]">
                            {
                              displayName
                            }
                          </p>

                          <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
                            {getDocumentTypeLabel(
                              document,
                            )}

                            {" • "}

                            {formatFileSize(
                              document.fileSize,
                            )}
                          </p>
                        </div>

                        <span className="inline-flex shrink-0 rounded-full border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-3 py-1 text-xs font-black text-[var(--qoreva-muted)]">
                          Archived
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <HistoryDetail
                          label="Document Type"
                          value={
                            document.documentType ||
                            "Other"
                          }
                        />

                        <HistoryDetail
                          label="Effective Date"
                          value={formatDate(
                            document.effectiveDate,
                          )}
                        />

                        <HistoryDetail
                          label="Expiration Date"
                          value={formatDate(
                            document.expirationDate,
                          )}
                        />

                        <HistoryDetail
                          label="Archived"
                          value={formatDateTime(
                            document.archivedAt,
                          )}
                        />

                        <HistoryDetail
                          label="Approval"
                          value={
                            document.approvalStatus ||
                            "Pending"
                          }
                        />

                        <HistoryDetail
                          label="Review Status"
                          value={
                            document.reviewStatus ||
                            "Not Reviewed"
                          }
                        />

                        <HistoryDetail
                          label="Uploaded"
                          value={formatDateTime(
                            document.createdAt,
                          )}
                        />

                        <HistoryDetail
                          label="Uploaded By"
                          value={
                            document.uploadedBy ||
                            "Not recorded"
                          }
                        />
                      </div>

                      {document.notes ? (
                        <div className="mt-5 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                            Document
                            Notes
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[var(--qoreva-text)]">
                            {
                              document.notes
                            }
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--qoreva-border)] pt-4">
                        {/*
                         * Archived documents are
                         * intentionally download-only
                         * here.
                         *
                         * The current GET route blocks
                         * archived documents from being
                         * opened, so we should not show
                         * a broken View button.
                         */}

                        <a
                          href={
                            downloadUrl
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-2 text-xs font-black text-[var(--qoreva-text)] transition-all duration-150 hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-faint)] hover:text-[var(--qoreva-violet-dark)]"
                        >
                          Download
                          Historical
                          Document
                        </a>
                      </div>
                    </article>
                  );
                },
              )}
            </section>
          ) : null}

          <div className="flex justify-end border-t border-[var(--qoreva-border)] pt-5">
            <button
              type="button"
              onClick={
                closeModal
              }
              className="rounded-xl bg-[var(--qoreva-violet)] px-6 py-3 text-sm font-black text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-[var(--qoreva-violet-hover)] hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

function AuditIcon() {
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
        d="M12 3 5 6v5c0 4.8 2.9 8.4 7 10 4.1-1.6 7-5.2 7-10V6l-7-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9.5 12 1.7 1.7 3.6-4"
      />
    </svg>
  );
}

function HistoryDetail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
        {label}
      </p>

      <div className="mt-1 break-words text-sm font-black text-[var(--qoreva-text)]">
        {value ||
          "Not entered"}
      </div>
    </div>
  );
}

function getEventDisplay(
  eventType: string,
) {
  const normalized =
    eventType
      .trim()
      .toUpperCase();

  switch (normalized) {
    case "VIEWED":
      return {
        label: "Viewed",
        symbol: "V",

        circleClassName:
          "bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        badgeClassName:
          "bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        textClassName:
          "text-[var(--qoreva-violet-dark)]",
      };

    case "APPROVED":
      return {
        label: "Approved",
        symbol: "✓",

        circleClassName:
          "border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",

        badgeClassName:
          "border border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",

        textClassName:
          "text-[var(--qoreva-success)]",
      };

    case "NEEDS_REVISION":
      return {
        label:
          "Needs Revision",

        symbol: "!",

        circleClassName:
          "border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",

        badgeClassName:
          "border border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",

        textClassName:
          "text-[#9B6212]",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        symbol: "×",

        circleClassName:
          "border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",

        badgeClassName:
          "border border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",

        textClassName:
          "text-[var(--qoreva-danger)]",
      };

    case "UPLOADED":
      return {
        label: "Uploaded",
        symbol: "↑",

        circleClassName:
          "border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        badgeClassName:
          "border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        textClassName:
          "text-[var(--qoreva-violet-dark)]",
      };

    case "REPLACED":
      return {
        label: "Replaced",
        symbol: "R",

        circleClassName:
          "border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        badgeClassName:
          "border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",

        textClassName:
          "text-[var(--qoreva-violet-dark)]",
      };

    case "ARCHIVED":
      return {
        label: "Archived",
        symbol: "A",

        circleClassName:
          "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-text)]",

        badgeClassName:
          "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-text)]",

        textClassName:
          "text-[var(--qoreva-text)]",
      };

    default:
      return {
        label:
          formatEventType(
            eventType,
          ),

        symbol: "•",

        circleClassName:
          "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-text)]",

        badgeClassName:
          "bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-text)]",

        textClassName:
          "text-[var(--qoreva-text)]",
      };
  }
}

function shouldShowStatusTransition(
  event:
    ContractorDocumentHistoryEvent,
) {
  const previous =
    getPreviousStatus(
      event,
    );

  const next =
    getNewStatus(
      event,
    );

  return (
    Boolean(previous) &&
    Boolean(next) &&
    previous !== next
  );
}

function getPreviousStatus(
  event:
    ContractorDocumentHistoryEvent,
) {
  return (
    event.previousReviewStatus ||
    event.previousApprovalStatus ||
    "Not recorded"
  );
}

function getNewStatus(
  event:
    ContractorDocumentHistoryEvent,
) {
  return (
    event.newReviewStatus ||
    event.newApprovalStatus ||
    "Not recorded"
  );
}

function formatEventType(
  value: string,
) {
  if (!value) {
    return "Activity";
  }

  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getDocumentTypeLabel(
  document:
    ContractorDocumentRecord,
) {
  if (
    document.mimeType ===
    "application/pdf"
  ) {
    return "PDF";
  }

  if (
    document.mimeType ===
    "image/jpeg"
  ) {
    return "JPEG";
  }

  if (
    document.mimeType ===
    "image/png"
  ) {
    return "PNG";
  }

  return (
    document.mimeType ||
    "Document"
  );
}

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "Not entered";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not entered";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        "America/Detroit",

      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "Not recorded";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        "America/Detroit",

      month: "short",
      day: "numeric",
      year: "numeric",

      hour: "numeric",
      minute: "2-digit",

      timeZoneName:
        "short",
    },
  ).format(date);
}