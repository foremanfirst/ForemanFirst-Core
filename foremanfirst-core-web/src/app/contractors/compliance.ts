import type {
  ContractorDocumentRecord,
} from "./types";

export type ContractorComplianceItemStatus =
  | "Missing"
  | "Current"
  | "Expiring Soon"
  | "Expired"
  | "Awaiting Review";

export type ContractorDocumentRequirementRecord = {
  id: string;
  tenantId: string;
  projectId: string;

  documentType: string;
  name: string;
  description: string | null;

  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;

  sortOrder: number;

  isActive: boolean;
  isArchived: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type ContractorComplianceItem = {
  requirementId: string;

  documentType: string;
  requirementName: string;
  description: string | null;

  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;

  status: ContractorComplianceItemStatus;

  documentId: string | null;
  documentName: string | null;

  effectiveDate: string | null;
  expirationDate: string | null;

  approvalStatus: string | null;
  reviewStatus: string | null;

  daysUntilExpiration: number | null;
};

export type ContractorComplianceSummary = {
  totalRequirements: number;

  current: number;
  missing: number;
  expiringSoon: number;
  expired: number;
  awaitingReview: number;

  compliantCount: number;

  compliancePercentage: number;

  overallStatus:
    | "Compliant"
    | "Needs Attention"
    | "No Requirements";

  items: ContractorComplianceItem[];
};

const EXPIRING_SOON_DAYS = 30;

export function evaluateContractorCompliance(
  requirements: ContractorDocumentRequirementRecord[],
  documents: ContractorDocumentRecord[],
): ContractorComplianceSummary {
  const activeRequirements = requirements
    .filter(
      (requirement) =>
        requirement.isActive &&
        !requirement.isArchived &&
        requirement.isRequired,
    )
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );

  if (activeRequirements.length === 0) {
    return {
      totalRequirements: 0,

      current: 0,
      missing: 0,
      expiringSoon: 0,
      expired: 0,
      awaitingReview: 0,

      compliantCount: 0,

      compliancePercentage: 100,

      overallStatus: "No Requirements",

      items: [],
    };
  }

  const activeDocuments = documents.filter(
    (document) =>
      document.isActive &&
      !document.isArchived,
  );

  const items = activeRequirements.map(
    (requirement) =>
      evaluateRequirement(
        requirement,
        activeDocuments,
      ),
  );

  const current = items.filter(
    (item) => item.status === "Current",
  ).length;

  const missing = items.filter(
    (item) => item.status === "Missing",
  ).length;

  const expiringSoon = items.filter(
    (item) => item.status === "Expiring Soon",
  ).length;

  const expired = items.filter(
    (item) => item.status === "Expired",
  ).length;

  const awaitingReview = items.filter(
    (item) => item.status === "Awaiting Review",
  ).length;

  const compliantCount = current;

  const compliancePercentage = Math.round(
    (compliantCount /
      activeRequirements.length) *
      100,
  );

  const hasAttentionItem =
    missing > 0 ||
    expiringSoon > 0 ||
    expired > 0 ||
    awaitingReview > 0;

  return {
    totalRequirements:
      activeRequirements.length,

    current,
    missing,
    expiringSoon,
    expired,
    awaitingReview,

    compliantCount,

    compliancePercentage,

    overallStatus: hasAttentionItem
      ? "Needs Attention"
      : "Compliant",

    items,
  };
}

function evaluateRequirement(
  requirement: ContractorDocumentRequirementRecord,
  documents: ContractorDocumentRecord[],
): ContractorComplianceItem {
  const matchingDocuments = documents
    .filter(
      (document) =>
        normalizeDocumentType(
          document.documentType,
        ) ===
        normalizeDocumentType(
          requirement.documentType,
        ),
    )
    .sort(compareDocumentsNewestFirst);

  const document = matchingDocuments[0];

  if (!document) {
    return createComplianceItem({
      requirement,
      status: "Missing",
      document: null,
      daysUntilExpiration: null,
    });
  }

  const daysUntilExpiration =
    calculateDaysUntilExpiration(
      document.expirationDate,
    );

  if (requirement.expirationRequired) {
    if (!document.expirationDate) {
      return createComplianceItem({
        requirement,
        status: "Awaiting Review",
        document,
        daysUntilExpiration: null,
      });
    }

    if (
      daysUntilExpiration !== null &&
      daysUntilExpiration < 0
    ) {
      return createComplianceItem({
        requirement,
        status: "Expired",
        document,
        daysUntilExpiration,
      });
    }

    if (
      daysUntilExpiration !== null &&
      daysUntilExpiration <=
        EXPIRING_SOON_DAYS
    ) {
      return createComplianceItem({
        requirement,
        status: "Expiring Soon",
        document,
        daysUntilExpiration,
      });
    }
  }

  if (
    document.expirationDate &&
    daysUntilExpiration !== null
  ) {
    if (daysUntilExpiration < 0) {
      return createComplianceItem({
        requirement,
        status: "Expired",
        document,
        daysUntilExpiration,
      });
    }

    if (
      daysUntilExpiration <=
      EXPIRING_SOON_DAYS
    ) {
      return createComplianceItem({
        requirement,
        status: "Expiring Soon",
        document,
        daysUntilExpiration,
      });
    }
  }

  if (
    requirement.reviewRequired &&
    !isDocumentReviewed(document)
  ) {
    return createComplianceItem({
      requirement,
      status: "Awaiting Review",
      document,
      daysUntilExpiration,
    });
  }

  return createComplianceItem({
    requirement,
    status: "Current",
    document,
    daysUntilExpiration,
  });
}

function createComplianceItem({
  requirement,
  status,
  document,
  daysUntilExpiration,
}: {
  requirement: ContractorDocumentRequirementRecord;
  status: ContractorComplianceItemStatus;
  document: ContractorDocumentRecord | null;
  daysUntilExpiration: number | null;
}): ContractorComplianceItem {
  return {
    requirementId: requirement.id,

    documentType: requirement.documentType,
    requirementName: requirement.name,
    description: requirement.description,

    isRequired: requirement.isRequired,
    expirationRequired:
      requirement.expirationRequired,
    reviewRequired: requirement.reviewRequired,

    status,

    documentId: document?.id ?? null,

    documentName:
      document?.documentName ??
      document?.fileName ??
      null,

    effectiveDate:
      document?.effectiveDate ?? null,

    expirationDate:
      document?.expirationDate ?? null,

    approvalStatus:
      document?.approvalStatus ?? null,

    reviewStatus:
      document?.reviewStatus ?? null,

    daysUntilExpiration,
  };
}

function isDocumentReviewed(
  document: ContractorDocumentRecord,
) {
  const reviewStatus =
    document.reviewStatus
      ?.trim()
      .toLowerCase() ?? "";

  const approvalStatus =
    document.approvalStatus
      ?.trim()
      .toLowerCase() ?? "";

  const reviewComplete =
    reviewStatus === "reviewed" ||
    reviewStatus === "approved" ||
    reviewStatus === "complete" ||
    reviewStatus === "accepted";

  const approvalComplete =
    approvalStatus === "approved" ||
    approvalStatus === "conditional";

  return reviewComplete || approvalComplete;
}

function normalizeDocumentType(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compareDocumentsNewestFirst(
  a: ContractorDocumentRecord,
  b: ContractorDocumentRecord,
) {
  const aTime = getComparableDate(a);
  const bTime = getComparableDate(b);

  return bTime - aTime;
}

function getComparableDate(
  document: ContractorDocumentRecord,
) {
  const effectiveDate =
    parseDate(document.effectiveDate);

  if (effectiveDate) {
    return effectiveDate.getTime();
  }

  const createdDate =
    parseDate(document.createdAt);

  return createdDate?.getTime() ?? 0;
}

function calculateDaysUntilExpiration(
  expirationDate: string | null,
) {
  const expiration =
    parseDate(expirationDate);

  if (!expiration) {
    return null;
  }

  const today = startOfDay(new Date());
  const expirationDay =
    startOfDay(expiration);

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.ceil(
    (expirationDay.getTime() -
      today.getTime()) /
      millisecondsPerDay,
  );
}

function parseDate(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}