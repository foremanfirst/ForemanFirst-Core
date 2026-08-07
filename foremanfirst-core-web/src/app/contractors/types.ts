export type ContractorStatus =
  | "Active"
  | "Inactive"
  | "Archived";

export type ContractorApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Conditional";

export type ContractorComplianceStatus =
  | "Pending"
  | "Compliant"
  | "Action Required"
  | "Expired";

export type ContractorOrientationStatus =
  | "Pending"
  | "Complete"
  | "Expired"
  | "Not Required";

export type ContractorDocumentExpirationStatus =
  | "Current"
  | "Expiring Soon"
  | "Expired"
  | "No Expiration";

export type ContractorOption = {
  id: string;
  name: string;
};

export type ContractorCompanyOption = {
  id: string;
  name: string;
  companyType: string;
};

export type ContractorProjectOption = {
  id: string;
  name: string;
  projectCode: string | null;
  companyId: string;
};

export type ContractorDocumentRecord = {
  id: string;
  tenantId?: string;

  contractorId: string;
  projectId: string | null;

  documentType: string;
  documentName: string;

  fileName: string;
  mimeType: string;
  fileSize: number;

  storageProvider: string;
  storageKey: string;
  storageUrl: string | null;

  effectiveDate: string | null;
  expirationDate: string | null;

  approvalStatus: string;
  reviewStatus: string;

  notes: string | null;

  aiProcessingStatus: string;
  aiDocumentType?: string | null;
  aiConfidence?: number | null;
  extractedData?: unknown;
  confirmedData?: unknown;

  uploadedBy: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;

  isActive: boolean;
  isArchived: boolean;
  archivedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ContractorFormData = {
  companyId: string;
  projectId: string;

  name: string;
  legalName: string;
  contractorCode: string;

  trade: string;
  specialty: string;
  description: string;

  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;

  safetyContactName: string;
  safetyContactEmail: string;
  safetyContactPhone: string;

  address: string;
  city: string;
  state: string;
  zipCode: string;

  workforceCount: string;

  emr: string;
  trir: string;

  insuranceProvider: string;
  insuranceExpiresAt: string;

  orientationStatus: ContractorOrientationStatus;
  complianceStatus: ContractorComplianceStatus;
  approvalStatus: ContractorApprovalStatus;

  isActive: boolean;
};

export type ContractorRecord = {
  id: string;
  tenantId: string;

  companyId: string;
  projectId: string | null;

  name: string;
  legalName: string | null;
  contractorCode: string | null;

  trade: string | null;
  specialty: string | null;
  description: string | null;

  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;

  safetyContactName: string | null;
  safetyContactEmail: string | null;
  safetyContactPhone: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;

  workforceCount: number;

  emr: number | null;
  trir: number | null;

  insuranceProvider: string | null;
  insuranceExpiresAt: string | null;

  orientationStatus: string;
  complianceStatus: string;
  approvalStatus: string;

  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;

  createdAt: string;
  updatedAt: string;

  company: ContractorCompanyOption;
  project: ContractorProjectOption | null;

  documents: ContractorDocumentRecord[];
};

export type ContractorModalProps = {
  companies: ContractorCompanyOption[];
  projects: ContractorProjectOption[];
};

export const EMPTY_CONTRACTOR_FORM: ContractorFormData = {
  companyId: "",
  projectId: "",

  name: "",
  legalName: "",
  contractorCode: "",

  trade: "",
  specialty: "",
  description: "",

  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",

  safetyContactName: "",
  safetyContactEmail: "",
  safetyContactPhone: "",

  address: "",
  city: "",
  state: "",
  zipCode: "",

  workforceCount: "0",

  emr: "",
  trir: "",

  insuranceProvider: "",
  insuranceExpiresAt: "",

  orientationStatus: "Pending",
  complianceStatus: "Pending",
  approvalStatus: "Pending",

  isActive: true,
};