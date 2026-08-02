const companies = [
  {
    name: "Barton Malow",
    type: "General Contractor",
    contact: "Sarah Mitchell",
    email: "sarah.mitchell@example.com",
    phone: "(517) 555-0142",
    projects: 4,
    status: "Active",
  },
  {
    name: "Great Lakes Electrical",
    type: "Specialty Contractor",
    contact: "James Carter",
    email: "jcarter@example.com",
    phone: "(313) 555-0188",
    projects: 2,
    status: "Active",
  },
  {
    name: "Midwest Safety Supply",
    type: "Supplier",
    contact: "Emily Brooks",
    email: "ebrooks@example.com",
    phone: "(616) 555-0114",
    projects: 1,
    status: "Inactive",
  },
];

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
          <p className="mt-1 text-slate-500">
            Manage owners, contractors, suppliers, and project partners.
          </p>
        </div>

        <button className="rounded-lg bg-cyan-600 px-5 py-2.5 font-medium text-white transition hover:bg-cyan-700">
          + Add Company
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Companies</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {companies.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Companies</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {companies.filter((company) => company.status === "Active").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Projects</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {companies.reduce((total, company) => total + company.projects, 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Company Directory
            </h2>
            <p className="text-sm text-slate-500">
              View and manage organizations connected to your projects.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              placeholder="Search companies..."
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <select className="rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100">
              <option>All company types</option>
              <option>Owner</option>
              <option>General Contractor</option>
              <option>Specialty Contractor</option>
              <option>Supplier</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Primary Contact
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Projects
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {companies.map((company) => (
                <tr key={company.name} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {company.name}
                      </p>
                      <p className="text-sm text-slate-500">{company.email}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {company.type}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {company.contact}
                    </p>
                    <p className="text-sm text-slate-500">{company.phone}</p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {company.projects}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        company.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {company.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-3 text-sm font-medium">
                      <button className="text-cyan-700 hover:text-cyan-900">
                        View
                      </button>
                      <button className="text-slate-600 hover:text-slate-900">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}