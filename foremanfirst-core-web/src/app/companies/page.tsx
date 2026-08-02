export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-slate-500">
          Manage owners, general contractors, subcontractors, and suppliers.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Company Directory
        </h2>

        <p className="text-slate-500">
          No companies have been created yet.
        </p>

        <button className="mt-6 rounded-lg bg-cyan-600 px-5 py-2 text-white hover:bg-cyan-700">
          + Add Company
        </button>
      </div>
    </div>
  );
}