"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ProjectStatus =
  | "Planning"
  | "Active"
  | "On Hold"
  | "Completed"
  | "Archived";

type ProjectType =
  | "Commercial Construction"
  | "Industrial Construction"
  | "Manufacturing"
  | "Data Center"
  | "Energy"
  | "Infrastructure"
  | "Other";

type SortOption =
  | "name-asc"
  | "name-desc"
  | "start-newest"
  | "start-oldest"
  | "end-soonest"
  | "progress-highest";

interface Project {
  id: string;
  projectName: string;
  projectNumber: string;
  client: string;
  managingCompany: string;
  projectType: ProjectType;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  startDate: string;
  targetCompletionDate: string;
  status: ProjectStatus;
  projectManager: string;
  superintendent: string;
  safetyManager: string;
  description: string;
  contractValue: number;
  plannedWorkforce: number;
  currentWorkforce: number;
  workersOnsite: number;
  activeContractors: number;
  totalManHours: number;
  progress: number;
  openActions: number;
  recordableIncidents: number;
  permitsOpen: number;
  planningDocumentsPending: number;
  trainingCompliance: number;
  accessCompliance: number;
  healthScore: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFormData {
  projectName: string;
  projectNumber: string;
  client: string;
  managingCompany: string;
  projectType: ProjectType;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  startDate: string;
  targetCompletionDate: string;
  status: Exclude<ProjectStatus, "Archived">;
  projectManager: string;
  superintendent: string;
  safetyManager: string;
  description: string;
  contractValue: string;
  plannedWorkforce: string;
  currentWorkforce: string;
  workersOnsite: string;
  activeContractors: string;
  totalManHours: string;
  progress: string;
  openActions: string;
  recordableIncidents: string;
  permitsOpen: string;
  planningDocumentsPending: string;
  trainingCompliance: string;
  accessCompliance: string;
  healthScore: string;
}

type ModalMode = "create" | "edit" | "view" | null;

const STORAGE_KEY = "foremanfirst-projects-v1";

const projectTypes: ProjectType[] = [
  "Commercial Construction",
  "Industrial Construction",
  "Manufacturing",
  "Data Center",
  "Energy",
  "Infrastructure",
  "Other",
];

const activeStatuses: Exclude<ProjectStatus, "Archived">[] = [
  "Planning",
  "Active",
  "On Hold",
  "Completed",
];

const emptyForm: ProjectFormData = {
  projectName: "",
  projectNumber: "",
  client: "",
  managingCompany: "",
  projectType: "Commercial Construction",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  startDate: "",
  targetCompletionDate: "",
  status: "Planning",
  projectManager: "",
  superintendent: "",
  safetyManager: "",
  description: "",
  contractValue: "0",
  plannedWorkforce: "0",
  currentWorkforce: "0",
  workersOnsite: "0",
  activeContractors: "0",
  totalManHours: "0",
  progress: "0",
  openActions: "0",
  recordableIncidents: "0",
  permitsOpen: "0",
  planningDocumentsPending: "0",
  trainingCompliance: "100",
  accessCompliance: "100",
  healthScore: "100",
};

const seedProjects: Project[] = [
  {
    id: "gm-ldt-001",
    projectName: "GM Lansing Delta Township",
    projectNumber: "GM-LDT-2026",
    client: "General Motors",
    managingCompany: "Barton Malow",
    projectType: "Manufacturing",
    address: "920 Townsend Street",
    city: "Lansing",
    state: "MI",
    postalCode: "48933",
    startDate: "2026-05-01",
    targetCompletionDate: "2027-08-31",
    status: "Active",
    projectManager: "Project Manager",
    superintendent: "Project Superintendent",
    safetyManager: "Robert Willis",
    description:
      "Multi-building construction and field-operations project supporting manufacturing improvements at GM Lansing Delta Township.",
    contractValue: 0,
    plannedWorkforce: 300,
    currentWorkforce: 74,
    workersOnsite: 61,
    activeContractors: 8,
    totalManHours: 50240,
    progress: 32,
    openActions: 6,
    recordableIncidents: 0,
    permitsOpen: 4,
    planningDocumentsPending: 3,
    trainingCompliance: 96,
    accessCompliance: 94,
    healthScore: 92,
    createdAt: "2026-07-27T12:00:00.000Z",
    updatedAt: "2026-07-28T12:00:00.000Z",
  },
];

const commandCenterModules = [
  {
    title: "Companies",
    description: "Manage project companies and organizational relationships.",
    icon: "CO",
    route: "/companies",
    available: false,
  },
  {
    title: "Contractors",
    description: "Manage prime contractors, subcontractors, and trades.",
    icon: "CT",
    route: "/contractors",
    available: false,
  },
  {
    title: "Team Members",
    description: "Manage project leadership, administrators, and permissions.",
    icon: "TM",
    route: "/team-members",
    available: false,
  },
  {
    title: "Workers",
    description: "Manage worker profiles, crews, trades, and assignments.",
    icon: "WK",
    route: "/workers",
    available: false,
  },
  {
    title: "Access™",
    description: "Worker credentials, gate access, attendance, and headcount.",
    icon: "AC",
    route: "/access",
    available: false,
  },
  {
    title: "Orientations",
    description: "Track project orientations, acknowledgments, and eligibility.",
    icon: "OR",
    route: "/orientations",
    available: false,
  },
  {
    title: "Training",
    description: "Track required training, certifications, and expirations.",
    icon: "TR",
    route: "/training",
    available: false,
  },
  {
    title: "Planning™",
    description: "Coordinate field planning documents and approvals.",
    icon: "PL",
    route: "/planning",
    available: false,
  },
  {
    title: "PTPs",
    description: "Create and review pre-task plans with AI assistance.",
    icon: "PT",
    route: "/ptps",
    available: false,
  },
  {
    title: "JSAs",
    description: "Create job safety analyses and task-specific controls.",
    icon: "JS",
    route: "/jsas",
    available: false,
  },
  {
    title: "SFMEAs",
    description: "Manage detailed task hazards, mitigations, and approvals.",
    icon: "SF",
    route: "/sfmeas",
    available: false,
  },
  {
    title: "Permits",
    description: "Manage permits, approvals, expiration dates, and status.",
    icon: "PM",
    route: "/permits",
    available: false,
  },
  {
    title: "LOTO",
    description: "Coordinate lockout/tagout plans, equipment, and verification.",
    icon: "LO",
    route: "/loto",
    available: false,
  },
  {
    title: "Observations",
    description: "Record safety observations, good catches, and concerns.",
    icon: "OB",
    route: "/observations",
    available: false,
  },
  {
    title: "Inspections",
    description: "Complete mobile inspections and track deficiencies.",
    icon: "IN",
    route: "/inspections",
    available: false,
  },
  {
    title: "Incidents",
    description: "Report, investigate, and analyze project incidents.",
    icon: "IC",
    route: "/incidents",
    available: false,
  },
  {
    title: "Near Misses",
    description: "Document and analyze high-potential near-miss events.",
    icon: "NM",
    route: "/near-misses",
    available: false,
  },
  {
    title: "Corrective Actions",
    description: "Assign, track, verify, and close corrective actions.",
    icon: "CA",
    route: "/corrective-actions",
    available: false,
  },
  {
    title: "Equipment",
    description: "Track equipment, inspections, operators, and documentation.",
    icon: "EQ",
    route: "/equipment",
    available: false,
  },
  {
    title: "Documents",
    description: "Store project plans, procedures, records, and attachments.",
    icon: "DC",
    route: "/documents",
    available: false,
  },
  {
    title: "Milestones",
    description: "Track major project dates, safety goals, and achievements.",
    icon: "ML",
    route: "/milestones",
    available: false,
  },
  {
    title: "Shutdown™",
    description: "Coordinate shutdown work zones, contractors, and conflicts.",
    icon: "SD",
    route: "/shutdown",
    available: false,
  },
  {
    title: "Vision™ AI",
    description: "Use Vision Live™, Capture™, Replay™, and Assistant™.",
    icon: "VI",
    route: "/vision",
    available: false,
  },
  {
    title: "Reports",
    description: "Generate safety, workforce, compliance, and executive reports.",
    icon: "RP",
    route: "/reports",
    available: false,
  },
  {
    title: "Analytics",
    description: "Analyze project trends, risks, performance, and leading indicators.",
    icon: "AN",
    route: "/analytics",
    available: false,
  },
  {
    title: "Settings",
    description: "Configure project details, workflows, permissions, and branding.",
    icon: "ST",
    route: "/settings",
    available: false,
  },
];

const quickActions = [
  "Add Company",
  "Add Contractor",
  "Add Worker",
  "Create PTP",
  "Record Observation",
  "Start Inspection",
  "Report Incident",
  "Create Permit",
  "Upload Document",
  "Launch Vision™",
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  if (!value) return "Not entered";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string): string {
  if (!value) return "Not entered";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDaysRemaining(targetDate: string): number | null {
  if (!targetDate) return null;

  const target = new Date(`${targetDate}T23:59:59`);
  const now = new Date();

  if (Number.isNaN(target.getTime())) return null;

  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function statusClass(status: ProjectStatus): string {
  switch (status) {
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Planning":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "On Hold":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Completed":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "Archived":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function projectToForm(project: Project): ProjectFormData {
  return {
    projectName: project.projectName,
    projectNumber: project.projectNumber,
    client: project.client,
    managingCompany: project.managingCompany,
    projectType: project.projectType,
    address: project.address,
    city: project.city,
    state: project.state,
    postalCode: project.postalCode,
    startDate: project.startDate,
    targetCompletionDate: project.targetCompletionDate,
    status: project.status === "Archived" ? "Planning" : project.status,
    projectManager: project.projectManager,
    superintendent: project.superintendent,
    safetyManager: project.safetyManager,
    description: project.description,
    contractValue: String(project.contractValue),
    plannedWorkforce: String(project.plannedWorkforce),
    currentWorkforce: String(project.currentWorkforce),
    workersOnsite: String(project.workersOnsite),
    activeContractors: String(project.activeContractors),
    totalManHours: String(project.totalManHours),
    progress: String(project.progress),
    openActions: String(project.openActions),
    recordableIncidents: String(project.recordableIncidents),
    permitsOpen: String(project.permitsOpen),
    planningDocumentsPending: String(project.planningDocumentsPending),
    trainingCompliance: String(project.trainingCompliance),
    accessCompliance: String(project.accessCompliance),
    healthScore: String(project.healthScore),
  };
}

function validateProject(form: ProjectFormData): string | null {
  if (!form.projectName.trim()) return "Project name is required.";
  if (!form.projectNumber.trim()) return "Project number is required.";
  if (!form.client.trim()) return "Client is required.";
  if (!form.startDate) return "Start date is required.";
  if (!form.targetCompletionDate) {
    return "Target completion date is required.";
  }

  if (
    new Date(`${form.targetCompletionDate}T12:00:00`) <
    new Date(`${form.startDate}T12:00:00`)
  ) {
    return "Target completion date cannot be before the start date.";
  }

  if (safeNumber(form.progress) < 0 || safeNumber(form.progress) > 100) {
    return "Project progress must be between 0 and 100.";
  }

  if (
    safeNumber(form.trainingCompliance) < 0 ||
    safeNumber(form.trainingCompliance) > 100
  ) {
    return "Training compliance must be between 0 and 100.";
  }

  if (
    safeNumber(form.accessCompliance) < 0 ||
    safeNumber(form.accessCompliance) > 100
  ) {
    return "Access compliance must be between 0 and 100.";
  }

  if (
    safeNumber(form.healthScore) < 0 ||
    safeNumber(form.healthScore) > 100
  ) {
    return "Project health score must be between 0 and 100.";
  }

  return null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">(
    "All",
  );
  const [typeFilter, setTypeFilter] = useState<ProjectType | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [showArchived, setShowArchived] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [formError, setFormError] = useState("");

  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(
    null,
  );
  const [workspaceTab, setWorkspaceTab] = useState<
    "overview" | "command" | "activity"
  >("overview");

  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const storedProjects = window.localStorage.getItem(STORAGE_KEY);

      if (storedProjects) {
        const parsed = JSON.parse(storedProjects) as Project[];
        setProjects(Array.isArray(parsed) ? parsed : seedProjects);
      } else {
        setProjects(seedProjects);
      }
    } catch {
      setProjects(seedProjects);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, hydrated]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  const workspaceProject =
    projects.find((project) => project.id === workspaceProjectId) ?? null;

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesArchive = showArchived
        ? project.status === "Archived"
        : project.status !== "Archived";

      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;

      const matchesType =
        typeFilter === "All" || project.projectType === typeFilter;

      const matchesSearch =
        !normalizedSearch ||
        [
          project.projectName,
          project.projectNumber,
          project.client,
          project.managingCompany,
          project.projectType,
          project.city,
          project.state,
          project.projectManager,
          project.superintendent,
          project.safetyManager,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesArchive && matchesStatus && matchesType && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-desc":
          return b.projectName.localeCompare(a.projectName);
        case "start-newest":
          return b.startDate.localeCompare(a.startDate);
        case "start-oldest":
          return a.startDate.localeCompare(b.startDate);
        case "end-soonest":
          return a.targetCompletionDate.localeCompare(b.targetCompletionDate);
        case "progress-highest":
          return b.progress - a.progress;
        case "name-asc":
        default:
          return a.projectName.localeCompare(b.projectName);
      }
    });
  }, [
    projects,
    search,
    statusFilter,
    typeFilter,
    sortOption,
    showArchived,
  ]);

  const activeProjectCount = projects.filter(
    (project) => project.status === "Active",
  ).length;

  const planningProjectCount = projects.filter(
    (project) => project.status === "Planning",
  ).length;

  const onHoldProjectCount = projects.filter(
    (project) => project.status === "On Hold",
  ).length;

  const completedProjectCount = projects.filter(
    (project) => project.status === "Completed",
  ).length;

  const archivedProjectCount = projects.filter(
    (project) => project.status === "Archived",
  ).length;

  function openCreateModal() {
    setSelectedProjectId(null);
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  }

  function openViewModal(project: Project) {
    setSelectedProjectId(project.id);
    setFormError("");
    setModalMode("view");
  }

  function openEditModal(project: Project) {
    setSelectedProjectId(project.id);
    setForm(projectToForm(project));
    setFormError("");
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedProjectId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function updateForm<K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function buildProjectFromForm(
    data: ProjectFormData,
    existing?: Project,
  ): Project {
    const now = new Date().toISOString();

    return {
      id: existing?.id ?? createId(),
      projectName: data.projectName.trim(),
      projectNumber: data.projectNumber.trim(),
      client: data.client.trim(),
      managingCompany: data.managingCompany.trim(),
      projectType: data.projectType,
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      postalCode: data.postalCode.trim(),
      startDate: data.startDate,
      targetCompletionDate: data.targetCompletionDate,
      status: data.status,
      projectManager: data.projectManager.trim(),
      superintendent: data.superintendent.trim(),
      safetyManager: data.safetyManager.trim(),
      description: data.description.trim(),
      contractValue: Math.max(0, safeNumber(data.contractValue)),
      plannedWorkforce: Math.max(0, safeNumber(data.plannedWorkforce)),
      currentWorkforce: Math.max(0, safeNumber(data.currentWorkforce)),
      workersOnsite: Math.max(0, safeNumber(data.workersOnsite)),
      activeContractors: Math.max(0, safeNumber(data.activeContractors)),
      totalManHours: Math.max(0, safeNumber(data.totalManHours)),
      progress: clamp(safeNumber(data.progress), 0, 100),
      openActions: Math.max(0, safeNumber(data.openActions)),
      recordableIncidents: Math.max(
        0,
        safeNumber(data.recordableIncidents),
      ),
      permitsOpen: Math.max(0, safeNumber(data.permitsOpen)),
      planningDocumentsPending: Math.max(
        0,
        safeNumber(data.planningDocumentsPending),
      ),
      trainingCompliance: clamp(
        safeNumber(data.trainingCompliance),
        0,
        100,
      ),
      accessCompliance: clamp(safeNumber(data.accessCompliance), 0, 100),
      healthScore: clamp(safeNumber(data.healthScore), 0, 100),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateProject(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (modalMode === "create") {
      const newProject = buildProjectFromForm(form);
      setProjects((current) => [newProject, ...current]);
      setToast(`${newProject.projectName} was created.`);
      closeModal();
      return;
    }

    if (modalMode === "edit" && selectedProject) {
      const updatedProject = buildProjectFromForm(form, selectedProject);

      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProject.id ? updatedProject : project,
        ),
      );

      setToast(`${updatedProject.projectName} was updated.`);
      closeModal();
    }
  }

  function duplicateProject(project: Project) {
    const now = new Date().toISOString();

    const duplicate: Project = {
      ...project,
      id: createId(),
      projectName: `${project.projectName} Copy`,
      projectNumber: `${project.projectNumber}-COPY`,
      status: "Planning",
      progress: 0,
      currentWorkforce: 0,
      workersOnsite: 0,
      totalManHours: 0,
      openActions: 0,
      recordableIncidents: 0,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((current) => [duplicate, ...current]);
    setToast(`${project.projectName} was duplicated.`);
  }

  function archiveProject(project: Project) {
    const confirmed = window.confirm(
      `Archive ${project.projectName}? The project can be restored later.`,
    );

    if (!confirmed) return;

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              status: "Archived",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    if (workspaceProjectId === project.id) {
      setWorkspaceProjectId(null);
    }

    setToast(`${project.projectName} was archived.`);
  }

  function restoreProject(project: Project) {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? {
              ...item,
              status: "Planning",
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    setToast(`${project.projectName} was restored to Planning.`);
  }

  function openWorkspace(project: Project) {
    setWorkspaceProjectId(project.id);
    setWorkspaceTab("overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCommandCenterModule(
    moduleTitle: string,
    route: string,
    available: boolean,
  ) {
    if (available) {
      window.location.href = route;
      return;
    }

    setToast(
      `${moduleTitle} is connected to this project workspace and will be activated when its module is built.`,
    );
  }

  function runQuickAction(action: string) {
    setToast(`${action} is ready for connection to its ForemanFirst™ module.`);
  }

  function resetDemoData() {
    const confirmed = window.confirm(
      "Reset the Projects page to the original demonstration project?",
    );

    if (!confirmed) return;

    setProjects(seedProjects);
    setWorkspaceProjectId(null);
    setToast("Demonstration project data was restored.");
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-200 bg-[#0B132B]">
          <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
            <div className="h-8 w-56 animate-pulse rounded-lg bg-white/15" />
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-36 animate-pulse rounded-3xl bg-white shadow-sm" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (workspaceProject) {
    const daysRemaining = getDaysRemaining(
      workspaceProject.targetCompletionDate,
    );

    return (
      <main className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B132B] text-white shadow-lg">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceProjectId(null)}
                className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
              >
                ← Projects
              </button>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  ForemanFirst™ Project Workspace
                </p>
                <h1 className="truncate text-xl font-black sm:text-2xl">
                  {workspaceProject.projectName}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openEditModal(workspaceProject)}
              className="hidden rounded-xl bg-[#00C2FF] px-4 py-2.5 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300 sm:inline-flex"
            >
              Edit Project
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B132B] via-[#142B5F] to-[#075EA8] p-6 text-white shadow-xl sm:p-8">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
              <div className="max-w-4xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                      workspaceProject.status,
                    )}`}
                  >
                    {workspaceProject.status}
                  </span>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                    {workspaceProject.projectNumber}
                  </span>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                    {workspaceProject.projectType}
                  </span>
                </div>

                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {workspaceProject.projectName}
                </h2>

                <p className="mt-3 text-base text-blue-100">
                  {workspaceProject.client}
                  {workspaceProject.city || workspaceProject.state
                    ? ` • ${workspaceProject.city}${
                        workspaceProject.city && workspaceProject.state
                          ? ", "
                          : ""
                      }${workspaceProject.state}`
                    : ""}
                </p>

                <p className="mt-5 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
                  {workspaceProject.description ||
                    "No project description has been entered."}
                </p>
              </div>

              <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur xl:max-w-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">
                      Project Progress
                    </p>
                    <p className="mt-1 text-4xl font-black">
                      {workspaceProject.progress}%
                    </p>
                  </div>

                  <p className="text-right text-sm text-blue-100">
                    {daysRemaining === null
                      ? "Completion date not entered"
                      : daysRemaining >= 0
                        ? `${formatNumber(daysRemaining)} days remaining`
                        : `${formatNumber(
                            Math.abs(daysRemaining),
                          )} days past target`}
                  </p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-[#00C2FF] transition-all"
                    style={{ width: `${workspaceProject.progress}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-blue-200">Start</p>
                    <p className="mt-1 font-bold">
                      {formatDate(workspaceProject.startDate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-blue-200">Target</p>
                    <p className="mt-1 font-bold">
                      {formatDate(workspaceProject.targetCompletionDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              { id: "overview", label: "Overview" },
              { id: "command", label: "Command Center" },
              { id: "activity", label: "Recent Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setWorkspaceTab(
                    tab.id as "overview" | "command" | "activity",
                  )
                }
                className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-black transition ${
                  workspaceTab === tab.id
                    ? "bg-[#0B132B] text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {workspaceTab === "overview" && (
            <div className="mt-6 space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Workers Onsite"
                  value={formatNumber(workspaceProject.workersOnsite)}
                  detail={`${formatNumber(
                    workspaceProject.currentWorkforce,
                  )} current workforce`}
                  tone="blue"
                />

                <MetricCard
                  label="Total Man-Hours"
                  value={formatNumber(workspaceProject.totalManHours)}
                  detail={`${formatNumber(
                    workspaceProject.plannedWorkforce,
                  )} planned peak`}
                  tone="cyan"
                />

                <MetricCard
                  label="Active Contractors"
                  value={formatNumber(workspaceProject.activeContractors)}
                  detail="Companies currently assigned"
                  tone="navy"
                />

                <MetricCard
                  label="Project Health"
                  value={`${workspaceProject.healthScore}%`}
                  detail={
                    workspaceProject.healthScore >= 90
                      ? "Strong project condition"
                      : workspaceProject.healthScore >= 75
                        ? "Monitor performance"
                        : "Leadership attention needed"
                  }
                  tone={
                    workspaceProject.healthScore >= 90
                      ? "green"
                      : workspaceProject.healthScore >= 75
                        ? "amber"
                        : "red"
                  }
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                        Live project condition
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">
                        Safety and Operations
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWorkspaceTab("command")}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      Open Command Center
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <HealthRow
                      label="Training Compliance"
                      value={workspaceProject.trainingCompliance}
                      description="Required training currently compliant"
                    />

                    <HealthRow
                      label="Access Eligibility"
                      value={workspaceProject.accessCompliance}
                      description="Workers eligible for site access"
                    />

                    <HealthRow
                      label="Project Progress"
                      value={workspaceProject.progress}
                      description="Progress toward project completion"
                    />

                    <HealthRow
                      label="Corrective Actions"
                      value={clamp(
                        100 - workspaceProject.openActions * 5,
                        0,
                        100,
                      )}
                      description={`${workspaceProject.openActions} open actions`}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Quick Actions
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Start Field Work
                  </h3>

                  <div className="mt-5 grid gap-2">
                    {quickActions.slice(0, 6).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => runQuickAction(action)}
                        className="flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#0B132B]"
                      >
                        <span>{action}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Safety Performance
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Current Status
                  </h3>

                  <div className="mt-5 space-y-3">
                    <SummaryRow
                      label="Recordable incidents"
                      value={formatNumber(
                        workspaceProject.recordableIncidents,
                      )}
                      danger={workspaceProject.recordableIncidents > 0}
                    />

                    <SummaryRow
                      label="Open corrective actions"
                      value={formatNumber(workspaceProject.openActions)}
                      danger={workspaceProject.openActions > 10}
                    />

                    <SummaryRow
                      label="Open permits"
                      value={formatNumber(workspaceProject.permitsOpen)}
                    />

                    <SummaryRow
                      label="Pending planning documents"
                      value={formatNumber(
                        workspaceProject.planningDocumentsPending,
                      )}
                      danger={workspaceProject.planningDocumentsPending > 5}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Key Contacts
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Project Leadership
                  </h3>

                  <div className="mt-5 space-y-4">
                    <ContactRow
                      role="Project Manager"
                      name={workspaceProject.projectManager}
                    />
                    <ContactRow
                      role="Superintendent"
                      name={workspaceProject.superintendent}
                    />
                    <ContactRow
                      role="Safety Manager"
                      name={workspaceProject.safetyManager}
                    />
                    <ContactRow
                      role="Managing Company"
                      name={workspaceProject.managingCompany}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Vision™ and Access™
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Platform Readiness
                  </h3>

                  <div className="mt-5 space-y-3">
                    <ReadinessCard
                      title="ForemanFirst Access™"
                      status="Ready for setup"
                      description="Worker credentials, attendance, eligibility, and live headcount."
                    />

                    <ReadinessCard
                      title="ForemanFirst Vision™"
                      status="Ready for setup"
                      description="Vision Live™, Capture™, Replay™, and Assistant™."
                    />

                    <ReadinessCard
                      title="Weather Intelligence"
                      status="Future connection"
                      description="Project conditions, alerts, and planning recommendations."
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Project Information
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    General Details
                  </h3>

                  <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                    <DetailItem
                      label="Project Number"
                      value={workspaceProject.projectNumber}
                    />
                    <DetailItem
                      label="Project Type"
                      value={workspaceProject.projectType}
                    />
                    <DetailItem
                      label="Client"
                      value={workspaceProject.client}
                    />
                    <DetailItem
                      label="Managing Company"
                      value={workspaceProject.managingCompany}
                    />
                    <DetailItem
                      label="Contract Value"
                      value={formatCurrency(workspaceProject.contractValue)}
                    />
                    <DetailItem
                      label="Status"
                      value={workspaceProject.status}
                    />
                  </dl>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                    Location
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    Project Address
                  </h3>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="font-black text-slate-900">
                      {workspaceProject.address || "Address not entered"}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {[
                        workspaceProject.city,
                        workspaceProject.state,
                        workspaceProject.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "City, state, and postal code not entered"}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Start Date
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {formatDate(workspaceProject.startDate)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Target Completion
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {formatDate(workspaceProject.targetCompletionDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {workspaceTab === "command" && (
            <div className="mt-6 space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                      ForemanFirst™ Project Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      Manage the entire project from one place
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      Each module will automatically remain connected to this
                      project, its companies, contractors, workers, records, and
                      audit history.
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-800">
                    {commandCenterModules.length} connected modules
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {commandCenterModules.map((module) => (
                    <button
                      key={module.title}
                      type="button"
                      onClick={() =>
                        openCommandCenterModule(
                          module.title,
                          module.route,
                          module.available,
                        )
                      }
                      className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B132B] text-sm font-black text-[#00C2FF]">
                          {module.icon}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 group-hover:bg-cyan-50 group-hover:text-cyan-700">
                          {module.available ? "Open" : "Coming Soon"}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-black text-slate-950">
                        {module.title}
                      </h3>

                      <p className="mt-2 flex-1 text-sm leading-5 text-slate-600">
                        {module.description}
                      </p>

                      <span className="mt-5 text-sm font-black text-blue-700">
                        Open module →
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  Quick Actions
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Common project workflows
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => runQuickAction(action)}
                      className="min-h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-[#0B132B]"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {workspaceTab === "activity" && (
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Project Activity
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Recent activity and audit history
              </h2>

              <div className="mt-8 space-y-4">
                <ActivityItem
                  title="Project workspace reviewed"
                  description="The project overview and current project metrics were opened."
                  date="Today"
                />

                <ActivityItem
                  title="Project information updated"
                  description={`Project record last updated ${new Date(
                    workspaceProject.updatedAt,
                  ).toLocaleString("en-US")}.`}
                  date="Latest update"
                />

                <ActivityItem
                  title="Project record created"
                  description={`Project record created ${new Date(
                    workspaceProject.createdAt,
                  ).toLocaleString("en-US")}.`}
                  date="Created"
                />

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-black text-slate-900">
                    Full audit logging will appear here.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Future records will include approvals, document revisions,
                    access events, safety activities, user actions, and module
                    changes.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {renderProjectModal()}
        {renderToast()}
      </main>
    );
  }

  function renderToast() {
    if (!toast) return null;

    return (
      <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-cyan-200 bg-[#0B132B] px-5 py-4 text-sm font-bold text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00C2FF] font-black text-[#0B132B]">
            ✓
          </span>
          <span>{toast}</span>
        </div>
      </div>
    );
  }

  function renderProjectModal() {
    if (!modalMode) return null;

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
                ForemanFirst™ Projects
              </p>
              <h2 className="mt-1 text-xl font-black">
                {modalMode === "create"
                  ? "Create New Project"
                  : modalMode === "edit"
                    ? "Edit Project"
                    : selectedProject?.projectName}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-xl font-bold transition hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {modalMode === "view" && selectedProject ? (
            <div className="max-h-[calc(96vh-76px)] overflow-y-auto p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        selectedProject.status,
                      )}`}
                    >
                      {selectedProject.status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {selectedProject.projectNumber}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-black text-slate-950">
                    {selectedProject.projectName}
                  </h3>

                  <p className="mt-2 text-slate-600">
                    {selectedProject.client} • {selectedProject.projectType}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    openWorkspace(selectedProject);
                  }}
                  className="rounded-xl bg-[#00C2FF] px-5 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300"
                >
                  Open Project Workspace
                </button>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Managing Company"
                  value={selectedProject.managingCompany}
                />
                <DetailItem
                  label="Project Manager"
                  value={selectedProject.projectManager}
                />
                <DetailItem
                  label="Superintendent"
                  value={selectedProject.superintendent}
                />
                <DetailItem
                  label="Safety Manager"
                  value={selectedProject.safetyManager}
                />
                <DetailItem
                  label="Start Date"
                  value={formatDate(selectedProject.startDate)}
                />
                <DetailItem
                  label="Target Completion"
                  value={formatDate(selectedProject.targetCompletionDate)}
                />
                <DetailItem
                  label="Current Workforce"
                  value={formatNumber(selectedProject.currentWorkforce)}
                />
                <DetailItem
                  label="Active Contractors"
                  value={formatNumber(selectedProject.activeContractors)}
                />
                <DetailItem
                  label="Total Man-Hours"
                  value={formatNumber(selectedProject.totalManHours)}
                />
              </dl>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-2 leading-6 text-slate-700">
                  {selectedProject.description ||
                    "No project description has been entered."}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    duplicateProject(selectedProject);
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(selectedProject)}
                  className="rounded-xl bg-[#0B132B] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-950"
                >
                  Edit Project
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(96vh-76px)] overflow-y-auto"
            >
              <div className="space-y-8 p-5 sm:p-7">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
                  >
                    {formError}
                  </div>
                )}

                <FormSection
                  title="Project Identity"
                  description="Enter the primary information used throughout ForemanFirst™."
                >
                  <TextField
                    label="Project Name"
                    required
                    value={form.projectName}
                    onChange={(value) => updateForm("projectName", value)}
                  />

                  <TextField
                    label="Project Number"
                    required
                    value={form.projectNumber}
                    onChange={(value) => updateForm("projectNumber", value)}
                  />

                  <TextField
                    label="Client"
                    required
                    value={form.client}
                    onChange={(value) => updateForm("client", value)}
                  />

                  <TextField
                    label="Managing Company"
                    value={form.managingCompany}
                    onChange={(value) =>
                      updateForm("managingCompany", value)
                    }
                  />

                  <SelectField
                    label="Project Type"
                    value={form.projectType}
                    options={projectTypes}
                    onChange={(value) =>
                      updateForm("projectType", value as ProjectType)
                    }
                  />

                  <SelectField
                    label="Project Status"
                    value={form.status}
                    options={activeStatuses}
                    onChange={(value) =>
                      updateForm(
                        "status",
                        value as Exclude<ProjectStatus, "Archived">,
                      )
                    }
                  />
                </FormSection>

                <FormSection
                  title="Location and Schedule"
                  description="Define where the project is located and its planned duration."
                >
                  <TextField
                    label="Street Address"
                    value={form.address}
                    onChange={(value) => updateForm("address", value)}
                  />

                  <TextField
                    label="City"
                    value={form.city}
                    onChange={(value) => updateForm("city", value)}
                  />

                  <TextField
                    label="State"
                    value={form.state}
                    onChange={(value) => updateForm("state", value)}
                  />

                  <TextField
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(value) => updateForm("postalCode", value)}
                  />

                  <TextField
                    label="Start Date"
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(value) => updateForm("startDate", value)}
                  />

                  <TextField
                    label="Target Completion Date"
                    type="date"
                    required
                    value={form.targetCompletionDate}
                    onChange={(value) =>
                      updateForm("targetCompletionDate", value)
                    }
                  />
                </FormSection>

                <FormSection
                  title="Project Leadership"
                  description="Assign the primary project leadership contacts."
                >
                  <TextField
                    label="Project Manager"
                    value={form.projectManager}
                    onChange={(value) =>
                      updateForm("projectManager", value)
                    }
                  />

                  <TextField
                    label="Superintendent"
                    value={form.superintendent}
                    onChange={(value) =>
                      updateForm("superintendent", value)
                    }
                  />

                  <TextField
                    label="Safety Manager"
                    value={form.safetyManager}
                    onChange={(value) => updateForm("safetyManager", value)}
                  />
                </FormSection>

                <FormSection
                  title="Workforce and Progress"
                  description="Enter the latest workforce, progress, and operational metrics."
                >
                  <TextField
                    label="Contract Value"
                    type="number"
                    min="0"
                    value={form.contractValue}
                    onChange={(value) =>
                      updateForm("contractValue", value)
                    }
                  />

                  <TextField
                    label="Planned Workforce"
                    type="number"
                    min="0"
                    value={form.plannedWorkforce}
                    onChange={(value) =>
                      updateForm("plannedWorkforce", value)
                    }
                  />

                  <TextField
                    label="Current Workforce"
                    type="number"
                    min="0"
                    value={form.currentWorkforce}
                    onChange={(value) =>
                      updateForm("currentWorkforce", value)
                    }
                  />

                  <TextField
                    label="Workers Onsite"
                    type="number"
                    min="0"
                    value={form.workersOnsite}
                    onChange={(value) =>
                      updateForm("workersOnsite", value)
                    }
                  />

                  <TextField
                    label="Active Contractors"
                    type="number"
                    min="0"
                    value={form.activeContractors}
                    onChange={(value) =>
                      updateForm("activeContractors", value)
                    }
                  />

                  <TextField
                    label="Total Man-Hours"
                    type="number"
                    min="0"
                    value={form.totalManHours}
                    onChange={(value) =>
                      updateForm("totalManHours", value)
                    }
                  />

                  <TextField
                    label="Project Progress %"
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(value) => updateForm("progress", value)}
                  />

                  <TextField
                    label="Project Health Score %"
                    type="number"
                    min="0"
                    max="100"
                    value={form.healthScore}
                    onChange={(value) => updateForm("healthScore", value)}
                  />
                </FormSection>

                <FormSection
                  title="Safety and Compliance"
                  description="Enter current leading indicators and compliance metrics."
                >
                  <TextField
                    label="Open Corrective Actions"
                    type="number"
                    min="0"
                    value={form.openActions}
                    onChange={(value) => updateForm("openActions", value)}
                  />

                  <TextField
                    label="Recordable Incidents"
                    type="number"
                    min="0"
                    value={form.recordableIncidents}
                    onChange={(value) =>
                      updateForm("recordableIncidents", value)
                    }
                  />

                  <TextField
                    label="Open Permits"
                    type="number"
                    min="0"
                    value={form.permitsOpen}
                    onChange={(value) => updateForm("permitsOpen", value)}
                  />

                  <TextField
                    label="Pending Planning Documents"
                    type="number"
                    min="0"
                    value={form.planningDocumentsPending}
                    onChange={(value) =>
                      updateForm("planningDocumentsPending", value)
                    }
                  />

                  <TextField
                    label="Training Compliance %"
                    type="number"
                    min="0"
                    max="100"
                    value={form.trainingCompliance}
                    onChange={(value) =>
                      updateForm("trainingCompliance", value)
                    }
                  />

                  <TextField
                    label="Access Compliance %"
                    type="number"
                    min="0"
                    max="100"
                    value={form.accessCompliance}
                    onChange={(value) =>
                      updateForm("accessCompliance", value)
                    }
                  />
                </FormSection>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-800">
                    Project Description
                  </label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Describe the project scope, objectives, buildings, phases, and important field information."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] shadow transition hover:bg-cyan-300"
                >
                  {modalMode === "create"
                    ? "Create Project"
                    : "Save Project Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-white/10 bg-[#0B132B] text-white shadow-lg">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00C2FF]">
              ForemanFirst™
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Create, manage, and monitor every project from one platform.
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
              + New Project
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-blue-900/10 bg-gradient-to-r from-[#0B132B] via-[#15346F] to-[#0873BE] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-200">
                Project Portfolio
              </span>

              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                One command center for every ForemanFirst™ project.
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 sm:text-base">
                Connect companies, contractors, workers, Access™, Planning™,
                safety workflows, Shutdown™, Vision™, documents, and reporting
                to a single project record.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="min-h-12 rounded-xl bg-white px-6 py-3 text-sm font-black text-[#0B132B] shadow transition hover:bg-cyan-50"
            >
              Create Your Next Project
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <PortfolioKpi
            label="Total Projects"
            value={projects.filter((project) => project.status !== "Archived").length}
            detail="Current project portfolio"
          />

          <PortfolioKpi
            label="Active"
            value={activeProjectCount}
            detail="Currently underway"
          />

          <PortfolioKpi
            label="Planning"
            value={planningProjectCount}
            detail="Preparing to begin"
          />

          <PortfolioKpi
            label="On Hold"
            value={onHoldProjectCount}
            detail="Temporarily paused"
          />

          <PortfolioKpi
            label="Completed"
            value={completedProjectCount}
            detail="Successfully completed"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                Project Directory
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                {showArchived ? "Archived Projects" : "Current Projects"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {visibleProjects.length} project
                {visibleProjects.length === 1 ? "" : "s"} shown
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowArchived(false);
                  if (statusFilter === "Archived") setStatusFilter("All");
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  !showArchived
                    ? "bg-[#0B132B] text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Current Projects
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowArchived(true);
                  setStatusFilter("All");
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                  showArchived
                    ? "bg-[#0B132B] text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Archived ({archivedProjectCount})
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block xl:col-span-1">
              <span className="sr-only">Search projects</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects, clients, or locations..."
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ProjectStatus | "All")
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All statuses</option>
                {showArchived ? (
                  <option value="Archived">Archived</option>
                ) : (
                  activeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">Filter by project type</span>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as ProjectType | "All")
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All">All project types</option>
                {projectTypes.map((projectType) => (
                  <option key={projectType} value={projectType}>
                    {projectType}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">Sort projects</span>
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="start-newest">Newest start date</option>
                <option value="start-oldest">Oldest start date</option>
                <option value="end-soonest">Completion date: soonest</option>
                <option value="progress-highest">Highest progress</option>
              </select>
            </label>
          </div>
        </section>

        {visibleProjects.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
              PR
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              {projects.length === 0
                ? "Create your first ForemanFirst™ project"
                : "No projects match these filters"}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {projects.length === 0
                ? "Your companies, contractors, workers, planning documents, safety records, Access™, and Vision™ activity will connect to the project you create."
                : "Adjust your search or filters to display additional projects."}
            </p>

            <button
              type="button"
              onClick={
                projects.length === 0
                  ? openCreateModal
                  : () => {
                      setSearch("");
                      setStatusFilter("All");
                      setTypeFilter("All");
                    }
              }
              className="mt-6 rounded-xl bg-[#00C2FF] px-6 py-3 text-sm font-black text-[#0B132B] transition hover:bg-cyan-300"
            >
              {projects.length === 0 ? "Create Project" : "Clear Filters"}
            </button>
          </section>
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Project</th>
                      <th className="px-5 py-4">Client</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Schedule</th>
                      <th className="px-5 py-4">Progress</th>
                      <th className="px-5 py-4">Workforce</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {visibleProjects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => openWorkspace(project)}
                        className="cursor-pointer transition hover:bg-cyan-50/50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                              {project.projectName
                                .split(" ")
                                .slice(0, 2)
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-black text-slate-950">
                                {project.projectName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {project.projectNumber} • {project.projectType}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-bold text-slate-800">
                            {project.client || "Not entered"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {project.managingCompany || "No managing company"}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                              project.status,
                            )}`}
                          >
                            {project.status}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm">
                          <p className="font-bold text-slate-800">
                            {formatDate(project.startDate)}
                          </p>
                          <p className="mt-1 text-slate-500">
                            to {formatDate(project.targetCompletionDate)}
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[#00C2FF]"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-black text-slate-800">
                              {project.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-black text-slate-900">
                            {formatNumber(project.currentWorkforce)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatNumber(project.workersOnsite)} onsite
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div
                            className="flex justify-end gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openViewModal(project)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </button>

                            {project.status === "Archived" ? (
                              <button
                                type="button"
                                onClick={() => restoreProject(project)}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(project)}
                                  className="rounded-lg bg-[#0B132B] px-3 py-2 text-xs font-black text-white transition hover:bg-blue-950"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => archiveProject(project)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100"
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

            <section className="grid gap-4 lg:hidden">
              {visibleProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => openWorkspace(project)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B132B] text-xs font-black text-[#00C2FF]">
                          {project.projectName
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-black text-slate-950">
                            {project.projectName}
                          </h3>
                          <p className="mt-1 truncate text-sm text-slate-500">
                            {project.projectNumber}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(
                          project.status,
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MobileStat label="Client" value={project.client} />
                      <MobileStat
                        label="Workforce"
                        value={formatNumber(project.currentWorkforce)}
                      />
                      <MobileStat
                        label="Start"
                        value={formatDate(project.startDate)}
                      />
                      <MobileStat
                        label="Target"
                        value={formatDate(project.targetCompletionDate)}
                      />
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs font-black text-slate-600">
                        <span>Project progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#00C2FF]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => openViewModal(project)}
                      className="min-h-11 rounded-xl border border-slate-300 text-sm font-black text-slate-700"
                    >
                      View
                    </button>

                    {project.status === "Archived" ? (
                      <button
                        type="button"
                        onClick={() => restoreProject(project)}
                        className="min-h-11 rounded-xl bg-emerald-600 text-sm font-black text-white"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditModal(project)}
                        className="min-h-11 rounded-xl bg-[#0B132B] text-sm font-black text-white"
                      >
                        Edit
                      </button>
                    )}

                    {project.status !== "Archived" && (
                      <>
                        <button
                          type="button"
                          onClick={() => duplicateProject(project)}
                          className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => archiveProject(project)}
                          className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 text-sm font-black text-rose-700"
                        >
                          Archive
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

      {renderProjectModal()}
      {renderToast()}
    </main>
  );
}

function PortfolioKpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#0B132B]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "cyan" | "navy" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-950",
    navy: "border-slate-300 bg-[#0B132B] text-white",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-rose-200 bg-rose-50 text-rose-950",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm opacity-70">{detail}</p>
    </div>
  );
}

function HealthRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <p className="text-xl font-black text-[#0B132B]">{value}%</p>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#00C2FF]"
          style={{ width: `${clamp(value, 0, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span
        className={`text-lg font-black ${
          danger ? "text-rose-700" : "text-slate-950"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ContactRow({ role, name }: { role: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
        {(name || role)
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {role}
        </p>
        <p className="font-black text-slate-900">
          {name || "Not assigned"}
        </p>
      </div>
    </div>
  );
}

function ReadinessCard({
  title,
  status,
  description,
}: {
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-black text-slate-900">
        {value || "Not entered"}
      </dd>
    </div>
  );
}

function ActivityItem({
  title,
  description,
  date,
}: {
  title: string;
  description: string;
  date: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 p-5">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#00C2FF] ring-4 ring-cyan-100" />
      <div className="flex-1">
        <div className="flex flex-col justify-between gap-1 sm:flex-row">
          <p className="font-black text-slate-950">{title}</p>
          <p className="text-xs font-bold text-slate-500">{date}</p>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
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
  children: React.ReactNode;
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
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "number";
  required?: boolean;
  min?: string;
  max?: string;
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
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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