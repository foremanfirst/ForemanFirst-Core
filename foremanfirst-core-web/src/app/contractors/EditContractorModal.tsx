"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  FormSection,
  ModalShell,
  SelectField,
  TextField,
} from "@/components";
import { updateContractor } from "./actions";
import {
  type ContractorFormData,
  type ContractorModalProps,
  type ContractorRecord,
} from "./types";
import { contractorToFormData } from "./utils";

const orientationOptions = [
  { label: "Pending", value: "Pending" },
  { label: "Complete", value: "Complete" },
  { label: "Expired", value: "Expired" },
  { label: "Not Required", value: "Not Required" },
] as const;

const complianceOptions = [
  { label: "Pending", value: "Pending" },
  { label: "Compliant", value: "Compliant" },
  { label: "Action Required", value: "Action Required" },
  { label: "Expired", value: "Expired" },
] as const;

const approvalOptions = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Conditional", value: "Conditional" },
  { label: "Rejected", value: "Rejected" },
] as const;

type EditContractorModalProps = ContractorModalProps & {
  contractor: ContractorRecord;
};

export default function EditContractorModal({
  contractor,
  companies,
  projects,
}: EditContractorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ContractorFormData>(
    contractorToFormData(contractor),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!form.companyId) {
      return projects;
    }

    return projects.filter(
      (project) => project.companyId === form.companyId,
    );
  }, [form.companyId, projects]);

  function openModal() {
    setForm(contractorToFormData(contractor));
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

  function updateField<K extends keyof ContractorFormData>(
    field: K,
    value: ContractorFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "companyId"
        ? {
            projectId: "",
          }
        : {}),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!form.companyId) {
      setError("Select a company before saving the contractor.");
      return;
    }

    if (!form.name.trim()) {
      setError("Contractor name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateContractor(contractor.id, {
        companyId: form.companyId,
        projectId: form.projectId || null,

        name: form.name,
        legalName: form.legalName || null,
        contractorCode: form.contractorCode || null,

        trade: form.trade || null,
        specialty: form.specialty || null,
        description: form.description || null,

        primaryContactName:
          form.primaryContactName || null,
        primaryContactEmail:
          form.primaryContactEmail || null,
        primaryContactPhone:
          form.primaryContactPhone || null,

        safetyContactName:
          form.safetyContactName || null,
        safetyContactEmail:
          form.safetyContactEmail || null,
        safetyContactPhone:
          form.safetyContactPhone || null,

        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zipCode: form.zipCode || null,

        workforceCount: Number(form.workforceCount || 0),

        emr: form.emr ? Number(form.emr) : null,
        trir: form.trir ? Number(form.trir) : null,

        insuranceProvider:
          form.insuranceProvider || null,
        insuranceExpiresAt:
          form.insuranceExpiresAt || null,

        orientationStatus: form.orientationStatus,
        complianceStatus: form.complianceStatus,
        approvalStatus: form.approvalStatus,

        isActive: form.isActive,
      });

      setIsOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update contractor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const companyOptions = [
    {
      label: "Select company",
      value: "",
    },
    ...companies.map((company) => ({
      label: `${company.name} — ${company.companyType}`,
      value: company.id,
    })),
  ];

  const projectOptions = [
    {
      label: "No project assignment",
      value: "",
    },
    ...filteredProjects.map((project) => ({
      label: project.projectCode
        ? `${project.name} — ${project.projectCode}`
        : project.name,
      value: project.id,
    })),
  ];

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="font-semibold text-slate-700 transition hover:text-cyan-700 hover:underline"
      >
        Edit
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Edit Contractor"
        eyebrow="Contractor Management"
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-8 p-5 sm:p-7">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <FormSection
              title="Contractor Identity"
              description="Update the contractor’s primary company profile."
            >
              <SelectField
                label="Connected Company"
                value={form.companyId}
                options={companyOptions}
                required
                onChange={(value) =>
                  updateField("companyId", value)
                }
              />

              <SelectField
                label="Project Assignment"
                value={form.projectId}
                options={projectOptions}
                onChange={(value) =>
                  updateField("projectId", value)
                }
              />

              <TextField
                label="Contractor Name"
                value={form.name}
                required
                onChange={(value) =>
                  updateField("name", value)
                }
              />

              <TextField
                label="Legal Name"
                value={form.legalName}
                onChange={(value) =>
                  updateField("legalName", value)
                }
              />

              <TextField
                label="Contractor Code"
                value={form.contractorCode}
                onChange={(value) =>
                  updateField("contractorCode", value)
                }
              />

              <TextField
                label="Trade"
                value={form.trade}
                onChange={(value) =>
                  updateField("trade", value)
                }
              />

              <TextField
                label="Specialty"
                value={form.specialty}
                onChange={(value) =>
                  updateField("specialty", value)
                }
              />

              <TextField
                label="Current Workforce"
                type="number"
                value={form.workforceCount}
                onChange={(value) =>
                  updateField("workforceCount", value)
                }
              />
            </FormSection>

            <FormSection
              title="Primary Contact"
              description="Update the main administrative or project contact."
            >
              <TextField
                label="Contact Name"
                value={form.primaryContactName}
                onChange={(value) =>
                  updateField("primaryContactName", value)
                }
              />

              <TextField
                label="Contact Email"
                type="email"
                value={form.primaryContactEmail}
                onChange={(value) =>
                  updateField("primaryContactEmail", value)
                }
              />

              <TextField
                label="Contact Phone"
                type="tel"
                value={form.primaryContactPhone}
                onChange={(value) =>
                  updateField("primaryContactPhone", value)
                }
              />
            </FormSection>

            <FormSection
              title="Safety Contact"
              description="Update the contractor’s primary safety representative."
            >
              <TextField
                label="Safety Contact Name"
                value={form.safetyContactName}
                onChange={(value) =>
                  updateField("safetyContactName", value)
                }
              />

              <TextField
                label="Safety Contact Email"
                type="email"
                value={form.safetyContactEmail}
                onChange={(value) =>
                  updateField("safetyContactEmail", value)
                }
              />

              <TextField
                label="Safety Contact Phone"
                type="tel"
                value={form.safetyContactPhone}
                onChange={(value) =>
                  updateField("safetyContactPhone", value)
                }
              />
            </FormSection>

            <FormSection
              title="Address"
              description="Update the contractor’s primary business address."
            >
              <TextField
                label="Street Address"
                value={form.address}
                onChange={(value) =>
                  updateField("address", value)
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
                  updateField("zipCode", value)
                }
              />
            </FormSection>

            <FormSection
              title="Safety Performance"
              description="Update contractor qualification and risk indicators."
            >
              <TextField
                label="EMR"
                type="number"
                value={form.emr}
                onChange={(value) =>
                  updateField("emr", value)
                }
              />

              <TextField
                label="TRIR"
                type="number"
                value={form.trir}
                onChange={(value) =>
                  updateField("trir", value)
                }
              />

              <TextField
                label="Insurance Provider"
                value={form.insuranceProvider}
                onChange={(value) =>
                  updateField("insuranceProvider", value)
                }
              />

              <TextField
                label="Insurance Expiration"
                type="date"
                value={form.insuranceExpiresAt}
                onChange={(value) =>
                  updateField(
                    "insuranceExpiresAt",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Compliance Status"
              description="Update approval, orientation, and compliance status."
            >
              <SelectField
                label="Orientation Status"
                value={form.orientationStatus}
                options={orientationOptions}
                onChange={(value) =>
                  updateField(
                    "orientationStatus",
                    value as ContractorFormData["orientationStatus"],
                  )
                }
              />

              <SelectField
                label="Compliance Status"
                value={form.complianceStatus}
                options={complianceOptions}
                onChange={(value) =>
                  updateField(
                    "complianceStatus",
                    value as ContractorFormData["complianceStatus"],
                  )
                }
              />

              <SelectField
                label="Approval Status"
value={form.approvalStatus}
                options={approvalOptions}
                onChange={(value) =>
                  updateField(
                    "approvalStatus",
                    value as ContractorFormData["approvalStatus"],
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
                  Contractor is active
                </span>
              </label>
            </FormSection>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">
                Description
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
                placeholder="Add contractor scope, specialty, qualifications, or notes."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
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
                ? "Saving Changes..."
                : "Save Contractor Changes"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}