"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormSection,
  ModalShell,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components";
import { createProject } from "./actions";
import {
  EMPTY_PROJECT_FORM,
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type ProjectFormData,
  type ProjectModalProps,
} from "./types";

export default function AddProjectModal({
  companies,
}: ProjectModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormData>(
    EMPTY_PROJECT_FORM,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function openModal() {
    setForm(EMPTY_PROJECT_FORM);
    setError("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setError("");
  }

  function updateField<
    K extends keyof ProjectFormData,
  >(
    field: K,
    value: ProjectFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!form.companyId) {
      setError("Select a managing company.");
      return;
    }

    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError(
        "Target completion date cannot be before the start date.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createProject({
        companyId: form.companyId,

        name: form.name,
        projectCode:
          form.projectCode || null,
        clientName:
          form.clientName || null,
        projectType:
          form.projectType || null,
        description:
          form.description || null,

        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zipCode: form.zipCode || null,
        location: form.location || null,

        status: form.status,

        startDate:
          form.startDate || null,
        endDate:
          form.endDate || null,

        projectManager:
          form.projectManager || null,
        superintendent:
          form.superintendent || null,
        safetyManager:
          form.safetyManager || null,

        contractValue:
          form.contractValue
            ? Number(form.contractValue)
            : null,

        plannedWorkforce: Number(
          form.plannedWorkforce || 0,
        ),
        currentWorkforce: Number(
          form.currentWorkforce || 0,
        ),
        workersOnsite: Number(
          form.workersOnsite || 0,
        ),
        activeContractors: Number(
          form.activeContractors || 0,
        ),
        totalManHours: Number(
          form.totalManHours || 0,
        ),

        progress: Number(
          form.progress || 0,
        ),
        openActions: Number(
          form.openActions || 0,
        ),
        recordableIncidents: Number(
          form.recordableIncidents || 0,
        ),
        permitsOpen: Number(
          form.permitsOpen || 0,
        ),
        planningDocumentsPending:
          Number(
            form.planningDocumentsPending ||
              0,
          ),
        trainingCompliance: Number(
          form.trainingCompliance || 100,
        ),
        accessCompliance: Number(
          form.accessCompliance || 100,
        ),
        healthScore: Number(
          form.healthScore || 100,
        ),

        isActive: form.isActive,
      });

      setIsOpen(false);
      setForm(EMPTY_PROJECT_FORM);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const companyOptions = [
    {
      label: "Select managing company",
      value: "",
    },
    ...companies.map((company) => ({
      label: `${company.name} — ${company.companyType}`,
      value: company.id,
    })),
  ];

  return (
    <>
      <PrimaryButton onClick={openModal}>
        + New Project
      </PrimaryButton>

      <ModalShell
        isOpen={isOpen}
        title="Create New Project"
        eyebrow="ForemanFirst™ Projects"
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-8 p-5 sm:p-7">
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
              >
                {error}
              </div>
            ) : null}

            <FormSection
              title="Project Identity"
              description="Enter the primary project information used throughout ForemanFirst™."
            >
              <SelectField
                label="Managing Company"
                value={form.companyId}
                options={companyOptions}
                required
                onChange={(value) =>
                  updateField(
                    "companyId",
                    value,
                  )
                }
              />

              <TextField
                label="Project Name"
                value={form.name}
                required
                onChange={(value) =>
                  updateField("name", value)
                }
              />

              <TextField
                label="Project Code"
                value={form.projectCode}
                onChange={(value) =>
                  updateField(
                    "projectCode",
                    value,
                  )
                }
              />

              <TextField
                label="Client Name"
                value={form.clientName}
                onChange={(value) =>
                  updateField(
                    "clientName",
                    value,
                  )
                }
              />

              <SelectField
                label="Project Type"
                value={form.projectType}
                options={
                  PROJECT_TYPE_OPTIONS
                }
                onChange={(value) =>
                  updateField(
                    "projectType",
                    value as ProjectFormData["projectType"],
                  )
                }
              />

              <SelectField
                label="Project Status"
                value={form.status}
                options={
                  PROJECT_STATUS_OPTIONS
                }
                onChange={(value) =>
                  updateField(
                    "status",
                    value as ProjectFormData["status"],
                  )
                }
              />

              <TextField
                label="Location Name"
                value={form.location}
                placeholder="Building, campus, site, or facility"
                onChange={(value) =>
                  updateField(
                    "location",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Location and Schedule"
              description="Define where the project is located and its planned duration."
            >
              <TextField
                label="Street Address"
                value={form.address}
                onChange={(value) =>
                  updateField(
                    "address",
                    value,
                  )
                }
              />

              <TextField
                label="City"
                value={form.city}
                onChange={(value) =>
                  updateField("city", value)
                }
              />

              <TextField
                label="State"
                value={form.state}
                onChange={(value) =>
                  updateField("state", value)
                }
              />

              <TextField
                label="ZIP Code"
                value={form.zipCode}
                onChange={(value) =>
                  updateField(
                    "zipCode",
                    value,
                  )
                }
              />

              <TextField
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(value) =>
                  updateField(
                    "startDate",
                    value,
                  )
                }
              />

              <TextField
                label="Target Completion Date"
                type="date"
                value={form.endDate}
                onChange={(value) =>
                  updateField(
                    "endDate",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Project Leadership"
              description="Assign the primary project leadership contacts."
            >
              <TextField
                label="Project Manager"
                value={form.projectManager}
                onChange={(value) =>
                  updateField(
                    "projectManager",
                    value,
                  )
                }
              />

              <TextField
                label="Superintendent"
                value={form.superintendent}
                onChange={(value) =>
                  updateField(
                    "superintendent",
                    value,
                  )
                }
              />

              <TextField
                label="Safety Manager"
                value={form.safetyManager}
                onChange={(value) =>
                  updateField(
                    "safetyManager",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Workforce and Progress"
              description="Enter current workforce, financial, and project-progress metrics."
            >
              <TextField
                label="Contract Value"
                type="number"
                value={form.contractValue}
                onChange={(value) =>
                  updateField(
                    "contractValue",
                    value,
                  )
                }
              />

              <TextField
                label="Planned Workforce"
                type="number"
                value={form.plannedWorkforce}
                onChange={(value) =>
                  updateField(
                    "plannedWorkforce",
                    value,
                  )
                }
              />

              <TextField
                label="Current Workforce"
                type="number"
                value={form.currentWorkforce}
                onChange={(value) =>
                  updateField(
                    "currentWorkforce",
                    value,
                  )
                }
              />

              <TextField
                label="Workers Onsite"
                type="number"
                value={form.workersOnsite}
                onChange={(value) =>
                  updateField(
                    "workersOnsite",
                    value,
                  )
                }
              />

              <TextField
                label="Active Contractors"
                type="number"
                value={
                  form.activeContractors
                }
                onChange={(value) =>
                  updateField(
                    "activeContractors",
                    value,
                  )
                }
              />

              <TextField
                label="Total Man-Hours"
                type="number"
                value={form.totalManHours}
                onChange={(value) =>
                  updateField(
                    "totalManHours",
                    value,
                  )
                }
              />

              <TextField
                label="Project Progress %"
                type="number"
                value={form.progress}
                onChange={(value) =>
                  updateField(
                    "progress",
                    value,
                  )
                }
              />

              <TextField
                label="Project Health Score %"
                type="number"
                value={form.healthScore}
                onChange={(value) =>
                  updateField(
                    "healthScore",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Safety and Compliance"
              description="Enter current safety indicators and compliance metrics."
            >
              <TextField
                label="Open Corrective Actions"
                type="number"
                value={form.openActions}
                onChange={(value) =>
                  updateField(
                    "openActions",
                    value,
                  )
                }
              />

              <TextField
                label="Recordable Incidents"
                type="number"
                value={
                  form.recordableIncidents
                }
                onChange={(value) =>
                  updateField(
                    "recordableIncidents",
                    value,
                  )
                }
              />

              <TextField
                label="Open Permits"
                type="number"
                value={form.permitsOpen}
                onChange={(value) =>
                  updateField(
                    "permitsOpen",
                    value,
                  )
                }
              />

              <TextField
                label="Pending Planning Documents"
                type="number"
                value={
                  form.planningDocumentsPending
                }
                onChange={(value) =>
                  updateField(
                    "planningDocumentsPending",
                    value,
                  )
                }
              />

              <TextField
                label="Training Compliance %"
                type="number"
                value={
                  form.trainingCompliance
                }
                onChange={(value) =>
                  updateField(
                    "trainingCompliance",
                    value,
                  )
                }
              />

              <TextField
                label="Access Compliance %"
                type="number"
                value={
                  form.accessCompliance
                }
                onChange={(value) =>
                  updateField(
                    "accessCompliance",
                    value,
                  )
                }
              />

              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField(
                      "isActive",
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span className="text-sm font-black text-slate-800">
                  Project is active
                </span>
              </label>
            </FormSection>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">
                Project Description
              </label>

              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Describe the project scope, buildings, phases, objectives, and important field information."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
              <h3 className="font-black text-[#0B132B]">
                Prime contractor assignment
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                Create the project first. Prime and
                specialty contractors will then be assigned
                through Contractor Management so the
                relationship is saved correctly in
                PostgreSQL.
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating Project..."
                : "Create Project"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}