"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type CompanyDetails = {
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
  projectCount: number;
};

type ViewCompanyModalProps = {
  company: CompanyDetails;
};

export default function ViewCompanyModal({
  company,
}: ViewCompanyModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const fullAddress = [
    company.address,
    company.city,
    company.state,
    company.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

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
        View
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
            aria-labelledby="view-company-title"
            className="
              max-h-[96vh]
              w-full
              max-w-3xl
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
            {/* Header */}
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
                sm:py-6
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  -right-12
                  -top-20
                  h-52
                  w-52
                  rounded-full
                  bg-[rgba(102,87,232,0.18)]
                  blur-3xl
                "
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-5">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className="
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/10
                      bg-[rgba(102,87,232,0.18)]
                      text-[#B9B0FF]
                    "
                  >
                    <BuildingIcon />
                  </div>

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
                      id="view-company-title"
                      className="
                        mt-1.5
                        break-words
                        text-2xl
                        font-black
                        tracking-[-0.035em]
                        text-white
                        sm:text-3xl
                      "
                    >
                      {company.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className="
                          inline-flex
                          rounded-full
                          border
                          border-white/10
                          bg-white/[0.07]
                          px-3
                          py-1
                          text-xs
                          font-black
                          text-white/75
                        "
                      >
                        {company.companyType}
                      </span>

                      <span
                        className={
                          company.isActive
                            ? `
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              border
                              border-[#BDE8D4]
                              bg-[var(--qoreva-success-soft)]
                              px-3
                              py-1
                              text-xs
                              font-black
                              text-[var(--qoreva-success)]
                            `
                            : `
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              border
                              border-white/10
                              bg-white/[0.07]
                              px-3
                              py-1
                              text-xs
                              font-black
                              text-white/60
                            `
                        }
                      >
                        <span
                          className={
                            company.isActive
                              ? "h-1.5 w-1.5 rounded-full bg-[var(--qoreva-success)]"
                              : "h-1.5 w-1.5 rounded-full bg-white/40"
                          }
                          aria-hidden="true"
                        />

                        {company.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeModal}
                  aria-label="Close company details"
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
                  "
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="
                max-h-[calc(96vh-140px)]
                overflow-y-auto
                px-5
                py-6
                sm:px-7
                sm:py-7
              "
            >
              <div className="space-y-7">
                <section>
                  <SectionHeading>
                    Contact Information
                  </SectionHeading>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailCard
                      label="Email"
                      value={
                        company.email ||
                        "No email entered"
                      }
                    />

                    <DetailCard
                      label="Phone"
                      value={
                        company.phone ||
                        "No phone entered"
                      }
                    />
                  </div>
                </section>

                <section>
                  <SectionHeading>
                    Company Address
                  </SectionHeading>

                  <div
                    className="
                      mt-4
                      rounded-2xl
                      border
                      border-[var(--qoreva-border)]
                      bg-white
                      p-5
                      shadow-[var(--qoreva-shadow-sm)]
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-[var(--qoreva-violet-soft)]
                          text-[var(--qoreva-violet-dark)]
                        "
                      >
                        <LocationIcon />
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--qoreva-muted)]">
                          Address
                        </p>

                        <p className="mt-1 font-black leading-6 text-[var(--qoreva-obsidian)]">
                          {fullAddress ||
                            "No address entered"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeading>
                    Connected Records
                  </SectionHeading>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailCard
                      label="Projects"
                      value={String(
                        company.projectCount,
                      )}
                      accent
                    />

                    <DetailCard
                      label="Company Status"
                      value={
                        company.isActive
                          ? "Active"
                          : "Inactive"
                      }
                    />
                  </div>
                </section>

                <div
                  className="
                    flex
                    justify-end
                    border-t
                    border-[var(--qoreva-border)]
                    pt-5
                  "
                >
                  <button
                    type="button"
                    onClick={closeModal}
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
                      active:translate-y-0
                    "
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SectionHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="
          h-5
          w-1
          rounded-full
          bg-[var(--qoreva-violet)]
        "
        aria-hidden="true"
      />

      <p
        className="
          text-sm
          font-black
          tracking-[-0.01em]
          text-[var(--qoreva-obsidian)]
        "
      >
        {children}
      </p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border
        bg-white
        p-5
        shadow-[var(--qoreva-shadow-sm)]
        ${
          accent
            ? "border-[rgba(102,87,232,0.20)]"
            : "border-[var(--qoreva-border)]"
        }
      `}
    >
      {accent ? (
        <div
          className="
            absolute
            inset-y-0
            left-0
            w-[3px]
            bg-[var(--qoreva-violet)]
          "
          aria-hidden="true"
        />
      ) : null}

      <p
        className="
          text-[10px]
          font-black
          uppercase
          tracking-[0.12em]
          text-[var(--qoreva-muted)]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          break-words
          font-black
          text-[var(--qoreva-obsidian)]
        "
      >
        {value}
      </p>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M17 9h3v12M8 7h2M13 7h1M8 11h2M13 11h1M8 15h2M13 15h1M3 21h18"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-[18px] w-[18px]"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
      />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}