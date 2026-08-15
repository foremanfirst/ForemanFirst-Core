import Link from "next/link";

import { prisma } from "@/lib/prisma";

import {
  StatusBadge,
  SummaryCard,
} from "@/components";

import AddCompanyModal from "./AddCompanyModal";
import EditCompanyModal from "./EditCompanyModal";
import DeleteCompanyButton from "./DeleteCompanyButton";
import ViewCompanyModal from "./ViewCompanyModal";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    where: {
      isArchived: false,
    },
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const totalCompanies = companies.length;

  const activeCompanies = companies.filter(
    (company) => company.isActive,
  ).length;

  const activeProjects = companies.reduce(
    (total, company) =>
      total + company._count.projects,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page Introduction */}
      <section className="qoreva-surface-elevated overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--qoreva-violet)]"
                aria-hidden="true"
              />

              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                Organization Directory
              </p>
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--qoreva-obsidian)] sm:text-4xl">
              Companies
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
              Manage owners, general contractors, specialty
              contractors, suppliers, consultants, and project
              partners across Qoreva.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/companies/archived"
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-xl
                border
                border-[var(--qoreva-border-strong)]
                bg-white
                px-4
                py-2.5
                text-sm
                font-black
                text-[var(--qoreva-text)]
                transition-all
                duration-150
                hover:border-[rgba(102,87,232,0.22)]
                hover:bg-[var(--qoreva-violet-faint)]
              "
            >
              Archived Companies
            </Link>

            <AddCompanyModal />
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total Companies"
          value={totalCompanies}
          detail="Organizations in the current directory"
        />

        <SummaryCard
          label="Active Companies"
          value={activeCompanies}
          detail="Available for active project work"
        />

        <SummaryCard
          label="Active Projects"
          value={activeProjects}
          detail="Projects connected to these companies"
        />
      </section>

      {/* Company Directory */}
      <section className="qoreva-surface-elevated overflow-hidden">
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
                className="h-1.5 w-1.5 rounded-full bg-[var(--qoreva-violet)]"
                aria-hidden="true"
              />

              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                Company Directory
              </p>
            </div>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[var(--qoreva-obsidian)]">
              Current Companies
            </h2>

            <p className="mt-1 text-sm font-medium text-[var(--qoreva-muted)]">
              {companies.length} compan
              {companies.length === 1 ? "y" : "ies"} shown
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="sr-only">
                Search companies
              </span>

              <input
                type="search"
                placeholder="Search companies..."
                className="
                  h-12
                  w-full
                  min-w-[220px]
                  rounded-xl
                  border
                  border-[var(--qoreva-border-strong)]
                  bg-white
                  px-4
                  text-sm
                  font-medium
                  text-[var(--qoreva-ink)]
                  outline-none
                  transition-all
                  duration-150
                  placeholder:text-[var(--qoreva-subtle)]
                  hover:border-[#BBB6C6]
                  focus:border-[var(--qoreva-violet)]
                  focus:ring-4
                  focus:ring-[rgba(102,87,232,0.10)]
                "
              />
            </label>

            <label>
              <span className="sr-only">
                Filter by company type
              </span>

              <select
                defaultValue="all"
                className="
                  h-12
                  w-full
                  min-w-[210px]
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
                  hover:border-[#BBB6C6]
                  focus:border-[var(--qoreva-violet)]
                  focus:ring-4
                  focus:ring-[rgba(102,87,232,0.10)]
                "
              >
                <option value="all">
                  All company types
                </option>

                <option value="Owner">
                  Owner
                </option>

                <option value="General Contractor">
                  General Contractor
                </option>

                <option value="Specialty Contractor">
                  Specialty Contractor
                </option>

                <option value="Supplier">
                  Supplier
                </option>

                <option value="Consultant">
                  Consultant
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-[var(--qoreva-violet-soft)]
                text-sm
                font-black
                text-[var(--qoreva-violet-dark)]
              "
            >
              CO
            </div>

            <h3 className="mt-5 text-xl font-black text-[var(--qoreva-obsidian)]">
              No companies yet
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
              Add the first organization to begin connecting
              companies, contractors, projects, and workers in
              Qoreva.
            </p>

            <div className="mt-6 flex justify-center">
              <AddCompanyModal />
            </div>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--qoreva-surface-muted)]">
                  <tr className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-muted)]">
                    <th className="px-5 py-4">
                      Company
                    </th>

                    <th className="px-5 py-4">
                      Type
                    </th>

                    <th className="px-5 py-4">
                      Contact
                    </th>

                    <th className="px-5 py-4">
                      Projects
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--qoreva-border)]">
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="
                        transition-colors
                        duration-150
                        hover:bg-[var(--qoreva-violet-faint)]
                      "
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-[var(--qoreva-violet-soft)]
                              text-xs
                              font-black
                              text-[var(--qoreva-violet-dark)]
                            "
                          >
                            {company.name
                              .split(" ")
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-black text-[var(--qoreva-obsidian)]">
                              {company.name}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                              {company.city || company.state
                                ? [
                                    company.city,
                                    company.state,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")
                                : "Location not entered"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-[var(--qoreva-text)]">
                        {company.companyType}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--qoreva-text)]">
                          {company.email ||
                            "No email entered"}
                        </p>

                        <p className="mt-1 text-xs font-medium text-[var(--qoreva-muted)]">
                          {company.phone ||
                            "No phone entered"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-black text-[var(--qoreva-obsidian)]">
                        {company._count.projects}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          label={
                            company.isActive
                              ? "Active"
                              : "Inactive"
                          }
                          tone={
                            company.isActive
                              ? "success"
                              : "neutral"
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          <ViewCompanyModal
                            company={{
                              id: company.id,
                              name: company.name,
                              companyType:
                                company.companyType,
                              email: company.email,
                              phone: company.phone,
                              address: company.address,
                              city: company.city,
                              state: company.state,
                              zipCode: company.zipCode,
                              isActive:
                                company.isActive,
                              projectCount:
                                company._count.projects,
                            }}
                          />

                          <EditCompanyModal
                            company={{
                              id: company.id,
                              name: company.name,
                              companyType:
                                company.companyType,
                              email: company.email,
                              phone: company.phone,
                              address: company.address,
                              city: company.city,
                              state: company.state,
                              zipCode: company.zipCode,
                              isActive:
                                company.isActive,
                            }}
                          />

                          <DeleteCompanyButton
                            companyId={company.id}
                            companyName={company.name}
                            companyType={
                              company.companyType
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="grid gap-3 p-4 lg:hidden">
              {companies.map((company) => (
                <article
                  key={company.id}
                  className="
                    rounded-2xl
                    border
                    border-[var(--qoreva-border)]
                    bg-white
                    p-4
                    shadow-[var(--qoreva-shadow-sm)]
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[var(--qoreva-violet-soft)]
                          text-xs
                          font-black
                          text-[var(--qoreva-violet-dark)]
                        "
                      >
                        {company.name
                          .split(" ")
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-black text-[var(--qoreva-obsidian)]">
                          {company.name}
                        </h3>

                        <p className="mt-1 truncate text-xs font-medium text-[var(--qoreva-muted)]">
                          {company.companyType}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      label={
                        company.isActive
                          ? "Active"
                          : "Inactive"
                      }
                      tone={
                        company.isActive
                          ? "success"
                          : "neutral"
                      }
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MobileStat
                      label="Projects"
                      value={String(
                        company._count.projects,
                      )}
                    />

                    <MobileStat
                      label="Location"
                      value={
                        company.city || company.state
                          ? [
                              company.city,
                              company.state,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : "Not entered"
                      }
                    />

                    <MobileStat
                      label="Email"
                      value={
                        company.email ||
                        "Not entered"
                      }
                    />

                    <MobileStat
                      label="Phone"
                      value={
                        company.phone ||
                        "Not entered"
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-[var(--qoreva-border)] pt-4">
                    <ViewCompanyModal
                      company={{
                        id: company.id,
                        name: company.name,
                        companyType:
                          company.companyType,
                        email: company.email,
                        phone: company.phone,
                        address: company.address,
                        city: company.city,
                        state: company.state,
                        zipCode: company.zipCode,
                        isActive:
                          company.isActive,
                        projectCount:
                          company._count.projects,
                      }}
                    />

                    <EditCompanyModal
                      company={{
                        id: company.id,
                        name: company.name,
                        companyType:
                          company.companyType,
                        email: company.email,
                        phone: company.phone,
                        address: company.address,
                        city: company.city,
                        state: company.state,
                        zipCode: company.zipCode,
                        isActive:
                          company.isActive,
                      }}
                    />

                    <DeleteCompanyButton
                      companyId={company.id}
                      companyName={company.name}
                      companyType={
                        company.companyType
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MobileStat({
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
        bg-[var(--qoreva-porcelain)]
        p-3
      "
    >
      <p className="text-[10px] font-black uppercase tracking-[0.10em] text-[var(--qoreva-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-[var(--qoreva-obsidian)]">
        {value}
      </p>
    </div>
  );
}