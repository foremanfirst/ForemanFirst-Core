import type {
  ContractorApprovalStatus,
  ContractorComplianceStatus,
  ContractorFormData,
  ContractorOrientationStatus,
  ContractorRecord,
} from "./types";

export function formatContractorDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "Not entered";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function contractorInitials(
  contractorName: string,
): string {
  return contractorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatContractorAddress(
  contractor: Pick<
    ContractorRecord,
    "address" | "city" | "state" | "zipCode"
  >,
): string {
  const cityStateZip = [
    contractor.city,
    contractor.state,
    contractor.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return [contractor.address, cityStateZip]
    .filter(Boolean)
    .join(" • ") || "No address entered";
}

export function formatRiskRate(
  value: number | null,
): string {
  if (value === null || value === undefined) {
    return "Not entered";
  }

  return value.toFixed(2);
}

export function contractorToFormData(
  contractor: ContractorRecord,
): ContractorFormData {
  return {
    companyId: contractor.companyId,
    projectId: contractor.projectId ?? "",

    name: contractor.name,
    legalName: contractor.legalName ?? "",
    contractorCode: contractor.contractorCode ?? "",

    trade: contractor.trade ?? "",
    specialty: contractor.specialty ?? "",
    description: contractor.description ?? "",

    primaryContactName:
      contractor.primaryContactName ?? "",
    primaryContactEmail:
      contractor.primaryContactEmail ?? "",
    primaryContactPhone:
      contractor.primaryContactPhone ?? "",

    safetyContactName:
      contractor.safetyContactName ?? "",
    safetyContactEmail:
      contractor.safetyContactEmail ?? "",
    safetyContactPhone:
      contractor.safetyContactPhone ?? "",

    address: contractor.address ?? "",
    city: contractor.city ?? "",
    state: contractor.state ?? "",
    zipCode: contractor.zipCode ?? "",

    workforceCount: String(
      contractor.workforceCount ?? 0,
    ),

    emr:
      contractor.emr === null
        ? ""
        : String(contractor.emr),

    trir:
      contractor.trir === null
        ? ""
        : String(contractor.trir),

    insuranceProvider:
      contractor.insuranceProvider ?? "",

    insuranceExpiresAt:
      contractor.insuranceExpiresAt
        ? contractor.insuranceExpiresAt.slice(0, 10)
        : "",

    orientationStatus:
      contractor.orientationStatus as ContractorOrientationStatus,

    complianceStatus:
      contractor.complianceStatus as ContractorComplianceStatus,

    approvalStatus:
      contractor.approvalStatus as ContractorApprovalStatus,

    isActive: contractor.isActive,
  };
}

export function approvalStatusTone(
  status: string,
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  switch (status) {
    case "Approved":
      return "success";

    case "Conditional":
      return "warning";

    case "Rejected":
      return "danger";

    case "Pending":
      return "info";

    default:
      return "neutral";
  }
}

export function complianceStatusTone(
  status: string,
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  switch (status) {
    case "Compliant":
      return "success";

    case "Action Required":
      return "warning";

    case "Expired":
      return "danger";

    case "Pending":
      return "info";

    default:
      return "neutral";
  }
}

export function orientationStatusTone(
  status: string,
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  switch (status) {
    case "Complete":
      return "success";

    case "Expired":
      return "danger";

    case "Pending":
      return "warning";

    case "Not Required":
      return "neutral";

    default:
      return "info";
  }
}

export function contractorIsInsuranceExpired(
  insuranceExpiresAt: string | null,
): boolean {
  if (!insuranceExpiresAt) {
    return false;
  }

  const expirationDate = new Date(
    insuranceExpiresAt,
  );

  if (Number.isNaN(expirationDate.getTime())) {
    return false;
  }

  return expirationDate.getTime() < Date.now();
}

export function contractorHasComplianceIssue(
  contractor: ContractorRecord,
): boolean {
  return (
    contractor.complianceStatus === "Action Required" ||
    contractor.complianceStatus === "Expired" ||
    contractor.approvalStatus === "Rejected" ||
    contractor.orientationStatus === "Expired" ||
    contractorIsInsuranceExpired(
      contractor.insuranceExpiresAt,
    )
  );
}