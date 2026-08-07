"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import {
  FormSection,
  ModalShell,
  PrimaryButton,
  SelectField,
  TextField,
} from "@/components";

import { createContractor } from "./actions";

import {
  EMPTY_CONTRACTOR_FORM,
  type ContractorFormData,
  type ContractorModalProps,
} from "./types";

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

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
];

export default function AddContractorModal({
  companies,
  projects,
}: ContractorModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState<ContractorFormData>(
    EMPTY_CONTRACTOR_FORM,
  );

  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDocuments, setSelectedDocuments] = useState<File[]>(
    [],
  );

  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const filteredProjects = projects.filter(
    (project) =>
      !form.companyId || project.companyId === form.companyId,
  );

  function openModal() {
    setForm(EMPTY_CONTRACTOR_FORM);
    setSelectedDocuments([]);
    setError("");
    setDocumentError("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setSelectedDocuments([]);
    setError("");
    setDocumentError("");
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

  function addDocuments(files: File[]) {
    setDocumentError("");

    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of files) {
      const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

      const hasAllowedExtension =
        ALLOWED_DOCUMENT_EXTENSIONS.includes(extension ?? "");

      const hasAllowedMimeType =
        ALLOWED_DOCUMENT_TYPES.includes(file.type);

      if (!hasAllowedExtension && !hasAllowedMimeType) {
        rejectedFiles.push(
          `${file.name} — unsupported file type`,
        );
        continue;
      }

      if (file.size > MAX_DOCUMENT_SIZE) {
        rejectedFiles.push(`${file.name} — exceeds 20 MB`);
        continue;
      }

      validFiles.push(file);
    }

    setSelectedDocuments((currentDocuments) => {
      const combinedDocuments = [
        ...currentDocuments,
        ...validFiles,
      ];

      return combinedDocuments.filter(
        (file, index, allFiles) =>
          index ===
          allFiles.findIndex(
            (candidate) =>
              candidate.name === file.name &&
              candidate.size === file.size &&
              candidate.lastModified === file.lastModified,
          ),
      );
    });

    if (rejectedFiles.length > 0) {
      setDocumentError(rejectedFiles.join(", "));
    }
  }

  function handleDocumentSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    addDocuments(files);

    event.target.value = "";
  }

  function handleDocumentDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files ?? []);

    addDocuments(files);
  }

  function handleDocumentDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
  }

  function removeDocument(indexToRemove: number) {
    setSelectedDocuments((currentDocuments) =>
      currentDocuments.filter(
        (_, index) => index !== indexToRemove,
      ),
    );
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function uploadDocuments(
    contractorId: string,
    projectId: string | null,
  ) {
    if (selectedDocuments.length === 0) {
      return;
    }

    const documentFormData = new FormData();

    documentFormData.append("contractorId", contractorId);

    if (projectId) {
      documentFormData.append("projectId", projectId);
    }

    documentFormData.append("documentType", "Other");

    for (const file of selectedDocuments) {
      documentFormData.append("files", file);
    }

    const response = await fetch(
      "/api/contractor-documents",
      {
        method: "POST",
        body: documentFormData,
      },
    );

    if (!response.ok) {
      const responseData = await response
        .json()
        .catch(() => null);

      throw new Error(
        responseData?.message ??
          "Contractor was created, but the documents could not be uploaded.",
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setDocumentError("");

    if (!form.companyId) {
      setError(
        "Select a company before adding the contractor.",
      );
      return;
    }

    if (!form.name.trim()) {
      setError("Contractor name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createContractor({
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

        workforceCount: Number(
          form.workforceCount || 0,
        ),

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

if (!result?.contractorId) {
        throw new Error(
          "Contractor was created, but no contractor ID was returned.",
        );
      }

await uploadDocuments(
  result.contractorId,
  form.projectId || null,
);

      setIsOpen(false);
      setForm(EMPTY_CONTRACTOR_FORM);
      setSelectedDocuments([]);
      setDocumentError("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to add contractor.",
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
      <PrimaryButton onClick={openModal}>
        + Add Contractor
      </PrimaryButton>

      <ModalShell
        isOpen={isOpen}
        title="Add Contractor"
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
              description="Create the contractor’s primary company profile."
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
                  updateField(
                    "contractorCode",
                    value,
                  )
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
                  updateField(
                    "workforceCount",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Primary Contact"
              description="Add the main administrative or project contact."
            >
              <TextField
                label="Contact Name"
                value={form.primaryContactName}
                onChange={(value) =>
                  updateField(
                    "primaryContactName",
                    value,
                  )
                }
              />

              <TextField
                label="Contact Email"
                type="email"
                value={form.primaryContactEmail}
                onChange={(value) =>
                  updateField(
                    "primaryContactEmail",
                    value,
                  )
                }
              />

              <TextField
                label="Contact Phone"
                type="tel"
                value={form.primaryContactPhone}
                onChange={(value) =>
                  updateField(
                    "primaryContactPhone",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Safety Contact"
              description="Add the contractor’s primary safety representative."
            >
              <TextField
                label="Safety Contact Name"
                value={form.safetyContactName}
                onChange={(value) =>
                  updateField(
                    "safetyContactName",
                    value,
                  )
                }
              />

              <TextField
                label="Safety Contact Email"
                type="email"
                value={form.safetyContactEmail}
                onChange={(value) =>
                  updateField(
                    "safetyContactEmail",
                    value,
                  )
                }
              />

              <TextField
                label="Safety Contact Phone"
                type="tel"
                value={form.safetyContactPhone}
                onChange={(value) =>
                  updateField(
                    "safetyContactPhone",
                    value,
                  )
                }
              />
            </FormSection>

            <FormSection
              title="Address"
              description="Record the contractor’s primary business address."
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
              description="Track contractor qualification and risk indicators."
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
                  updateField(
                    "insuranceProvider",
                    value,
                  )
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
              description="Set contractor approval, orientation, and compliance status."
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

            <FormSection
              title="Contractor Documents"
              description="Upload contractor qualification, insurance, safety, and compliance documentation."
            >
              <div className="col-span-full">
                <input
                  ref={documentInputRef}
                  id="contractor-documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleDocumentSelection}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    documentInputRef.current?.click()
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      documentInputRef.current?.click();
                    }
                  }}
                  onDrop={handleDocumentDrop}
                  onDragOver={handleDocumentDragOver}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/40 px-6 py-8 text-center transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div className="text-base font-black text-slate-800">
                    Drop contractor documents here
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    or click to select files
                  </div>

                  <div className="mt-3 text-xs font-bold text-slate-400">
                    PDF, JPG, JPEG, or PNG • Maximum 20 MB
                    per file
                  </div>
                </div>

                {documentError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {documentError}
                  </div>
                ) : null}

                {selectedDocuments.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-black text-slate-800">
                        Selected Documents
                      </div>

                      <div className="text-xs font-bold text-slate-500">
                        {selectedDocuments.length}{" "}
                        {selectedDocuments.length === 1
                          ? "document"
                          : "documents"}
                      </div>
                    </div>

                    {selectedDocuments.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-800">
                              {file.name}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {formatFileSize(
                                file.size,
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeDocument(index)
                            }
                            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        documentInputRef.current?.click()
                      }
                      className="mt-2 text-sm font-black text-cyan-700 hover:text-cyan-800"
                    >
                      + Add more documents
                    </button>
                  </div>
                ) : null}

                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                  <div className="text-sm font-black text-slate-800">
                    ForemanFirst™ Document Intelligence
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Upload contractor documentation and
                    ForemanFirst™ will help identify
                    contractor information, insurance
                    details, EMR, TRIR, expiration dates,
                    contacts, qualifications, and
                    compliance information. Extracted
                    information must be reviewed before
                    becoming part of the official
                    contractor record.
                  </p>
                </div>
              </div>
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
                ? "Adding Contractor..."
                : "Add Contractor"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}