"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
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

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

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
    useRef<HTMLInputElement | null>(
      null,
    );

  const [isOpen, setIsOpen] =
    useState(false);

  const [isReplacing, setIsReplacing] =
    useState(false);

  const [
    replacementFile,
    setReplacementFile,
  ] = useState<File | null>(null);

  const [
    replacementName,
    setReplacementName,
  ] = useState(documentName);

  const [
    replacementEffectiveDate,
    setReplacementEffectiveDate,
  ] = useState(
    formatDateForInput(
      effectiveDate,
    ),
  );

  const [
    replacementExpirationDate,
    setReplacementExpirationDate,
  ] = useState(
    formatDateForInput(
      expirationDate,
    ),
  );

  const [
    replacementNotes,
    setReplacementNotes,
  ] = useState(notes ?? "");

  const [error, setError] =
    useState("");

  const [fileError, setFileError] =
    useState("");

  function openModal() {
    setReplacementFile(null);

    setReplacementName(
      documentName,
    );

    setReplacementEffectiveDate(
      formatDateForInput(
        effectiveDate,
      ),
    );

    setReplacementExpirationDate(
      formatDateForInput(
        expirationDate,
      ),
    );

    setReplacementNotes(
      notes ?? "",
    );

    setError("");
    setFileError("");
    setIsOpen(true);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
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

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  function handleFileSelection(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    setFileError("");

    const file =
      event.target.files?.[0] ??
      null;

    event.target.value = "";

    if (!file) {
      return;
    }

    const extension = file.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const validExtension =
      ALLOWED_EXTENSIONS.includes(
        extension ?? "",
      );

    const validMimeType =
      ALLOWED_MIME_TYPES.includes(
        file.type,
      );

    if (
      !validExtension &&
      !validMimeType
    ) {
      setFileError(
        `${file.name} is not a supported document type.`,
      );

      return;
    }

    if (file.size <= 0) {
      setFileError(
        `${file.name} is empty.`,
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setFileError(
        `${file.name} exceeds the 20 MB file-size limit.`,
      );

      return;
    }

    setReplacementFile(file);
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
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
      const formData =
        new FormData();

      formData.append(
        "file",
        replacementFile,
      );

      if (
        replacementName.trim()
      ) {
        formData.append(
          "documentName",
          replacementName.trim(),
        );
      }

      if (
        replacementEffectiveDate
      ) {
        formData.append(
          "effectiveDate",
          replacementEffectiveDate,
        );
      }

      if (
        replacementExpirationDate
      ) {
        formData.append(
          "expirationDate",
          replacementExpirationDate,
        );
      }

      if (
        replacementNotes.trim()
      ) {
        formData.append(
          "notes",
          replacementNotes.trim(),
        );
      }

      const response =
        await fetch(
          `/api/contractor-documents/${documentId}/replace`,
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
            "Unable to replace the contractor document.",
        );
      }

      setIsOpen(false);
      setReplacementFile(null);

      router.refresh();
    } catch (replaceError) {
      setError(
        replaceError instanceof
          Error
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
        className="
          inline-flex
          items-center
          justify-center
          rounded-xl
          border
          border-[rgba(102,87,232,0.22)]
          bg-white
          px-4
          py-2
          text-xs
          font-black
          text-[var(--qoreva-violet-dark)]
          transition-all
          duration-150
          hover:border-[var(--qoreva-violet)]
          hover:bg-[var(--qoreva-violet-faint)]
        "
      >
        Replace
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Replace Contractor Document"
        eyebrow="Qoreva™ Document Versioning"
        onClose={closeModal}
        maxWidthClass="max-w-3xl"
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
            {/* Current version */}
            <section
              className="
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
                  gap-3
                  sm:flex-row
                  sm:items-start
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
                    Current Version
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
                    {documentName}
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-[var(--qoreva-muted)]
                    "
                  >
                    {documentType ||
                      "Other"}
                  </p>
                </div>

                <span
                  className="
                    inline-flex
                    self-start
                    rounded-full
                    border
                    border-[var(--qoreva-border)]
                    bg-[var(--qoreva-surface-muted)]
                    px-3
                    py-1
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-[var(--qoreva-muted)]
                  "
                >
                  Active Version
                </span>
              </div>
            </section>

            {/* Versioning warning */}
            <section
              className="
                rounded-2xl
                border
                border-[#F0D5A4]
                bg-[var(--qoreva-warning-soft)]
                p-4
              "
            >
              <div
                className="
                  flex
                  items-start
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
                    bg-white/70
                    text-[#9B6212]
                  "
                >
                  <VersionIcon />
                </div>

                <div>
                  <p
                    className="
                      text-sm
                      font-black
                      text-[#9B6212]
                    "
                  >
                    A new document
                    version will be
                    created.
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      font-medium
                      leading-5
                      text-[#9B6212]
                    "
                  >
                    The replacement will
                    become the active
                    version. The current
                    document will be
                    archived and preserved
                    in the Qoreva audit
                    trail.
                  </p>
                </div>
              </div>
            </section>

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

            {/* 01 Replacement details */}
            <VersionSection
              number="01"
              title="Replacement Details"
              description="Update the metadata that should apply to the new active version."
            >
              <div
                className="
                  grid
                  gap-5
                  sm:grid-cols-2
                "
              >
                <div className="sm:col-span-2">
                  <TextField
                    label="Document Name"
                    value={
                      replacementName
                    }
                    onChange={
                      setReplacementName
                    }
                  />
                </div>

                <TextField
                  label="Effective Date"
                  type="date"
                  value={
                    replacementEffectiveDate
                  }
                  onChange={
                    setReplacementEffectiveDate
                  }
                />

                <TextField
                  label="Expiration Date"
                  type="date"
                  value={
                    replacementExpirationDate
                  }
                  onChange={
                    setReplacementExpirationDate
                  }
                />
              </div>
            </VersionSection>

            {/* 02 Replacement file */}
            <VersionSection
              number="02"
              title="Replacement File"
              description="Select the new PDF or image that will become the active version."
              highlight
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={
                  handleFileSelection
                }
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="
                  w-full
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
                <span
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
                </span>

                <span
                  className="
                    mt-4
                    block
                    text-base
                    font-black
                    text-[var(--qoreva-obsidian)]
                  "
                >
                  Select replacement
                  document
                </span>

                <span
                  className="
                    mt-1
                    block
                    text-sm
                    font-medium
                    text-[var(--qoreva-muted)]
                  "
                >
                  PDF, JPG, JPEG or PNG
                </span>

                <span
                  className="
                    mt-3
                    block
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-[var(--qoreva-subtle)]
                  "
                >
                  Maximum 20 MB
                </span>
              </button>

              {fileError ? (
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
                  {fileError}
                </div>
              ) : null}

              {replacementFile ? (
                <div
                  className="
                    mt-4
                    flex
                    items-center
                    gap-3
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
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--qoreva-violet-soft)]
                      text-[var(--qoreva-violet-dark)]
                    "
                  >
                    <DocumentIcon />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="
                        break-words
                        text-sm
                        font-black
                        text-[var(--qoreva-text)]
                      "
                    >
                      {
                        replacementFile.name
                      }
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
                        replacementFile.size,
                      )}
                    </p>
                  </div>
                </div>
              ) : null}
            </VersionSection>

            {/* 03 Notes */}
            <VersionSection
              number="03"
              title="Notes"
              description="Record renewal details, replacement context, or review instructions."
            >
              <textarea
                rows={4}
                value={
                  replacementNotes
                }
                onChange={(event) =>
                  setReplacementNotes(
                    event.target.value,
                  )
                }
                placeholder="Add replacement notes, renewal details, or review instructions..."
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
            </VersionSection>
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
              The previous version
              remains available in
              Document History.
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
                disabled={isReplacing}
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
                disabled={isReplacing}
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
                {isReplacing
                  ? "Replacing Document..."
                  : "Replace Document"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>
    </>
  );
}

function VersionSection({
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

function VersionIcon() {
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
        d="M7 7h8.5a4.5 4.5 0 0 1 0 9H13"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 4-3 3 3 3M17 20l3-3-3-3"
      />
    </svg>
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

function formatDateForInput(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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