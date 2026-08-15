"use client";

import {
  FormEvent,
  ReactNode,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function AddCompanyModal() {
  const router = useRouter();
  const formRef =
    useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [isPending, setIsPending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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

    const formData = new FormData(
      event.currentTarget,
    );

    const payload = {
      name: formData.get("name"),
      companyType:
        formData.get("companyType"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zipCode: formData.get("zipCode"),
    };

    try {
      const response = await fetch(
        "/api/companies",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result =
        await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message ||
            "Unable to create company.",
        );

        return;
      }

      formRef.current?.reset();

      setIsOpen(false);

      router.refresh();
    } catch (error) {
      console.error(
        "Company submission failed:",
        error,
      );

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
        onClick={() => setIsOpen(true)}
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
          active:translate-y-0
        "
      >
        + Add Company
      </button>

      {isOpen ? (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-[rgba(17,18,22,0.72)]
            p-0
            backdrop-blur-[6px]
            sm:items-center
            sm:p-5
          "
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-company-title"
            className="
              max-h-[96vh]
              w-full
              max-w-2xl
              overflow-hidden
              rounded-t-[1.75rem]
              border
              border-white/10
              bg-[var(--qoreva-porcelain)]
              shadow-[var(--qoreva-shadow-lg)]
              sm:rounded-[1.75rem]
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div
              className="
                relative
                overflow-hidden
                border-b
                border-white/10
                bg-[var(--qoreva-obsidian)]
                px-5
                py-5
                text-white
                sm:px-7
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-10
                  -top-16
                  h-44
                  w-44
                  rounded-full
                  bg-[rgba(102,87,232,0.18)]
                  blur-3xl
                "
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-[var(--qoreva-violet)]
                      "
                      aria-hidden="true"
                    />

                    <p
                      className="
                        text-[11px]
                        font-black
                        uppercase
                        tracking-[0.18em]
                        text-[#B9B0FF]
                      "
                    >
                      Qoreva™ Companies
                    </p>
                  </div>

                  <h2
                    id="add-company-title"
                    className="
                      mt-1.5
                      text-xl
                      font-black
                      tracking-[-0.025em]
                      text-white
                      sm:text-2xl
                    "
                  >
                    Add Company
                  </h2>

                  <p
                    className="
                      mt-1.5
                      max-w-xl
                      text-sm
                      font-medium
                      leading-5
                      text-white/60
                    "
                  >
                    Add an owner, general
                    contractor, specialty
                    contractor, supplier,
                    consultant, or project
                    partner.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  aria-label="Close modal"
                  className="
                    inline-flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.06]
                    text-xl
                    font-medium
                    text-white
                    transition-all
                    duration-150
                    hover:border-white/20
                    hover:bg-white/[0.12]
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  ×
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="
                max-h-[calc(96vh-118px)]
                overflow-y-auto
              "
            >
              <div
                className="
                  space-y-6
                  p-5
                  sm:p-7
                "
              >
                <section>
                  <div
                    className="
                      flex
                      items-center
                      gap-2.5
                      border-b
                      border-[var(--qoreva-border)]
                      pb-4
                    "
                  >
                    <span
                      className="
                        h-5
                        w-1
                        rounded-full
                        bg-[var(--qoreva-violet)]
                      "
                      aria-hidden="true"
                    />

                    <div>
                      <h3
                        className="
                          text-lg
                          font-black
                          tracking-[-0.02em]
                          text-[var(--qoreva-obsidian)]
                        "
                      >
                        Company Information
                      </h3>

                      <p
                        className="
                          mt-1
                          text-sm
                          font-medium
                          text-[var(--qoreva-muted)]
                        "
                      >
                        Enter the organization&apos;s
                        primary information.
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-5
                      grid
                      gap-5
                      sm:grid-cols-2
                    "
                  >
                    <Field
                      label="Company Name"
                      required
                    >
                      <input
                        name="name"
                        type="text"
                        required
                        autoFocus
                        placeholder="Example Construction Company"
                        className={
                          inputClassName
                        }
                      />
                    </Field>

                    <Field
                      label="Company Type"
                      required
                    >
                      <select
                        name="companyType"
                        required
                        defaultValue=""
                        className={
                          inputClassName
                        }
                      >
                        <option
                          value=""
                          disabled
                        >
                          Select company type
                        </option>

                        <option value="Owner">
                          Owner
                        </option>

                        <option value="General Contractor">
                          General Contractor
                        </option>

                        <option value="Specialty Contractor">
                          Specialty Contractor
                        </option>

                        <option value="Supplier">
                          Supplier
                        </option>

                        <option value="Consultant">
                          Consultant
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </Field>

                    <Field label="Email">
                      <input
                        name="email"
                        type="email"
                        placeholder="contact@example.com"
                        className={
                          inputClassName
                        }
                      />
                    </Field>

                    <Field label="Phone">
                      <input
                        name="phone"
                        type="tel"
                        placeholder="(555) 555-5555"
                        className={
                          inputClassName
                        }
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Address">
                        <input
                          name="address"
                          type="text"
                          placeholder="Street address"
                          className={
                            inputClassName
                          }
                        />
                      </Field>
                    </div>

                    <Field label="City">
                      <input
                        name="city"
                        type="text"
                        placeholder="City"
                        className={
                          inputClassName
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="State">
                        <input
                          name="state"
                          type="text"
                          maxLength={2}
                          placeholder="MI"
                          className={
                            inputClassName
                          }
                        />
                      </Field>

                      <Field label="ZIP Code">
                        <input
                          name="zipCode"
                          type="text"
                          placeholder="48917"
                          className={
                            inputClassName
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                {errorMessage ? (
                  <div
                    role="alert"
                    className="
                      rounded-xl
                      border
                      border-[#F0BDC4]
                      bg-[var(--qoreva-danger-soft)]
                      px-4
                      py-3
                      text-sm
                      font-bold
                      text-[var(--qoreva-danger)]
                    "
                  >
                    {errorMessage}
                  </div>
                ) : null}
              </div>

              {/* Footer Actions */}
              <div
                className="
                  sticky
                  bottom-0
                  flex
                  flex-col-reverse
                  gap-3
                  border-t
                  border-[var(--qoreva-border)]
                  bg-[rgba(255,255,255,0.96)]
                  px-5
                  py-4
                  backdrop-blur
                  sm:flex-row
                  sm:justify-end
                  sm:px-7
                "
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="
                    inline-flex
                    min-h-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[var(--qoreva-border-strong)]
                    bg-white
                    px-5
                    py-2.5
                    text-sm
                    font-black
                    text-[var(--qoreva-text)]
                    transition-all
                    duration-150
                    hover:border-[#BBB6C6]
                    hover:bg-[var(--qoreva-surface-muted)]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="
                    inline-flex
                    min-h-11
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
                    duration-150
                    hover:-translate-y-px
                    hover:bg-[var(--qoreva-violet-hover)]
                    hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    disabled:hover:translate-y-0
                  "
                >
                  {isPending
                    ? "Saving..."
                    : "Save Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
      <span
        className="
          mb-2
          flex
          items-center
          gap-1
          text-sm
          font-bold
          text-[var(--qoreva-text)]
        "
      >
        {label}

        {required ? (
          <span
            className="text-[var(--qoreva-danger)]"
            aria-hidden="true"
          >
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}

const inputClassName = `
  min-h-12
  w-full
  rounded-xl
  border
  border-[var(--qoreva-border-strong)]
  bg-white
  px-4
  py-3
  text-sm
  font-medium
  text-[var(--qoreva-ink)]
  shadow-[0_1px_2px_rgba(17,18,22,0.02)]
  outline-none
  transition-all
  duration-150

  placeholder:text-[var(--qoreva-subtle)]

  hover:border-[#BBB6C6]

  focus:border-[var(--qoreva-violet)]
  focus:ring-4
  focus:ring-[rgba(102,87,232,0.10)]

  disabled:cursor-not-allowed
  disabled:bg-[var(--qoreva-surface-muted)]
  disabled:text-[var(--qoreva-muted)]
`;