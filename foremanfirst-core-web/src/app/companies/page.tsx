import { prisma } from "@/lib/prisma";
import AddCompanyModal from "./AddCompanyModal";
import EditCompanyModal from "./EditCompanyModal";
import DeleteCompanyButton from "./DeleteCompanyButton";
import Link from "next/link";

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
    (total, company) => total + company._count.projects,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Companies
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Manage owners, contractors, suppliers, consultants, and
            project partners.
          </p>
        </div>
<div className="flex items-center gap-3">
  <Link
    href="/companies/archived"
    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
  >
    Archived Companies
  </Link>

  <AddCompanyModal />
</div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Total Companies"
          value={totalCompanies}
        />

        <SummaryCard
          label="Active Companies"
          value={activeCompanies}
        />

        <SummaryCard
          label="Active Projects"
          value={activeProjects}
        />
      </div>

      {/* Company directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Company Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage organizations connected to your
              projects.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Search companies..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <select
              defaultValue="all"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">All company types</option>
              <option value="Owner">Owner</option>
              <option value="General Contractor">
                General Contractor
              </option>
              <option value="Specialty Contractor">
                Specialty Contractor
              </option>
              <option value="Supplier">Supplier</option>
              <option value="Consultant">Consultant</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-lg font-bold text-slate-900">
              No companies found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your PostgreSQL database does not contain any company
              records yet.
            </p>

            <div className="mt-5 flex justify-center">
              <AddCompanyModal />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Company
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Type
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Contact
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Projects
                  </th>

                  <th className="px-5 py-3 font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {company.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {company.city || company.state
                          ? [company.city, company.state]
                              .filter(Boolean)
                              .join(", ")
                          : "Location not entered"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {company.companyType}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-slate-700">
                        {company.email || "No email entered"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {company.phone || "No phone entered"}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {company._count.projects}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        isActive={company.isActive}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="font-semibold text-slate-600 transition hover:text-cyan-700"
                        >
                          View
                        </button>

                        <EditCompanyModal
                          company={{
                            id: company.id,
                            name: company.name,
                            companyType: company.companyType,
                            email: company.email,
                            phone: company.phone,
                            address: company.address,
                            city: company.city,
                            state: company.state,
                            zipCode: company.zipCode,
                            isActive: company.isActive,
                          }}
                        />

<DeleteCompanyButton
  companyId={company.id}
  companyName={company.name}
  companyType={company.companyType}
/>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}