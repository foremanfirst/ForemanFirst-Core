import { prisma } from "@/lib/prisma";

import {
  EmptyState,
  PageHeader,
  StatusBadge,
  SummaryCard,
} from "@/components";

import AddContractorModal from "./AddContractorModal";
import DeleteContractorButton from "./DeleteContractorButton";
import EditContractorModal from "./EditContractorModal";
import ViewContractorModal from "./ViewContractorModal";

import {
  evaluateContractorCompliance,
  type ContractorComplianceSummary,
  type ContractorDocumentRequirementRecord,
} from "./compliance";

import type {
  ContractorCompanyOption,
  ContractorProjectOption,
  ContractorRecord,
} from "./types";

import {
  approvalStatusTone,
  complianceStatusTone,
  contractorHasComplianceIssue,
  contractorInitials,
  contractorIsInsuranceExpired,
  formatContractorDate,
  formatRiskRate,
  orientationStatusTone,
} from "./utils";

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const [
    contractorsRaw,
    companiesRaw,
    projectsRaw,
    requirementsRaw,
  ] = await Promise.all([
    prisma.contractor.findMany({
      where: {
        isArchived: false,
      },

      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyType: true,
          },
        },

        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            companyId: true,
          },
        },

        documents: {
          where: {
            isArchived: false,
          },

          select: {
            id: true,
            tenantId: true,
            contractorId: true,
            projectId: true,

            documentType: true,
            documentName: true,

            fileName: true,
            mimeType: true,
            fileSize: true,

            storageProvider: true,
            storageKey: true,
            storageUrl: true,

            effectiveDate: true,
            expirationDate: true,

            approvalStatus: true,
            reviewStatus: true,

            notes: true,

            aiProcessingStatus: true,

            uploadedBy: true,

            isActive: true,
            isArchived: true,

            createdAt: true,
            updatedAt: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.company.findMany({
      where: {
        isArchived: false,
      },

      select: {
        id: true,
        name: true,
        companyType: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.project.findMany({
      where: {
        isArchived: false,
      },

      select: {
        id: true,
        name: true,
        projectCode: true,
        companyId: true,
      },

      orderBy: {
        name: "asc",
      },
    }),

    prisma.contractorDocumentRequirement.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
        projectId: true,

        documentType: true,
        name: true,
        description: true,

        isRequired: true,
        expirationRequired: true,
        reviewRequired: true,

        sortOrder: true,

        isActive: true,
        isArchived: true,

        createdAt: true,
        updatedAt: true,
      },

      orderBy: [
        {
          projectId: "asc",
        },
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  const contractors: ContractorRecord[] =
    contractorsRaw.map((contractor) => ({
      ...contractor,

      emr:
        contractor.emr === null
          ? null
          : Number(contractor.emr),

      trir:
        contractor.trir === null
          ? null
          : Number(contractor.trir),

      insuranceExpiresAt:
        contractor.insuranceExpiresAt?.toISOString() ??
        null,

      archivedAt:
        contractor.archivedAt?.toISOString() ??
        null,

      createdAt:
        contractor.createdAt.toISOString(),

      updatedAt:
        contractor.updatedAt.toISOString(),

      documents: contractor.documents.map(
        (document) => ({
          ...document,

          effectiveDate:
            document.effectiveDate?.toISOString() ??
            null,

          expirationDate:
            document.expirationDate?.toISOString() ??
            null,

          createdAt:
            document.createdAt.toISOString(),

          updatedAt:
            document.updatedAt.toISOString(),
        }),
      ),
    }));

  const companies: ContractorCompanyOption[] =
    companiesRaw;

  const projects: ContractorProjectOption[] =
    projectsRaw;

  const requirements: ContractorDocumentRequirementRecord[] =
    requirementsRaw.map((requirement) => ({
      ...requirement,

      createdAt:
        requirement.createdAt.toISOString(),

      updatedAt:
        requirement.updatedAt.toISOString(),
    }));

  const requirementsByProject =
    new Map<
      string,
      ContractorDocumentRequirementRecord[]
    >();

  for (const requirement of requirements) {
    const existingRequirements =
      requirementsByProject.get(
        requirement.projectId,
      ) ?? [];

    existingRequirements.push(requirement);

    requirementsByProject.set(
      requirement.projectId,
      existingRequirements,
    );
  }

  const complianceByContractor =
    new Map<
      string,
      ContractorComplianceSummary
    >();

  for (const contractor of contractors) {
    const projectRequirements =
      contractor.projectId
        ? requirementsByProject.get(
            contractor.projectId,
          ) ?? []
        : [];

    const complianceSummary =
      evaluateContractorCompliance(
        projectRequirements,
        contractor.documents,
      );

    complianceByContractor.set(
      contractor.id,
      complianceSummary,
    );
  }

  const totalContractors =
    contractors.length;

  const activeContractors =
    contractors.filter(
      (contractor) =>
        contractor.isActive,
    ).length;

  const totalWorkforce =
    contractors.reduce(
      (total, contractor) =>
        total +
        contractor.workforceCount,
      0,
    );

  const compliantContractors =
    contractors.filter(
      (contractor) => {
        const summary =
          complianceByContractor.get(
            contractor.id,
          );

        if (
          summary &&
          summary.overallStatus !==
            "No Requirements"
        ) {
          return (
            summary.overallStatus ===
            "Compliant"
          );
        }

        return (
          contractor.complianceStatus ===
          "Compliant"
        );
      },
    ).length;

  const contractorsNeedingAttention =
    contractors.filter(
      (contractor) => {
        const summary =
          complianceByContractor.get(
            contractor.id,
          );

        const documentComplianceIssue =
          summary?.overallStatus ===
          "Needs Attention";

        const existingComplianceIssue =
          contractorHasComplianceIssue(
            contractor,
          );

        return (
          documentComplianceIssue ||
          existingComplianceIssue
        );
      },
    ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ForemanFirst™ Contractor Management"
        title="Contractors"
        description="Manage subcontractors, specialty contractors, workforce partners, safety contacts, compliance status, and project assignments."
        actions={
          <AddContractorModal
            companies={companies}
            projects={projects}
          />
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Total Contractors"
          value={totalContractors}
          detail="Current contractor directory"
        />

        <SummaryCard
          label="Active Contractors"
          value={activeContractors}
          detail="Available for project work"
        />

        <SummaryCard
          label="Workers Assigned"
          value={totalWorkforce}
          detail="Reported contractor workforce"
        />

        <SummaryCard
          label="Compliant"
          value={compliantContractors}
          detail="Current compliance status"
        />

        <SummaryCard
          label="Needs Attention"
          value={
            contractorsNeedingAttention
          }
          detail="Compliance or document issues"
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
              Contractor Directory
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Current Contractors
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {contractors.length} contractor
              {contractors.length === 1
                ? ""
                : "s"}{" "}
              shown
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Search contractors..."
              className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />

            <select
              defaultValue="all"
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            >
              <option value="all">
                All approval statuses
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Conditional">
                Conditional
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Rejected">
                Rejected
              </option>
            </select>

            <select
              defaultValue="all"
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            >
              <option value="all">
                All compliance statuses
              </option>

              <option value="Compliant">
                Compliant
              </option>

              <option value="Action Required">
                Action Required
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Expired">
                Expired
              </option>
            </select>
          </div>
        </div>

        {contractors.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No contractors found"
              description="Add your first contractor to begin connecting companies, projects, safety contacts, workforce, insurance, and compliance records."
              icon={
                <span className="text-lg font-black">
                  CT
                </span>
              }
              actions={
                <AddContractorModal
                  companies={companies}
                  projects={projects}
                />
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">
                      Contractor
                    </th>

                    <th className="px-5 py-4">
                      Company / Project
                    </th>

                    <th className="px-5 py-4">
                      Trade
                    </th>

                    <th className="px-5 py-4">
                      Workforce
                    </th>

                    <th className="px-5 py-4">
                      Safety Performance
                    </th>

                    <th className="px-5 py-4">
                      Compliance
                    </th>

                    <th className="px-5 py-4">
                      Insurance
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {contractors.map(
                    (contractor) => {
                      const insuranceExpired =
                        contractorIsInsuranceExpired(
                          contractor.insuranceExpiresAt,
                        );

                      const complianceSummary =
                        complianceByContractor.get(
                          contractor.id,
                        );

                      return (
                        <tr
                          key={contractor.id}
                          className="transition hover:bg-cyan-50/40"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                                {contractorInitials(
                                  contractor.name,
                                )}
                              </div>

                              <div>
                                <p className="font-black text-slate-950">
                                  {
                                    contractor.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {contractor.contractorCode ||
                                    contractor.legalName ||
                                    "No contractor code"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-bold text-slate-800">
                              {
                                contractor.company
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {contractor.project
                                ?.name ||
                                "No project assigned"}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-bold text-slate-800">
                              {contractor.trade ||
                                "Not entered"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {contractor.specialty ||
                                "No specialty entered"}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-xl font-black text-slate-950">
                              {
                                contractor.workforceCount
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Current workers
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <div className="space-y-1 text-xs">
                              <p className="font-bold text-slate-700">
                                EMR:{" "}
                                {formatRiskRate(
                                  contractor.emr,
                                )}
                              </p>

                              <p className="font-bold text-slate-700">
                                TRIR:{" "}
                                {formatRiskRate(
                                  contractor.trir,
                                )}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="space-y-3">
                              <div className="flex max-w-48 flex-wrap gap-2">
                                <StatusBadge
                                  label={
                                    contractor.approvalStatus
                                  }
                                  tone={approvalStatusTone(
                                    contractor.approvalStatus,
                                  )}
                                />

                                <StatusBadge
                                  label={
                                    contractor.complianceStatus
                                  }
                                  tone={complianceStatusTone(
                                    contractor.complianceStatus,
                                  )}
                                />

                                <StatusBadge
                                  label={
                                    contractor.orientationStatus
                                  }
                                  tone={orientationStatusTone(
                                    contractor.orientationStatus,
                                  )}
                                />
                              </div>

                              <DocumentComplianceSummary
                                summary={
                                  complianceSummary
                                }
                              />
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p
                              className={
                                insuranceExpired
                                  ? "font-black text-rose-700"
                                  : "font-bold text-slate-800"
                              }
                            >
                              {formatContractorDate(
                                contractor.insuranceExpiresAt,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {contractor.insuranceProvider ||
                                "No provider entered"}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-3">
                              <ViewContractorModal
                                contractor={
                                  contractor
                                }
                              />

                              <EditContractorModal
                                contractor={
                                  contractor
                                }
                                companies={
                                  companies
                                }
                                projects={
                                  projects
                                }
                              />

                              <DeleteContractorButton
                                contractorId={
                                  contractor.id
                                }
                                contractorName={
                                  contractor.name
                                }
                                companyName={
                                  contractor.company
                                    .name
                                }
                                projectName={
                                  contractor.project
                                    ?.name
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-5 xl:hidden">
              {contractors.map(
                (contractor) => {
                  const complianceSummary =
                    complianceByContractor.get(
                      contractor.id,
                    );

                  return (
                    <article
                      key={contractor.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                            {contractorInitials(
                              contractor.name,
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-black text-slate-950">
                              {
                                contractor.name
                              }
                            </h3>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {
                                contractor.company
                                  .name
                              }
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          label={
                            contractor.approvalStatus
                          }
                          tone={approvalStatusTone(
                            contractor.approvalStatus,
                          )}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <MobileDetail
                          label="Project"
                          value={
                            contractor.project
                              ?.name ||
                            "Not assigned"
                          }
                        />

                        <MobileDetail
                          label="Trade"
                          value={
                            contractor.trade ||
                            "Not entered"
                          }
                        />

                        <MobileDetail
                          label="Workforce"
                          value={String(
                            contractor.workforceCount,
                          )}
                        />

                        <MobileDetail
                          label="Compliance"
                          value={
                            complianceSummary &&
                            complianceSummary.overallStatus !==
                              "No Requirements"
                              ? `${complianceSummary.compliancePercentage}%`
                              : contractor.complianceStatus
                          }
                        />

                        <MobileDetail
                          label="EMR"
                          value={formatRiskRate(
                            contractor.emr,
                          )}
                        />

                        <MobileDetail
                          label="TRIR"
                          value={formatRiskRate(
                            contractor.trir,
                          )}
                        />
                      </div>

                      <div className="mt-4">
                        <DocumentComplianceSummary
                          summary={
                            complianceSummary
                          }
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        <ViewContractorModal
                          contractor={
                            contractor
                          }
                        />

                        <EditContractorModal
                          contractor={
                            contractor
                          }
                          companies={
                            companies
                          }
                          projects={
                            projects
                          }
                        />

                        <DeleteContractorButton
                          contractorId={
                            contractor.id
                          }
                          contractorName={
                            contractor.name
                          }
                          companyName={
                            contractor.company
                              .name
                          }
                          projectName={
                            contractor.project
                              ?.name
                          }
                        />
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DocumentComplianceSummary({
  summary,
}: {
  summary:
    | ContractorComplianceSummary
    | undefined;
}) {
  if (
    !summary ||
    summary.overallStatus ===
      "No Requirements"
  ) {
    return (
      <p className="text-xs font-semibold text-slate-500">
        No document requirements
      </p>
    );
  }

  /*
   * CRITICAL — RED
   *
   * These conditions represent a true
   * document compliance failure.
   *
   * Missing:
   * A required document has not been submitted.
   *
   * Expired:
   * A required document is no longer current.
   *
   * Rejected:
   * A reviewer formally rejected the document.
   */
  const hasCriticalIssue =
    summary.missing > 0 ||
    summary.expired > 0 ||
    summary.rejected > 0;

  /*
   * WARNING — AMBER
   *
   * These conditions require attention,
   * but they are not treated as a formal
   * compliance failure.
   *
   * Needs Revision:
   * The document was reviewed and returned
   * for correction.
   *
   * Awaiting Review:
   * The document was submitted but has not
   * yet been reviewed.
   *
   * Viewed:
   * A reviewer opened the document but has
   * not yet made a final decision.
   *
   * Expiring Soon:
   * The document is currently valid but is
   * approaching its expiration date.
   */
  const hasWarning =
    summary.needsRevision > 0 ||
    summary.expiringSoon > 0 ||
    summary.awaitingReview > 0 ||
    summary.viewed > 0;

  /*
   * Severity hierarchy:
   *
   * RED wins over AMBER.
   * AMBER wins over GREEN.
   *
   * Example:
   * 1 Needs Revision = Amber
   *
   * 1 Needs Revision + 1 Rejected = Red
   */
  const toneClass =
    hasCriticalIssue
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : hasWarning
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`max-w-64 rounded-xl border px-3 py-2 ${toneClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black">
          Document Compliance
        </span>

        <span className="text-sm font-black">
          {
            summary.compliancePercentage
          }
          %
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-black">
        {summary.current > 0 ? (
          <span>
            {summary.current} Current
          </span>
        ) : null}

        {summary.missing > 0 ? (
          <span>
            {summary.missing} Missing
          </span>
        ) : null}

        {summary.expiringSoon > 0 ? (
          <span>
            {summary.expiringSoon} Expiring
            Soon
          </span>
        ) : null}

        {summary.expired > 0 ? (
          <span>
            {summary.expired} Expired
          </span>
        ) : null}

        {summary.awaitingReview > 0 ? (
          <span>
            {summary.awaitingReview} Awaiting
            Review
          </span>
        ) : null}

        {summary.viewed > 0 ? (
          <span>
            {summary.viewed} Viewed / Pending
            Approval
          </span>
        ) : null}

        {summary.needsRevision > 0 ? (
          <span>
            {summary.needsRevision} Needs
            Revision
          </span>
        ) : null}

        {summary.rejected > 0 ? (
          <span>
            {summary.rejected} Rejected
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-900">
        {value || "Not entered"}
      </p>
    </div>
  );
}