"use client";

import { useMemo, useState } from "react";
import type { ProjectRecord } from "./types";
import ViewProjectModal from "./ViewProjectModal";
import EditProjectModal from "./EditProjectModal";
import type {
  ProjectCompanyOption,
  ProjectContractorOption,
} from "./types";

type ProjectTableProps = {
  projects: ProjectRecord[];
  companies: ProjectCompanyOption[];
  contractors: ProjectContractorOption[];
};

export default function ProjectTable({
  projects,
  companies,
  contractors,
}: ProjectTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          project.name,
          project.projectCode,
          project.clientName,
          project.company.name,
          project.projectType,
          project.city,
          project.state,
          project.projectManager,
          project.superintendent,
          project.safetyManager,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
            Project Directory
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-950">
            Current Projects
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            {filteredProjects.length} project
            {filteredProjects.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search projects..."
            className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="All">All statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="p-10 text-center">
          <h3 className="text-lg font-black text-slate-950">
            No projects found
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Create a project or adjust the current filters.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">
                    Project
                  </th>

                  <th className="px-5 py-4">
                    Company / Client
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Schedule
                  </th>

                  <th className="px-5 py-4">
                    Progress
                  </th>

                  <th className="px-5 py-4">
                    Workforce
                  </th>

                  <th className="px-5 py-4">
                    Contractors
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="transition hover:bg-cyan-50/40"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                          {projectInitials(project.name)}
                        </div>

                        <div>
                          <p className="font-black text-slate-950">
                            {project.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {project.projectCode ||
                              "No project code"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <p className="font-bold text-slate-800">
                        {project.company.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {project.clientName ||
                          "No client entered"}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusTone(
                          project.status,
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <p className="font-bold text-slate-800">
                        {formatDate(project.startDate)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        to {formatDate(project.endDate)}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[#00C2FF]"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  project.progress,
                                  0,
                                ),
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="text-sm font-black text-slate-800">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <p className="font-black text-slate-950">
                        {project.currentWorkforce}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {project.workersOnsite} onsite
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <p className="font-black text-slate-950">
                        {project._count?.contractors ??
                          project.contractors?.length ??
                          0}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Assigned contractors
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-3">
                        <ViewProjectModal
                          project={project}
                        />

                        <EditProjectModal
                          project={project}
                          companies={companies}
                          contractors={contractors}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-5 xl:hidden">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                      {projectInitials(project.name)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-950">
                        {project.name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {project.company.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusTone(
                      project.status,
                    )}`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MobileDetail
                    label="Client"
                    value={
                      project.clientName ||
                      "Not entered"
                    }
                  />

                  <MobileDetail
                    label="Progress"
                    value={`${project.progress}%`}
                  />

                  <MobileDetail
                    label="Workforce"
                    value={String(
                      project.currentWorkforce,
                    )}
                  />

                  <MobileDetail
                    label="Contractors"
                    value={String(
                      project._count?.contractors ??
                        project.contractors?.length ??
                        0,
                    )}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                  <ViewProjectModal
                    project={project}
                  />

                  <EditProjectModal
                    project={project}
                    companies={companies}
                    contractors={contractors}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function MobileDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-slate-900">
        {value || "Not entered"}
      </p>
    </div>
  );
}

function projectInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not entered";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusTone(status: string): string {
  switch (status) {
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Planning":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "On Hold":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "Completed":
      return "border-slate-200 bg-slate-100 text-slate-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}