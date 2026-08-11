import type {
  ContractorDocumentRecord,
} from "./types";

export type ContractorComplianceItemStatus =
  | "Missing"
  | "Current"
  | "Expiring Soon"
  | "Expired"
  | "Awaiting Review"
  | "Viewed"
  | "Needs Revision"
  | "Rejected"
  | "Optional";

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
  optionalRequirements: number;

  current: number;
  missing: number;
  expiringSoon: number;
  expired: number;
  awaitingReview: number;
  viewed: number;
  needsRevision: number;
  rejected: number;
  optional: number;

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
        !requirement.isArchived,
    )
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );

  const requiredRequirements =
    activeRequirements.filter(
      (requirement) =>
        requirement.isRequired,
    );

  const optionalRequirements =
    activeRequirements.filter(
      (requirement) =>
        !requirement.isRequired,
    );

  if (activeRequirements.length === 0) {
    return {
      totalRequirements: 0,
      optionalRequirements: 0,

      current: 0,
      missing: 0,
      expiringSoon: 0,
      expired: 0,
      awaitingReview: 0,
      viewed: 0,
      needsRevision: 0,
      rejected: 0,
      optional: 0,

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

  const requiredItems = items.filter(
    (item) =>
      item.isRequired,
  );

  const current = requiredItems.filter(
    (item) =>
      item.status === "Current",
  ).length;

  const missing = requiredItems.filter(
    (item) =>
      item.status === "Missing",
  ).length;

  const expiringSoon = requiredItems.filter(
    (item) =>
      item.status === "Expiring Soon",
  ).length;

  const expired = requiredItems.filter(
    (item) =>
      item.status === "Expired",
  ).length;

  const awaitingReview =
    requiredItems.filter(
      (item) =>
        item.status === "Awaiting Review",
    ).length;

  const viewed =
    requiredItems.filter(
      (item) =>
        item.status === "Viewed",
    ).length;

  const needsRevision =
    requiredItems.filter(
      (item) =>
        item.status === "Needs Revision",
    ).length;

  const rejected =
    requiredItems.filter(
      (item) =>
        item.status === "Rejected",
    ).length;

  const optional = items.filter(
    (item) =>
      item.status === "Optional",
  ).length;

  /*
   * Only documents that are approved and currently
   * valid count toward compliance.
   *
   * Expiring Soon remains compliant until the
   * expiration date actually passes.
   */
  const compliantCount =
    current + expiringSoon;

  const compliancePercentage =
    requiredRequirements.length === 0
      ? 100
      : Math.round(
          (compliantCount /
            requiredRequirements.length) *
            100,
        );

  /*
   * Any unresolved required document prevents the
   * contractor from reaching full document compliance.
   */
  const hasBlockingIssue =
    missing > 0 ||
    expired > 0 ||
    awaitingReview > 0 ||
    viewed > 0 ||
    needsRevision > 0 ||
    rejected > 0;

  return {
    totalRequirements:
      requiredRequirements.length,

    optionalRequirements:
      optionalRequirements.length,

    current,
    missing,
    expiringSoon,
    expired,
    awaitingReview,
    viewed,
    needsRevision,
    rejected,
    optional,

    compliantCount,

    compliancePercentage,

    overallStatus: hasBlockingIssue
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
        documentMatchesRequirement(
          document,
          requirement,
        ),
    )
    .map((document) => ({
      document,

      evaluation:
        evaluateDocumentAgainstRequirement(
          document,
          requirement,
        ),
    }))
    .sort(compareEvaluatedDocuments);

  /*
   * Optional requirement with no document.
   * This does not negatively affect compliance.
   */
  if (
    matchingDocuments.length === 0 &&
    !requirement.isRequired
  ) {
    return createComplianceItem({
      requirement,
      status: "Optional",
      document: null,
      daysUntilExpiration: null,
    });
  }

  /*
   * Required document has not been submitted.
   */
  if (matchingDocuments.length === 0) {
    return createComplianceItem({
      requirement,
      status: "Missing",
      document: null,
      daysUntilExpiration: null,
    });
  }

  /*
   * Documents are ranked by compliance quality first
   * and recency second.
   */
  const bestMatch =
    matchingDocuments[0];

  return createComplianceItem({
    requirement,

    status:
      bestMatch.evaluation.status,

    document:
      bestMatch.document,

    daysUntilExpiration:
      bestMatch.evaluation
        .daysUntilExpiration,
  });
}

function documentMatchesRequirement(
  document: ContractorDocumentRecord,
  requirement: ContractorDocumentRequirementRecord,
) {
  if (
    normalizeDocumentType(
      document.documentType,
    ) !==
    normalizeDocumentType(
      requirement.documentType,
    )
  ) {
    return false;
  }

  /*
   * A project-specific document must match the
   * requirement's project.
   *
   * A null projectId document can serve as a broader
   * contractor/company-level document.
   */
  if (
    document.projectId &&
    document.projectId !==
      requirement.projectId
  ) {
    return false;
  }

  /*
   * Documents from another tenant must never satisfy
   * this tenant's requirement.
   */
  if (
    document.tenantId &&
    document.tenantId !==
      requirement.tenantId
  ) {
    return false;
  }

  return true;
}

function evaluateDocumentAgainstRequirement(
  document: ContractorDocumentRecord,
  requirement: ContractorDocumentRequirementRecord,
): {
  status: ContractorComplianceItemStatus;
  daysUntilExpiration: number | null;
} {
  const daysUntilExpiration =
    calculateDaysUntilExpiration(
      document.expirationDate,
    );

  const reviewStatus =
    normalizeStatus(
      document.reviewStatus,
    );

  const approvalStatus =
    normalizeStatus(
      document.approvalStatus,
    );

  /*
   * Explicit rejection takes priority over the normal
   * review workflow.
   */
  if (
    approvalStatus === "rejected" ||
    reviewStatus === "rejected"
  ) {
    return {
      status: "Rejected",
      daysUntilExpiration,
    };
  }

  /*
   * A document returned for correction remains a
   * blocking compliance issue until a replacement or
   * corrected document is submitted and approved.
   */
  if (
    approvalStatus === "needs revision" ||
    approvalStatus === "needs-revision" ||
    reviewStatus === "needs revision" ||
    reviewStatus === "needs-revision"
  ) {
    return {
      status: "Needs Revision",
      daysUntilExpiration,
    };
  }

  /*
   * Expired documents do not satisfy compliance,
   * including documents that were previously approved.
   */
  if (
    document.expirationDate &&
    daysUntilExpiration !== null &&
    daysUntilExpiration < 0
  ) {
    return {
      status: "Expired",
      daysUntilExpiration,
    };
  }

  /*
   * A requirement that mandates an expiration date
   * cannot become compliant without one.
   */
  if (
    requirement.expirationRequired &&
    !document.expirationDate
  ) {
    if (
      reviewStatus === "viewed" ||
      reviewStatus === "reviewed"
    ) {
      return {
        status: "Viewed",
        daysUntilExpiration: null,
      };
    }

    return {
      status: "Awaiting Review",
      daysUntilExpiration: null,
    };
  }

  /*
   * Review-required documents must receive an explicit
   * approval before they count toward compliance.
   */
  if (requirement.reviewRequired) {
    const isApproved =
      approvalStatus === "approved" ||
      approvalStatus === "conditional";

    if (!isApproved) {
      if (
        reviewStatus === "viewed" ||
        reviewStatus === "reviewed"
      ) {
        return {
          status: "Viewed",
          daysUntilExpiration,
        };
      }

      return {
        status: "Awaiting Review",
        daysUntilExpiration,
      };
    }
  }

  /*
   * An approved and valid document approaching its
   * expiration date remains compliant but generates
   * a warning.
   */
  if (
    document.expirationDate &&
    daysUntilExpiration !== null &&
    daysUntilExpiration <=
      EXPIRING_SOON_DAYS
  ) {
    return {
      status: "Expiring Soon",
      daysUntilExpiration,
    };
  }

  /*
   * Requirement has been satisfied.
   */
  return {
    status: "Current",
    daysUntilExpiration,
  };
}

function compareEvaluatedDocuments(
  a: {
    document: ContractorDocumentRecord;

    evaluation: {
      status: ContractorComplianceItemStatus;
      daysUntilExpiration: number | null;
    };
  },

  b: {
    document: ContractorDocumentRecord;

    evaluation: {
      status: ContractorComplianceItemStatus;
      daysUntilExpiration: number | null;
    };
  },
) {
  const aRank =
    getStatusRank(
      a.evaluation.status,
    );

  const bRank =
    getStatusRank(
      b.evaluation.status,
    );

  if (aRank !== bRank) {
    return aRank - bRank;
  }

  /*
   * For documents with the same compliance quality,
   * prefer the newest document.
   */
  return (
    getComparableDate(b.document) -
    getComparableDate(a.document)
  );
}

function getStatusRank(
  status: ContractorComplianceItemStatus,
) {
  switch (status) {
    case "Current":
      return 1;

    case "Expiring Soon":
      return 2;

    case "Viewed":
      return 3;

    case "Awaiting Review":
      return 4;

    case "Needs Revision":
      return 5;

    case "Rejected":
      return 6;

    case "Expired":
      return 7;

    case "Missing":
      return 8;

    case "Optional":
      return 9;

    default:
      return 99;
  }
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
    requirementId:
      requirement.id,

    documentType:
      requirement.documentType,

    requirementName:
      requirement.name,

    description:
      requirement.description,

    isRequired:
      requirement.isRequired,

    expirationRequired:
      requirement.expirationRequired,

    reviewRequired:
      requirement.reviewRequired,

    status,

    documentId:
      document?.id ?? null,

    documentName:
      document?.documentName ??
      document?.fileName ??
      null,

    effectiveDate:
      document?.effectiveDate ??
      null,

    expirationDate:
      document?.expirationDate ??
      null,

    approvalStatus:
      document?.approvalStatus ??
      null,

    reviewStatus:
      document?.reviewStatus ??
      null,

    daysUntilExpiration,
  };
}

function normalizeStatus(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .toLowerCase() ?? ""
  );
}

function normalizeDocumentType(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getComparableDate(
  document: ContractorDocumentRecord,
) {
  const effectiveDate =
    parseDate(
      document.effectiveDate,
    );

  if (effectiveDate) {
    return effectiveDate.getTime();
  }

  const createdDate =
    parseDate(
      document.createdAt,
    );

  return (
    createdDate?.getTime() ?? 0
  );
}

function calculateDaysUntilExpiration(
  expirationDate:
    | string
    | null,
) {
  const expiration =
    parseDate(
      expirationDate,
    );

  if (!expiration) {
    return null;
  }

  const today =
    startOfDay(
      new Date(),
    );

  const expirationDay =
    startOfDay(
      expiration,
    );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.ceil(
    (
      expirationDay.getTime() -
      today.getTime()
    ) /
      millisecondsPerDay,
  );
}

function parseDate(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}