interface ProjectStatsProps {
  totalProjects: number;
  activeProjects: number;
  totalWorkers: number;
  totalContractors: number;
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-black text-[#0B132B]">
        {value.toLocaleString()}
      </h2>
    </div>
  );
}

export default function ProjectStats({
  totalProjects,
  activeProjects,
  totalWorkers,
  totalContractors,
}: ProjectStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Projects"
        value={totalProjects}
      />

      <StatCard
        title="Active Projects"
        value={activeProjects}
      />

      <StatCard
        title="Workers On Site"
        value={totalWorkers}
      />

      <StatCard
        title="Active Contractors"
        value={totalContractors}
      />
    </div>
  );
}