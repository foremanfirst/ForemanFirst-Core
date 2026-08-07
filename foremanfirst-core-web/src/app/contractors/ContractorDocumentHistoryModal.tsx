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

type HistoryResponse = {
  contractor: {
    id: string;
    name: string;
  };

  total: number;
  documents: ContractorDocumentRecord[];
  message?: string;
};

export default function ContractorDocumentHistoryModal({
  contractorId,
  contractorName,
}: ContractorDocumentHistoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] =
    useState(false);

  const [documents, setDocuments] = useState<
    ContractorDocumentRecord[]
  >([]);

  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] =
    useState(false);

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
      const response = await fetch(
        `/api/contractors/${contractorId}/document-history`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const responseData = (await response
        .json()
        .catch(() => null)) as
        | HistoryResponse
        | null;

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Unable to load document history.",
        );
      }

      setDocuments(responseData?.documents ?? []);
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

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                {documents.length} historical{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}
              </div>

              <button
                type="button"
                onClick={refreshHistory}
                disabled={isLoading}
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
                Loading document history...
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Retrieving archived and replaced
                contractor documents.
              </p>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          documents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
              <p className="font-black text-slate-800">
                No document history
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Archived and replaced documents will
                appear here.
              </p>
            </div>
          ) : null}

          {!isLoading && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((document) => {
                const viewUrl =
                  `/api/contractor-documents/${document.id}`;

                const downloadUrl =
                  `/api/contractor-documents/${document.id}?download=1`;

                const displayName =
                  document.documentName ||
                  document.fileName;

                return (
                  <article
                    key={document.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-words font-black text-slate-950 transition hover:text-cyan-700 hover:underline"
                        >
                          {displayName}
                        </a>

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
                        label="Archived Date"
                        value={formatDate(
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
                        value={formatDate(
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
                          Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                          {document.notes}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-[#0B132B] px-4 py-2 text-xs font-black text-white transition hover:bg-blue-950"
                      >
                        View Historical Document
                      </a>

                      <a
                        href={downloadUrl}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                      >
                        Download
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={closeModal}
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
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {value || "Not entered"}
      </p>
    </div>
  );
}

function getDocumentTypeLabel(
  document: ContractorDocumentRecord,
) {
  if (document.mimeType === "application/pdf") {
    return "PDF";
  }

  if (document.mimeType === "image/jpeg") {
    return "JPEG";
  }

  if (document.mimeType === "image/png") {
    return "PNG";
  }

  return document.mimeType || "Document";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "Not entered";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not entered";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}