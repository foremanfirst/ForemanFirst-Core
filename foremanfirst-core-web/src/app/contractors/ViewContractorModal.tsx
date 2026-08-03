"use client";

import { useState } from "react";
import { ModalShell, StatusBadge } from "@/components";
import type { ContractorRecord } from "./types";
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
        className="font-semibold text-slate-600 transition hover:text-cyan-700 hover:underline"
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
                      contractor.isActive ? "Active" : "Inactive"
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

function ViewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h4 className="text-lg font-black text-slate-950">
        {title}
      </h4>

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