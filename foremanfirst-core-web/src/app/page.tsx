export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center">

        <span className="mb-6 rounded-full border border-orange-500 px-4 py-1 text-sm text-orange-400">
          ForemanFirst™
        </span>

        <h1 className="text-5xl font-bold md:text-7xl">
          Construction Safety
          <br />
          Field Operations
        </h1>

        <p className="mt-6 max-w-3xl text-lg text-slate-300">
          The AI-powered platform built for contractors to simplify safety,
          planning, inspections, observations, permits, and field operations.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600">
            Sign In
          </button>

          <button className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800">
            Request Demo
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-xl font-semibold">
              AI Safety
            </h2>
            <p className="text-slate-400">
              Observations, incident intelligence, hazard recognition,
              and corrective actions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-xl font-semibold">
              Field Operations
            </h2>
            <p className="text-slate-400">
              Daily reports, permits, workforce tracking,
              shutdown planning, and inspections.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-2 text-xl font-semibold">
              Vision™ AI
            </h2>
            <p className="text-slate-400">
              Vision Live™, Vision Capture™, Vision Replay™,
              and Vision Assistant™.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}