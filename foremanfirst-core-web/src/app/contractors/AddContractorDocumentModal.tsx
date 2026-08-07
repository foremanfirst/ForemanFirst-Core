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
  FormSection,
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

  const [isOpen, setIsOpen] = useState(false);
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

  const [notes, setNotes] = useState("");

  const [selectedDocuments, setSelectedDocuments] =
    useState<File[]>([]);

  const [error, setError] = useState("");
  const [documentError, setDocumentError] =
    useState("");

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

  function addDocuments(files: File[]) {
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
        ALLOWED_DOCUMENT_TYPES.includes(file.type);

      if (!allowedExtension && !allowedMimeType) {
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

      if (file.size > MAX_DOCUMENT_SIZE) {
        rejectedFiles.push(
          `${file.name} — exceeds 20 MB`,
        );

        continue;
      }

      acceptedFiles.push(file);
    }

    setSelectedDocuments((currentFiles) => {
      const combinedFiles = [
        ...currentFiles,
        ...acceptedFiles,
      ];

      return combinedFiles.filter(
        (file, index, allFiles) =>
          index ===
          allFiles.findIndex(
            (candidate) =>
              candidate.name === file.name &&
              candidate.size === file.size &&
              candidate.lastModified ===
                file.lastModified,
          ),
      );
    });

    if (rejectedFiles.length > 0) {
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

  function removeDocument(indexToRemove: number) {
    setSelectedDocuments((currentFiles) =>
      currentFiles.filter(
        (_, index) => index !== indexToRemove,
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
      setError("Select a document type.");
      return;
    }

    if (selectedDocuments.length === 0) {
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
      const formData = new FormData();

      formData.append(
        "contractorId",
        contractorId,
      );

      if (projectId) {
        formData.append("projectId", projectId);
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

      for (const file of selectedDocuments) {
        formData.append("files", file);
      }

      const response = await fetch(
        "/api/contractor-documents",
        {
          method: "POST",
          body: formData,
        },
      );

      const responseData = (await response
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
        className="inline-flex items-center justify-center rounded-xl bg-[#00C2FF] px-4 py-2.5 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300"
      >
        + Add Document
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Add Contractor Document"
        eyebrow="Contractor Documentation"
        onClose={closeModal}
        maxWidthClass="max-w-4xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-7 p-5 sm:p-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Contractor
              </p>

              <p className="mt-1 font-black text-slate-950">
                {contractorName}
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <FormSection
              title="Document Information"
              description="Classify the document and enter any applicable dates."
            >
              <SelectField
                label="Document Type"
                value={documentType}
                options={documentTypeOptions}
                required
                onChange={setDocumentType}
              />

              <TextField
                label="Custom Document Name"
                value={documentName}
                onChange={setDocumentName}
              />

              <TextField
                label="Effective Date"
                type="date"
                value={effectiveDate}
                onChange={setEffectiveDate}
              />

              <TextField
                label="Expiration Date"
                type="date"
                value={expirationDate}
                onChange={setExpirationDate}
              />
            </FormSection>

            <FormSection
              title="Upload Documents"
              description="Upload one or more PDF or image files."
            >
              <div className="col-span-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileSelection}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();

                      fileInputRef.current?.click();
                    }
                  }}
                  onDrop={handleDocumentDrop}
                  onDragOver={
                    handleDocumentDragOver
                  }
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/40 px-6 py-8 text-center transition hover:border-cyan-400 hover:bg-cyan-50"
                >
                  <p className="font-black text-slate-800">
                    Drop contractor documents here
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    or click to select files
                  </p>

                  <p className="mt-3 text-xs font-bold text-slate-400">
                    PDF, JPG, JPEG, or PNG • Maximum
                    20 MB per file
                  </p>
                </div>

                {documentError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {documentError}
                  </div>
                ) : null}

                {selectedDocuments.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-slate-800">
                        Selected Documents
                      </p>

                      <p className="text-xs font-bold text-slate-500">
                        {selectedDocuments.length}{" "}
                        {selectedDocuments.length === 1
                          ? "document"
                          : "documents"}
                      </p>
                    </div>

                    {selectedDocuments.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-800">
                              {file.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatFileSize(
                                file.size,
                              )}
                            </p>
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
                        fileInputRef.current?.click()
                      }
                      className="text-sm font-black text-cyan-700 transition hover:text-cyan-900"
                    >
                      + Add more documents
                    </button>
                  </div>
                ) : null}
              </div>
            </FormSection>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-800">
                Notes
              </label>

              <textarea
                rows={4}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Add document notes, qualification details, restrictions, or review instructions."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3">
              <p className="text-sm font-black text-slate-800">
                ForemanFirst™ Document Intelligence
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Uploaded documentation will later be
                classified and analyzed for important
                contractor information. Extracted values
                will require user review before becoming
                official records.
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={closeModal}
              disabled={isUploading}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading
                ? "Uploading Documents..."
                : "Upload Documents"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}