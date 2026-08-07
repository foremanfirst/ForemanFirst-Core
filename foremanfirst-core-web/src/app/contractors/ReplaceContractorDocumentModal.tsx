"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  FormSection,
  ModalShell,
  TextField,
} from "@/components";

type ReplaceContractorDocumentModalProps = {
  documentId: string;
  documentName: string;
  documentType: string;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
];

export default function ReplaceContractorDocumentModal({
  documentId,
  documentName,
  documentType,
  effectiveDate = null,
  expirationDate = null,
  notes = null,
}: ReplaceContractorDocumentModalProps) {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isReplacing, setIsReplacing] =
    useState(false);

  const [replacementFile, setReplacementFile] =
    useState<File | null>(null);

  const [replacementName, setReplacementName] =
    useState(documentName);

  const [replacementEffectiveDate, setReplacementEffectiveDate] =
    useState(formatDateForInput(effectiveDate));

  const [replacementExpirationDate, setReplacementExpirationDate] =
    useState(formatDateForInput(expirationDate));

  const [replacementNotes, setReplacementNotes] =
    useState(notes ?? "");

  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  function openModal() {
    setReplacementFile(null);
    setReplacementName(documentName);
    setReplacementEffectiveDate(
      formatDateForInput(effectiveDate),
    );
    setReplacementExpirationDate(
      formatDateForInput(expirationDate),
    );
    setReplacementNotes(notes ?? "");
    setError("");
    setFileError("");
    setIsOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function closeModal() {
    if (isReplacing) {
      return;
    }

    setIsOpen(false);
    setReplacementFile(null);
    setError("");
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setFileError("");

    const file = event.target.files?.[0] ?? null;

    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const validExtension =
      ALLOWED_EXTENSIONS.includes(extension ?? "");

    const validMimeType =
      ALLOWED_MIME_TYPES.includes(file.type);

    if (!validExtension && !validMimeType) {
      setFileError(
        `${file.name} is not a supported document type.`,
      );
      return;
    }

    if (file.size <= 0) {
      setFileError(`${file.name} is empty.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `${file.name} exceeds the 20 MB file-size limit.`,
      );
      return;
    }

    setReplacementFile(file);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setFileError("");

    if (!replacementFile) {
      setError(
        "Select one replacement document.",
      );
      return;
    }

    if (
      replacementEffectiveDate &&
      replacementExpirationDate &&
      replacementExpirationDate <
        replacementEffectiveDate
    ) {
      setError(
        "Expiration date cannot be before the effective date.",
      );
      return;
    }

    setIsReplacing(true);

    try {
      const formData = new FormData();

      formData.append("file", replacementFile);

      if (replacementName.trim()) {
        formData.append(
          "documentName",
          replacementName.trim(),
        );
      }

      if (replacementEffectiveDate) {
        formData.append(
          "effectiveDate",
          replacementEffectiveDate,
        );
      }

      if (replacementExpirationDate) {
        formData.append(
          "expirationDate",
          replacementExpirationDate,
        );
      }

      if (replacementNotes.trim()) {
        formData.append(
          "notes",
          replacementNotes.trim(),
        );
      }

      const response = await fetch(
        `/api/contractor-documents/${documentId}/replace`,
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
            "Unable to replace the contractor document.",
        );
      }

      setIsOpen(false);
      setReplacementFile(null);

      router.refresh();
    } catch (replaceError) {
      setError(
        replaceError instanceof Error
          ? replaceError.message
          : "Unable to replace the contractor document.",
      );
    } finally {
      setIsReplacing(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center rounded-xl border border-cyan-200 bg-white px-4 py-2 text-xs font-black text-cyan-800 transition hover:bg-cyan-50"
      >
        Replace
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Replace Contractor Document"
        eyebrow="Document Versioning"
        onClose={closeModal}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-7 p-5 sm:p-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Current Document
              </p>

              <p className="mt-1 font-black text-slate-950">
                {documentName}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {documentType || "Other"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-black text-amber-900">
                The current document will be archived.
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                The replacement will become the active
                version. The previous document will remain
                preserved for audit history.
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : null}

            <FormSection
              title="Replacement Information"
              description="Update the document name and dates for the new version."
            >
              <TextField
                label="Document Name"
                value={replacementName}
                onChange={setReplacementName}
              />

              <TextField
                label="Effective Date"
                type="date"
                value={replacementEffectiveDate}
                onChange={
                  setReplacementEffectiveDate
                }
              />

              <TextField
                label="Expiration Date"
                type="date"
                value={replacementExpirationDate}
                onChange={
                  setReplacementExpirationDate
                }
              />
            </FormSection>

            <FormSection
              title="Replacement File"
              description="Select one PDF or image file."
            >
              <div className="col-span-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileSelection}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="w-full rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/40 px-6 py-8 text-center transition hover:border-cyan-400 hover:bg-cyan-50"
                >
                  <span className="block font-black text-slate-800">
                    Select replacement document
                  </span>

                  <span className="mt-1 block text-sm text-slate-500">
                    PDF, JPG, JPEG, or PNG
                  </span>

                  <span className="mt-3 block text-xs font-bold text-slate-400">
                    Maximum 20 MB
                  </span>
                </button>

                {fileError ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {fileError}
                  </div>
                ) : null}

                {replacementFile ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="break-words text-sm font-black text-slate-800">
                      {replacementFile.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(
                        replacementFile.size,
                      )}
                    </p>
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
                value={replacementNotes}
                onChange={(event) =>
                  setReplacementNotes(
                    event.target.value,
                  )
                }
                placeholder="Add replacement notes, renewal details, or review instructions."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={closeModal}
              disabled={isReplacing}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isReplacing}
              className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReplacing
                ? "Replacing Document..."
                : "Replace Document"}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

function formatDateForInput(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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