import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
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

async function main() {
  const planningRecordId =
    process.argv[2];

  if (!planningRecordId) {
    throw new Error(
      "Usage: npx tsx prisma/check-excavation-requirements-package.ts <planningRecordId>",
    );
  }

  const result =
    await resolveApplicablePlanningRequirements(
      planningRecordId,
      {
        activityCodes: [
          "EXCAVATION",
          "UNDERGROUND_UTILITIES",
        ],
      },
    );

  console.log("");
  console.log(
    "===== APPLICABLE PACKS =====",
  );

  console.table(
    result.applicablePacks.map(
      (pack) => ({
        name:
          pack.name,
        type:
          pack.packType,
        organization:
          pack.organizationName,
        version:
          pack.version,
      }),
    ),
  );

  console.log("");
  console.log(
    "===== APPLICABLE RULES =====",
  );

  console.table(
    result.rules.map(
      (rule) => ({
        ruleCode:
          rule.ruleCode,
        pack:
          rule.requirementPackName,
        sourceLevel:
          rule.sourceLevel,
        category:
          rule.category,
        group:
          rule.resolutionGroupKey,
        relationship:
          rule.relationshipHint,
        stringencyRank:
          rule.stringencyRank,
      }),
    ),
  );

  console.log("");
  console.log(
    "===== RESOLUTION GROUPS =====",
  );

  console.table(
    result.groups.map(
      (group) => ({
        groupKey:
          group.groupKey,
        relationship:
          group.relationship,
        status:
          group.status,
        rules:
          group.ruleCodes.join(
            ", ",
          ),
        controllingRule:
          group.controllingRuleCode ??
          "",
        qualifiedReview:
          group.requiresQualifiedReview,
      }),
    ),
  );

  const utilityIdentification =
    result.groups.find(
      (group) =>
        group.groupKey ===
        "EXCAVATION_UTILITY_IDENTIFICATION",
    );

  const utilityApproach =
    result.groups.find(
      (group) =>
        group.groupKey ===
        "EXCAVATION_UTILITY_APPROACH_METHOD",
    );

  console.log("");
  console.log(
    "===== PACKAGE ASSERTIONS =====",
  );

  console.log(
    "Utility identification additive:",
    utilityIdentification?.status ===
      "Additive"
      ? "PASS"
      : "NOT PRESENT / FAIL",
  );

  console.log(
    "Utility approach additive:",
    utilityApproach?.status ===
      "Additive"
      ? "PASS"
      : "NOT PRESENT / FAIL",
  );

  const legacy =
    await prisma.requirementRule.findFirst({
      where: {
        ruleCode:
          "OSHA_1926_651_B_UNDERGROUND_INSTALLATIONS",
      },

      select: {
        ruleCode:
          true,
        status:
          true,
        isActive:
          true,
      },
    });

  console.log(
    "Legacy combined OSHA rule retired:",
    !legacy ||
    (
      legacy.isActive ===
        false &&
      legacy.status ===
        "Retired"
    )
      ? "PASS"
      : "FAIL",
  );

  console.log("");
  console.log(
    "Resolver version:",
    result.metadata
      .resolverVersion,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode =
      1;
  })
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );