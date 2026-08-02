export default function ContractorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contractors</h1>
        <p className="text-slate-600 mt-1">
          Manage subcontractors, specialty contractors, and workforce partners.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total Contractors</p>
          <h2 className="text-3xl font-bold mt-2">18</h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Active Contractors</p>
          <h2 className="text-3xl font-bold mt-2">15</h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Workers On Site</p>
          <h2 className="text-3xl font-bold mt-2">286</h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">
          Contractor Directory
        </h2>

        <table className="w-full text-left">
          <thead className="border-b">
            <tr>
              <th className="py-3">Contractor</th>
              <th>Trade</th>
              <th>Workers</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              <td className="py-3">Great Lakes Electrical</td>
              <td>Electrical</td>
              <td>42</td>
              <td className="text-green-600 font-medium">Active</td>
            </tr>

            <tr className="border-b">
              <td className="py-3">ABC Mechanical</td>
              <td>Mechanical</td>
              <td>28</td>
              <td className="text-green-600 font-medium">Active</td>
            </tr>

            <tr>
              <td className="py-3">United Concrete</td>
              <td>Concrete</td>
              <td>17</td>
              <td className="text-yellow-600 font-medium">Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}