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
        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
      >
        Document History
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Document History"
        eyebrow="Contractor Documentation"
        onClose={closeModal}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Contractor
              </p>

              <p className="mt-1 text-lg font-black text-slate-950">
                {contractorName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                {events.length}{" "}
                {events.length === 1
                  ? "event"
                  : "events"}
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
              <p className="font-black text-slate-800">
                Loading document
                history...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Retrieving document
                activity and historical
                versions.
              </p>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          !hasHistory ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
              <p className="font-black text-slate-800">
                No document history
              </p>

              <p className="mt-1 text-sm text-slate-500">
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
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
                  Lifecycle Timeline
                </p>

                <h3 className="mt-1 text-lg font-black text-slate-950">
                  Document Activity
                </h3>

                <p className="mt-1 text-sm text-slate-500">
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
                            <div className="absolute bottom-0 top-8 w-px bg-slate-200" />
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
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                                    <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                                      Historical
                                      Version
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-3 break-words font-black text-slate-950">
                                  {
                                    displayName
                                  }
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {
                                    event
                                      .document
                                      .documentType
                                  }
                                </p>
                              </div>

                              <div className="shrink-0 text-left sm:text-right">
                                <p className="text-sm font-black text-slate-800">
                                  {formatDateTime(
                                    event.createdAt,
                                  )}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Eastern
                                  Time
                                </p>
                              </div>
                            </div>

                            {shouldShowStatusTransition(
                              event,
                            ) ? (
                              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                                  Status
                                  Change
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
                                  <span>
                                    {getPreviousStatus(
                                      event,
                                    )}
                                  </span>

                                  <span className="text-slate-400">
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
                              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                                  Reviewer
                                  Comment
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                                  {
                                    event.comment
                                  }
                                </p>
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
                              <span>
                                <span className="font-black text-slate-600">
                                  Performed
                                  By:
                                </span>{" "}
                                {event.performedBy ||
                                  "Not recorded"}
                              </span>

                              <span>
                                <span className="font-black text-slate-600">
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
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <p className="text-sm font-black text-cyan-900">
                Lifecycle tracking is
                ready
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-cyan-800">
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
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Historical Files
                </p>

                <h3 className="mt-1 text-lg font-black text-slate-950">
                  Archived & Replaced
                  Documents
                </h3>

                <p className="mt-1 text-sm text-slate-500">
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
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0">
                          <p className="break-words font-black text-slate-950">
                            {
                              displayName
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getDocumentTypeLabel(
                              document,
                            )}

                            {" • "}

                            {formatFileSize(
                              document.fileSize,
                            )}
                          </p>
                        </div>

                        <span className="inline-flex shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
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
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Document
                            Notes
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {
                              document.notes
                            }
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
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
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
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

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={
                closeModal
              }
              className="rounded-xl bg-[#0B132B] px-6 py-3 text-sm font-black text-white transition hover:bg-blue-950"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    </>
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
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="mt-1 break-words text-sm font-black text-slate-800">
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
          "bg-cyan-100 text-cyan-800",

        badgeClassName:
          "bg-cyan-100 text-cyan-800",

        textClassName:
          "text-cyan-800",
      };

    case "APPROVED":
      return {
        label: "Approved",
        symbol: "✓",

        circleClassName:
          "bg-emerald-100 text-emerald-800",

        badgeClassName:
          "bg-emerald-100 text-emerald-800",

        textClassName:
          "text-emerald-800",
      };

    case "NEEDS_REVISION":
      return {
        label:
          "Needs Revision",

        symbol: "!",

        circleClassName:
          "bg-amber-100 text-amber-800",

        badgeClassName:
          "bg-amber-100 text-amber-800",

        textClassName:
          "text-amber-800",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        symbol: "×",

        circleClassName:
          "bg-rose-100 text-rose-800",

        badgeClassName:
          "bg-rose-100 text-rose-800",

        textClassName:
          "text-rose-800",
      };

    case "UPLOADED":
      return {
        label: "Uploaded",
        symbol: "↑",

        circleClassName:
          "bg-blue-100 text-blue-800",

        badgeClassName:
          "bg-blue-100 text-blue-800",

        textClassName:
          "text-blue-800",
      };

    case "REPLACED":
      return {
        label: "Replaced",
        symbol: "R",

        circleClassName:
          "bg-violet-100 text-violet-800",

        badgeClassName:
          "bg-violet-100 text-violet-800",

        textClassName:
          "text-violet-800",
      };

    case "ARCHIVED":
      return {
        label: "Archived",
        symbol: "A",

        circleClassName:
          "bg-slate-200 text-slate-700",

        badgeClassName:
          "bg-slate-200 text-slate-700",

        textClassName:
          "text-slate-700",
      };

    default:
      return {
        label:
          formatEventType(
            eventType,
          ),

        symbol: "•",

        circleClassName:
          "bg-slate-200 text-slate-700",

        badgeClassName:
          "bg-slate-200 text-slate-700",

        textClassName:
          "text-slate-700",
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