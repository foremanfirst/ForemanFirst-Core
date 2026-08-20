"use client";
 
import { FormEvent, useEffect, useMemo, useState } from "react";
 
import {
  createProject,
  updateProject,
  archiveProject as archiveProjectAction,
  restoreProject as restoreProjectAction,
  getProjects,
  getProjectCompanies,
} from "./actions";
 
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
  companyId: string;
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
  emergencyContactName: string;
  emergencyContactPhone: string;
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
  companyId: string;
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
  emergencyContactName: string;
  emergencyContactPhone: string;
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

type CompanyOption = {
  id: string;
  name: string;
};

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
  companyId: "",
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
  emergencyContactName: "",
  emergencyContactPhone: "",
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
    available: true,
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
      return "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]";
    case "Planning":
      return "border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]";
    case "On Hold":
      return "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]";
    case "Completed":
      return "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]";
    case "Archived":
      return "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]";
    default:
      return "border-[var(--qoreva-border)] bg-[var(--qoreva-surface-muted)] text-[var(--qoreva-muted)]";
  }
}
 
function projectToForm(project: Project): ProjectFormData {
  return {
    companyId: project.companyId,
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
    emergencyContactName: project.emergencyContactName,
    emergencyContactPhone: project.emergencyContactPhone,
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
  if (!form.companyId.trim()) return "Managing company is required.";
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
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
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
    let isMounted = true;

    async function loadProjectData() {
      try {
        const [loadedProjects, loadedCompanies] = await Promise.all([
          getProjects(),
          getProjectCompanies(),
        ]);

        if (!isMounted) {
          return;
        }

        setProjects(loadedProjects as Project[]);
        setCompanies(loadedCompanies as CompanyOption[]);
      } catch (error) {
        console.error("Unable to load project data:", error);

        if (isMounted) {
          setProjects([]);
          setCompanies([]);
        }
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    }

    void loadProjectData();

    return () => {
      isMounted = false;
    };
  }, []);

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
          project.emergencyContactName,
          project.emergencyContactPhone,
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

  async function reloadProjects() {
    const loadedProjects = await getProjects();
    setProjects(loadedProjects as Project[]);
  }

  function selectManagingCompany(companyId: string) {
    const company = companies.find((item) => item.id === companyId);

    setForm((current) => ({
      ...current,
      companyId,
      managingCompany: company?.name ?? "",
    }));
  }
 
 
  function buildProjectInput(data: ProjectFormData) {
    return {
      companyId: data.companyId,
      name: data.projectName.trim(),
      projectCode: data.projectNumber.trim(),
      clientName: data.client.trim(),
      projectType: data.projectType,
      description: data.description.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      zipCode: data.postalCode.trim(),
      status: data.status,
      startDate: data.startDate,
      endDate: data.targetCompletionDate,
      projectManager: data.projectManager.trim(),
      superintendent: data.superintendent.trim(),
      safetyManager: data.safetyManager.trim(),
      emergencyContactName: data.emergencyContactName.trim(),
      emergencyContactPhone: data.emergencyContactPhone.trim(),
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
      accessCompliance: clamp(
        safeNumber(data.accessCompliance),
        0,
        100,
      ),
      healthScore: clamp(
        safeNumber(data.healthScore),
        0,
        100,
      ),
      isActive: true,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateProject(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      if (modalMode === "create") {
        await createProject(buildProjectInput(form));
        await reloadProjects();

        setToast(`${form.projectName.trim()} was created.`);
        closeModal();
        return;
      }

      if (modalMode === "edit" && selectedProject) {
        await updateProject({
          id: selectedProject.id,
          ...buildProjectInput(form),
        });

        await reloadProjects();

        setToast(`${form.projectName.trim()} was updated.`);
        closeModal();
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the project.",
      );
    }
  }

  async function duplicateProject(project: Project) {
    if (!project.companyId) {
      setToast("This project is missing a managing company.");
      return;
    }

    try {
      await createProject({
        companyId: project.companyId,
        name: `${project.projectName} Copy`,
        projectCode: `${project.projectNumber}-COPY`,
        clientName: project.client,
        projectType: project.projectType,
        description: project.description,
        address: project.address,
        city: project.city,
        state: project.state,
        zipCode: project.postalCode,
        status: "Planning",
        startDate: project.startDate,
        endDate: project.targetCompletionDate,
        projectManager: project.projectManager,
        superintendent: project.superintendent,
        safetyManager: project.safetyManager,
        emergencyContactName: project.emergencyContactName,
        emergencyContactPhone: project.emergencyContactPhone,
        contractValue: project.contractValue,
        plannedWorkforce: project.plannedWorkforce,
        currentWorkforce: 0,
        workersOnsite: 0,
        activeContractors: project.activeContractors,
        totalManHours: 0,
        progress: 0,
        openActions: 0,
        recordableIncidents: 0,
        permitsOpen: project.permitsOpen,
        planningDocumentsPending: project.planningDocumentsPending,
        trainingCompliance: project.trainingCompliance,
        accessCompliance: project.accessCompliance,
        healthScore: project.healthScore,
        isActive: true,
      });

      await reloadProjects();
      setToast(`${project.projectName} was duplicated.`);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Unable to duplicate the project.",
      );
    }
  }

  async function archiveProject(project: Project) {
    const confirmed = window.confirm(
      `Archive ${project.projectName}? The project can be restored later.`,
    );

    if (!confirmed) return;

    try {
      await archiveProjectAction(project.id);
      await reloadProjects();

      if (workspaceProjectId === project.id) {
        setWorkspaceProjectId(null);
      }

      setToast(`${project.projectName} was archived.`);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Unable to archive the project.",
      );
    }
  }

  async function restoreProject(project: Project) {
    try {
      await restoreProjectAction(project.id);
      await reloadProjects();
      setToast(`${project.projectName} was restored to Planning.`);
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Unable to restore the project.",
      );
    }
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
    if (moduleTitle === "Contractors" && workspaceProjectId) {
      window.location.href =
        `/projects/${workspaceProjectId}/contractor-requirements`;
      return;
    }

    if (available) {
      window.location.href = route;
      return;
    }

    setToast(
      `${moduleTitle} is connected to this project workspace and will be activated when its module is built.`,
    );
  }
 
  function runQuickAction(action: string) {
    setToast(`${action} is ready to connect to Qoreva.`);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[var(--qoreva-bone)]">
        <div className="border-b border-[var(--qoreva-border)] bg-[var(--qoreva-obsidian)]">
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
      <main className="min-h-screen bg-transparent">
        <header className="sticky top-[72px] z-20 border-b border-[var(--qoreva-border)] bg-[rgba(244,241,234,0.94)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setWorkspaceProjectId(null)}
                className="shrink-0 rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-3 py-2 text-sm font-black text-[var(--qoreva-text)] transition hover:border-[rgba(102,87,232,0.25)] hover:bg-[var(--qoreva-violet-faint)]"
              >
                ← Projects
              </button>
 
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                  Qoreva™ Project Workspace
                </p>
                <h1 className="truncate text-xl font-black tracking-[-0.025em] text-[var(--qoreva-obsidian)] sm:text-2xl">
                  {workspaceProject.projectName}
                </h1>
              </div>
            </div>
 
            <button
              type="button"
              onClick={() => openEditModal(workspaceProject)}
              className="hidden rounded-xl bg-[var(--qoreva-violet)] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[var(--qoreva-violet-hover)] sm:inline-flex"
            >
              Edit Project
            </button>
          </div>
        </header>
 
        <div className="space-y-6 py-6">
          <section className="qoreva-command-surface overflow-hidden p-6 sm:p-8">
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
 
                <p className="mt-3 text-base text-white/70">
                  {workspaceProject.client}
                  {workspaceProject.city || workspaceProject.state
                    ? ` • ${workspaceProject.city}${
                        workspaceProject.city && workspaceProject.state
                          ? ", "
                          : ""
                      }${workspaceProject.state}`
                    : ""}
                </p>
 
                <p className="mt-5 max-w-3xl text-sm leading-6 text-white/70 sm:text-base">
                  {workspaceProject.description ||
                    "No project description has been entered."}
                </p>
              </div>
 
              <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur xl:max-w-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#B9B0FF]">
                      Project Progress
                    </p>
                    <p className="mt-1 text-4xl font-black">
                      {workspaceProject.progress}%
                    </p>
                  </div>
 
                  <p className="text-right text-sm text-white/70">
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
                    className="h-full rounded-full bg-[var(--qoreva-violet)] transition-all"
                    style={{ width: `${workspaceProject.progress}%` }}
                  />
                </div>
 
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-white/60">Start</p>
                    <p className="mt-1 font-bold">
                      {formatDate(workspaceProject.startDate)}
                    </p>
                  </div>
 
                  <div className="rounded-xl bg-white/10 p-3">
                    <p className="text-white/60">Target</p>
                    <p className="mt-1 font-bold">
                      {formatDate(workspaceProject.targetCompletionDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
 
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--qoreva-border)] bg-white p-2 shadow-[var(--qoreva-shadow-sm)]">
            {[
              { id: "overview", label: "Overview" },
              { id: "command", label: "Command" },
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
                    ? "bg-[var(--qoreva-violet)] text-white shadow-sm"
                    : "text-[var(--qoreva-muted)] hover:bg-[var(--qoreva-surface-muted)]"
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
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                        Live project condition
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                        Safety and Operations
                      </h3>
                    </div>
 
                    <button
                      type="button"
                      onClick={() => setWorkspaceTab("command")}
                      className="rounded-xl border border-[var(--qoreva-border)] px-4 py-2 text-sm font-bold text-[var(--qoreva-text)] transition hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-soft)]"
                    >
                      Open Command
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
 
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Quick Actions
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                    Start Field Work
                  </h3>
 
                  <div className="mt-5 grid gap-2">
                    {quickActions.slice(0, 6).map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => runQuickAction(action)}
                        className="flex min-h-12 items-center justify-between rounded-xl border border-[var(--qoreva-border)] px-4 py-3 text-left text-sm font-bold text-[var(--qoreva-text)] transition hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-soft)] hover:text-[var(--qoreva-obsidian)]"
                      >
                        <span>{action}</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
 
              <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Safety Performance
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
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
 
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Key Contacts
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
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
                      role="Emergency Contact"
                      name={
                        workspaceProject.emergencyContactName ||
                        workspaceProject.emergencyContactPhone
                      }
                    />
                    <ContactRow
                      role="Managing Company"
                      name={workspaceProject.managingCompany}
                    />
                  </div>
                </div>
 
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Vision™ and Access™
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                    Platform Readiness
                  </h3>
 
                  <div className="mt-5 space-y-3">
                    <ReadinessCard
                      title="Qoreva Access™"
                      status="Ready for setup"
                      description="Worker credentials, attendance, eligibility, and live headcount."
                    />
 
                    <ReadinessCard
                      title="Qoreva Vision™"
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
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Project Information
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
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
                    <DetailItem
                      label="Emergency Contact"
                      value={workspaceProject.emergencyContactName}
                    />
                    <DetailItem
                      label="Emergency Phone Number"
                      value={workspaceProject.emergencyContactPhone}
                    />
                  </dl>
                </div>
 
                <div className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                    Location
                  </p>
                  <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                    Project Address
                  </h3>
 
                  <div className="mt-6 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-bone)] p-5">
                    <p className="font-black text-[var(--qoreva-ink)]">
                      {workspaceProject.address || "Address not entered"}
                    </p>
                    <p className="mt-1 text-[var(--qoreva-muted)]">
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
                    <div className="rounded-xl border border-[var(--qoreva-border)] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--qoreva-muted)]">
                        Start Date
                      </p>
                      <p className="mt-1 font-black text-[var(--qoreva-ink)]">
                        {formatDate(workspaceProject.startDate)}
                      </p>
                    </div>
 
                    <div className="rounded-xl border border-[var(--qoreva-border)] p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--qoreva-muted)]">
                        Target Completion
                      </p>
                      <p className="mt-1 font-black text-[var(--qoreva-ink)]">
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
              <section className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                      Qoreva Command™
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[var(--qoreva-obsidian)]">
                      Manage the entire project from one place
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--qoreva-muted)]">
                      Each module will automatically remain connected to this
                      project, its companies, contractors, workers, records, and
                      audit history.
                    </p>
                  </div>
 
                  <span className="inline-flex w-fit rounded-full border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] px-3 py-1.5 text-xs font-black text-[var(--qoreva-violet-dark)]">
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
                      className="group flex min-h-44 flex-col rounded-2xl border border-[var(--qoreva-border)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[rgba(102,87,232,0.28)] hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--qoreva-obsidian)] text-sm font-black text-[var(--qoreva-violet)]">
                          {module.icon}
                        </span>
 
                        <span className="rounded-full bg-[var(--qoreva-surface-muted)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)] group-hover:bg-[var(--qoreva-violet-soft)] group-hover:text-[var(--qoreva-violet-dark)]">
                          {module.available ? "Open" : "Coming Soon"}
                        </span>
                      </div>
 
                      <h3 className="mt-5 text-lg font-black text-[var(--qoreva-obsidian)]">
                        {module.title}
                      </h3>
 
                      <p className="mt-2 flex-1 text-sm leading-5 text-[var(--qoreva-muted)]">
                        {module.description}
                      </p>
 
                      <span className="mt-5 text-sm font-black text-[var(--qoreva-violet-dark)]">
                        Open module →
                      </span>
                    </button>
                  ))}
                </div>
              </section>
 
              <section className="rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                  Quick Actions
                </p>
                <h3 className="mt-1 text-xl font-black text-[var(--qoreva-obsidian)]">
                  Common project workflows
                </h3>
 
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => runQuickAction(action)}
                      className="min-h-14 rounded-xl border border-[var(--qoreva-border)] bg-[var(--qoreva-bone)] px-4 py-3 text-sm font-black text-[var(--qoreva-text)] transition hover:border-[rgba(102,87,232,0.28)] hover:bg-[var(--qoreva-violet-soft)] hover:text-[var(--qoreva-obsidian)]"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
 
          {workspaceTab === "activity" && (
            <section className="mt-6 rounded-3xl border border-[var(--qoreva-border)] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                Project Activity
              </p>
              <h2 className="mt-1 text-2xl font-black text-[var(--qoreva-obsidian)]">
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
 
                <div className="rounded-2xl border border-dashed border-[var(--qoreva-border-strong)] bg-[var(--qoreva-bone)] p-8 text-center">
                  <p className="font-black text-[var(--qoreva-ink)]">
                    Full audit logging will appear here.
                  </p>
                  <p className="mt-2 text-sm text-[var(--qoreva-muted)]">
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
      <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-obsidian)] px-5 py-4 text-sm font-bold text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--qoreva-violet)] font-black text-[var(--qoreva-obsidian)]">
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
          <div className="relative flex items-center justify-between overflow-hidden border-b border-white/10 bg-[var(--qoreva-obsidian)] px-5 py-4 text-white sm:px-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Qoreva™ Projects
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
              <div className="flex flex-col justify-between gap-4 border-b border-[var(--qoreva-border)] pb-6 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                        selectedProject.status,
                      )}`}
                    >
                      {selectedProject.status}
                    </span>
 
                    <span className="rounded-full bg-[var(--qoreva-surface-muted)] px-3 py-1 text-xs font-black text-[var(--qoreva-muted)]">
                      {selectedProject.projectNumber}
                    </span>
                  </div>
 
                  <h3 className="mt-4 text-2xl font-black text-[var(--qoreva-obsidian)]">
                    {selectedProject.projectName}
                  </h3>
 
                  <p className="mt-2 text-[var(--qoreva-muted)]">
                    {selectedProject.client} • {selectedProject.projectType}
                  </p>
                </div>
 
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    openWorkspace(selectedProject);
                  }}
                  className="rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
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
                  label="Emergency Contact"
                  value={selectedProject.emergencyContactName}
                />
                <DetailItem
                  label="Emergency Phone Number"
                  value={selectedProject.emergencyContactPhone}
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
 
              <div className="mt-7 rounded-2xl border border-[var(--qoreva-border)] bg-[var(--qoreva-bone)] p-5">
                <p className="text-xs font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
                  Description
                </p>
                <p className="mt-2 leading-6 text-[var(--qoreva-text)]">
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
                  className="rounded-xl border border-[var(--qoreva-border-strong)] px-5 py-3 text-sm font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
                >
                  Duplicate
                </button>
 
                <button
                  type="button"
                  onClick={() => openEditModal(selectedProject)}
                  className="rounded-xl bg-[var(--qoreva-violet)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
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
                  description="Enter the primary information used throughout Qoreva™."
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
 
                  <CompanySelectField
                    label="Managing Company"
                    required
                    value={form.companyId}
                    companies={companies}
                    onChange={selectManagingCompany}
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
                  title="Emergency Information"
                  description="Set the project emergency contact information that Qoreva will automatically display on Daily WSE records."
                >
                  <TextField
                    label="Emergency Contact Name"
                    value={form.emergencyContactName}
                    onChange={(value) =>
                      updateForm("emergencyContactName", value)
                    }
                  />

                  <TextField
                    label="Emergency Phone Number"
                    value={form.emergencyContactPhone}
                    onChange={(value) =>
                      updateForm("emergencyContactPhone", value)
                    }
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
                  <label className="mb-2 block text-sm font-black text-[var(--qoreva-text)]">
                    Project Description
                  </label>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Describe the project scope, objectives, buildings, phases, and important field information."
                    className="w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 py-3 text-sm font-medium text-[var(--qoreva-ink)] outline-none transition placeholder:text-[var(--qoreva-subtle)] hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
                  />
                </div>
              </div>
 
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[var(--qoreva-border)] bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[var(--qoreva-border-strong)] px-5 py-3 text-sm font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
                >
                  Cancel
                </button>
 
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--qoreva-violet)] px-6 py-3 text-sm font-black text-white shadow transition hover:bg-[var(--qoreva-violet-hover)]"
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
    <main className="min-h-screen bg-transparent">
      <div className="space-y-6">
        <section className="qoreva-surface-elevated overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--qoreva-violet)]" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--qoreva-violet)]">
                  Project Portfolio
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--qoreva-obsidian)] sm:text-4xl">
                Projects
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--qoreva-muted)]">
                Open a project to manage workforce, readiness, safety, planning, contractors, documents, and project activity from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--qoreva-violet)] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-px hover:bg-[var(--qoreva-violet-hover)] hover:shadow-[0_8px_20px_rgba(102,87,232,0.18)]"
            >
              + New Project
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
 
        <section className="qoreva-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#B9B0FF]">
                Project Directory
              </p>
              <h2 className="mt-1 text-2xl font-black text-[var(--qoreva-obsidian)]">
                {showArchived ? "Archived Projects" : "Current Projects"}
              </h2>
              <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
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
                    ? "bg-[var(--qoreva-violet)] text-white shadow-sm"
                    : "border border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:bg-[var(--qoreva-surface-muted)]"
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
                    ? "bg-[var(--qoreva-violet)] text-white shadow-sm"
                    : "border border-[var(--qoreva-border-strong)] bg-white text-[var(--qoreva-text)] hover:bg-[var(--qoreva-surface-muted)]"
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
                className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm font-medium text-[var(--qoreva-ink)] outline-none transition placeholder:text-[var(--qoreva-subtle)] hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
              />
            </label>
 
            <label className="block">
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as ProjectStatus | "All")
                }
                className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--qoreva-text)] outline-none transition hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
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
                className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--qoreva-text)] outline-none transition hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
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
                className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--qoreva-text)] outline-none transition hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
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
          <section className="rounded-3xl border border-dashed border-[var(--qoreva-border-strong)] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--qoreva-surface-muted)] text-2xl font-black text-[var(--qoreva-muted)]">
              PR
            </div>
 
            <h2 className="mt-5 text-xl font-black text-[var(--qoreva-obsidian)]">
              {projects.length === 0
                ? "Create your first Qoreva project"
                : "No projects match these filters"}
            </h2>
 
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--qoreva-muted)]">
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
              className="mt-6 rounded-xl bg-[var(--qoreva-violet)] px-6 py-3 text-sm font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
            >
              {projects.length === 0 ? "Create Project" : "Clear Filters"}
            </button>
          </section>
        ) : (
          <>
            <section className="hidden overflow-hidden rounded-[1.5rem] border border-[var(--qoreva-border)] bg-white shadow-[var(--qoreva-shadow-sm)] lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[var(--qoreva-surface-muted)]">
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
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
                        className="cursor-pointer transition hover:bg-[var(--qoreva-violet-soft)]/50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--qoreva-violet-soft)] text-xs font-black text-[var(--qoreva-violet-dark)]">
                              {project.projectName
                                .split(" ")
                                .slice(0, 2)
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()}
                            </div>
 
                            <div>
                              <p className="font-black text-[var(--qoreva-obsidian)]">
                                {project.projectName}
                              </p>
                              <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
                                {project.projectNumber} • {project.projectType}
                              </p>
                            </div>
                          </div>
                        </td>
 
                        <td className="px-5 py-5">
                          <p className="font-bold text-[var(--qoreva-text)]">
                            {project.client || "Not entered"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--qoreva-muted)]">
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
                          <p className="font-bold text-[var(--qoreva-text)]">
                            {formatDate(project.startDate)}
                          </p>
                          <p className="mt-1 text-[var(--qoreva-muted)]">
                            to {formatDate(project.targetCompletionDate)}
                          </p>
                        </td>
 
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[var(--qoreva-violet)]"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-black text-[var(--qoreva-text)]">
                              {project.progress}%
                            </span>
                          </div>
                        </td>
 
                        <td className="px-5 py-5">
                          <p className="font-black text-[var(--qoreva-ink)]">
                            {formatNumber(project.currentWorkforce)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--qoreva-muted)]">
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
                              className="rounded-lg border border-[var(--qoreva-border-strong)] px-3 py-2 text-xs font-black text-[var(--qoreva-text)] transition hover:bg-[var(--qoreva-surface-muted)]"
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
                                  className="rounded-lg bg-[var(--qoreva-violet)] px-3 py-2 text-xs font-black text-white transition hover:bg-[var(--qoreva-violet-hover)]"
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
                  className="rounded-[1.5rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)]"
                >
                  <button
                    type="button"
                    onClick={() => openWorkspace(project)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--qoreva-violet-soft)] text-xs font-black text-[var(--qoreva-violet-dark)]">
                          {project.projectName
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()}
                        </div>
 
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-[var(--qoreva-obsidian)]">
                            {project.projectName}
                          </h3>
                          <p className="mt-1 truncate text-sm text-[var(--qoreva-muted)]">
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
                      <div className="flex justify-between text-xs font-black text-[var(--qoreva-muted)]">
                        <span>Project progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[var(--qoreva-violet)]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </button>
 
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--qoreva-border)] pt-4">
                    <button
                      type="button"
                      onClick={() => openViewModal(project)}
                      className="min-h-11 rounded-xl border border-[var(--qoreva-border-strong)] text-sm font-black text-[var(--qoreva-text)]"
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
                        className="min-h-11 rounded-xl bg-[var(--qoreva-violet)] text-sm font-black text-white"
                      >
                        Edit
                      </button>
                    )}
 
                    {project.status !== "Archived" && (
                      <>
                        <button
                          type="button"
                          onClick={() => duplicateProject(project)}
                          className="min-h-11 rounded-xl border border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] text-sm font-black text-[var(--qoreva-violet-dark)]"
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
    <div className="group relative overflow-hidden rounded-[1.4rem] border border-[var(--qoreva-border)] bg-white p-5 shadow-[var(--qoreva-shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(102,87,232,0.22)] hover:shadow-[var(--qoreva-shadow)]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-[var(--qoreva-violet)]" />
      <p className="pl-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--qoreva-muted)]">
        {label}
      </p>
      <p className="mt-2 pl-1 text-3xl font-black tracking-[-0.04em] text-[var(--qoreva-obsidian)]">
        {value}
      </p>
      <p className="mt-1 pl-1 text-sm font-medium text-[var(--qoreva-muted)]">
        {detail}
      </p>
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
    blue: "border-[rgba(102,87,232,0.20)] bg-[var(--qoreva-violet-soft)] text-[var(--qoreva-violet-dark)]",
    cyan: "border-[var(--qoreva-border)] bg-white text-[var(--qoreva-obsidian)]",
    navy: "border-white/10 bg-[var(--qoreva-obsidian)] text-white",
    green: "border-[#BDE8D4] bg-[var(--qoreva-success-soft)] text-[var(--qoreva-success)]",
    amber: "border-[#F0D5A4] bg-[var(--qoreva-warning-soft)] text-[#9B6212]",
    red: "border-[#F0BDC4] bg-[var(--qoreva-danger-soft)] text-[var(--qoreva-danger)]",
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
    <div className="rounded-2xl border border-[var(--qoreva-border)] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-[var(--qoreva-ink)]">{label}</p>
          <p className="mt-1 text-xs text-[var(--qoreva-muted)]">{description}</p>
        </div>
        <p className="text-xl font-black text-[var(--qoreva-obsidian)]">{value}%</p>
      </div>
 
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[var(--qoreva-violet)]"
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--qoreva-border)] p-4">
      <span className="text-sm font-semibold text-[var(--qoreva-muted)]">{label}</span>
      <span
        className={`text-lg font-black ${
          danger ? "text-rose-700" : "text-[var(--qoreva-obsidian)]"
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--qoreva-violet-soft)] text-xs font-black text-[var(--qoreva-violet-dark)]">
        {(name || role)
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()}
      </div>
 
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--qoreva-muted)]">
          {role}
        </p>
        <p className="font-black text-[var(--qoreva-ink)]">
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
    <div className="rounded-xl border border-[var(--qoreva-border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-black text-[var(--qoreva-ink)]">{title}</p>
        <span className="shrink-0 rounded-full border border-[rgba(102,87,232,0.18)] bg-[var(--qoreva-violet-soft)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--qoreva-violet-dark)]">
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--qoreva-muted)]">{description}</p>
    </div>
  );
}
 
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-black text-[var(--qoreva-ink)]">
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
    <div className="flex gap-4 rounded-2xl border border-[var(--qoreva-border)] p-5">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--qoreva-violet)] ring-4 ring-[rgba(102,87,232,0.10)]" />
      <div className="flex-1">
        <div className="flex flex-col justify-between gap-1 sm:flex-row">
          <p className="font-black text-[var(--qoreva-obsidian)]">{title}</p>
          <p className="text-xs font-bold text-[var(--qoreva-muted)]">{date}</p>
        </div>
        <p className="mt-1 text-sm leading-6 text-[var(--qoreva-muted)]">{description}</p>
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
      <div className="border-b border-[var(--qoreva-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-1 rounded-full bg-[var(--qoreva-violet)]" />
          <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--qoreva-obsidian)]">
            {title}
          </h3>
        </div>
        <p className="mt-1.5 pl-3.5 text-sm font-medium text-[var(--qoreva-muted)]">
          {description}
        </p>
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
      <span className="mb-2 block text-sm font-black text-[var(--qoreva-text)]">
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
        className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm font-medium text-[var(--qoreva-ink)] outline-none transition placeholder:text-[var(--qoreva-subtle)] hover:border-[#BBB6C6] focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
      />
    </label>
  );
}
 
function CompanySelectField({
  label,
  value,
  companies,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  companies: CompanyOption[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[var(--qoreva-text)]">
        {label}
        {required && <span className="ml-1 text-rose-600">*</span>}
      </span>

      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm text-[var(--qoreva-ink)] outline-none transition focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
      >
        <option value="">Select managing company</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
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
      <span className="mb-2 block text-sm font-black text-[var(--qoreva-text)]">
        {label}
      </span>
 
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[var(--qoreva-border-strong)] bg-white px-4 text-sm text-[var(--qoreva-ink)] outline-none transition focus:border-[var(--qoreva-violet)] focus:ring-4 focus:ring-[rgba(102,87,232,0.10)]"
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
    <div className="rounded-xl bg-[var(--qoreva-bone)] p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[var(--qoreva-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[var(--qoreva-ink)]">
        {value || "Not entered"}
      </p>
    </div>
  );
}