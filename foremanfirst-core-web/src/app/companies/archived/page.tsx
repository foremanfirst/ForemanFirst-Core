import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RestoreCompanyButton from "./RestoreCompanyButton";

export const dynamic = "force-dynamic";

export default async function ArchivedCompaniesPage() {
  const companies = await prisma.company.findMany({
    where: {
      isArchived: true,
    },
    orderBy: {
      archivedAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          ← Back to Companies
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Archived Companies
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Archived companies are hidden from the active Companies
            directory but can be restored at any time.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-700">
                Company
              </th>

              <th className="px-5 py-3 font-semibold text-slate-700">
                Type
              </th>

              <th className="px-5 py-3 font-semibold text-slate-700">
                Archived
              </th>

              <th className="px-5 py-3 text-right font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {companies.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  No archived companies found.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {company.name}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {company.companyType}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {company.archivedAt
                      ? company.archivedAt.toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <RestoreCompanyButton
                      companyId={company.id}
                      companyName={company.name}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}