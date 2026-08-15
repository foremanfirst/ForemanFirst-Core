"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import {
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
  {
    label: "Not Required",
    value: "Not Required",
  },
] as const;

const complianceOptions = [
  { label: "Pending", value: "Pending" },
  {
    label: "Compliant",
    value: "Compliant",
  },
  {
    label: "Action Required",
    value: "Action Required",
  },
  { label: "Expired", value: "Expired" },
] as const;

const approvalOptions = [
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  {
    label: "Conditional",
    value: "Conditional",
  },
  { label: "Rejected", value: "Rejected" },
] as const;

type EditContractorModalProps =
  ContractorModalProps & {
    contractor: ContractorRecord;
  };

export default function EditContractorModal({
  contractor,
  companies,
  projects,
}: EditContractorModalProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const [form, setForm] =
    useState<ContractorFormData>(
      contractorToFormData(contractor),
    );

  const [error, setError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const filteredProjects =
    useMemo(() => {
      if (!form.companyId) {
        return projects;
      }

      return projects.filter(
        (project) =>
          project.companyId ===
          form.companyId,
      );
    }, [
      form.companyId,
      projects,
    ]);

  function openModal() {
    setForm(
      contractorToFormData(
        contractor,
      ),
    );

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!form.companyId) {
      setError(
        "Select a company before saving the contractor.",
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
      await updateContractor(
        contractor.id,
        {
          companyId:
            form.companyId,

          projectId:
            form.projectId ||
            null,

          name:
            form.name,

          legalName:
            form.legalName ||
            null,

          contractorCode:
            form.contractorCode ||
            null,

          trade:
            form.trade ||
            null,

          specialty:
            form.specialty ||
            null,

          description:
            form.description ||
            null,

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
            form.address ||
            null,

          city:
            form.city ||
            null,

          state:
            form.state ||
            null,

          zipCode:
            form.zipCode ||
            null,

          workforceCount: Number(
            form.workforceCount ||
              0,
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

          isActive:
            form.isActive,
        },
      );

      setIsOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
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

    ...companies.map(
      (company) => ({
        label: `${company.name} — ${company.companyType}`,
        value: company.id,
      }),
    ),
  ];

  const projectOptions = [
    {
      label:
        "No project assignment",
      value: "",
    },

    ...filteredProjects.map(
      (project) => ({
        label:
          project.projectCode
            ? `${project.name} — ${project.projectCode}`
            : project.name,

        value: project.id,
      }),
    ),
  ];

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="
          text-sm
          font-black
          text-[var(--qoreva-text)]
          transition
          hover:text-[var(--qoreva-violet)]
          hover:underline
        "
      >
        Edit
      </button>

      <ModalShell
        isOpen={isOpen}
        title="Edit Contractor"
        eyebrow="Qoreva™ Contractor Management"
        onClose={closeModal}
        maxWidthClass="max-w-6xl"
      >
        <form
          onSubmit={handleSubmit}
        >
          <div
            className="
              bg-[var(--qoreva-porcelain)]
              p-5
              sm:p-7
            "
          >
            {/* Contractor Identity */}
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
                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[var(--qoreva-obsidian)]
                      text-sm
                      font-black
                      text-[#B9B0FF]
                    "
                  >
                    {getInitials(
                      contractor.name,
                    )}
                  </div>

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
                      Contractor Record
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
                      {contractor.name}
                    </h3>

                    <p
                      className="
                        mt-0.5
                        text-sm
                        font-medium
                        text-[var(--qoreva-muted)]
                      "
                    >
                      Update contractor
                      information and
                      readiness.
                    </p>
                  </div>
                </div>

                <span
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

                  Editing
                </span>
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
                description="Update company relationship, project assignment, trade, and workforce."
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
                    label="Connected Company"
                    value={
                      form.companyId
                    }
                    options={
                      companyOptions
                    }
                    required
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "companyId",
                        value,
                      )
                    }
                  />

                  <SelectField
                    label="Project Assignment"
                    value={
                      form.projectId
                    }
                    options={
                      projectOptions
                    }
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "name",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Trade"
                    value={form.trade}
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "workforceCount",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Specialty"
                    value={
                      form.specialty
                    }
                    onChange={(
                      value,
                    ) =>
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
                      value={
                        form.legalName
                      }
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                description="Maintain the contractor's administrative and safety contacts."
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
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                      onChange={(
                        value,
                      ) =>
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
                      value={
                        form.address
                      }
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "address",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="City"
                      value={form.city}
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "city",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="State"
                      value={form.state}
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "state",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="ZIP Code"
                      value={
                        form.zipCode
                      }
                      onChange={(
                        value,
                      ) =>
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
                description="Update safety performance and insurance information used for readiness."
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
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
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
                    Contractor documents
                    are managed from View
                    Contractor so review,
                    history, replacement,
                    and approval remain in
                    one workflow.
                  </p>
                </div>
              </QorevaSection>

              {/* 04 Readiness */}
              <QorevaSection
                number="04"
                title="Readiness"
                description="Update orientation, compliance, approval, and active operating status."
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
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
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
                    onChange={(
                      value,
                    ) =>
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
                    checked={
                      form.isActive
                    }
                    onChange={(
                      event,
                    ) =>
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

              {/* 05 Notes */}
              <QorevaSection
                number="05"
                title="Notes"
                description="Maintain contractor scope, qualifications, or other operational information."
              >
                <textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "description",
                      event.target
                        .value,
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

                    hover:border-[#BBB6C6]

                    focus:border-[var(--qoreva-violet)]
                    focus:ring-4
                    focus:ring-[rgba(102,87,232,0.10)]
                  "
                />
              </QorevaSection>
            </div>
          </div>

          {/* Sticky Footer */}
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
              Changes update the
              contractor record after
              saving.
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
                onClick={
                  closeModal
                }
                disabled={
                  isSubmitting
                }
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
                disabled={
                  isSubmitting
                }
                className="
                  inline-flex
                  min-h-11
                  min-w-48
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
                  ? "Saving Changes..."
                  : "Save Changes"}
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
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[var(--qoreva-border)]
        bg-white
        shadow-[var(--qoreva-shadow-sm)]
      "
    >
      <div
        className="
          flex
          items-start
          gap-4
          border-b
          border-[var(--qoreva-border)]
          bg-[var(--qoreva-surface-muted)]
          px-5
          py-4
          sm:px-6
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

function getInitials(
  name: string,
) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word[0]?.toUpperCase() ??
          "",
      )
      .join("") || "CT"
  );
}