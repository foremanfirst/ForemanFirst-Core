"use client";

import { useState } from "react";
import { ModalShell, StatusBadge } from "@/components";
import type { ProjectRecord } from "./types";

type ViewProjectModalProps = {
  project: ProjectRecord;
};

export default function ViewProjectModal({
  project,
}: ViewProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-semibold text-slate-600 transition hover:text-cyan-700 hover:underline"
      >
        View
      </button>

      <ModalShell
        isOpen={isOpen}
        title={project.name}
        eyebrow="ForemanFirst™ Projects"
        onClose={() => setIsOpen(false)}
        maxWidthClass="max-w-5xl"
      >
        <div className="space-y-7 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xl font-black text-[#00C2FF]">
                {projectInitials(project.name)}
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  {project.name}
                </h3>

                <p className="mt-1 text-slate-600">
                  {project.projectCode || "No project code"}
                  {project.projectType
                    ? ` • ${project.projectType}`
                    : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge
                    label={project.status}
                    tone={statusTone(project.status)}
                  />

                  <StatusBadge
                    label={
                      project.isActive ? "Active" : "Inactive"
                    }
                    tone={
                      project.isActive
                        ? "success"
                        : "neutral"
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ViewSection title="Project Identity">
              <DetailItem
                label="Managing Company"
                value={project.company.name}
              />

              <DetailItem
                label="Company Type"
                value={project.company.companyType}
              />

              <DetailItem
                label="Client"
                value={project.clientName || "Not entered"}
              />

              <DetailItem
                label="Project Type"
                value={project.projectType || "Not entered"}
              />

              <DetailItem
                label="Project Code"
                value={project.projectCode || "Not entered"}
              />

              <DetailItem
                label="Status"
                value={project.status}
              />
            </ViewSection>

            <ViewSection title="Schedule">
              <DetailItem
                label="Start Date"
                value={formatDate(project.startDate)}
              />

              <DetailItem
                label="Target Completion"
                value={formatDate(project.endDate)}
              />

              <DetailItem
                label="Progress"
                value={`${project.progress}%`}
              />

              <DetailItem
                label="Health Score"
                value={`${project.healthScore}%`}
              />
            </ViewSection>

            <ViewSection title="Project Leadership">
              <DetailItem
                label="Project Manager"
                value={project.projectManager || "Not assigned"}
              />

              <DetailItem
                label="Superintendent"
                value={project.superintendent || "Not assigned"}
              />

              <DetailItem
                label="Safety Manager"
                value={project.safetyManager || "Not assigned"}
              />
            </ViewSection>

            <ViewSection title="Workforce">
              <DetailItem
                label="Planned Workforce"
                value={formatNumber(project.plannedWorkforce)}
              />

              <DetailItem
                label="Current Workforce"
                value={formatNumber(project.currentWorkforce)}
              />

              <DetailItem
                label="Workers Onsite"
                value={formatNumber(project.workersOnsite)}
              />

              <DetailItem
                label="Assigned Contractors"
                value={formatNumber(
                  project._count?.contractors ??
                    project.contractors?.length ??
                    0,
                )}
              />

              <DetailItem
                label="Total Man-Hours"
                value={formatNumber(project.totalManHours)}
              />

              <DetailItem
                label="Contract Value"
                value={formatCurrency(project.contractValue)}
              />
            </ViewSection>

            <ViewSection title="Safety and Compliance">
              <DetailItem
                label="Open Actions"
                value={formatNumber(project.openActions)}
              />

              <DetailItem
                label="Recordable Incidents"
                value={formatNumber(
                  project.recordableIncidents,
                )}
              />

              <DetailItem
                label="Open Permits"
                value={formatNumber(project.permitsOpen)}
              />

              <DetailItem
                label="Pending Planning Documents"
                value={formatNumber(
                  project.planningDocumentsPending,
                )}
              />

              <DetailItem
                label="Training Compliance"
                value={`${project.trainingCompliance}%`}
              />

              <DetailItem
                label="Access Compliance"
                value={`${project.accessCompliance}%`}
              />
            </ViewSection>

            <ViewSection title="Location">
              <div className="sm:col-span-2">
                <DetailItem
                  label="Project Address"
                  value={formatAddress(project)}
                />
              </div>

              <div className="sm:col-span-2">
                <DetailItem
                  label="Location Name"
                  value={project.location || "Not entered"}
                />
              </div>
            </ViewSection>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Description
            </p>

            <p className="mt-2 leading-6 text-slate-700">
              {project.description ||
                "No project description has been entered."}
            </p>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-[#0B132B] px-6 py-3 text-sm font-black text-white transition hover:bg-blue-950"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    </>
  );
}

function ViewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h4 className="text-lg font-black text-slate-950">
        {title}
      </h4>

      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {children}
      </dl>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words font-black text-slate-900">
        {value || "Not entered"}
      </dd>
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

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "Active":
      return "success";

    case "Planning":
      return "info";

    case "On Hold":
      return "warning";

    case "Completed":
      return "neutral";

    default:
      return "neutral";
  }
}

function formatDate(value: string | null): string {
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) {
    return "Not entered";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAddress(
  project: Pick<
    ProjectRecord,
    "address" | "city" | "state" | "zipCode"
  >,
): string {
  const cityStateZip = [
    project.city,
    project.state,
    project.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return [project.address, cityStateZip]
    .filter(Boolean)
    .join(" • ") || "No address entered";
}