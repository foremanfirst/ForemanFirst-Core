export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Welcome to ForemanFirst™
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">
          Notifications
        </button>

        <div className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
          F
        </div>
      </div>
    </header>
  );
}