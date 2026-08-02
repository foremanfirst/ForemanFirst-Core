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
      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          Archived Companies
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Archived companies are hidden from the active directory but
          can be restored at any time.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Archived</th>
              <th className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {companies.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  No archived companies.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-5 py-4 font-semibold">
                    {company.name}
                  </td>

                  <td className="px-5 py-4">
                    {company.companyType}
                  </td>

                  <td className="px-5 py-4">
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