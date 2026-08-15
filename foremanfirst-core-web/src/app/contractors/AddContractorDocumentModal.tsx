"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ModalShell,
  SelectField,
  TextField,
} from "@/components";

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

const documentTypeOptions = [
  {
    label: "Select document type",
    value: "",
  },
  {
    label: "Certificate of Insurance",
    value: "Certificate of Insurance",
  },
  {
    label: "EMR Verification",
    value: "EMR Verification",
  },
  {
    label: "TRIR Verification",
    value: "TRIR Verification",
  },
  {
    label: "OSHA 300A",
    value: "OSHA 300A",
  },
  {
    label: "Company Safety Manual",
    value: "Company Safety Manual",
  },
  {
    label: "Site-Specific Safety Plan",
    value: "Site-Specific Safety Plan",
  },
  {
    label: "Safety Letter",
    value: "Safety Letter",
  },
  {
    label: "Organization Chart",
    value: "Organization Chart",
  },
  {
    label: "Emergency Contact List",
    value: "Emergency Contact List",
  },
  {
    label: "Chemical Inventory / SDS",
    value: "Chemical Inventory / SDS",
  },
  {
    label: "Permit",
    value: "Permit",
  },
  {
    label: "Training / Certification",
    value: "Training / Certification",
  },
  {
    label: "Other",
    value: "Other",
  },
];

type AddContractorDocumentModalProps = {
  contractorId: string;
  contractorName: string;
  projectId?: string | null;
};

export default function AddContractorDocumentModal({
  contractorId,
  contractorName,
  projectId = null,
}: AddContractorDocumentModalProps) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [documentType, setDocumentType] =
    useState("");

  const [documentName, setDocumentName] =
    useState("");

  const [effectiveDate, setEffectiveDate] =
    useState("");

  const [expirationDate, setExpirationDate] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [
    selectedDocuments,
    setSelectedDocuments,
  ] = useState<File[]>([]);

  const [error, setError] =
    useState("");

  const [
    documentError,
    setDocumentError,
  ] = useState("");

  function openModal() {
    resetForm();
    setIsOpen(true);
  }

  function closeModal() {
    if (isUploading) {
      return;
    }

    setIsOpen(false);
    resetForm();
  }

  function resetForm() {
    setDocumentType("");
    setDocumentName("");
    setEffectiveDate("");
    setExpirationDate("");
    setNotes("");
    setSelectedDocuments([]);
    setError("");
    setDocumentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function addDocuments(
    files: File[],
  ) {
    setDocumentError("");

    const acceptedFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of files) {
      const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

      const allowedExtension =
        ALLOWED_DOCUMENT_EXTENSIONS.includes(
          extension ?? "",
        );

      const allowedMimeType =
        ALLOWED_DOCUMENT_TYPES.includes(
          file.type,
        );

      if (
        !allowedExtension &&
        !allowedMimeType
      ) {
        rejectedFiles.push(
          `${file.name} — unsupported file type`,
        );

        continue;
      }

      if (file.size <= 0) {
        rejectedFiles.push(
          `${file.name} — file is empty`,
        );

        continue;
      }

      if (
        file.size >
        MAX_DOCUMENT_SIZE
      ) {
        rejectedFiles.push(
          `${file.name} — exceeds 20 MB`,
        );

        continue;
      }

      acceptedFiles.push(file);
    }

    setSelectedDocuments(
      (currentFiles) => {
        const combinedFiles = [
          ...currentFiles,
          ...acceptedFiles,
        ];

        return combinedFiles.filter(
          (file, index, allFiles) =>
            index ===
            allFiles.findIndex(
              (candidate) =>
                candidate.name ===
                  file.name &&
                candidate.size ===
                  file.size &&
                candidate.lastModified ===
                  file.lastModified,
            ),
        );
      },
    );

    if (
      rejectedFiles.length > 0
    ) {
      setDocumentError(
        rejectedFiles.join(", "),
      );
    }
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    addDocuments(files);

    event.target.value = "";
  }

  function handleDocumentDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(
      event.dataTransfer.files ?? [],
    );

    addDocuments(files);
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
      (currentFiles) =>
        currentFiles.filter(
          (_, index) =>
            index !== indexToRemove,
        ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setDocumentError("");

    if (!documentType) {
      setError(
        "Select a document type.",
      );
      return;
    }

    if (
      selectedDocuments.length === 0
    ) {
      setError(
        "Select at least one document to upload.",
      );

      return;
    }

    if (
      effectiveDate &&
      expirationDate &&
      expirationDate < effectiveDate
    ) {
      setError(
        "Expiration date cannot be before the effective date.",
      );

      return;
    }

    if (
      documentName.trim() &&
      selectedDocuments.length > 1
    ) {
      setError(
        "A custom document name can only be used when uploading one file.",
      );

      return;
    }

    setIsUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "contractorId",
        contractorId,
      );

      if (projectId) {
        formData.append(
          "projectId",
          projectId,
        );
      }

      formData.append(
        "documentType",
        documentType,
      );

      if (documentName.trim()) {
        formData.append(
          "documentName",
          documentName.trim(),
        );
      }

      if (effectiveDate) {
        formData.append(
          "effectiveDate",
          effectiveDate,
        );
      }

      if (expirationDate) {
        formData.append(
          "expirationDate",
          expirationDate,
        );
      }

      if (notes.trim()) {
        formData.append(
          "notes",
          notes.trim(),
        );
      }

      for (
        const file of selectedDocuments
      ) {
        formData.append(
          "files",
          file,
        );
      }

      const response = await fetch(
        "/api/contractor-documents",
        {
          method: "POST",
          body: formData,
        },
      );

      const responseData =
        (await response
          .json()
          .catch(() => null)) as
          | {
              message?: string;
            }
          | null;

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Unable to upload contractor documents.",
        );
      }

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload contractor documents.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="
          inline-flex
          min-h-11
          items-center
          justify-center
          rounded-xl
          bg-[var(--qoreva-violet)]
          px-4
          py-2.5
          text-sm
          font-black
          text-white
          shadow-sm
          transition-all
          duration-150
          hover:-translate-y-px
          hover:bg-[var(--qoreva-violet-hover)]
          hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
        "
      >
        + Add Document
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Add Contractor Document"
        eyebrow="Qoreva™ Contractor Documentation"
        onClose={closeModal}
        maxWidthClass="max-w-4xl"
      >
        <form
          onSubmit={handleSubmit}
        >
          <div
            className="
              space-y-6
              bg-[var(--qoreva-porcelain)]
              p-5
              sm:p-7
            "
          >
            {/* Contractor */}
            <div
              className="
                flex
                flex-col
                gap-4
                rounded-2xl
                border
                border-[var(--qoreva-border)]
                bg-white
                p-4
                shadow-[var(--qoreva-shadow-sm)]
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-[var(--qoreva-muted)]
                  "
                >
                  Contractor
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-black
                    tracking-[-0.02em]
                    text-[var(--qoreva-obsidian)]
                  "
                >
                  {contractorName}
                </p>
              </div>

              <span
                className="
                  inline-flex
                  self-start
                  rounded-full
                  border
                  border-[rgba(102,87,232,0.18)]
                  bg-[var(--qoreva-violet-soft)]
                  px-3
                  py-1
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.1em]
                  text-[var(--qoreva-violet-dark)]
                "
              >
                New Document
              </span>
            </div>

            {error ? (
              <div
                className="
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

            {/* 01 Document Details */}
            <DocumentSection
              number="01"
              title="Document Details"
              description="Classify the document and enter any applicable dates."
            >
              <div
                className="
                  grid
                  gap-5
                  sm:grid-cols-2
                "
              >
                <SelectField
                  label="Document Type"
                  value={documentType}
                  options={
                    documentTypeOptions
                  }
                  required
                  onChange={
                    setDocumentType
                  }
                />

                <TextField
                  label="Custom Document Name"
                  value={documentName}
                  onChange={
                    setDocumentName
                  }
                />

                <TextField
                  label="Effective Date"
                  type="date"
                  value={effectiveDate}
                  onChange={
                    setEffectiveDate
                  }
                />

                <TextField
                  label="Expiration Date"
                  type="date"
                  value={expirationDate}
                  onChange={
                    setExpirationDate
                  }
                />
              </div>
            </DocumentSection>

            {/* 02 Upload */}
            <DocumentSection
              number="02"
              title="Upload"
              description="Add one or more PDF or image files."
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
                          text-xs
                          font-black
                          text-white
                        "
                      >
                        AI
                      </span>

                      <p
                        className="
                          font-black
                          text-[var(--qoreva-obsidian)]
                        "
                      >
                        Qoreva™ Document
                        Intelligence
                      </p>
                    </div>

                    <p
                      className="
                        mt-3
                        max-w-2xl
                        text-sm
                        font-medium
                        leading-6
                        text-[var(--qoreva-muted)]
                      "
                    >
                      Qoreva can assist with
                      classifying contractor
                      documents and extracting
                      useful information such as
                      insurance details,
                      qualification data,
                      expiration dates, and
                      contacts.
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
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={
                  handleFileSelection
                }
                className="hidden"
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();

                    fileInputRef.current?.click();
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
                      fileInputRef.current?.click()
                    }
                    className="
                      mt-3
                      text-sm
                      font-black
                      text-[var(--qoreva-violet)]
                      transition
                      hover:text-[var(--qoreva-violet-dark)]
                    "
                  >
                    + Add more documents
                  </button>
                </div>
              ) : null}
            </DocumentSection>

            {/* 03 Notes & Review */}
            <DocumentSection
              number="03"
              title="Notes & Review"
              description="Add context for reviewers before the document enters the contractor record."
            >
              <textarea
                rows={4}
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                placeholder="Add document notes, qualification details, restrictions, or review instructions..."
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

                  hover:border-[#BBB6C6]

                  focus:border-[var(--qoreva-violet)]
                  focus:ring-4
                  focus:ring-[rgba(102,87,232,0.10)]
                "
              />

              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-[var(--qoreva-border)]
                  bg-[var(--qoreva-surface-muted)]
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    text-[var(--qoreva-obsidian)]
                  "
                >
                  Qualified review remains
                  required.
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-[var(--qoreva-muted)]
                  "
                >
                  AI-assisted classification
                  or extracted information
                  should be reviewed before
                  becoming part of the
                  official contractor record.
                </p>
              </div>
            </DocumentSection>
          </div>

          {/* Footer */}
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
              Document metadata and files
              will be saved to the
              contractor record.
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
                disabled={isUploading}
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
                disabled={isUploading}
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
                {isUploading
                  ? "Uploading Documents..."
                  : "Upload Documents"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

function DocumentSection({
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

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}