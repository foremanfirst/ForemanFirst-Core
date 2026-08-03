"use client";

import { useEffect, useRef, useState } from "react";

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
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
        className="font-semibold text-slate-600 transition hover:text-cyan-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
      >
        View
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-company-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-7 sm:px-8">
              <div className="flex items-start justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <BuildingIcon />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                      Company Management
                    </p>

                    <h2
                      id="view-company-title"
                      className="mt-1 text-3xl font-bold tracking-tight text-[#0B132B]"
                    >
                      {company.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                        {company.companyType}
                      </span>

                      <span
                        className={
                          company.isActive
                            ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeModal}
                  aria-label="Close company details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-7 px-6 py-7 sm:px-8">
              <section>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Contact Information
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailCard
                    label="Email"
                    value={company.email || "No email entered"}
                  />

                  <DetailCard
                    label="Phone"
                    value={company.phone || "No phone entered"}
                  />
                </div>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Company Address
                </p>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">
                    {fullAddress || "No address entered"}
                  </p>
                </div>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Connected Records
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailCard
                    label="Projects"
                    value={String(company.projectCount)}
                  />

                  <DetailCard
                    label="Company Status"
                    value={company.isActive ? "Active" : "Inactive"}
                  />
                </div>
              </section>

              <div className="flex justify-end border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-12 rounded-xl bg-[#0B132B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#132044] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-900">
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