import { prisma } from "@/lib/prisma";
import {
  requirementPackApplies,
  type ApplicabilityContext,
} from "@/lib/planning/requirement-applicability";

export type PlanningApprovalRoleSource = {
  requirementPackId: string | null;
  requirementPackName: string;
  packType: string;
  organizationName: string | null;
};

export type ResolvedPlanningApprovalRole = {
  code: string;
  label: string;

  required: boolean;
  order: number;

  signerName: string | null;
  signerId: string | null;
  signerEmail: string | null;

  sourceType:
    | "Qoreva"
    | "RequirementPack";

  sources: PlanningApprovalRoleSource[];
};

export type PlanningApprovalRoutingResult = {
  planningRecordId: string;
  tenantId: string;

  revisionNumber: number;
  planType: string;

  roles: ResolvedPlanningApprovalRole[];

  applicablePacks: Array<{
    id: string;
    name: string;
    packType: string;
    organizationName: string | null;
    version: number;
  }>;

  metadata: {
    baselineRoleCount: number;
    requirementPackRoleCount: number;
    resolvedRoleCount: number;
    applicablePackCount: number;
    resolverVersion: string;
  };
};

export type MocApprovalRoutingResult = {
  planningRecordId: string;
  tenantId: string;

  revisionNumber: number;
  planType: string;

  roles: ResolvedPlanningApprovalRole[];

  applicablePacks: Array<{
    id: string;
    name: string;
    packType: string;
    organizationName: string | null;
    version: number;
  }>;

  metadata: {
    requirementPackRoleCount: number;
    resolvedRoleCount: number;
    applicablePackCount: number;
    resolverVersion: string;
  };
};

type JsonRecord =
  Record<string, unknown>;

type ApprovalRoleDefinition = {
  code: string;
  label: string;

  required: boolean;
  order: number;
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

function normalizeCode(
  value: unknown,
) {
  const normalized =
    nullableString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function normalizeBoolean(
  value: unknown,
  fallback: boolean,
) {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function normalizeOrder(
  value: unknown,
  fallback: number,
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.trunc(parsed),
  );
}

function parseApprovalRole(
  value: unknown,
  fallbackOrder: number,
): ApprovalRoleDefinition | null {
  if (!isRecord(value)) {
    return null;
  }

  const code =
    normalizeCode(
      value.code,
    );

  const label =
    nullableString(
      value.label ??
        value.name ??
        value.role,
    );

  if (
    !code ||
    !label
  ) {
    return null;
  }

  return {
    code,
    label,

    required:
      normalizeBoolean(
        value.required,
        true,
      ),

    order:
      normalizeOrder(
        value.order ??
          value.sortOrder,
        fallbackOrder,
      ),
  };
}

function readRolesFromPlanConfig(
  planConfig: unknown,
) {
  if (!isRecord(planConfig)) {
    return [];
  }

  const rawRoles =
    Array.isArray(
      planConfig.roles,
    )
      ? planConfig.roles
      : [];

  return rawRoles
    .map(
      (
        role,
        index,
      ) =>
        parseApprovalRole(
          role,
          100 + index * 10,
        ),
    )
    .filter(
      (
        role,
      ): role is ApprovalRoleDefinition =>
        Boolean(role),
    );
}

function readApprovalRoles(
  approvalRouting: unknown,
  planType: string,
) {
  if (!isRecord(approvalRouting)) {
    return [];
  }

  /*
   * Preferred MVP format:
   *
   * {
   *   planning: {
   *     PTP: {
   *       roles: [...]
   *     },
   *     "*": {
   *       roles: [...]
   *     }
   *   }
   * }
   */
  const planning =
    isRecord(
      approvalRouting.planning,
    )
      ? approvalRouting.planning
      : null;

  if (planning) {
    const wildcardRoles =
      readRolesFromPlanConfig(
        planning["*"] ??
          planning.default,
      );

    const specificRoles =
      readRolesFromPlanConfig(
        planning[planType],
      );

    return [
      ...wildcardRoles,
      ...specificRoles,
    ];
  }

  /*
   * Also support a simple pack-wide format:
   *
   * {
   *   roles: [...]
   * }
   *
   * This keeps early Requirement Pack creation
   * inexpensive while the admin UI is still being
   * developed.
   */
  return readRolesFromPlanConfig(
    approvalRouting,
  );
}

function readMocApprovalRoles(
  approvalRouting: unknown,
) {
  if (!isRecord(approvalRouting)) {
    return [];
  }

  /*
   * MOC approval is intentionally separate from
   * Planning approval/signature routing.
   *
   * Preferred MVP format:
   *
   * {
   *   moc: {
   *     roles: [...]
   *   }
   * }
   *
   * There is deliberately no fallback to the
   * pack-wide `roles` array or `planning` roles.
   * This prevents Planning approvers from being
   * silently treated as MOC approvers.
   */
  return readRolesFromPlanConfig(
    approvalRouting.moc,
  );
}

function packPriority(
  packType: string,
) {
  switch (
    packType
      .trim()
      .toLowerCase()
  ) {
    case "qoreva":
      return 10;

    case "owner":
      return 20;

    case "gc":
      return 30;

    case "company":
      return 40;

    case "project":
      return 50;

    default:
      return 15;
  }
}

function baselineRoles({
  responsibleSupervisor,
  responsibleSupervisorId,
  reviewerName,
  reviewerId,
  reviewerRole,
}: {
  responsibleSupervisor: string | null;
  responsibleSupervisorId: string | null;

  reviewerName: string | null;
  reviewerId: string | null;
  reviewerRole: string | null;
}): ResolvedPlanningApprovalRole[] {
  return [
    {
      code:
        "RESPONSIBLE_SUPERVISOR",

      label:
        "Responsible Supervisor / Foreman",

      required:
        true,

      order:
        10,

      signerName:
        responsibleSupervisor,

      signerId:
        responsibleSupervisorId,

      signerEmail:
        null,

      sourceType:
        "Qoreva",

      sources: [
        {
          requirementPackId:
            null,

          requirementPackName:
            "Qoreva Planning Baseline",

          packType:
            "Qoreva",

          organizationName:
            null,
        },
      ],
    },

    {
      code:
        "QUALIFIED_REVIEWER",

      label:
        reviewerRole ??
        "Qualified Reviewer",

      required:
        true,

      order:
        20,

      signerName:
        reviewerName,

      signerId:
        reviewerId,

      signerEmail:
        null,

      sourceType:
        "Qoreva",

      sources: [
        {
          requirementPackId:
            null,

          requirementPackName:
            "Qoreva Planning Baseline",

          packType:
            "Qoreva",

          organizationName:
            null,
        },
      ],
    },
  ];
}

export async function resolvePlanningApprovalRouting(
  planningRecordId: string,
): Promise<PlanningApprovalRoutingResult> {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id:
          planningRecordId,

        isArchived:
          false,
      },

      include: {
        company:
          true,

        project: {
          include: {
            organizations: {
              where: {
                isActive:
                  true,

                isArchived:
                  false,
              },

              orderBy: [
                {
                  isPrimary:
                    "desc",
                },

                {
                  role:
                    "asc",
                },

                {
                  organizationName:
                    "asc",
                },
              ],
            },
          },
        },

        contractor:
          true,

        reviews: {
          where: {
            revisionNumber: {
              gt: 0,
            },
          },

          orderBy: {
            completedAt:
              "desc",
          },
        },
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  const currentReview =
    record.reviews.find(
      (review) =>
        review.revisionNumber ===
          record.revisionNumber &&
        review.status ===
          "Completed",
    ) ?? null;

  const applicabilityContext:
    ApplicabilityContext = {
    tenantId:
      record.tenantId,

    companyId:
      record.companyId,

    projectId:
      record.projectId,

    contractorId:
      record.contractorId,

    planType:
      record.planType,

    companyName:
      record.company.name,

    projectName:
      record.project.name,

    projectCode:
      record.project.projectCode,

    clientName:
      record.project.clientName,

    contractorName:
      record.contractor?.name ??
      null,

    contractorTrade:
      record.contractor?.trade ??
      null,

    projectOrganizations:
      record.project.organizations
        .map(
          (organization) => ({
            organizationName:
              organization
                .organizationName,

            organizationType:
              organization
                .organizationType,

            role:
              organization.role,

            isPrimary:
              organization
                .isPrimary,
          }),
        ),
  };

  const candidatePacks =
    await prisma.requirementPack.findMany({
      where: {
        tenantId:
          record.tenantId,

        isActive:
          true,

        isArchived:
          false,

        status: {
          in: [
            "Active",
            "Approved",
          ],
        },
      },

      orderBy: [
        {
          version:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  const applicablePacks =
    candidatePacks
      .filter(
        (pack) =>
          requirementPackApplies(
            pack.applicability,
            applicabilityContext,
          ),
      )
      .sort(
        (a, b) => {
          const priorityDifference =
            packPriority(
              a.packType,
            ) -
            packPriority(
              b.packType,
            );

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          if (
            a.version !==
            b.version
          ) {
            return (
              a.version -
              b.version
            );
          }

          return a.name.localeCompare(
            b.name,
          );
        },
      );

  const resolvedByCode =
    new Map<
      string,
      ResolvedPlanningApprovalRole
    >();

  const baseRoles =
    baselineRoles({
      responsibleSupervisor:
        record.responsibleSupervisor,

      responsibleSupervisorId:
        record.responsibleSupervisorId,

      reviewerName:
        currentReview?.reviewerName ??
        null,

      reviewerId:
        currentReview?.reviewerId ??
        null,

      reviewerRole:
        currentReview?.reviewerRole ??
        null,
    });

  for (
    const role of
    baseRoles
  ) {
    resolvedByCode.set(
      role.code,
      role,
    );
  }

  let requirementPackRoleCount =
    0;

  for (
    const pack of
    applicablePacks
  ) {
    const packRoles =
      readApprovalRoles(
        pack.approvalRouting,
        record.planType,
      );

    for (
      const packRole of
      packRoles
    ) {
      requirementPackRoleCount +=
        1;

      const source:
        PlanningApprovalRoleSource = {
        requirementPackId:
          pack.id,

        requirementPackName:
          pack.name,

        packType:
          pack.packType,

        organizationName:
          pack.organizationName,
      };

      const existing =
        resolvedByCode.get(
          packRole.code,
        );

      if (existing) {
        /*
         * Requirement Packs are additive for MVP.
         *
         * A pack can make an existing optional role
         * required, but it cannot make a Qoreva
         * baseline role optional.
         *
         * More specific packs may refine the label
         * and display order without removing prior
         * provenance.
         */
        resolvedByCode.set(
          packRole.code,
          {
            ...existing,

            label:
              existing.sourceType ===
              "Qoreva"
                ? existing.label
                : packRole.label,

            required:
              existing.required ||
              packRole.required,

            order:
              existing.sourceType ===
              "Qoreva"
                ? existing.order
                : packRole.order,

            sources: [
              ...existing.sources,
              source,
            ],
          },
        );

        continue;
      }

      resolvedByCode.set(
        packRole.code,
        {
          code:
            packRole.code,

          label:
            packRole.label,

          required:
            packRole.required,

          order:
            packRole.order,

          signerName:
            null,

          signerId:
            null,

          signerEmail:
            null,

          sourceType:
            "RequirementPack",

          sources: [
            source,
          ],
        },
      );
    }
  }

  const roles =
    Array.from(
      resolvedByCode.values(),
    ).sort(
      (a, b) => {
        if (
          a.order !== b.order
        ) {
          return (
            a.order -
            b.order
          );
        }

        return a.label.localeCompare(
          b.label,
        );
      },
    );

  return {
    planningRecordId:
      record.id,

    tenantId:
      record.tenantId,

    revisionNumber:
      record.revisionNumber,

    planType:
      record.planType,

    roles,

    applicablePacks:
      applicablePacks.map(
        (pack) => ({
          id:
            pack.id,

          name:
            pack.name,

          packType:
            pack.packType,

          organizationName:
            pack.organizationName,

          version:
            pack.version,
        }),
      ),

    metadata: {
      baselineRoleCount:
        baseRoles.length,

      requirementPackRoleCount,

      resolvedRoleCount:
        roles.length,

      applicablePackCount:
        applicablePacks.length,

      resolverVersion:
        "qoreva-planning-approval-routing-v1",
    },
  };
}

export async function resolveMocApprovalRouting(
  planningRecordId: string,
): Promise<MocApprovalRoutingResult> {
  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id:
          planningRecordId,

        isArchived:
          false,
      },

      include: {
        company:
          true,

        project: {
          include: {
            organizations: {
              where: {
                isActive:
                  true,

                isArchived:
                  false,
              },

              orderBy: [
                {
                  isPrimary:
                    "desc",
                },

                {
                  role:
                    "asc",
                },

                {
                  organizationName:
                    "asc",
                },
              ],
            },
          },
        },

        contractor:
          true,
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  const applicabilityContext:
    ApplicabilityContext = {
    tenantId:
      record.tenantId,

    companyId:
      record.companyId,

    projectId:
      record.projectId,

    contractorId:
      record.contractorId,

    planType:
      record.planType,

    companyName:
      record.company.name,

    projectName:
      record.project.name,

    projectCode:
      record.project.projectCode,

    clientName:
      record.project.clientName,

    contractorName:
      record.contractor?.name ??
      null,

    contractorTrade:
      record.contractor?.trade ??
      null,

    projectOrganizations:
      record.project.organizations
        .map(
          (organization) => ({
            organizationName:
              organization
                .organizationName,

            organizationType:
              organization
                .organizationType,

            role:
              organization.role,

            isPrimary:
              organization
                .isPrimary,
          }),
        ),
  };

  const candidatePacks =
    await prisma.requirementPack.findMany({
      where: {
        tenantId:
          record.tenantId,

        isActive:
          true,

        isArchived:
          false,

        status: {
          in: [
            "Active",
            "Approved",
          ],
        },
      },

      orderBy: [
        {
          version:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  const applicablePacks =
    candidatePacks
      .filter(
        (pack) =>
          requirementPackApplies(
            pack.applicability,
            applicabilityContext,
          ),
      )
      .sort(
        (a, b) => {
          const priorityDifference =
            packPriority(
              a.packType,
            ) -
            packPriority(
              b.packType,
            );

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          if (
            a.version !==
            b.version
          ) {
            return (
              a.version -
              b.version
            );
          }

          return a.name.localeCompare(
            b.name,
          );
        },
      );

  const resolvedByCode =
    new Map<
      string,
      ResolvedPlanningApprovalRole
    >();

  let requirementPackRoleCount =
    0;

  for (
    const pack of
    applicablePacks
  ) {
    const packRoles =
      readMocApprovalRoles(
        pack.approvalRouting,
      );

    for (
      const packRole of
      packRoles
    ) {
      requirementPackRoleCount +=
        1;

      const source:
        PlanningApprovalRoleSource = {
        requirementPackId:
          pack.id,

        requirementPackName:
          pack.name,

        packType:
          pack.packType,

        organizationName:
          pack.organizationName,
      };

      const existing =
        resolvedByCode.get(
          packRole.code,
        );

      if (existing) {
        /*
         * MOC Requirement Packs are additive.
         *
         * A more specific applicable pack may refine
         * label/order and can make a role required,
         * while provenance from every contributing
         * pack remains attached to the resolved role.
         */
        resolvedByCode.set(
          packRole.code,
          {
            ...existing,

            label:
              packRole.label,

            required:
              existing.required ||
              packRole.required,

            order:
              packRole.order,

            sources: [
              ...existing.sources,
              source,
            ],
          },
        );

        continue;
      }

      resolvedByCode.set(
        packRole.code,
        {
          code:
            packRole.code,

          label:
            packRole.label,

          required:
            packRole.required,

          order:
            packRole.order,

          signerName:
            null,

          signerId:
            null,

          signerEmail:
            null,

          sourceType:
            "RequirementPack",

          sources: [
            source,
          ],
        },
      );
    }
  }

  const resolvedRoles =
    Array.from(
      resolvedByCode.values(),
    ).sort(
      (a, b) => {
        if (
          a.order !== b.order
        ) {
          return (
            a.order -
            b.order
          );
        }

        return a.label.localeCompare(
          b.label,
        );
      },
    );

  const requiredRoles =
    resolvedRoles.filter(
      (role) =>
        role.required,
    );

  if (
    requiredRoles.length >
    1
  ) {
    throw new Error(
      "MOC approval routing is configured with more than one required approver. Qoreva MVP requires exactly one required Designated Approver.",
    );
  }

  if (
    requiredRoles.length ===
      1 &&
    requiredRoles[0].code !==
      "DESIGNATED_MOC_APPROVER"
  ) {
    throw new Error(
      "The required MOC approver must use the role code DESIGNATED_MOC_APPROVER.",
    );
  }

  const roles =
    requiredRoles.length ===
    1
      ? requiredRoles
      : [];

  return {
    planningRecordId:
      record.id,

    tenantId:
      record.tenantId,

    revisionNumber:
      record.revisionNumber,

    planType:
      record.planType,

    roles,

    applicablePacks:
      applicablePacks.map(
        (pack) => ({
          id:
            pack.id,

          name:
            pack.name,

          packType:
            pack.packType,

          organizationName:
            pack.organizationName,

          version:
            pack.version,
        }),
      ),

    metadata: {
      requirementPackRoleCount,

      resolvedRoleCount:
        roles.length,

      applicablePackCount:
        applicablePacks.length,

      resolverVersion:
        "qoreva-moc-approval-routing-v2-single-designated-approver",
    },
  };
}