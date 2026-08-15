import { prisma } from "@/lib/prisma";

import {
  EmptyState,
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
  contractorHasComplianceIssue,
  contractorInitials,
  contractorIsInsuranceExpired,
  formatContractorDate,
  formatRiskRate,
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
      {/* Qoreva Contractor Header */}
      <section
        className="
          relative
          overflow-hidden
          rounded-[1.75rem]
          border
          border-[var(--qoreva-border)]
          bg-white
          p-5
          shadow-[var(--qoreva-shadow-sm)]
          sm:p-6
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-24
            h-64
            w-64
            rounded-full
            bg-[rgba(102,87,232,0.08)]
            blur-3xl
          "
          aria-hidden="true"
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[var(--qoreva-violet)]
                "
                aria-hidden="true"
              />

              <p
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[var(--qoreva-violet)]
                "
              >
                Qoreva™ Contractor Management
              </p>
            </div>

            <h1
              className="
                mt-2
                text-3xl
                font-black
                tracking-[-0.045em]
                text-[var(--qoreva-obsidian)]
                sm:text-4xl
              "
            >
              Contractors
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                font-medium
                leading-6
                text-[var(--qoreva-muted)]
              "
            >
              Know who is ready for work before
              they reach the field. Manage
              contractor qualification, workforce,
              documents, insurance, and project
              readiness from one place.
            </p>
          </div>

          <div className="shrink-0">
            <AddContractorModal
              companies={companies}
              projects={projects}
            />
          </div>
        </div>
      </section>

      {/* Contractor Readiness KPIs */}
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

        <ReadinessMetric
          label="Ready"
          value={compliantContractors}
          detail="Meeting current requirements"
          tone="success"
        />

        <ReadinessMetric
          label="Needs Attention"
          value={
            contractorsNeedingAttention
          }
          detail="Review before field work"
          tone={
            contractorsNeedingAttention > 0
              ? "danger"
              : "neutral"
          }
        />
      </section>

      {/* Directory */}
      <section
        className="
          overflow-hidden
          rounded-[1.75rem]
          border
          border-[var(--qoreva-border)]
          bg-white
          shadow-[var(--qoreva-shadow-sm)]
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            border-b
            border-[var(--qoreva-border)]
            p-5
            sm:p-6
            xl:flex-row
            xl:items-end
            xl:justify-between
          "
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[var(--qoreva-violet)]
                "
                aria-hidden="true"
              />

              <p
                className="
                  text-[11px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[var(--qoreva-violet)]
                "
              >
                Contractor Directory
              </p>
            </div>

            <h2
              className="
                mt-1
                text-2xl
                font-black
                tracking-[-0.03em]
                text-[var(--qoreva-obsidian)]
              "
            >
              Contractor Readiness
            </h2>

            <p
              className="
                mt-1
                text-sm
                font-medium
                text-[var(--qoreva-muted)]
              "
            >
              {contractors.length} contractor
              {contractors.length === 1
                ? ""
                : "s"}{" "}
              shown
            </p>
          </div>

          <div
            className="
              grid
              gap-3
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            <input
              type="search"
              placeholder="Search contractors..."
              className={filterClassName}
            />

            <select
              defaultValue="all"
              className={filterClassName}
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
              className={filterClassName}
            >
              <option value="all">
                All readiness statuses
              </option>

              <option value="Compliant">
                Ready
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
              description="Add your first contractor to begin managing project assignment, workforce, qualification, documents, insurance, and readiness."
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
            {/* Desktop */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-left text-sm">
                <thead
                  className="
                    bg-[var(--qoreva-surface-muted)]
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-[var(--qoreva-muted)]
                  "
                >
                  <tr>
                    <th className="px-6 py-4">
                      Contractor
                    </th>

                    <th className="px-5 py-4">
                      Project
                    </th>

                    <th className="px-5 py-4">
                      Workforce
                    </th>

                    <th className="px-5 py-4">
                      Readiness
                    </th>

                    <th className="px-5 py-4">
                      Documents
                    </th>

                    <th className="px-5 py-4">
                      Insurance
                    </th>

                    <th className="px-5 py-4">
                      Safety
                    </th>

                    <th className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-[var(--qoreva-border)]
                  "
                >
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

                      const readiness =
                        getContractorReadiness(
                          contractor,
                          complianceSummary,
                        );

                      return (
                        <tr
                          key={contractor.id}
                          className="
                            transition-colors
                            duration-150
                            hover:bg-[var(--qoreva-violet-faint)]
                          "
                        >
                          {/* Contractor */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
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
                                  text-xs
                                  font-black
                                  text-[#B9B0FF]
                                "
                              >
                                {contractorInitials(
                                  contractor.name,
                                )}
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="
                                    font-black
                                    text-[var(--qoreva-obsidian)]
                                  "
                                >
                                  {
                                    contractor.name
                                  }
                                </p>

                                <p
                                  className="
                                    mt-1
                                    text-xs
                                    font-medium
                                    text-[var(--qoreva-muted)]
                                  "
                                >
                                  {
                                    contractor.company
                                      .name
                                  }
                                </p>

                                <p
                                  className="
                                    mt-0.5
                                    text-[11px]
                                    font-medium
                                    text-[var(--qoreva-subtle)]
                                  "
                                >
                                  {contractor.trade ||
                                    contractor.contractorCode ||
                                    "Trade not entered"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Project */}
                          <td className="px-5 py-5">
                            <p
                              className="
                                font-black
                                text-[var(--qoreva-text)]
                              "
                            >
                              {contractor.project
                                ?.name ||
                                "Not assigned"}
                            </p>

                            <p
                              className="
                                mt-1
                                text-xs
                                font-medium
                                text-[var(--qoreva-muted)]
                              "
                            >
                              {contractor.project
                                ?.projectCode ||
                                contractor.specialty ||
                                "No project code"}
                            </p>
                          </td>

                          {/* Workforce */}
                          <td className="px-5 py-5">
                            <p
                              className="
                                text-2xl
                                font-black
                                tracking-[-0.03em]
                                text-[var(--qoreva-obsidian)]
                              "
                            >
                              {
                                contractor.workforceCount
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                text-[11px]
                                font-bold
                                text-[var(--qoreva-muted)]
                              "
                            >
                              Current workers
                            </p>
                          </td>

                          {/* Readiness */}
                          <td className="px-5 py-5">
                            <ReadinessBadge
                              label={readiness.label}
                              tone={readiness.tone}
                            />

                            <div className="mt-2">
                              <StatusBadge
                                label={
                                  contractor.approvalStatus
                                }
                                tone={approvalStatusTone(
                                  contractor.approvalStatus,
                                )}
                              />
                            </div>
                          </td>

                          {/* Documents */}
                          <td className="px-5 py-5">
                            <DocumentComplianceSummary
                              summary={
                                complianceSummary
                              }
                            />
                          </td>

                          {/* Insurance */}
                          <td className="px-5 py-5">
                            <div
                              className={`
                                max-w-44
                                rounded-xl
                                border
                                px-3
                                py-2.5
                                ${
                                  insuranceExpired
                                    ? `
                                      border-[#F0BDC4]
                                      bg-[var(--qoreva-danger-soft)]
                                    `
                                    : `
                                      border-[var(--qoreva-border)]
                                      bg-[var(--qoreva-surface-muted)]
                                    `
                                }
                              `}
                            >
                              <p
                                className={`
                                  text-xs
                                  font-black
                                  ${
                                    insuranceExpired
                                      ? "text-[var(--qoreva-danger)]"
                                      : "text-[var(--qoreva-obsidian)]"
                                  }
                                `}
                              >
                                {insuranceExpired
                                  ? "Expired"
                                  : formatContractorDate(
                                      contractor.insuranceExpiresAt,
                                    )}
                              </p>

                              <p
                                className="
                                  mt-1
                                  truncate
                                  text-[10px]
                                  font-bold
                                  text-[var(--qoreva-muted)]
                                "
                              >
                                {contractor.insuranceProvider ||
                                  "No provider"}
                              </p>

                              {insuranceExpired ? (
                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    font-black
                                    text-[var(--qoreva-danger)]
                                  "
                                >
                                  {formatContractorDate(
                                    contractor.insuranceExpiresAt,
                                  )}
                                </p>
                              ) : null}
                            </div>
                          </td>

                          {/* Safety */}
                          <td className="px-5 py-5">
                            <div className="space-y-1">
                              <SafetyMetric
                                label="EMR"
                                value={formatRiskRate(
                                  contractor.emr,
                                )}
                              />

                              <SafetyMetric
                                label="TRIR"
                                value={formatRiskRate(
                                  contractor.trir,
                                )}
                              />
                            </div>
                          </td>

                          {/* Actions */}
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

            {/* Mobile / Tablet */}
            <div
              className="
                grid
                gap-4
                bg-[var(--qoreva-surface-muted)]
                p-4
                sm:p-5
                xl:hidden
              "
            >
              {contractors.map(
                (contractor) => {
                  const complianceSummary =
                    complianceByContractor.get(
                      contractor.id,
                    );

                  const readiness =
                    getContractorReadiness(
                      contractor,
                      complianceSummary,
                    );

                  const insuranceExpired =
                    contractorIsInsuranceExpired(
                      contractor.insuranceExpiresAt,
                    );

                  return (
                    <article
                      key={contractor.id}
                      className="
                        rounded-3xl
                        border
                        border-[var(--qoreva-border)]
                        bg-white
                        p-5
                        shadow-[var(--qoreva-shadow-sm)]
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-4
                        "
                      >
                        <div className="flex min-w-0 items-center gap-3">
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
                              text-xs
                              font-black
                              text-[#B9B0FF]
                            "
                          >
                            {contractorInitials(
                              contractor.name,
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3
                              className="
                                truncate
                                font-black
                                text-[var(--qoreva-obsidian)]
                              "
                            >
                              {
                                contractor.name
                              }
                            </h3>

                            <p
                              className="
                                mt-1
                                truncate
                                text-sm
                                font-medium
                                text-[var(--qoreva-muted)]
                              "
                            >
                              {
                                contractor.company
                                  .name
                              }
                            </p>
                          </div>
                        </div>

                        <ReadinessBadge
                          label={readiness.label}
                          tone={readiness.tone}
                        />
                      </div>

                      <div
                        className="
                          mt-5
                          grid
                          grid-cols-2
                          gap-3
                        "
                      >
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
                          label="Approval"
                          value={
                            contractor.approvalStatus
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

                      <div
                        className={`
                          mt-4
                          rounded-xl
                          border
                          p-3
                          ${
                            insuranceExpired
                              ? `
                                border-[#F0BDC4]
                                bg-[var(--qoreva-danger-soft)]
                              `
                              : `
                                border-[var(--qoreva-border)]
                                bg-[var(--qoreva-surface-muted)]
                              `
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className="
                              text-[10px]
                              font-black
                              uppercase
                              tracking-[0.1em]
                              text-[var(--qoreva-muted)]
                            "
                          >
                            Insurance
                          </p>

                          <p
                            className={`
                              text-xs
                              font-black
                              ${
                                insuranceExpired
                                  ? "text-[var(--qoreva-danger)]"
                                  : "text-[var(--qoreva-obsidian)]"
                              }
                            `}
                          >
                            {insuranceExpired
                              ? "Expired"
                              : formatContractorDate(
                                  contractor.insuranceExpiresAt,
                                )}
                          </p>
                        </div>
                      </div>

                      <div
                        className="
                          mt-5
                          flex
                          flex-wrap
                          gap-3
                          border-t
                          border-[var(--qoreva-border)]
                          pt-4
                        "
                      >
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
      <div
        className="
          inline-flex
          rounded-xl
          border
          border-[var(--qoreva-border)]
          bg-[var(--qoreva-surface-muted)]
          px-3
          py-2
        "
      >
        <p
          className="
            text-[11px]
            font-bold
            text-[var(--qoreva-muted)]
          "
        >
          No document requirements
        </p>
      </div>
    );
  }

  /*
   * RED
   * Missing, expired or rejected required
   * documents represent a compliance failure.
   */
  const hasCriticalIssue =
    summary.missing > 0 ||
    summary.expired > 0 ||
    summary.rejected > 0;

  /*
   * AMBER
   * Revision, review, viewed or expiring-soon
   * documents require attention.
   */
  const hasWarning =
    summary.needsRevision > 0 ||
    summary.expiringSoon > 0 ||
    summary.awaitingReview > 0 ||
    summary.viewed > 0;

  const tone =
    hasCriticalIssue
      ? "danger"
      : hasWarning
        ? "warning"
        : "success";

  const toneClasses = {
    danger: {
      container:
        "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)]",
      text:
        "text-[var(--qoreva-danger)]",
      bar:
        "bg-[var(--qoreva-danger)]",
    },

    warning: {
      container:
        "border-[#F0D49B] bg-[var(--qoreva-warning-soft)]",
      text:
        "text-[var(--qoreva-warning)]",
      bar:
        "bg-[var(--qoreva-warning)]",
    },

    success: {
      container:
        "border-[#BDE8D4] bg-[var(--qoreva-success-soft)]",
      text:
        "text-[var(--qoreva-success)]",
      bar:
        "bg-[var(--qoreva-success)]",
    },
  } as const;

  const classes =
    toneClasses[tone];

  return (
    <div
      className={`
        w-full
        max-w-64
        rounded-xl
        border
        px-3
        py-2.5
        ${classes.container}
      `}
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <span
          className={`
            text-[11px]
            font-black
            ${classes.text}
          `}
        >
          Documents
        </span>

        <span
          className={`
            text-sm
            font-black
            ${classes.text}
          `}
        >
          {summary.compliancePercentage}%
        </span>
      </div>

      <div
        className="
          mt-2
          h-1.5
          overflow-hidden
          rounded-full
          bg-black/[0.06]
        "
      >
        <div
          className={`
            h-full
            rounded-full
            ${classes.bar}
          `}
          style={{
            width: `${Math.max(
              0,
              Math.min(
                100,
                summary.compliancePercentage,
              ),
            )}%`,
          }}
        />
      </div>

      <div
        className="
          mt-2
          flex
          flex-wrap
          gap-x-2.5
          gap-y-1
          text-[9px]
          font-black
        "
      >
        {summary.current > 0 ? (
          <span className={classes.text}>
            {summary.current} Current
          </span>
        ) : null}

        {summary.missing > 0 ? (
          <span className="text-[var(--qoreva-danger)]">
            {summary.missing} Missing
          </span>
        ) : null}

        {summary.expiringSoon > 0 ? (
          <span className="text-[var(--qoreva-warning)]">
            {summary.expiringSoon} Expiring
          </span>
        ) : null}

        {summary.expired > 0 ? (
          <span className="text-[var(--qoreva-danger)]">
            {summary.expired} Expired
          </span>
        ) : null}

        {summary.awaitingReview > 0 ? (
          <span className="text-[var(--qoreva-warning)]">
            {summary.awaitingReview} Review
          </span>
        ) : null}

        {summary.viewed > 0 ? (
          <span className="text-[var(--qoreva-warning)]">
            {summary.viewed} Pending
          </span>
        ) : null}

        {summary.needsRevision > 0 ? (
          <span className="text-[var(--qoreva-warning)]">
            {summary.needsRevision} Revision
          </span>
        ) : null}

        {summary.rejected > 0 ? (
          <span className="text-[var(--qoreva-danger)]">
            {summary.rejected} Rejected
          </span>
        ) : null}
      </div>
    </div>
  );
}

function getContractorReadiness(
  contractor: ContractorRecord,
  summary:
    | ContractorComplianceSummary
    | undefined,
): {
  label: string;
  tone:
    | "success"
    | "warning"
    | "danger"
    | "neutral";
} {
  const documentFailure =
    summary?.missing &&
      summary.missing > 0 ||
    summary?.expired &&
      summary.expired > 0 ||
    summary?.rejected &&
      summary.rejected > 0;

  const documentWarning =
    summary?.needsRevision &&
      summary.needsRevision > 0 ||
    summary?.expiringSoon &&
      summary.expiringSoon > 0 ||
    summary?.awaitingReview &&
      summary.awaitingReview > 0 ||
    summary?.viewed &&
      summary.viewed > 0;

  const insuranceExpired =
    contractorIsInsuranceExpired(
      contractor.insuranceExpiresAt,
    );

  if (
    documentFailure ||
    insuranceExpired ||
    contractor.complianceStatus ===
      "Expired" ||
    contractor.complianceStatus ===
      "Action Required" ||
    contractor.approvalStatus ===
      "Rejected"
  ) {
    return {
      label: "Action Required",
      tone: "danger",
    };
  }

  if (
    documentWarning ||
    contractor.approvalStatus ===
      "Pending" ||
    contractor.approvalStatus ===
      "Conditional" ||
    contractor.complianceStatus ===
      "Pending" ||
    contractor.orientationStatus !==
      "Complete"
  ) {
    return {
      label: "Review",
      tone: "warning",
    };
  }

  if (
    contractor.approvalStatus ===
      "Approved" &&
    contractor.complianceStatus ===
      "Compliant" &&
    contractor.orientationStatus ===
      "Complete"
  ) {
    return {
      label: "Ready",
      tone: "success",
    };
  }

  return {
    label: "Review",
    tone: "neutral",
  };
}

function ReadinessBadge({
  label,
  tone,
}: {
  label: string;
  tone:
    | "success"
    | "warning"
    | "danger"
    | "neutral";
}) {
  const classes = {
    success:
      "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",

    warning:
      "border-[#F0D49B] bg-[var(--qoreva-warning-soft)] text-[var(--qoreva-warning)]",

    danger:
      "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",

    neutral:
      "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]",
  } as const;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-3
        py-1
        text-[10px]
        font-black
        ${classes[tone]}
      `}
    >
      <span
        className="
          h-1.5
          w-1.5
          rounded-full
          bg-current
        "
        aria-hidden="true"
      />

      {label}
    </span>
  );
}

function ReadinessMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone:
    | "success"
    | "danger"
    | "neutral";
}) {
  const toneClasses = {
    success: {
      border:
        "border-[#BDE8D4]",
      value:
        "text-[var(--qoreva-success)]",
      dot:
        "bg-[var(--qoreva-success)]",
    },

    danger: {
      border:
        "border-[#F0BDC4]",
      value:
        "text-[var(--qoreva-danger)]",
      dot:
        "bg-[var(--qoreva-danger)]",
    },

    neutral: {
      border:
        "border-[var(--qoreva-border)]",
      value:
        "text-[var(--qoreva-obsidian)]",
      dot:
        "bg-[var(--qoreva-muted)]",
    },
  } as const;

  const classes =
    toneClasses[tone];

  return (
    <div
      className={`
        rounded-2xl
        border
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
        ${classes.border}
      `}
    >
      <div className="flex items-center gap-2">
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${classes.dot}
          `}
          aria-hidden="true"
        />

        <p
          className="
            text-sm
            font-bold
            text-[var(--qoreva-muted)]
          "
        >
          {label}
        </p>
      </div>

      <p
        className={`
          mt-2
          text-3xl
          font-black
          tracking-[-0.04em]
          ${classes.value}
        `}
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-sm
          font-medium
          text-[var(--qoreva-muted)]
        "
      >
        {detail}
      </p>
    </div>
  );
}

function SafetyMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="
          min-w-8
          text-[10px]
          font-black
          uppercase
          tracking-wide
          text-[var(--qoreva-muted)]
        "
      >
        {label}
      </span>

      <span
        className="
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {value}
      </span>
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
    <div
      className="
        rounded-xl
        border
        border-[var(--qoreva-border)]
        bg-[var(--qoreva-surface-muted)]
        p-3
      "
    >
      <p
        className="
          text-[9px]
          font-black
          uppercase
          tracking-[0.1em]
          text-[var(--qoreva-muted)]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          truncate
          text-sm
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {value || "Not entered"}
      </p>
    </div>
  );
}

const filterClassName = `
  h-12
  w-full
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  text-sm
  font-semibold
  text-[var(--qoreva-text)]
  outline-none
  transition-all
  duration-150

  placeholder:text-[var(--qoreva-subtle)]

  hover:border-[#BBB6C6]

  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]
`;