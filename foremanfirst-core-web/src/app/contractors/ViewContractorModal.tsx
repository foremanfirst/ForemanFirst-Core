"use client";

import {
  type ReactNode,
  useState,
} from "react";

import {
  ModalShell,
  StatusBadge,
} from "@/components";

import AddContractorDocumentModal from "./AddContractorDocumentModal";
import ArchiveContractorDocumentButton from "./ArchiveContractorDocumentButton";
import ContractorDocumentHistoryModal from "./ContractorDocumentHistoryModal";
import ReplaceContractorDocumentModal from "./ReplaceContractorDocumentModal";

import type {
  ContractorDocumentExpirationStatus,
  ContractorDocumentRecord,
  ContractorRecord,
} from "./types";

import {
  approvalStatusTone,
  complianceStatusTone,
  contractorInitials,
  formatContractorAddress,
  formatContractorDate,
  formatRiskRate,
  orientationStatusTone,
} from "./utils";

type ViewContractorModalProps = {
  contractor: ContractorRecord;
};

export default function ViewContractorModal({
  contractor,
}: ViewContractorModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-sm font-black text-slate-700 transition hover:text-cyan-700"
      >
        View
      </button>

      <ModalShell
        isOpen={isOpen}
        title={contractor.name}
        eyebrow="Contractor Management"
        onClose={closeModal}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-7 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xl font-black text-[#00C2FF]">
                {contractorInitials(contractor.name)}
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  {contractor.name}
                </h3>

                <p className="mt-1 text-slate-600">
                  {contractor.trade || "Trade not entered"}

                  {contractor.specialty
                    ? ` • ${contractor.specialty}`
                    : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    label={contractor.approvalStatus}
                    tone={approvalStatusTone(
                      contractor.approvalStatus,
                    )}
                  />

                  <StatusBadge
                    label={contractor.complianceStatus}
                    tone={complianceStatusTone(
                      contractor.complianceStatus,
                    )}
                  />

                  <StatusBadge
                    label={contractor.orientationStatus}
                    tone={orientationStatusTone(
                      contractor.orientationStatus,
                    )}
                  />

                  <StatusBadge
                    label={
                      contractor.isActive
                        ? "Active"
                        : "Inactive"
                    }
                    tone={
                      contractor.isActive
                        ? "success"
                        : "neutral"
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ViewSection title="Assignment">
              <DetailItem
                label="Connected Company"
                value={contractor.company.name}
              />

              <DetailItem
                label="Company Type"
                value={contractor.company.companyType}
              />

              <DetailItem
                label="Project"
                value={
                  contractor.project?.name ||
                  "No project assigned"
                }
              />

              <DetailItem
                label="Project Code"
                value={
                  contractor.project?.projectCode ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Contractor Code"
                value={
                  contractor.contractorCode ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Current Workforce"
                value={String(contractor.workforceCount)}
              />
            </ViewSection>

            <ViewSection title="Primary Contact">
              <DetailItem
                label="Name"
                value={
                  contractor.primaryContactName ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Email"
                value={
                  contractor.primaryContactEmail ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Phone"
                value={
                  contractor.primaryContactPhone ||
                  "Not entered"
                }
              />
            </ViewSection>

            <ViewSection title="Safety Contact">
              <DetailItem
                label="Name"
                value={
                  contractor.safetyContactName ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Email"
                value={
                  contractor.safetyContactEmail ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Phone"
                value={
                  contractor.safetyContactPhone ||
                  "Not entered"
                }
              />
            </ViewSection>

            <ViewSection title="Safety Performance">
              <DetailItem
                label="EMR"
                value={formatRiskRate(contractor.emr)}
              />

              <DetailItem
                label="TRIR"
                value={formatRiskRate(contractor.trir)}
              />

              <DetailItem
                label="Insurance Provider"
                value={
                  contractor.insuranceProvider ||
                  "Not entered"
                }
              />

              <DetailItem
                label="Insurance Expiration"
                value={formatContractorDate(
                  contractor.insuranceExpiresAt,
                )}
              />
            </ViewSection>

            <ViewSection title="Address">
              <div className="sm:col-span-2">
                <DetailItem
                  label="Business Address"
                  value={formatContractorAddress(
                    contractor,
                  )}
                />
              </div>
            </ViewSection>

            <ViewSection title="Record Information">
              <DetailItem
                label="Created"
                value={formatContractorDate(
                  contractor.createdAt,
                )}
              />

              <DetailItem
                label="Last Updated"
                value={formatContractorDate(
                  contractor.updatedAt,
                )}
              />
            </ViewSection>
          </div>

          <ContractorDocumentsSection
            contractorId={contractor.id}
            contractorName={contractor.name}
            projectId={contractor.projectId}
            documents={contractor.documents}
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Description
            </p>

            <p className="mt-2 leading-6 text-slate-700">
              {contractor.description ||
                "No contractor description has been entered."}
            </p>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
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

function ContractorDocumentsSection({
  contractorId,
  contractorName,
  projectId,
  documents,
}: {
  contractorId: string;
  contractorName: string;
  projectId: string | null;
  documents: ContractorDocumentRecord[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">
            Contractor Documents
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-950">
            Uploaded Documentation
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {documents.length}{" "}
            {documents.length === 1
              ? "document"
              : "documents"}
          </div>

          <ContractorDocumentHistoryModal
            contractorId={contractorId}
            contractorName={contractorName}
          />

          <AddContractorDocumentModal
            contractorId={contractorId}
            contractorName={contractorName}
            projectId={projectId}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-black text-slate-800">
            No documents uploaded
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Contractor qualification and compliance
            documents will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {documents.map((document) => {
            const viewUrl =
              `/api/contractor-documents/${document.id}`;

            const downloadUrl =
              `/api/contractor-documents/${document.id}?download=1`;

            const expirationStatus =
              getDocumentExpirationStatus(
                document.expirationDate,
              );

            const displayName =
              document.documentName ||
              document.fileName;

            return (
              <article
                key={document.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <a
                      href={viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words font-black text-slate-900 transition hover:text-cyan-700 hover:underline"
                    >
                      {displayName}
                    </a>

                    <p className="mt-1 text-xs text-slate-500">
                      {getDocumentTypeLabel(document)}
                      {" • "}
                      {formatDocumentFileSize(
                        document.fileSize,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentExpirationBadge
                      status={expirationStatus}
                    />

                    <DocumentReviewBadge
                      status={document.reviewStatus}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DocumentDetail
                    label="Document Type"
                    value={
                      document.documentType ||
                      "Other"
                    }
                  />

                  <DocumentDetail
                    label="Approval"
                    value={document.approvalStatus}
                  />

                  <DocumentDetail
                    label="Effective Date"
                    value={formatContractorDate(
                      document.effectiveDate,
                    )}
                  />

                  <DocumentDetail
                    label="Expiration Date"
                    value={formatContractorDate(
                      document.expirationDate,
                    )}
                  />

                  <DocumentDetail
                    label="Expiration Status"
                    value={expirationStatus}
                  />

                  <DocumentDetail
                    label="AI Processing"
                    value={document.aiProcessingStatus}
                  />

                  <DocumentDetail
                    label="Uploaded"
                    value={formatContractorDate(
                      document.createdAt,
                    )}
                  />

                  <DocumentDetail
                    label="Uploaded By"
                    value={
                      document.uploadedBy ||
                      "Not recorded"
                    }
                  />
                </div>

                {document.notes ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Notes
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                      {document.notes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-[#0B132B] px-4 py-2 text-xs font-black text-white transition hover:bg-blue-950"
                  >
                    View Document
                  </a>

                  <a
                    href={downloadUrl}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                  >
                    Download
                  </a>

                  <ReplaceContractorDocumentModal
                    documentId={document.id}
                    documentName={displayName}
                    documentType={document.documentType}
                    effectiveDate={
                      document.effectiveDate
                    }
                    expirationDate={
                      document.expirationDate
                    }
                    notes={document.notes}
                  />

                  <ArchiveContractorDocumentButton
                    documentId={document.id}
                    documentName={displayName}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getDocumentExpirationStatus(
  expirationDate: string | null,
): ContractorDocumentExpirationStatus {
  if (!expirationDate) {
    return "No Expiration";
  }

  const expiration = new Date(expirationDate);

  if (Number.isNaN(expiration.getTime())) {
    return "No Expiration";
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const expirationDay = new Date(
    expiration.getFullYear(),
    expiration.getMonth(),
    expiration.getDate(),
  );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const daysUntilExpiration = Math.ceil(
    (expirationDay.getTime() -
      today.getTime()) /
      millisecondsPerDay,
  );

  if (daysUntilExpiration < 0) {
    return "Expired";
  }

  if (daysUntilExpiration <= 30) {
    return "Expiring Soon";
  }

  return "Current";
}

function DocumentExpirationBadge({
  status,
}: {
  status: ContractorDocumentExpirationStatus;
}) {
  const className =
    status === "Expired"
      ? "bg-rose-100 text-rose-700"
      : status === "Expiring Soon"
        ? "bg-amber-100 text-amber-700"
        : status === "Current"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-200 text-slate-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {status}
    </span>
  );
}

function DocumentReviewBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  const className = normalized.includes("approved")
    ? "bg-emerald-100 text-emerald-700"
    : normalized.includes("rejected")
      ? "bg-rose-100 text-rose-700"
      : normalized.includes("review")
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-200 text-slate-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {status || "Not Reviewed"}
    </span>
  );
}

function DocumentDetail({
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

function formatDocumentFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ViewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-black text-slate-950">
        {title}
      </h3>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words font-black text-slate-900">
        {value || "Not entered"}
      </dd>
    </div>
  );
}