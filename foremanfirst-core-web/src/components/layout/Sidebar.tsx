import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h2 className="text-xl font-bold mb-8">ForemanFirst™</h2>

      <nav className="space-y-4">
        <Link href="/dashboard" className="block hover:text-cyan-400">
          Dashboard
        </Link>

        <Link href="/projects" className="block hover:text-cyan-400">
          Projects
        </Link>

        <Link href="/companies" className="block hover:text-cyan-400">
          Companies
        </Link>
        
        <Link href="/contractors" className="block hover:text-cyan-400">
  Contractors
</Link>

        <Link href="/workers" className="block hover:text-cyan-400">
          Workers
        </Link>

        <Link href="/settings" className="block hover:text-cyan-400">
          Settings
        </Link>
      </nav>
    </aside>
  );
}