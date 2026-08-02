"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

export type EditableCompany = {
  id: string;
  name: string;
  companyType: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isActive: boolean;
};

type EditCompanyModalProps = {
  company: EditableCompany;
};

export default function EditCompanyModal({
  company,
}: EditCompanyModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function openModal() {
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeModal() {
    if (!isPending) {
      setErrorMessage("");
      setIsOpen(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsPending(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: formData.get("name"),
      companyType: formData.get("companyType"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
      isActive: formData.get("isActive") === "true",
    };

    try {
      const response = await fetch(
        `/api/companies/${company.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message || "Unable to update the company.",
        );
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Company update failed:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-sm font-medium text-cyan-700 hover:text-cyan-900 hover:underline"
      >
        Edit
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-company-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="edit-company-title"
                  className="text-xl font-bold text-slate-950"
                >
                  Edit Company
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update company information and status.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Close modal"
                className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company Name" required>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={company.name}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Company Type" required>
                  <select
                    name="companyType"
                    required
                    defaultValue={company.companyType}
                    className={inputClassName}
                  >
                    <option value="Owner">Owner</option>
                    <option value="General Contractor">
                      General Contractor
                    </option>
                    <option value="Specialty Contractor">
                      Specialty Contractor
                    </option>
                    <option value="Supplier">Supplier</option>
                    <option value="Consultant">
                      Consultant
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Email">
                  <input
                    name="email"
                    type="email"
                    defaultValue={company.email ?? ""}
                    className={inputClassName}
                  />
                </Field>

                <Field label="Phone">
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={company.phone ?? ""}
                    className={inputClassName}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Address">
                    <input
                      name="address"
                      type="text"
                      defaultValue={company.address ?? ""}
                      className={inputClassName}
                    />
                  </Field>
                </div>

                <Field label="City">
                  <input
                    name="city"
                    type="text"
                    defaultValue={company.city ?? ""}
                    className={inputClassName}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="State">
                    <input
                      name="state"
                      type="text"
                      maxLength={2}
                      defaultValue={company.state ?? ""}
                      className={inputClassName}
                    />
                  </Field>

                  <Field label="ZIP Code">
                    <input
                      name="zipCode"
                      type="text"
                      defaultValue={company.zipCode ?? ""}
                      className={inputClassName}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Status">
                    <select
                      name="isActive"
                      defaultValue={String(company.isActive)}
                      className={inputClassName}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </Field>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-600">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";