"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import {
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

  const [form, setForm] =
    useState<ContractorFormData>(
      EMPTY_CONTRACTOR_FORM,
    );

  const [error, setError] = useState("");
  const [documentError, setDocumentError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    selectedDocuments,
    setSelectedDocuments,
  ] = useState<File[]>([]);

  const documentInputRef =
    useRef<HTMLInputElement | null>(null);

  const filteredProjects = projects.filter(
    (project) =>
      !form.companyId ||
      project.companyId === form.companyId,
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

  function updateField<
    K extends keyof ContractorFormData,
  >(
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
        ALLOWED_DOCUMENT_EXTENSIONS.includes(
          extension ?? "",
        );

      const hasAllowedMimeType =
        ALLOWED_DOCUMENT_TYPES.includes(
          file.type,
        );

      if (
        !hasAllowedExtension &&
        !hasAllowedMimeType
      ) {
        rejectedFiles.push(
          `${file.name} — unsupported file type`,
        );
        continue;
      }

      if (file.size > MAX_DOCUMENT_SIZE) {
        rejectedFiles.push(
          `${file.name} — exceeds 20 MB`,
        );
        continue;
      }

      validFiles.push(file);
    }

    setSelectedDocuments(
      (currentDocuments) => {
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
                candidate.size ===
                  file.size &&
                candidate.lastModified ===
                  file.lastModified,
            ),
        );
      },
    );

    if (rejectedFiles.length > 0) {
      setDocumentError(
        rejectedFiles.join(", "),
      );
    }
  }

  function handleDocumentSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    addDocuments(
      Array.from(
        event.target.files ?? [],
      ),
    );

    event.target.value = "";
  }

  function handleDocumentDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    addDocuments(
      Array.from(
        event.dataTransfer.files ?? [],
      ),
    );
  }

  function handleDocumentDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();
  }

  function removeDocument(
    indexToRemove: number,
  ) {
    setSelectedDocuments(
      (currentDocuments) =>
        currentDocuments.filter(
          (_, index) =>
            index !== indexToRemove,
        ),
    );
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  async function uploadDocuments(
    contractorId: string,
    projectId: string | null,
  ) {
    if (
      selectedDocuments.length === 0
    ) {
      return;
    }

    const documentFormData =
      new FormData();

    documentFormData.append(
      "contractorId",
      contractorId,
    );

    if (projectId) {
      documentFormData.append(
        "projectId",
        projectId,
      );
    }

    /*
     * Temporary classification.
     * Qoreva Document Intelligence will
     * eventually classify documents
     * automatically.
     */
    documentFormData.append(
      "documentType",
      "Other",
    );

    for (const file of selectedDocuments) {
      documentFormData.append(
        "files",
        file,
      );
    }

    const response = await fetch(
      "/api/contractor-documents",
      {
        method: "POST",
        body: documentFormData,
      },
    );

    if (!response.ok) {
      const responseData =
        await response
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
      setError(
        "Contractor name is required.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        await createContractor({
          companyId: form.companyId,
          projectId:
            form.projectId || null,

          name: form.name,
          legalName:
            form.legalName || null,

          contractorCode:
            form.contractorCode || null,

          trade: form.trade || null,

          specialty:
            form.specialty || null,

          description:
            form.description || null,

          primaryContactName:
            form.primaryContactName ||
            null,

          primaryContactEmail:
            form.primaryContactEmail ||
            null,

          primaryContactPhone:
            form.primaryContactPhone ||
            null,

          safetyContactName:
            form.safetyContactName ||
            null,

          safetyContactEmail:
            form.safetyContactEmail ||
            null,

          safetyContactPhone:
            form.safetyContactPhone ||
            null,

          address:
            form.address || null,

          city: form.city || null,
          state: form.state || null,

          zipCode:
            form.zipCode || null,

          workforceCount: Number(
            form.workforceCount || 0,
          ),

          emr: form.emr
            ? Number(form.emr)
            : null,

          trir: form.trir
            ? Number(form.trir)
            : null,

          insuranceProvider:
            form.insuranceProvider ||
            null,

          insuranceExpiresAt:
            form.insuranceExpiresAt ||
            null,

          orientationStatus:
            form.orientationStatus,

          complianceStatus:
            form.complianceStatus,

          approvalStatus:
            form.approvalStatus,

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
      setForm(
        EMPTY_CONTRACTOR_FORM,
      );

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

    ...filteredProjects.map(
      (project) => ({
        label: project.projectCode
          ? `${project.name} — ${project.projectCode}`
          : project.name,

        value: project.id,
      }),
    ),
  ];

  return (
    <>
      <PrimaryButton
        onClick={openModal}
      >
        + Add Contractor
      </PrimaryButton>

      <ModalShell
        isOpen={isOpen}
        title="Add Contractor"
        eyebrow="Qoreva™ Contractor Management"
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
      >
        <form onSubmit={handleSubmit}>
          <div
            className="
              bg-[var(--qoreva-porcelain)]
              p-5
              sm:p-7
            "
          >
            {/* Intro */}
            <div
              className="
                mb-7
                rounded-2xl
                border
                border-[var(--qoreva-border)]
                bg-white
                p-5
                shadow-[var(--qoreva-shadow-sm)]
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[11px]
                      font-black
                      uppercase
                      tracking-[0.18em]
                      text-[var(--qoreva-violet)]
                    "
                  >
                    Contractor Setup
                  </p>

                  <h3
                    className="
                      mt-1
                      text-xl
                      font-black
                      tracking-[-0.025em]
                      text-[var(--qoreva-obsidian)]
                    "
                  >
                    Get this contractor
                    ready for the field.
                  </h3>

                  <p
                    className="
                      mt-1
                      max-w-2xl
                      text-sm
                      font-medium
                      leading-6
                      text-[var(--qoreva-muted)]
                    "
                  >
                    Add the essentials,
                    qualification information
                    and required documents.
                    Qoreva keeps the setup
                    organized for review.
                  </p>
                </div>

                <div
                  className="
                    inline-flex
                    shrink-0
                    items-center
                    gap-2
                    self-start
                    rounded-full
                    border
                    border-[rgba(102,87,232,0.18)]
                    bg-[var(--qoreva-violet-soft)]
                    px-3
                    py-1.5
                    text-xs
                    font-black
                    text-[var(--qoreva-violet-dark)]
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-[var(--qoreva-violet)]
                    "
                  />

                  New Contractor
                </div>
              </div>
            </div>

            {error ? (
              <div
                className="
                  mb-6
                  rounded-2xl
                  border
                  border-[#F0BDC4]
                  bg-[var(--qoreva-danger-soft)]
                  px-4
                  py-3
                  text-sm
                  font-black
                  text-[var(--qoreva-danger)]
                "
              >
                {error}
              </div>
            ) : null}

            <div className="space-y-6">
              {/* 01 Contractor */}
              <QorevaSection
                number="01"
                title="Contractor"
                description="Start with who they are, where they are working, and the workforce they represent."
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <SelectField
                    label="Connected Company"
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

                  <SelectField
                    label="Project Assignment"
                    value={form.projectId}
                    options={projectOptions}
                    onChange={(value) =>
                      updateField(
                        "projectId",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Contractor Name"
                    value={form.name}
                    required
                    onChange={(value) =>
                      updateField(
                        "name",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Trade"
                    value={form.trade}
                    onChange={(value) =>
                      updateField(
                        "trade",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Current Workforce"
                    type="number"
                    value={
                      form.workforceCount
                    }
                    onChange={(value) =>
                      updateField(
                        "workforceCount",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Specialty"
                    value={form.specialty}
                    onChange={(value) =>
                      updateField(
                        "specialty",
                        value,
                      )
                    }
                  />
                </div>

                <details
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-[var(--qoreva-border)]
                    bg-[var(--qoreva-surface-muted)]
                  "
                >
                  <summary
                    className="
                      cursor-pointer
                      px-4
                      py-3
                      text-sm
                      font-black
                      text-[var(--qoreva-text)]
                    "
                  >
                    Additional contractor
                    information
                  </summary>

                  <div
                    className="
                      grid
                      gap-5
                      border-t
                      border-[var(--qoreva-border)]
                      p-4
                      sm:grid-cols-2
                    "
                  >
                    <TextField
                      label="Legal Name"
                      value={form.legalName}
                      onChange={(value) =>
                        updateField(
                          "legalName",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Contractor Code"
                      value={
                        form.contractorCode
                      }
                      onChange={(value) =>
                        updateField(
                          "contractorCode",
                          value,
                        )
                      }
                    />
                  </div>
                </details>
              </QorevaSection>

              {/* 02 Contacts */}
              <QorevaSection
                number="02"
                title="Contacts"
                description="Record the people Qoreva should associate with this contractor."
              >
                <div
                  className="
                    grid
                    gap-5
                    lg:grid-cols-2
                  "
                >
                  <ContactGroup
                    title="Primary Contact"
                    description="Administrative or project contact."
                  >
                    <TextField
                      label="Name"
                      value={
                        form.primaryContactName
                      }
                      onChange={(value) =>
                        updateField(
                          "primaryContactName",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Email"
                      type="email"
                      value={
                        form.primaryContactEmail
                      }
                      onChange={(value) =>
                        updateField(
                          "primaryContactEmail",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Phone"
                      type="tel"
                      value={
                        form.primaryContactPhone
                      }
                      onChange={(value) =>
                        updateField(
                          "primaryContactPhone",
                          value,
                        )
                      }
                    />
                  </ContactGroup>

                  <ContactGroup
                    title="Safety Contact"
                    description="Primary contractor safety representative."
                  >
                    <TextField
                      label="Name"
                      value={
                        form.safetyContactName
                      }
                      onChange={(value) =>
                        updateField(
                          "safetyContactName",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Email"
                      type="email"
                      value={
                        form.safetyContactEmail
                      }
                      onChange={(value) =>
                        updateField(
                          "safetyContactEmail",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Phone"
                      type="tel"
                      value={
                        form.safetyContactPhone
                      }
                      onChange={(value) =>
                        updateField(
                          "safetyContactPhone",
                          value,
                        )
                      }
                    />
                  </ContactGroup>
                </div>

                <details
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-[var(--qoreva-border)]
                    bg-[var(--qoreva-surface-muted)]
                  "
                >
                  <summary
                    className="
                      cursor-pointer
                      px-4
                      py-3
                      text-sm
                      font-black
                      text-[var(--qoreva-text)]
                    "
                  >
                    Business address
                  </summary>

                  <div
                    className="
                      grid
                      gap-5
                      border-t
                      border-[var(--qoreva-border)]
                      p-4
                      sm:grid-cols-2
                      lg:grid-cols-4
                    "
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
                        updateField(
                          "city",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="State"
                      value={form.state}
                      onChange={(value) =>
                        updateField(
                          "state",
                          value,
                        )
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
                  </div>
                </details>
              </QorevaSection>

              {/* 03 Qualification */}
              <QorevaSection
                number="03"
                title="Qualification"
                description="Capture the safety and insurance information used to evaluate contractor readiness."
              >
                <div
                  className="
                    grid
                    gap-5
                    sm:grid-cols-2
                    lg:grid-cols-4
                  "
                >
                  <TextField
                    label="EMR"
                    type="number"
                    value={form.emr}
                    onChange={(value) =>
                      updateField(
                        "emr",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="TRIR"
                    type="number"
                    value={form.trir}
                    onChange={(value) =>
                      updateField(
                        "trir",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Insurance Provider"
                    value={
                      form.insuranceProvider
                    }
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
                    value={
                      form.insuranceExpiresAt
                    }
                    onChange={(value) =>
                      updateField(
                        "insuranceExpiresAt",
                        value,
                      )
                    }
                  />
                </div>

                <div
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-[rgba(102,87,232,0.16)]
                    bg-[var(--qoreva-violet-faint)]
                    px-4
                    py-3
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      text-[var(--qoreva-violet-dark)]
                    "
                  >
                    Qualification data can
                    also be verified against
                    uploaded contractor
                    documents.
                  </p>
                </div>
              </QorevaSection>

              {/* 04 Documents */}
              <QorevaSection
                number="04"
                title="Documents"
                description="Upload contractor documentation for qualification, compliance, and project readiness."
                highlight
              >
                <div
                  className="
                    rounded-2xl
                    border
                    border-[rgba(102,87,232,0.18)]
                    bg-[var(--qoreva-violet-faint)]
                    p-4
                    sm:p-5
                  "
                >
                  <div
                    className="
                      flex
                      flex-col
                      gap-3
                      sm:flex-row
                      sm:items-start
                      sm:justify-between
                    "
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-xl
                            bg-[var(--qoreva-violet)]
                            text-sm
                            font-black
                            text-white
                          "
                        >
                          AI
                        </span>

                        <h4
                          className="
                            font-black
                            text-[var(--qoreva-obsidian)]
                          "
                        >
                          Qoreva™ Document
                          Intelligence
                        </h4>
                      </div>

                      <p
                        className="
                          mt-3
                          max-w-3xl
                          text-sm
                          font-medium
                          leading-6
                          text-[var(--qoreva-muted)]
                        "
                      >
                        Drop contractor
                        documents here. Qoreva
                        can assist with
                        identifying document
                        types and extracting
                        contractor, insurance,
                        qualification,
                        expiration, and contact
                        information.
                      </p>
                    </div>

                    <span
                      className="
                        shrink-0
                        self-start
                        rounded-full
                        border
                        border-[rgba(102,87,232,0.18)]
                        bg-white
                        px-3
                        py-1
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.1em]
                        text-[var(--qoreva-violet-dark)]
                      "
                    >
                      Review Required
                    </span>
                  </div>
                </div>

                <input
                  ref={documentInputRef}
                  id="contractor-documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={
                    handleDocumentSelection
                  }
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
                  onDrop={
                    handleDocumentDrop
                  }
                  onDragOver={
                    handleDocumentDragOver
                  }
                  className="
                    mt-5
                    cursor-pointer
                    rounded-2xl
                    border-2
                    border-dashed
                    border-[rgba(102,87,232,0.30)]
                    bg-white
                    px-6
                    py-10
                    text-center
                    transition-all
                    duration-150
                    hover:border-[var(--qoreva-violet)]
                    hover:bg-[var(--qoreva-violet-faint)]
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[var(--qoreva-violet-soft)]
                      text-[var(--qoreva-violet-dark)]
                    "
                  >
                    <UploadIcon />
                  </div>

                  <p
                    className="
                      mt-4
                      text-base
                      font-black
                      text-[var(--qoreva-obsidian)]
                    "
                  >
                    Drop contractor
                    documents here
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-[var(--qoreva-muted)]
                    "
                  >
                    or click to select files
                  </p>

                  <p
                    className="
                      mt-3
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.1em]
                      text-[var(--qoreva-subtle)]
                    "
                  >
                    PDF, JPG, JPEG or PNG •
                    20 MB maximum per file
                  </p>
                </div>

                {documentError ? (
                  <div
                    className="
                      mt-4
                      rounded-xl
                      border
                      border-[#F0BDC4]
                      bg-[var(--qoreva-danger-soft)]
                      px-4
                      py-3
                      text-sm
                      font-black
                      text-[var(--qoreva-danger)]
                    "
                  >
                    {documentError}
                  </div>
                ) : null}

                {selectedDocuments.length >
                0 ? (
                  <div className="mt-5">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                      "
                    >
                      <p
                        className="
                          text-sm
                          font-black
                          text-[var(--qoreva-obsidian)]
                        "
                      >
                        Documents ready to
                        upload
                      </p>

                      <span
                        className="
                          rounded-full
                          bg-[var(--qoreva-violet-soft)]
                          px-3
                          py-1
                          text-xs
                          font-black
                          text-[var(--qoreva-violet-dark)]
                        "
                      >
                        {
                          selectedDocuments.length
                        }{" "}
                        {selectedDocuments.length ===
                        1
                          ? "file"
                          : "files"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedDocuments.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            className="
                              flex
                              items-center
                              justify-between
                              gap-4
                              rounded-xl
                              border
                              border-[var(--qoreva-border)]
                              bg-white
                              px-4
                              py-3
                              shadow-[var(--qoreva-shadow-sm)]
                            "
                          >
                            <div
                              className="
                                flex
                                min-w-0
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  bg-[var(--qoreva-surface-muted)]
                                  text-[var(--qoreva-violet-dark)]
                                "
                              >
                                <DocumentIcon />
                              </div>

                              <div className="min-w-0">
                                <p
                                  className="
                                    truncate
                                    text-sm
                                    font-black
                                    text-[var(--qoreva-text)]
                                  "
                                >
                                  {file.name}
                                </p>

                                <p
                                  className="
                                    mt-0.5
                                    text-xs
                                    font-medium
                                    text-[var(--qoreva-muted)]
                                  "
                                >
                                  {formatFileSize(
                                    file.size,
                                  )}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeDocument(
                                  index,
                                )
                              }
                              className="
                                shrink-0
                                rounded-lg
                                px-3
                                py-1.5
                                text-xs
                                font-black
                                text-[var(--qoreva-muted)]
                                transition
                                hover:bg-[var(--qoreva-danger-soft)]
                                hover:text-[var(--qoreva-danger)]
                              "
                            >
                              Remove
                            </button>
                          </div>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        documentInputRef.current?.click()
                      }
                      className="
                        mt-3
                        text-sm
                        font-black
                        text-[var(--qoreva-violet)]
                        hover:text-[var(--qoreva-violet-dark)]
                      "
                    >
                      + Add more documents
                    </button>
                  </div>
                ) : null}
              </QorevaSection>

              {/* 05 Readiness */}
              <QorevaSection
                number="05"
                title="Readiness"
                description="Set the contractor's current onboarding and approval state."
              >
                <div
                  className="
                    grid
                    gap-5
                    sm:grid-cols-2
                    lg:grid-cols-3
                  "
                >
                  <SelectField
                    label="Orientation Status"
                    value={
                      form.orientationStatus
                    }
                    options={
                      orientationOptions
                    }
                    onChange={(value) =>
                      updateField(
                        "orientationStatus",
                        value as ContractorFormData["orientationStatus"],
                      )
                    }
                  />

                  <SelectField
                    label="Compliance Status"
                    value={
                      form.complianceStatus
                    }
                    options={
                      complianceOptions
                    }
                    onChange={(value) =>
                      updateField(
                        "complianceStatus",
                        value as ContractorFormData["complianceStatus"],
                      )
                    }
                  />

                  <SelectField
                    label="Approval Status"
                    value={
                      form.approvalStatus
                    }
                    options={
                      approvalOptions
                    }
                    onChange={(value) =>
                      updateField(
                        "approvalStatus",
                        value as ContractorFormData["approvalStatus"],
                      )
                    }
                  />
                </div>

                <label
                  className="
                    mt-5
                    flex
                    cursor-pointer
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    border
                    border-[var(--qoreva-border)]
                    bg-[var(--qoreva-surface-muted)]
                    px-4
                    py-3.5
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-[var(--qoreva-obsidian)]
                      "
                    >
                      Active contractor
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        font-medium
                        text-[var(--qoreva-muted)]
                      "
                    >
                      Show this contractor
                      in active project
                      operations.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      updateField(
                        "isActive",
                        event.target
                          .checked,
                      )
                    }
                    className="
                      h-5
                      w-5
                      rounded
                      border-[var(--qoreva-border-strong)]
                      accent-[var(--qoreva-violet)]
                    "
                  />
                </label>
              </QorevaSection>

              {/* Notes */}
              <QorevaSection
                number="06"
                title="Notes"
                description="Optional scope, qualification, or contractor information."
              >
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Add contractor scope, specialty, qualifications, or notes..."
                  className="
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-[var(--qoreva-border-strong)]
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-[var(--qoreva-text)]
                    outline-none
                    transition-all

                    placeholder:text-[var(--qoreva-subtle)]

                    focus:border-[var(--qoreva-violet)]
                    focus:ring-4
                    focus:ring-[rgba(102,87,232,0.10)]
                  "
                />
              </QorevaSection>
            </div>
          </div>

          {/* Sticky Actions */}
          <div
            className="
              sticky
              bottom-0
              z-10
              flex
              flex-col-reverse
              gap-3
              border-t
              border-[var(--qoreva-border)]
              bg-white/95
              px-5
              py-4
              backdrop-blur
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-7
            "
          >
            <p
              className="
                hidden
                text-xs
                font-medium
                text-[var(--qoreva-muted)]
                sm:block
              "
            >
              Required information must be
              completed before the contractor
              can be created.
            </p>

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
              "
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="
                  min-h-11
                  rounded-xl
                  border
                  border-[var(--qoreva-border-strong)]
                  bg-white
                  px-5
                  py-2.5
                  text-sm
                  font-black
                  text-[var(--qoreva-text)]
                  transition
                  hover:bg-[var(--qoreva-surface-muted)]
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  inline-flex
                  min-h-11
                  min-w-44
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--qoreva-violet)]
                  px-6
                  py-2.5
                  text-sm
                  font-black
                  text-white
                  shadow-sm
                  transition-all
                  hover:-translate-y-px
                  hover:bg-[var(--qoreva-violet-hover)]
                  hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  disabled:hover:translate-y-0
                "
              >
                {isSubmitting
                  ? "Adding Contractor..."
                  : "Add Contractor"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

function QorevaSection({
  number,
  title,
  description,
  children,
  highlight = false,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <section
      className={`
        overflow-hidden
        rounded-2xl
        border
        bg-white
        shadow-[var(--qoreva-shadow-sm)]
        ${
          highlight
            ? "border-[rgba(102,87,232,0.22)]"
            : "border-[var(--qoreva-border)]"
        }
      `}
    >
      <div
        className={`
          flex
          items-start
          gap-4
          border-b
          px-5
          py-4
          sm:px-6
          ${
            highlight
              ? "border-[rgba(102,87,232,0.14)] bg-[var(--qoreva-violet-faint)]"
              : "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)]"
          }
        `}
      >
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[var(--qoreva-obsidian)]
            text-[11px]
            font-black
            text-[#B9B0FF]
          "
        >
          {number}
        </div>

        <div>
          <h3
            className="
              text-base
              font-black
              text-[var(--qoreva-obsidian)]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-0.5
              text-xs
              font-medium
              leading-5
              text-[var(--qoreva-muted)]
            "
          >
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function ContactGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--qoreva-border)]
        bg-[var(--qoreva-surface-muted)]
        p-4
      "
    >
      <p
        className="
          text-sm
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-0.5
          text-xs
          font-medium
          text-[var(--qoreva-muted)]
        "
      >
        {description}
      </p>

      <div
        className="
          mt-4
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-1
        "
      >
        {children}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4.5"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h7l4 4v14H7V3Zm7 0v5h5M10 13h5M10 17h5"
      />
    </svg>
  );
}