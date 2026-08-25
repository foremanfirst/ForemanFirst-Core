import "dotenv/config";

import {
  PrismaClient,
  Prisma,
} from "../src/generated/prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  resolveApplicablePlanningRequirements,
} from "../src/lib/planning/requirement-resolver";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured.",
  );
}

const prisma =
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });

const TEST_PREFIX =
  "QOREVA_RESOLUTION_TEST";

function trigger(
  activityCode: string,
): Prisma.InputJsonValue {
  return {
    match: "ALL",

    conditions: [
      {
        type:
          "ActivityDetected",

        activityCode,
      },
    ],
  };
}

function sourceReference({
  groupKey,
  relationship,
  stringencyRank,
}: {
  groupKey?: string;
  relationship?:
    | "Additive"
    | "Overlapping";
  stringencyRank?: number;
}): Prisma.InputJsonValue {
  return {
    resolution: {
      ...(groupKey
        ? {
            groupKey,
          }
        : {}),

      ...(relationship
        ? {
            relationship,
          }
        : {}),

      ...(stringencyRank !==
      undefined
        ? {
            stringencyRank,
          }
        : {}),
    },
  };
}

async function createPack({
  tenantId,
  name,
  packType,
  organizationName,
  projectId,
}: {
  tenantId: string;
  name: string;
  packType: string;
  organizationName: string;
  projectId: string;
}) {
  return prisma.requirementPack.create({
    data: {
      tenantId,

      name,

      description:
        "Temporary Qoreva Requirement Resolution integration test.",

      packType,

      organizationName,

      version: 1,

      status:
        "Active",

      applicability: {
        projectIds: [
          projectId,
        ],
      },

      isActive:
        true,

      isArchived:
        false,
    },
  });
}

async function createRule({
  tenantId,
  requirementPackId,
  ruleCode,
  title,
  sourceReferenceValue,
}: {
  tenantId: string;
  requirementPackId: string;
  ruleCode: string;
  title: string;
  sourceReferenceValue?:
    Prisma.InputJsonValue;
}) {
  return prisma.requirementRule.create({
    data: {
      tenantId,

      requirementPackId,

      ruleCode,

      title,

      requirementText:
        `${title} test requirement.`,

      category:
        "Excavation",

      triggerConditions:
        trigger(
          "EXCAVATION",
        ),

      requiredControls: [
        `${title} test control`,
      ],

      severity:
        "High",

      sourceDocumentName:
        "Qoreva Test Source",

      sourcePage:
        "TEST",

      sourceReference:
        sourceReferenceValue,

      status:
        "Active",

      isActive:
        true,
    },
  });
}

async function cleanup() {
  const packs =
    await prisma.requirementPack.findMany({
      where: {
        name: {
          startsWith:
            TEST_PREFIX,
        },
      },

      select: {
        id:
          true,
      },
    });

  const packIds =
    packs.map(
      (pack) =>
        pack.id,
    );

  if (
    packIds.length >
    0
  ) {
    await prisma.requirementRule.deleteMany({
      where: {
        requirementPackId: {
          in:
            packIds,
        },
      },
    });

    await prisma.requirementPack.deleteMany({
      where: {
        id: {
          in:
            packIds,
        },
      },
    });
  }
}

function getTestGroups(
  result:
    Awaited<
      ReturnType<
        typeof resolveApplicablePlanningRequirements
      >
    >,
) {
  return result.groups.filter(
    (group) =>
      group.ruleCodes.some(
        (ruleCode) =>
          ruleCode.startsWith(
            TEST_PREFIX,
          ),
      ),
  );
}

function assert(
  condition: unknown,
  message: string,
) {
  if (!condition) {
    throw new Error(
      `TEST FAILED: ${message}`,
    );
  }
}

async function main() {
  const planningRecordId =
    process.argv[2];

  if (
    !planningRecordId
  ) {
    throw new Error(
      "Usage: npx tsx prisma/test-requirement-resolution.ts <planningRecordId>",
    );
  }

  const record =
    await prisma.planningRecord.findFirst({
      where: {
        id:
          planningRecordId,

        isArchived:
          false,
      },

      include: {
        project:
          true,
      },
    });

  if (!record) {
    throw new Error(
      "Planning record was not found.",
    );
  }

  console.log(
    "Testing Qoreva Requirement Resolution V1...",
  );

  console.log(
    `Planning Record: ${record.id}`,
  );

  console.log(
    `Project: ${record.project.name}`,
  );

  await cleanup();

  /*
   * ---------------------------------------------------------
   * TEST 1 — STANDALONE
   * ---------------------------------------------------------
   */

  const standalonePack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_STANDALONE`,

      packType:
        "Federal",

      organizationName:
        "Test Federal Source",

      projectId:
        record.projectId,
    });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      standalonePack.id,

    ruleCode:
      `${TEST_PREFIX}_STANDALONE_RULE`,

    title:
      "Standalone Requirement",
  });

  /*
   * ---------------------------------------------------------
   * TEST 2 — ADDITIVE
   * ---------------------------------------------------------
   */

  const additiveFederalPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_ADDITIVE_FEDERAL`,

      packType:
        "Federal",

      organizationName:
        "Test Federal Source",

      projectId:
        record.projectId,
    });

  const additiveOwnerPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_ADDITIVE_OWNER`,

      packType:
        "Owner",

      organizationName:
        "Test Owner",

      projectId:
        record.projectId,
    });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      additiveFederalPack.id,

    ruleCode:
      `${TEST_PREFIX}_ADDITIVE_FEDERAL_RULE`,

    title:
      "Federal Additive Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_ADDITIVE_GROUP`,

        relationship:
          "Additive",
      }),
  });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      additiveOwnerPack.id,

    ruleCode:
      `${TEST_PREFIX}_ADDITIVE_OWNER_RULE`,

    title:
      "Owner Additive Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_ADDITIVE_GROUP`,

        relationship:
          "Additive",
      }),
  });

  /*
   * ---------------------------------------------------------
   * TEST 3 — CONTROLLING REQUIREMENT
   * ---------------------------------------------------------
   */

  const overlapFederalPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_OVERLAP_FEDERAL`,

      packType:
        "Federal",

      organizationName:
        "Test Federal Source",

      projectId:
        record.projectId,
    });

  const overlapOwnerPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_OVERLAP_OWNER`,

      packType:
        "Owner",

      organizationName:
        "Test Owner",

      projectId:
        record.projectId,
    });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      overlapFederalPack.id,

    ruleCode:
      `${TEST_PREFIX}_OVERLAP_FEDERAL_RULE`,

    title:
      "Federal Overlapping Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_OVERLAP_GROUP`,

        relationship:
          "Overlapping",

        stringencyRank:
          100,
      }),
  });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      overlapOwnerPack.id,

    ruleCode:
      `${TEST_PREFIX}_OVERLAP_OWNER_RULE`,

    title:
      "Owner More Stringent Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_OVERLAP_GROUP`,

        relationship:
          "Overlapping",

        stringencyRank:
          200,
      }),
  });

  /*
   * ---------------------------------------------------------
   * TEST 4 — REVIEW REQUIRED
   * ---------------------------------------------------------
   */

  const reviewGcPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_REVIEW_GC`,

      packType:
        "GC",

      organizationName:
        "Test GC",

      projectId:
        record.projectId,
    });

  const reviewProjectPack =
    await createPack({
      tenantId:
        record.tenantId,

      name:
        `${TEST_PREFIX}_REVIEW_PROJECT`,

      packType:
        "Project",

      organizationName:
        "Test Project",

      projectId:
        record.projectId,
    });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      reviewGcPack.id,

    ruleCode:
      `${TEST_PREFIX}_REVIEW_GC_RULE`,

    title:
      "GC Overlapping Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_REVIEW_GROUP`,

        relationship:
          "Overlapping",
      }),
  });

  await createRule({
    tenantId:
      record.tenantId,

    requirementPackId:
      reviewProjectPack.id,

    ruleCode:
      `${TEST_PREFIX}_REVIEW_PROJECT_RULE`,

    title:
      "Project Overlapping Requirement",

    sourceReferenceValue:
      sourceReference({
        groupKey:
          `${TEST_PREFIX}_REVIEW_GROUP`,

        relationship:
          "Overlapping",
      }),
  });

  /*
   * ---------------------------------------------------------
   * RUN RESOLVER
   * ---------------------------------------------------------
   */

  const result =
    await resolveApplicablePlanningRequirements(
      planningRecordId,

      {
        activityCodes: [
          "EXCAVATION",
        ],
      },
    );

  const testGroups =
    getTestGroups(
      result,
    );

  console.log(
    "\n===== TEST GROUPS =====",
  );

  console.table(
    testGroups.map(
      (group) => ({
        groupKey:
          group.groupKey,

        relationship:
          group.relationship,

        status:
          group.status,

        controllingRule:
          group.controllingRuleCode,

        review:
          group.requiresQualifiedReview,

        ruleCount:
          group.ruleCodes.length,
      }),
    ),
  );

  /*
   * ---------------------------------------------------------
   * ASSERT TEST 1
   * ---------------------------------------------------------
   */

  const standalone =
    testGroups.find(
      (group) =>
        group.ruleCodes.includes(
          `${TEST_PREFIX}_STANDALONE_RULE`,
        ),
    );

  assert(
    standalone,
    "Standalone group was not returned.",
  );

  assert(
    standalone?.status ===
      "Standalone",
    "Standalone requirement did not resolve as Standalone.",
  );

  console.log(
    "✓ Standalone requirement",
  );

  /*
   * ---------------------------------------------------------
   * ASSERT TEST 2
   * ---------------------------------------------------------
   */

  const additive =
    testGroups.find(
      (group) =>
        group.groupKey ===
        `${TEST_PREFIX}_ADDITIVE_GROUP`,
    );

  assert(
    additive,
    "Additive group was not returned.",
  );

  assert(
    additive?.status ===
      "Additive",
    "Additive requirements did not resolve as Additive.",
  );

  assert(
    additive?.ruleCodes.length ===
      2,
    "Additive group did not preserve both requirements.",
  );

  console.log(
    "✓ Additive requirements preserved",
  );

  /*
   * ---------------------------------------------------------
   * ASSERT TEST 3
   * ---------------------------------------------------------
   */

  const overlap =
    testGroups.find(
      (group) =>
        group.groupKey ===
        `${TEST_PREFIX}_OVERLAP_GROUP`,
    );

  assert(
    overlap,
    "Overlapping group was not returned.",
  );

  assert(
    overlap?.status ===
      "ControllingResolved",
    "Overlapping requirements did not resolve a controlling requirement.",
  );

  assert(
    overlap?.controllingRuleCode ===
      `${TEST_PREFIX}_OVERLAP_OWNER_RULE`,
    "The highest explicit stringency rank was not selected.",
  );

  console.log(
    "✓ Explicit stringency identified controlling requirement",
  );

  /*
   * ---------------------------------------------------------
   * ASSERT TEST 4
   * ---------------------------------------------------------
   */

  const review =
    testGroups.find(
      (group) =>
        group.groupKey ===
        `${TEST_PREFIX}_REVIEW_GROUP`,
    );

  assert(
    review,
    "Review-required group was not returned.",
  );

  assert(
    review?.status ===
      "ReviewRequired",
    "Unresolved overlap did not require qualified review.",
  );

  assert(
    review?.controllingRuleId ===
      null,
    "Qoreva selected a controlling rule without sufficient stringency evidence.",
  );

  assert(
    review?.requiresQualifiedReview ===
      true,
    "Qualified review flag was not set.",
  );

  console.log(
    "✓ Ambiguous overlap requires qualified review",
  );

  console.log(
    "\n========================================",
  );

  console.log(
    "ALL REQUIREMENT RESOLUTION TESTS PASSED",
  );

  console.log(
    "========================================",
  );

  console.log(
    `Applicable rules: ${result.metadata.applicableRuleCount}`,
  );

  console.log(
    `Requirement groups: ${result.metadata.requirementGroupCount}`,
  );

  console.log(
    `Additive groups: ${result.metadata.additiveGroupCount}`,
  );

  console.log(
    `Overlapping groups: ${result.metadata.overlappingGroupCount}`,
  );

  console.log(
    `Controlling resolved: ${result.metadata.controllingResolvedGroupCount}`,
  );

  console.log(
    `Review required: ${result.metadata.reviewRequiredGroupCount}`,
  );

  /*
   * Remove temporary database test records after
   * successful validation.
   */
  await cleanup();

  console.log(
    "\n✓ Temporary test data removed.",
  );
}

main()
  .catch(
    async (error) => {
      console.error(
        "\nRequirement Resolution test failed:",
      );

      console.error(
        error,
      );

      /*
       * Best-effort cleanup so failed tests do not
       * intentionally leave temporary requirement
       * packs behind.
       */
      try {
        await cleanup();
      } catch (
        cleanupError
      ) {
        console.error(
          "Test cleanup also failed:",
        );

        console.error(
          cleanupError,
        );
      }

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
