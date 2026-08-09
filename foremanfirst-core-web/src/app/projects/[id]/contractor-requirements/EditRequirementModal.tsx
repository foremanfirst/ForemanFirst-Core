"use client";

import { FormEvent, useState } from "react";

import { updateContractorRequirement } from "./actions";

type Props = {
  requirement: {
    id: string;
    projectId: string;
    documentType: string;
    name: string;
    description: string | null;
    isRequired: boolean;
    expirationRequired: boolean;
    reviewRequired: boolean;
    sortOrder: number;
  };
};

type FormState = {
  documentType: string;
  name: string;
  description: string;
  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;
  sortOrder: string;
};

export default function EditRequirementModal({
  requirement,
}: Props) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<FormState>({
    documentType: requirement.documentType,
    name: requirement.name,
    description: requirement.description ?? "",
    isRequired: requirement.isRequired,
    expirationRequired: requirement.expirationRequired,
    reviewRequired: requirement.reviewRequired,
    sortOrder: String(requirement.sortOrder),
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({
      documentType: requirement.documentType,
      name: requirement.name,
      description: requirement.description ?? "",
      isRequired: requirement.isRequired,
      expirationRequired: requirement.expirationRequired,
      reviewRequired: requirement.reviewRequired,
      sortOrder: String(requirement.sortOrder),
    });
  }

  function openModal() {
    resetForm();
    setError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    resetForm();
    setError("");
    setOpen(false);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.documentType.trim()) {
      setError("Document type is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Requirement name is required.");
      return;
    }

    try {
      setSaving(true);

      await updateContractorRequirement({
        requirementId: requirement.id,
        projectId: requirement.projectId,

        documentType: form.documentType.trim(),
        name: form.name.trim(),
        description: form.description.trim(),

        isRequired: form.isRequired,
        expirationRequired: form.expirationRequired,
        reviewRequired: form.reviewRequired,

        sortOrder:
          Number(form.sortOrder) || 0,
      });

      setOpen(false);

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update requirement.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-xs font-black text-blue-700 transition hover:text-blue-900"
      >
        Edit
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[95vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0B132B] px-5 py-4 text-white sm:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  ForemanFirst™ Contractor Compliance
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Edit Requirement
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl font-bold transition hover:bg-white/20 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(95vh-70px)] overflow-y-auto"
            >
              <div className="space-y-6 p-5 sm:p-6">
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <RequirementField
                    label="Requirement Name"
                    required
                    value={form.name}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                  />

                  <RequirementField
                    label="Document Type"
                    required
                    value={form.documentType}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        documentType: value,
                      }))
                    }
                  />

                  <RequirementField
                    label="Sort Order"
                    type="number"
                    value={form.sortOrder}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-3">
                  <RequirementToggle
                    label="Required"
                    description="Contractors must satisfy this requirement."
                    checked={form.isRequired}
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        isRequired: checked,
                      }))
                    }
                  />

                  <RequirementToggle
                    label="Expiration Required"
                    description="The submitted document must include and maintain a valid expiration date."
                    checked={
                      form.expirationRequired
                    }
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        expirationRequired:
                          checked,
                      }))
                    }
                  />

                  <RequirementToggle
                    label="Review Required"
                    description="A qualified user must review the document before compliance is confirmed."
                    checked={
                      form.reviewRequired
                    }
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        reviewRequired:
                          checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RequirementField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">
        {label}

        {required ? (
          <span className="ml-1 text-rose-600">
            *
          </span>
        ) : null}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        min={type === "number" ? "0" : undefined}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function RequirementToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-500"
      />

      <span>
        <span className="block font-black text-slate-900">
          {label}
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}