export type ProjectStatus =
  | "Planning"
  | "Active"
  | "On Hold"
  | "Completed";

export type ProjectType =
  | "Commercial Construction"
  | "Industrial Construction"
  | "Manufacturing"
  | "Data Center"
  | "Energy"
  | "Infrastructure"
  | "Other";

export interface ProjectCompanyOption {
  id: string;
  name: string;
  companyType: string;
}

export interface ProjectContractorOption {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  trade: string | null;
}

export interface ProjectRecord {
  id: string;
  tenantId: string;
  companyId: string;

  name: string;
  projectCode: string | null;
  clientName: string | null;
  projectType: string | null;
  description: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  location: string | null;

  status: string;

  startDate: string | null;
  endDate: string | null;

  projectManager: string | null;
  superintendent: string | null;
  safetyManager: string | null;

  contractValue: number | null;

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

  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;

  createdAt: string;
  updatedAt: string;

  company: {
    id: string;
    name: string;
    companyType: string;
  };

  contractors?: {
    id: string;
    name: string;
    trade: string | null;
    workforceCount: number;
  }[];

  _count?: {
    workers: number;
    contractors: number;
  };
}

export interface ProjectFormData {
  companyId: string;

  name: string;
  projectCode: string;
  clientName: string;
  projectType: ProjectType;
  description: string;

  address: string;
  city: string;
  state: string;
  zipCode: string;
  location: string;

  status: ProjectStatus;

  startDate: string;
  endDate: string;

  projectManager: string;
  superintendent: string;
  safetyManager: string;

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

  isActive: boolean;
}

export interface ProjectModalProps {
  companies: ProjectCompanyOption[];
  contractors: ProjectContractorOption[];
}

export interface EditProjectModalProps
  extends ProjectModalProps {
  project: ProjectRecord;
}

export const EMPTY_PROJECT_FORM: ProjectFormData = {
  companyId: "",

  name: "",
  projectCode: "",
  clientName: "",
  projectType: "Commercial Construction",
  description: "",

  address: "",
  city: "",
  state: "",
  zipCode: "",
  location: "",

  status: "Planning",

  startDate: "",
  endDate: "",

  projectManager: "",
  superintendent: "",
  safetyManager: "",

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

  isActive: true,
};

export const PROJECT_STATUS_OPTIONS: {
  label: string;
  value: ProjectStatus;
}[] = [
  {
    label: "Planning",
    value: "Planning",
  },
  {
    label: "Active",
    value: "Active",
  },
  {
    label: "On Hold",
    value: "On Hold",
  },
  {
    label: "Completed",
    value: "Completed",
  },
];

export const PROJECT_TYPE_OPTIONS: {
  label: string;
  value: ProjectType;
}[] = [
  {
    label: "Commercial Construction",
    value: "Commercial Construction",
  },
  {
    label: "Industrial Construction",
    value: "Industrial Construction",
  },
  {
    label: "Manufacturing",
    value: "Manufacturing",
  },
  {
    label: "Data Center",
    value: "Data Center",
  },
  {
    label: "Energy",
    value: "Energy",
  },
  {
    label: "Infrastructure",
    value: "Infrastructure",
  },
  {
    label: "Other",
    value: "Other",
  },
];