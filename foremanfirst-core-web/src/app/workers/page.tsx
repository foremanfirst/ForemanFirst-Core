"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type WorkerStatus = "Active" | "Inactive" | "Archived";
type AccessStatus = "Approved" | "Pending" | "Restricted" | "Denied";
type BadgeStatus = "Active" | "Inactive" | "Expired" | "Suspended";
type OrientationStatus =
  | "Complete"
  | "Pending"
  | "Expired"
  | "Not Started";
type TrainingStatus =
  | "Current"
  | "Pending"
  | "Expired"
  | "Not Required";
type DrugScreenStatus =
  | "Current"
  | "Pending"
  | "Expired"
  | "Not Required";
type ModalMode = "create" | "edit" | "view" | "archive" | null;
type SortOption =
  | "name-asc"
  | "name-desc"
  | "company-asc"
  | "trade-asc"
  | "recent";

interface Worker {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  employeeNumber: string;
  email: string;
  phone: string;
  company: string;
  project: string;
  trade: string;
  jobTitle: string;
  crew: string;
  foreman: string;
  unionLocal: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  orientationStatus: OrientationStatus;
  orientationDate: string;
  orientationExpiresAt: string;
  trainingStatus: TrainingStatus;
  drugScreenStatus: DrugScreenStatus;
  drugScreenDate: string;
  drugScreenExpiresAt: string;
  badgeNumber: string;
  badgeStatus: BadgeStatus;
  badgeExpiresAt: string;
  qrCredentialId: string;
  accessStatus: AccessStatus;
  hireDate: string;
  startDate: string;
  endDate: string;
  status: WorkerStatus;
  isOnsite: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

type WorkerForm = Omit<Worker, "id" | "createdAt" | "updatedAt">;

const STORAGE_KEY = "foremanfirst-workers-v1";

const emptyForm: WorkerForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  employeeNumber: "",
  email: "",
  phone: "",
  company: "",
  project: "",
  trade: "",
  jobTitle: "",
  crew: "",
  foreman: "",
  unionLocal: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  orientationStatus: "Not Started",
  orientationDate: "",
  orientationExpiresAt: "",
  trainingStatus: "Pending",
  drugScreenStatus: "Not Required",
  drugScreenDate: "",
  drugScreenExpiresAt: "",
  badgeNumber: "",
  badgeStatus: "Inactive",
  badgeExpiresAt: "",
  qrCredentialId: "",
  accessStatus: "Pending",
  hireDate: "",
  startDate: "",
  endDate: "",
  status: "Active",
  isOnsite: false,
  notes: "",
};

const seedWorkers: Worker[] = [
  {
    id: "worker-robert-willis",
    firstName: "Robert",
    middleName: "",
    lastName: "Willis",
    suffix: "",
    employeeNumber: "FF-0001",
    email: "robertwillis612@gmail.com",
    phone: "5862924432",
    company: "ForemanFirst Technologies",
    project: "GM Lansing Delta Township",
    trade: "Safety",
    jobTitle: "Senior Safety Professional",
    crew: "Project Safety",
    foreman: "",
    unionLocal: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    orientationStatus: "Complete",
    orientationDate: "2026-05-01",
    orientationExpiresAt: "2027-05-01",
    trainingStatus: "Current",
    drugScreenStatus: "Current",
    drugScreenDate: "2026-05-01",
    drugScreenExpiresAt: "2026-08-01",
    badgeNumber: "FF-0001",
    badgeStatus: "Active",
    badgeExpiresAt: "2027-05-01",
    qrCredentialId: "FF-QR-0001",
    accessStatus: "Approved",
    hireDate: "",
    startDate: "2026-05-01",
    endDate: "",
    status: "Active",
    isOnsite: true,
    notes:
      "Demonstration worker record for the ForemanFirst™ Workers module.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const orientationOptions: OrientationStatus[] = [
  "Complete",
  "Pending",
  "Expired",
  "Not Started",
];
const trainingOptions: TrainingStatus[] = [
  "Current",
  "Pending",
  "Expired",
  "Not Required",
];
const drugScreenOptions: DrugScreenStatus[] = [
  "Current",
  "Pending",
  "Expired",
  "Not Required",
];
const badgeOptions: BadgeStatus[] = [
  "Active",
  "Inactive",
  "Expired",
  "Suspended",
];
const accessOptions: AccessStatus[] = [
  "Approved",
  "Pending",
  "Restricted",
  "Denied",
];

function createId(): string {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fullName(worker: Pick<Worker, "firstName" | "middleName" | "lastName" | "suffix">): string {
  return [
    worker.firstName,
    worker.middleName,
    worker.lastName,
    worker.suffix,
  ]
    .filter(Boolean)
    .join(" ");
}

function initials(worker: Pick<Worker, "firstName" | "lastName">): string {
  return `${worker.firstName?.[0] ?? ""}${worker.lastName?.[0] ?? ""}`.toUpperCase();
}

function formatDate(value: string): string {
  if (!value) return "Not entered";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function badgeTone(status: BadgeStatus): string {
  switch (status) {
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Expired":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Suspended":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function accessTone(status: AccessStatus): string {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Restricted":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Denied":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function complianceTone(status: string): string {
  if (status === "Complete" || status === "Current") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Expired" || status === "Denied") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "Not Required") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-100 text-amber-800";
}

function validateWorker(form: WorkerForm): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.lastName.trim()) return "Last name is required.";
  if (!form.company.trim()) return "Company is required.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    return "Enter a valid email address.";
  }
  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    return "End date cannot be before the start date.";
  }
  return null;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState<AccessStatus | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [showArchived, setShowArchived] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Worker[];
        setWorkers(Array.isArray(parsed) ? parsed : seedWorkers);
      } else {
        setWorkers(seedWorkers);
      }
    } catch {
      setWorkers(seedWorkers);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
  }, [workers, hydrated]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!modalMode) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [modalMode]);

  const selectedWorker =
    workers.find((worker) => worker.id === selectedWorkerId) ?? null;

  const companies = useMemo(
    () =>
      Array.from(
        new Set(workers.map((worker) => worker.company).filter(Boolean)),
      ).sort(),
    [workers],
  );

  const projects = useMemo(
    () =>
      Array.from(
        new Set(workers.map((worker) => worker.project).filter(Boolean)),
      ).sort(),
    [workers],
  );

  const trades = useMemo(
    () =>
      Array.from(
        new Set(workers.map((worker) => worker.trade).filter(Boolean)),
      ).sort(),
    [workers],
  );

  const visibleWorkers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = workers.filter((worker) => {
      const archiveMatch = showArchived
        ? worker.status === "Archived"
        : worker.status !== "Archived";

      const companyMatch =
        companyFilter === "All" || worker.company === companyFilter;
      const projectMatch =
        projectFilter === "All" || worker.project === projectFilter;
      const tradeMatch = tradeFilter === "All" || worker.trade === tradeFilter;
      const accessMatch =
        accessFilter === "All" || worker.accessStatus === accessFilter;

      const searchMatch =
        !normalizedSearch ||
        [
          fullName(worker),
          worker.employeeNumber,
          worker.email,
          worker.phone,
          worker.company,
          worker.project,
          worker.trade,
          worker.jobTitle,
          worker.crew,
          worker.foreman,
          worker.badgeNumber,
          worker.qrCredentialId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        archiveMatch &&
        companyMatch &&
        projectMatch &&
        tradeMatch &&
        accessMatch &&
        searchMatch
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return fullName(b).localeCompare(fullName(a));
        case "company-asc":
          return a.company.localeCompare(b.company);
        case "trade-asc":
          return a.trade.localeCompare(b.trade);
        case "recent":
          return b.updatedAt.localeCompare(a.updatedAt);
        case "name-asc":
        default:
          return fullName(a).localeCompare(fullName(b));
      }
    });
  }, [
    workers,
    search,
    companyFilter,
    projectFilter,
    tradeFilter,
    accessFilter,
    sortOption,
    showArchived,
  ]);

  const activeWorkers = workers.filter(
    (worker) => worker.status === "Active",
  ).length;
  const onsiteWorkers = workers.filter(
    (worker) => worker.status !== "Archived" && worker.isOnsite,
  ).length;
  const approvedWorkers = workers.filter(
    (worker) =>
      worker.status !== "Archived" && worker.accessStatus === "Approved",
  ).length;
  const badgeIssues = workers.filter(
    (worker) =>
      worker.status !== "Archived" &&
      ["Expired", "Suspended"].includes(worker.badgeStatus),
  ).length;
  const archivedWorkers = workers.filter(
    (worker) => worker.status === "Archived",
  ).length;

  function openCreateModal() {
    setSelectedWorkerId(null);
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  }

  function openViewModal(worker: Worker) {
    setSelectedWorkerId(worker.id);
    setFormError("");
    setModalMode("view");
  }

  function openEditModal(worker: Worker) {
    const { id, createdAt, updatedAt, ...editable } = worker;
    void id;
    void createdAt;
    void updatedAt;
    setSelectedWorkerId(worker.id);
    setForm(editable);
    setFormError("");
    setModalMode("edit");
  }

  function openArchiveModal(worker: Worker) {
    setSelectedWorkerId(worker.id);
    setFormError("");
    setModalMode("archive");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedWorkerId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function updateForm<K extends keyof WorkerForm>(
    field: K,
    value: WorkerForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateWorker(form);

    if (error) {
      setFormError(error);
      return;
    }

    const now = new Date().toISOString();

    if (modalMode === "create") {
      const newWorker: Worker = {
        id: createId(),
        ...form,
        createdAt: now,
        updatedAt: now,
      };

      setWorkers((current) => [newWorker, ...current]);
      setToast(`${fullName(newWorker)} was added.`);
      closeModal();
      return;
    }

    if (modalMode === "edit" && selectedWorker) {
      const updatedWorker: Worker = {
        ...selectedWorker,
        ...form,
        updatedAt: now,
      };

      setWorkers((current) =>
        current.map((worker) =>
          worker.id === selectedWorker.id ? updatedWorker : worker,
        ),
      );
      setToast(`${fullName(updatedWorker)} was updated.`);
      closeModal();
    }
  }

  function confirmArchive() {
    if (!selectedWorker) return;

    setWorkers((current) =>
      current.map((worker) =>
        worker.id === selectedWorker.id
          ? {
              ...worker,
              status: "Archived",
              isOnsite: false,
              accessStatus: "Denied",
              updatedAt: new Date().toISOString(),
            }
          : worker,
      ),
    );

    setToast(`${fullName(selectedWorker)} was archived.`);
    closeModal();
  }

  function restoreWorker(worker: Worker) {
    setWorkers((current) =>
      current.map((item) =>
        item.id === worker.id
          ? {
              ...item,
              status: "Active",
              accessStatus:
                item.badgeStatus === "Active" ? "Approved" : "Pending",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    setToast(`${fullName(worker)} was restored.`);
  }

  function resetDemoData() {
    if (!window.confirm("Reset the Workers module to demonstration data?")) {
      return;
    }

    setWorkers(seedWorkers);
    setToast("Demonstration worker data was restored.");
  }

  function clearFilters() {
    setSearch("");
    setCompanyFilter("All");
    setProjectFilter("All");
    setTradeFilter("All");
    setAccessFilter("All");
    setSortOption("name-asc");
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="h-36 animate-pulse rounded-3xl bg-white" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-white/10 bg-[#0B132B] text-white shadow-lg">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00C2FF]">
              ForemanFirst™ Workforce
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Workers
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Manage worker profiles, compliance, credentials, and site access.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetDemoData}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"
            >
              Reset Demo Data
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-[#00C2FF] px-5 py-2.5 text-sm font-black text-[#0B132B] shadow transition hover:bg-cyan-300"
            >
              + Add Worker
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#15346F] to-[#0873BE] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-200">
                ForemanFirst Access™ Ready
              </span>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                One worker record for safety, training, and site access.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
                Connect each worker to their company, project, trade,
                orientation, training, drug-screen eligibility, badge, and QR
                credential.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="min-h-12 rounded-xl bg-white px-6 py-3 text-sm font-black text-[#0B132B] shadow transition hover:bg-cyan-50"
            >
              Add Your Next Worker
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Total Workers"
            value={workers.filter((worker) => worker.status !== "Archived").length}
            detail="Current workforce directory"
          />
          <KpiCard
            label="Active Workers"
            value={activeWorkers}
            detail="Available for assignment"
          />
          <KpiCard
            label="Onsite Now"
            value={onsiteWorkers}
            detail="Live headcount"
          />
          <KpiCard
            label="Access Approved"
            value={approvedWorkers}
            detail="Eligible for entry"
          />
          <KpiCard
            label="Badge Issues"
            value={badgeIssues}
            detail="Expired or suspended"
            danger={badgeIssues > 0}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Worker Directory
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {showArchived ? "Archived Workers" : "Current Workers"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {visibleWorkers.length} worker
                {visibleWorkers.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  !showArchived
                    ? "bg-[#0B132B] text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Current Workers
              </button>

              <button
                type="button"
                onClick={() => setShowArchived(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  showArchived
                    ? "bg-[#0B132B] text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Archived ({archivedWorkers})
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workers..."
              className="h-12 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 2xl:col-span-2"
            />

            <FilterSelect
              value={companyFilter}
              onChange={setCompanyFilter}
              options={companies}
              placeholder="All companies"
            />

            <FilterSelect
              value={projectFilter}
              onChange={setProjectFilter}
              options={projects}
              placeholder="All projects"
            />

            <FilterSelect
              value={tradeFilter}
              onChange={setTradeFilter}
              options={trades}
              placeholder="All trades"
            />

            <select
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(event.target.value as AccessStatus | "All")
              }
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="All">All access statuses</option>
              {accessOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as SortOption)
              }
              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="company-asc">Company: A to Z</option>
              <option value="trade-asc">Trade: A to Z</option>
              <option value="recent">Recently updated</option>
            </select>
          </div>
        </section>

        {visibleWorkers.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
              WK
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-950">
              No workers match the current view
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Add a worker or clear the filters to display more workforce
              records.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"
              >
                Clear Filters
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-xl bg-[#00C2FF] px-5 py-3 text-sm font-black text-[#0B132B]"
              >
                Add Worker
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Worker</th>
                      <th className="px-5 py-4">Company / Project</th>
                      <th className="px-5 py-4">Trade / Crew</th>
                      <th className="px-5 py-4">Compliance</th>
                      <th className="px-5 py-4">Badge</th>
                      <th className="px-5 py-4">Access</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {visibleWorkers.map((worker) => (
                      <tr
                        key={worker.id}
                        className="transition hover:bg-cyan-50/50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-sm font-black text-[#00C2FF]">
                              {initials(worker)}
                            </div>
                            <div>
                              <p className="font-black text-slate-950">
                                {fullName(worker)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {worker.employeeNumber || "No employee number"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {worker.isOnsite ? "Currently onsite" : "Offsite"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-slate-800">
                            {worker.company || "No company"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {worker.project || "No project assigned"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-slate-800">
                            {worker.trade || "No trade"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {worker.crew || worker.jobTitle || "No crew entered"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            <StatusPill
                              value={worker.orientationStatus}
                              className={complianceTone(
                                worker.orientationStatus,
                              )}
                            />
                            <StatusPill
                              value={worker.trainingStatus}
                              className={complianceTone(worker.trainingStatus)}
                            />
                            <StatusPill
                              value={worker.drugScreenStatus}
                              className={complianceTone(
                                worker.drugScreenStatus,
                              )}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${badgeTone(
                              worker.badgeStatus,
                            )}`}
                          >
                            {worker.badgeStatus}
                          </span>
                          <p className="mt-2 text-xs text-slate-500">
                            {worker.badgeNumber || "No badge number"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${accessTone(
                              worker.accessStatus,
                            )}`}
                          >
                            {worker.accessStatus}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openViewModal(worker)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100"
                            >
                              View
                            </button>

                            {worker.status === "Archived" ? (
                              <button
                                type="button"
                                onClick={() => restoreWorker(worker)}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(worker)}
                                  className="rounded-lg bg-[#0B132B] px-3 py-2 text-xs font-black text-white hover:bg-blue-950"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openArchiveModal(worker)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
                                >
                                  Archive
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 xl:hidden">
              {visibleWorkers.map((worker) => (
                <article
                  key={worker.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-sm font-black text-[#00C2FF]">
                        {initials(worker)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-950">
                          {fullName(worker)}
                        </h3>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {worker.company || "No company"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${accessTone(
                        worker.accessStatus,
                      )}`}
                    >
                      {worker.accessStatus}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MobileStat label="Project" value={worker.project} />
                    <MobileStat label="Trade" value={worker.trade} />
                    <MobileStat label="Badge" value={worker.badgeStatus} />
                    <MobileStat
                      label="Onsite"
                      value={worker.isOnsite ? "Yes" : "No"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => openViewModal(worker)}
                      className="min-h-11 rounded-xl border border-slate-300 text-sm font-black text-slate-700"
                    >
                      View
                    </button>

                    {worker.status === "Archived" ? (
                      <button
                        type="button"
                        onClick={() => restoreWorker(worker)}
                        className="min-h-11 rounded-xl bg-emerald-600 text-sm font-black text-white"
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(worker)}
                          className="min-h-11 rounded-xl bg-[#0B132B] text-sm font-black text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openArchiveModal(worker)}
                          className="col-span-2 min-h-11 rounded-xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-700"
                        >
                          Archive Worker
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>

      {modalMode && renderModal()}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-cyan-200 bg-[#0B132B] px-5 py-4 text-sm font-bold text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00C2FF] font-black text-[#0B132B]">
              ✓
            </span>
            <span>{toast}</span>
          </div>
        </div>
      )}
    </main>
  );

  function renderModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onMouseDown={(event) => {
          if (event.currentTarget === event.target) closeModal();
        }}
      >
        <div className="max-h-[96vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B132B] px-5 py-4 text-white sm:px-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                ForemanFirst™ Workers
              </p>
              <h2 className="mt-1 text-xl font-black">
                {modalMode === "create"
                  ? "Add Worker"
                  : modalMode === "edit"
                    ? "Edit Worker"
                    : modalMode === "archive"
                      ? "Archive Worker"
                      : selectedWorker
                        ? fullName(selectedWorker)
                        : "Worker Details"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl font-bold hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {modalMode === "view" && selectedWorker ? (
            <WorkerView worker={selectedWorker} onEdit={() => openEditModal(selectedWorker)} />
          ) : modalMode === "archive" && selectedWorker ? (
            <ArchiveConfirmation
              worker={selectedWorker}
              onCancel={closeModal}
              onConfirm={confirmArchive}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(96vh-76px)] overflow-y-auto"
            >
              <div className="space-y-8 p-5 sm:p-7">
                {formError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {formError}
                  </div>
                )}

                <FormSection
                  title="Worker Identity"
                  description="Enter the worker's primary identification and contact information."
                >
                  <TextField
                    label="First Name"
                    required
                    value={form.firstName}
                    onChange={(value) => updateForm("firstName", value)}
                  />
                  <TextField
                    label="Middle Name"
                    value={form.middleName}
                    onChange={(value) => updateForm("middleName", value)}
                  />
                  <TextField
                    label="Last Name"
                    required
                    value={form.lastName}
                    onChange={(value) => updateForm("lastName", value)}
                  />
                  <TextField
                    label="Suffix"
                    value={form.suffix}
                    onChange={(value) => updateForm("suffix", value)}
                  />
                  <TextField
                    label="Employee Number"
                    value={form.employeeNumber}
                    onChange={(value) => updateForm("employeeNumber", value)}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateForm("email", value)}
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    value={form.phone}
                    onChange={(value) => updateForm("phone", value)}
                  />
                </FormSection>

                <FormSection
                  title="Assignment"
                  description="Connect the worker to their company, project, trade, and crew."
                >
                  <TextField
                    label="Company"
                    required
                    value={form.company}
                    onChange={(value) => updateForm("company", value)}
                  />
                  <TextField
                    label="Project"
                    value={form.project}
                    onChange={(value) => updateForm("project", value)}
                  />
                  <TextField
                    label="Trade"
                    value={form.trade}
                    onChange={(value) => updateForm("trade", value)}
                  />
                  <TextField
                    label="Job Title"
                    value={form.jobTitle}
                    onChange={(value) => updateForm("jobTitle", value)}
                  />
                  <TextField
                    label="Crew"
                    value={form.crew}
                    onChange={(value) => updateForm("crew", value)}
                  />
                  <TextField
                    label="Foreman"
                    value={form.foreman}
                    onChange={(value) => updateForm("foreman", value)}
                  />
                  <TextField
                    label="Union Local"
                    value={form.unionLocal}
                    onChange={(value) => updateForm("unionLocal", value)}
                  />
                </FormSection>

                <FormSection
                  title="Compliance"
                  description="Track orientation, training, and drug-screen eligibility."
                >
                  <SelectField
                    label="Orientation Status"
                    value={form.orientationStatus}
                    options={orientationOptions}
                    onChange={(value) =>
                      updateForm(
                        "orientationStatus",
                        value as OrientationStatus,
                      )
                    }
                  />
                  <TextField
                    label="Orientation Date"
                    type="date"
                    value={form.orientationDate}
                    onChange={(value) => updateForm("orientationDate", value)}
                  />
                  <TextField
                    label="Orientation Expiration"
                    type="date"
                    value={form.orientationExpiresAt}
                    onChange={(value) =>
                      updateForm("orientationExpiresAt", value)
                    }
                  />
                  <SelectField
                    label="Training Status"
                    value={form.trainingStatus}
                    options={trainingOptions}
                    onChange={(value) =>
                      updateForm("trainingStatus", value as TrainingStatus)
                    }
                  />
                  <SelectField
                    label="Drug Screen Status"
                    value={form.drugScreenStatus}
                    options={drugScreenOptions}
                    onChange={(value) =>
                      updateForm(
                        "drugScreenStatus",
                        value as DrugScreenStatus,
                      )
                    }
                  />
                  <TextField
                    label="Drug Screen Date"
                    type="date"
                    value={form.drugScreenDate}
                    onChange={(value) => updateForm("drugScreenDate", value)}
                  />
                  <TextField
                    label="Drug Screen Expiration"
                    type="date"
                    value={form.drugScreenExpiresAt}
                    onChange={(value) =>
                      updateForm("drugScreenExpiresAt", value)
                    }
                  />
                </FormSection>

                <FormSection
                  title="Access Credential"
                  description="Configure ForemanFirst Access™ badge and QR eligibility."
                >
                  <TextField
                    label="Badge Number"
                    value={form.badgeNumber}
                    onChange={(value) => updateForm("badgeNumber", value)}
                  />
                  <SelectField
                    label="Badge Status"
                    value={form.badgeStatus}
                    options={badgeOptions}
                    onChange={(value) =>
                      updateForm("badgeStatus", value as BadgeStatus)
                    }
                  />
                  <TextField
                    label="Badge Expiration"
                    type="date"
                    value={form.badgeExpiresAt}
                    onChange={(value) => updateForm("badgeExpiresAt", value)}
                  />
                  <TextField
                    label="QR Credential ID"
                    value={form.qrCredentialId}
                    onChange={(value) => updateForm("qrCredentialId", value)}
                  />
                  <SelectField
                    label="Access Status"
                    value={form.accessStatus}
                    options={accessOptions}
                    onChange={(value) =>
                      updateForm("accessStatus", value as AccessStatus)
                    }
                  />
                  <SelectField
                    label="Worker Status"
                    value={form.status}
                    options={["Active", "Inactive"]}
                    onChange={(value) =>
                      updateForm("status", value as WorkerStatus)
                    }
                  />
                  <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4">
                    <input
                      type="checkbox"
                      checked={form.isOnsite}
                      onChange={(event) =>
                        updateForm("isOnsite", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-black text-slate-800">
                      Worker is currently onsite
                    </span>
                  </label>
                </FormSection>

                <FormSection
                  title="Employment Dates"
                  description="Record the worker's employment and project assignment dates."
                >
                  <TextField
                    label="Hire Date"
                    type="date"
                    value={form.hireDate}
                    onChange={(value) => updateForm("hireDate", value)}
                  />
                  <TextField
                    label="Project Start Date"
                    type="date"
                    value={form.startDate}
                    onChange={(value) => updateForm("startDate", value)}
                  />
                  <TextField
                    label="Project End Date"
                    type="date"
                    value={form.endDate}
                    onChange={(value) => updateForm("endDate", value)}
                  />
                </FormSection>

                <FormSection
                  title="Emergency Contact"
                  description="Add the worker's primary emergency contact."
                >
                  <TextField
                    label="Contact Name"
                    value={form.emergencyContactName}
                    onChange={(value) =>
                      updateForm("emergencyContactName", value)
                    }
                  />
                  <TextField
                    label="Relationship"
                    value={form.emergencyContactRelationship}
                    onChange={(value) =>
                      updateForm("emergencyContactRelationship", value)
                    }
                  />
                  <TextField
                    label="Contact Phone"
                    type="tel"
                    value={form.emergencyContactPhone}
                    onChange={(value) =>
                      updateForm("emergencyContactPhone", value)
                    }
                  />
                </FormSection>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Notes
                  </label>
                  <textarea
                    rows={5}
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    placeholder="Add important worker notes, restrictions, or assignment details."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] hover:bg-cyan-300"
                >
                  {modalMode === "create"
                    ? "Add Worker"
                    : "Save Worker Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}

function KpiCard({
  label,
  value,
  detail,
  danger = false,
}: {
  label: string;
  value: number;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        danger ? "border-rose-200" : "border-slate-200"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-black ${
          danger ? "text-rose-700" : "text-[#0B132B]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    >
      <option value="All">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function StatusPill({
  value,
  className,
}: {
  value: string;
  className: string;
}) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${className}`}>
      {value}
    </span>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">
        {value || "Not entered"}
      </p>
    </div>
  );
}

function WorkerView({
  worker,
  onEdit,
}: {
  worker: Worker;
  onEdit: () => void;
}) {
  return (
    <div className="max-h-[calc(96vh-76px)] overflow-y-auto p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xl font-black text-[#00C2FF]">
            {initials(worker)}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950">
              {fullName(worker)}
            </h3>
            <p className="mt-1 text-slate-600">
              {worker.jobTitle || worker.trade || "Worker"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${accessTone(
                  worker.accessStatus,
                )}`}
              >
                {worker.accessStatus}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-black ${badgeTone(
                  worker.badgeStatus,
                )}`}
              >
                Badge {worker.badgeStatus}
              </span>
              {worker.isOnsite && (
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">
                  Onsite Now
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl bg-[#00C2FF] px-5 py-3 text-sm font-black text-[#0B132B]"
        >
          Edit Worker
        </button>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <ViewSection title="Assignment">
          <DetailItem label="Company" value={worker.company} />
          <DetailItem label="Project" value={worker.project} />
          <DetailItem label="Trade" value={worker.trade} />
          <DetailItem label="Job Title" value={worker.jobTitle} />
          <DetailItem label="Crew" value={worker.crew} />
          <DetailItem label="Foreman" value={worker.foreman} />
          <DetailItem label="Union Local" value={worker.unionLocal} />
        </ViewSection>

        <ViewSection title="Contact Information">
          <DetailItem label="Employee Number" value={worker.employeeNumber} />
          <DetailItem label="Email" value={worker.email} />
          <DetailItem label="Phone" value={worker.phone} />
          <DetailItem
            label="Emergency Contact"
            value={worker.emergencyContactName}
          />
          <DetailItem
            label="Relationship"
            value={worker.emergencyContactRelationship}
          />
          <DetailItem
            label="Emergency Phone"
            value={worker.emergencyContactPhone}
          />
        </ViewSection>

        <ViewSection title="Compliance">
          <DetailItem
            label="Orientation"
            value={worker.orientationStatus}
          />
          <DetailItem
            label="Orientation Date"
            value={formatDate(worker.orientationDate)}
          />
          <DetailItem
            label="Orientation Expiration"
            value={formatDate(worker.orientationExpiresAt)}
          />
          <DetailItem label="Training" value={worker.trainingStatus} />
          <DetailItem
            label="Drug Screen"
            value={worker.drugScreenStatus}
          />
          <DetailItem
            label="Drug Screen Expiration"
            value={formatDate(worker.drugScreenExpiresAt)}
          />
        </ViewSection>

        <ViewSection title="ForemanFirst Access™">
          <DetailItem label="Badge Number" value={worker.badgeNumber} />
          <DetailItem label="Badge Status" value={worker.badgeStatus} />
          <DetailItem
            label="Badge Expiration"
            value={formatDate(worker.badgeExpiresAt)}
          />
          <DetailItem
            label="QR Credential"
            value={worker.qrCredentialId}
          />
          <DetailItem label="Access Status" value={worker.accessStatus} />
          <DetailItem
            label="Current Location"
            value={worker.isOnsite ? "Onsite" : "Offsite"}
          />
        </ViewSection>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          Notes
        </p>
        <p className="mt-2 leading-6 text-slate-700">
          {worker.notes || "No notes entered."}
        </p>
      </div>
    </div>
  );
}

function ArchiveConfirmation({
  worker,
  onCancel,
  onConfirm,
}: {
  worker: Worker;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="max-h-[calc(96vh-76px)] overflow-y-auto p-6 sm:p-8">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Worker
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 font-black text-cyan-800">
            {initials(worker)}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-950">
              {fullName(worker)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {worker.company || "No company"} •{" "}
              {worker.project || "No project"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
        <h4 className="font-black text-slate-950">
          Archiving preserves the worker's historical record
        </h4>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>✓ Hidden from the active Workers directory</li>
          <li>✓ Training, orientation, badge, and access history remains preserved</li>
          <li>✓ Project and company relationships remain intact</li>
          <li>✓ The worker can be restored at any time</li>
        </ul>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-[#0B132B] px-6 py-3 text-sm font-black text-white"
        >
          Archive Worker
        </button>
      </div>
    </div>
  );
}

function ViewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h4 className="text-lg font-black text-slate-950">{title}</h4>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-black text-slate-900">
        {value || "Not entered"}
      </dd>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-800">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}