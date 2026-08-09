import Link from "next/link";

import { prisma } from "@/lib/prisma";
import RestoreRequirementButton from "../RestoreRequirementButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ArchivedContractorRequirementsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const projectId = decodeURIComponent(id);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },

    select: {
      id: true,
      name: true,
      projectCode: true,
      clientName: true,
      isArchived: true,

      contractorDocumentRequirements: {
        where: {
          isArchived: true,
        },

        orderBy: [
          {
            archivedAt: "desc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-600">
              ForemanFirst™ Contractor Compliance
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Project Could Not Be Loaded
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              ForemanFirst could not locate the project associated with this
              archived requirements workspace.
            </p>

            <Link
              href="/projects"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0B132B] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-950"
            >
              Back to Projects
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (project.isArchived) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              ForemanFirst™ Contractor Compliance
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Archived Project
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {project.name} is archived. Restore the project before managing
              contractor requirements.
            </p>

            <Link
              href="/projects"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0B132B] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-950"
            >
              Back to Projects
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const archivedRequirements =
    project.contractorDocumentRequirements;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                ForemanFirst™ Contractor Compliance
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Archived Requirements
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review and restore archived contractor requirements for{" "}
                {project.name}.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span>Project: {project.name}</span>

                {project.projectCode ? (
                  <span>• {project.projectCode}</span>
                ) : null}

                {project.clientName ? (
                  <span>• {project.clientName}</span>
                ) : null}
              </div>
            </div>

            <Link
              href={`/projects/${project.id}/contractor-requirements`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
            >
              Back to Requirements
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">
              Archived Documentation
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Archived Contractor Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {archivedRequirements.length}{" "}
              {archivedRequirements.length === 1
                ? "requirement"
                : "requirements"}{" "}
              archived
            </p>
          </div>

          {archivedRequirements.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-500">
                AR
              </div>

              <p className="mt-4 font-black text-slate-800">
                No archived requirements
              </p>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Requirements archived from this project will appear here and
                can be restored when needed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {archivedRequirements.map((requirement) => (
                <article
                  key={requirement.id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950">
                          {requirement.name}
                        </h3>

                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-rose-700">
                          Archived
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {requirement.description ||
                          "No description entered."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <RequirementBadge
                          label={
                            requirement.isRequired
                              ? "Required"
                              : "Optional"
                          }
                        />

                        <RequirementBadge
                          label={
                            requirement.expirationRequired
                              ? "Expiration Required"
                              : "No Expiration Required"
                          }
                        />

                        <RequirementBadge
                          label={
                            requirement.reviewRequired
                              ? "Review Required"
                              : "No Review Required"
                          }
                        />

                        {requirement.archivedAt ? (
                          <RequirementBadge
                            label={`Archived ${formatDate(
                              requirement.archivedAt,
                            )}`}
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-3">
                      <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
                        {requirement.documentType}
                      </div>

                      <RestoreRequirementButton
                        requirementId={requirement.id}
                        projectId={project.id}
                        requirementName={requirement.name}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RequirementBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
      {label}
    </span>
  );
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}