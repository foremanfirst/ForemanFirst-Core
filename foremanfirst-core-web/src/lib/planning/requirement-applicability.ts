type JsonRecord =
  Record<string, unknown>;

export type ApplicabilityContext = {
  tenantId: string;

  companyId: string;
  projectId: string;
  contractorId: string | null;

  planType: string;

  companyName: string;

  projectName: string;
  projectCode: string | null;
  clientName: string | null;

  contractorName: string | null;
  contractorTrade: string | null;
};

function isRecord(
  value: unknown,
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function nullableString(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed
    ? trimmed
    : null;
}

function normalizeStringArray(
  value: unknown,
) {
  if (
    typeof value === "string"
  ) {
    const normalized =
      nullableString(value);

    return normalized
      ? [normalized]
      : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(nullableString)
    .filter(
      (
        item,
      ): item is string =>
        Boolean(item),
    );
}

function normalizeForComparison(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function matchesAny(
  actual: string | null,
  expected: string[],
) {
  if (
    expected.length ===
    0
  ) {
    return true;
  }

  if (!actual) {
    return false;
  }

  const normalizedActual =
    normalizeForComparison(
      actual,
    );

  return expected.some(
    (candidate) =>
      normalizeForComparison(
        candidate,
      ) ===
      normalizedActual,
  );
}

function matchesId(
  actual: string | null,
  expected: string[],
) {
  if (
    expected.length ===
    0
  ) {
    return true;
  }

  if (!actual) {
    return false;
  }

  return expected.includes(
    actual,
  );
}

export function requirementPackApplies(
  applicability: unknown,
  context: ApplicabilityContext,
) {
  /*
   * No applicability configuration means
   * the active pack applies tenant-wide.
   */
  if (
    applicability === null ||
    applicability === undefined
  ) {
    return true;
  }

  if (!isRecord(applicability)) {
    return false;
  }

  const tenantIds =
    normalizeStringArray(
      applicability.tenantIds ??
        applicability.tenantId,
    );

  const companyIds =
    normalizeStringArray(
      applicability.companyIds ??
        applicability.companyId,
    );

  const projectIds =
    normalizeStringArray(
      applicability.projectIds ??
        applicability.projectId,
    );

  const contractorIds =
    normalizeStringArray(
      applicability.contractorIds ??
        applicability.contractorId,
    );

  const planTypes =
    normalizeStringArray(
      applicability.planTypes ??
        applicability.planType,
    );

  const companyNames =
    normalizeStringArray(
      applicability.companyNames ??
        applicability.companyName,
    );

  const projectNames =
    normalizeStringArray(
      applicability.projectNames ??
        applicability.projectName,
    );

  const projectCodes =
    normalizeStringArray(
      applicability.projectCodes ??
        applicability.projectCode,
    );

  const clientNames =
    normalizeStringArray(
      applicability.clientNames ??
        applicability.clientName ??
        applicability.ownerNames ??
        applicability.ownerName,
    );

  const contractorNames =
    normalizeStringArray(
      applicability.contractorNames ??
        applicability.contractorName,
    );

  const trades =
    normalizeStringArray(
      applicability.trades ??
        applicability.trade,
    );

  if (
    !matchesId(
      context.tenantId,
      tenantIds,
    )
  ) {
    return false;
  }

  if (
    !matchesId(
      context.companyId,
      companyIds,
    )
  ) {
    return false;
  }

  if (
    !matchesId(
      context.projectId,
      projectIds,
    )
  ) {
    return false;
  }

  if (
    !matchesId(
      context.contractorId,
      contractorIds,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.planType,
      planTypes,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.companyName,
      companyNames,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.projectName,
      projectNames,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.projectCode,
      projectCodes,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.clientName,
      clientNames,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.contractorName,
      contractorNames,
    )
  ) {
    return false;
  }

  if (
    !matchesAny(
      context.contractorTrade,
      trades,
    )
  ) {
    return false;
  }

  return true;
}