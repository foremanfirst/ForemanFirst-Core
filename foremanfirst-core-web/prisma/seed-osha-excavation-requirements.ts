import "dotenv/config";
import {
  Prisma,
  PrismaClient,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

/*
 * Current resolver architecture loads Requirement Packs
 * from the Planning Record tenant.
 *
 * For the development environment this Federal OSHA
 * baseline is therefore installed into development-tenant.
 *
 * Future architecture should support Qoreva-managed
 * global regulatory packs inherited by every tenant.
 */
const TENANT_ID =
  process.argv[2] ??
  "development-tenant";

const PACK_NAME =
  "Federal OSHA Construction — Excavation & Trenching";

const PACK_VERSION = 1;

type RequirementSeed = {
  ruleCode: string;
  title: string;
  requirementText: string;
  category: string;
  severity: string;

  triggerConditions:
    Prisma.InputJsonValue;

  requiredInformation:
    Prisma.InputJsonValue;

  requiredControls:
    Prisma.InputJsonValue;

  sourceDocumentName: string;
  sourcePage: string;
  sourceReference:
    Prisma.InputJsonValue;

  questionLinks: Array<{
    questionCode: string;
    purpose:
      | "Information"
      | "Validation"
      | "ControlConfirmation";
  }>;
};

const requirements:
  RequirementSeed[] = [
  {
    ruleCode:
      "OSHA_1926_651_B_UNDERGROUND_INSTALLATIONS",

    title:
      "Underground Installation Location and Verification",

    requirementText:
      "Before excavation begins, the estimated location of underground installations that may reasonably be encountered must be determined. Utility companies or owners must be contacted as required, and when excavation approaches an estimated underground installation location, the exact location must be determined by safe and acceptable means.",

    category:
      "Excavation / Underground Utilities",

    severity:
      "Critical",

    triggerConditions: {
      match: "ANY",

      conditions: [
        {
          type:
            "ActivityDetected",

          activityCodes: [
            "EXCAVATION",
            "UNDERGROUND_UTILITIES",
          ],
        },
      ],
    },

    requiredInformation: {
      items: [
        {
          code:
            "UTILITIES_PRESENT",

          description:
            "Whether underground installations are present or reasonably expected within the excavation work area.",
        },

        {
          code:
            "UTILITY_LOCATION_METHOD",

          description:
            "The method used to determine estimated and exact underground installation locations.",
        },

        {
          code:
            "UTILITY_EXACT_LOCATION",

          description:
            "How exact location will be safely verified as excavation approaches underground installations.",
        },
      ],
    },

    requiredControls: {
      controls: [
        "Determine the estimated location of underground installations before opening the excavation.",

        "Contact applicable utility companies or owners and obtain available location information before excavation begins.",

        "As excavation approaches an estimated underground installation location, determine the exact location using safe and acceptable means.",

        "Protect, support, or remove exposed underground installations as necessary to safeguard employees while the excavation remains open.",
      ],
    },

    sourceDocumentName:
      "29 CFR Part 1926 Subpart P — Excavations",

    sourcePage:
      "§ 1926.651(b)(1)-(4)",

    sourceReference: {
      authority:
        "Occupational Safety and Health Administration",

      jurisdiction:
        "Federal",

      regulation:
        "29 CFR 1926.651",

      citation:
        "29 CFR 1926.651(b)(1)-(4)",

      subject:
        "Underground installations",

      sourceType:
        "Regulation",

      /*
       * No resolution group is assigned yet.
       *
       * This Federal requirement remains standalone until
       * an explicitly comparable State, Owner, GC, Company,
       * or Project requirement is configured.
       *
       * Qoreva must not infer stringency from source level.
       */
    },

    questionLinks: [
      {
        questionCode:
          "EXCAVATION_UTILITIES_PRESENT",

        purpose:
          "Information",
      },

      {
        questionCode:
          "UTILITY_LOCATE_METHOD",

        purpose:
          "Validation",
      },

      {
        questionCode:
          "UTILITY_POSITIVE_EXPOSURE",

        purpose:
          "Validation",
      },
    ],
  },

  {
    ruleCode:
      "OSHA_1926_652_A_CAVE_IN_PROTECTION",

    title:
      "Excavation Cave-In Protection",

    requirementText:
      "Employees in excavations must be protected from cave-ins by an adequate protective system unless the excavation is made entirely in stable rock or is less than 5 feet deep and a competent person finds no indication of a potential cave-in.",

    category:
      "Excavation / Protective Systems",

    severity:
      "Critical",

    triggerConditions: {
      match: "ANY",

      conditions: [
        {
          type:
            "ActivityDetected",

          activityCodes: [
            "EXCAVATION",
          ],
        },
      ],
    },

    requiredInformation: {
      items: [
        {
          code:
            "EXCAVATION_MAX_DEPTH",

          description:
            "Expected maximum excavation depth.",
        },

        {
          code:
            "GROUND_CONDITION",

          description:
            "Ground or soil condition relevant to protective-system selection.",
        },

        {
          code:
            "COMPETENT_PERSON_EVALUATION",

          description:
            "Competent-person evaluation of cave-in potential and protective-system requirements.",
        },
      ],
    },

    requiredControls: {
      controls: [
        "Protect employees from cave-ins using an adequate protective system when required by 29 CFR 1926.652.",

        "Do not use excavation depth alone to determine whether cave-in protection is required.",

        "For excavations less than 5 feet deep, the exception applies only when a competent person finds no indication of a potential cave-in.",

        "Protective systems must be capable of resisting the loads that are intended or could reasonably be expected to be applied to the system.",
      ],
    },

    sourceDocumentName:
      "29 CFR Part 1926 Subpart P — Excavations",

    sourcePage:
      "§ 1926.652(a)",

    sourceReference: {
      authority:
        "Occupational Safety and Health Administration",

      jurisdiction:
        "Federal",

      regulation:
        "29 CFR 1926.652",

      citation:
        "29 CFR 1926.652(a)(1)-(2)",

      subject:
        "Protection of employees in excavations",

      sourceType:
        "Regulation",
    },

    questionLinks: [
      {
        questionCode:
          "EXCAVATION_MAX_DEPTH",

        purpose:
          "Information",
      },
    ],
  },
];

async function findOrCreatePack() {
  const existing =
    await prisma.requirementPack.findFirst({
      where: {
        tenantId:
          TENANT_ID,

        name:
          PACK_NAME,

        packType:
          "Federal",

        version:
          PACK_VERSION,

        isArchived:
          false,
      },
    });

  if (existing) {
    return prisma.requirementPack.update({
      where: {
        id:
          existing.id,
      },

      data: {
        description:
          "Federal OSHA construction baseline requirements for excavation, trenching, and underground-installation planning under 29 CFR Part 1926 Subpart P.",

        packType:
          "Federal",

        organizationName:
          "Occupational Safety and Health Administration",

        status:
          "Active",

        /*
         * Null applicability means tenant-wide under the
         * current Requirement Pack applicability engine.
         */
        applicability:
          Prisma.JsonNull,

        approvalRouting:
          Prisma.JsonNull,

        effectiveDate:
          null,

        expirationDate:
          null,

        isActive:
          true,

        isArchived:
          false,

        archivedAt:
          null,
      },
    });
  }

  return prisma.requirementPack.create({
    data: {
      tenantId:
        TENANT_ID,

      name:
        PACK_NAME,

      description:
        "Federal OSHA construction baseline requirements for excavation, trenching, and underground-installation planning under 29 CFR Part 1926 Subpart P.",

      packType:
        "Federal",

      organizationName:
        "Occupational Safety and Health Administration",

      version:
        PACK_VERSION,

      status:
        "Active",

      /*
       * No applicability object means the active Federal
       * baseline applies tenant-wide.
       */
      effectiveDate:
        null,

      expirationDate:
        null,

      isActive:
        true,

      isArchived:
        false,
    },
  });
}

async function findQuestion(
  questionCode: string,
) {
  const definition =
    await prisma.planningQuestionDefinition.findFirst({
      where: {
        questionCode,

        isActive:
          true,

        isArchived:
          false,

        OR: [
          {
            tenantId:
              "QOREVA",
          },

          {
            tenantId:
              TENANT_ID,
          },
        ],
      },

      orderBy: [
        {
          version:
            "desc",
        },

        {
          createdAt:
            "desc",
        },
      ],
    });

  if (!definition) {
    throw new Error(
      `Planning question ${questionCode} was not found.`,
    );
  }

  return definition;
}

async function upsertRequirement(
  requirementPackId: string,
  seed: RequirementSeed,
) {
  const rule =
    await prisma.requirementRule.upsert({
      where: {
        requirementPackId_ruleCode: {
          requirementPackId,
          ruleCode:
            seed.ruleCode,
        },
      },

      update: {
        tenantId:
          TENANT_ID,

        title:
          seed.title,

        requirementText:
          seed.requirementText,

        category:
          seed.category,

        triggerConditions:
          seed.triggerConditions,

        requiredInformation:
          seed.requiredInformation,

        requiredControls:
          seed.requiredControls,

        severity:
          seed.severity,

        sourceDocumentName:
          seed.sourceDocumentName,

        sourcePage:
          seed.sourcePage,

        sourceReference:
          seed.sourceReference,

        status:
          "Active",

        effectiveDate:
          null,

        expirationDate:
          null,

        isActive:
          true,
      },

      create: {
        tenantId:
          TENANT_ID,

        requirementPackId,

        ruleCode:
          seed.ruleCode,

        title:
          seed.title,

        requirementText:
          seed.requirementText,

        category:
          seed.category,

        triggerConditions:
          seed.triggerConditions,

        requiredInformation:
          seed.requiredInformation,

        requiredControls:
          seed.requiredControls,

        severity:
          seed.severity,

        sourceDocumentName:
          seed.sourceDocumentName,

        sourcePage:
          seed.sourcePage,

        sourceReference:
          seed.sourceReference,

        status:
          "Active",

        isActive:
          true,
      },
    });

  /*
   * Remove obsolete links for this seeded rule first.
   *
   * This makes the seed authoritative and idempotent:
   * rerunning it cannot leave an outdated question link
   * behind after the configuration changes.
   */
  await prisma.planningQuestionRequirement.deleteMany({
    where: {
      requirementRuleId:
        rule.id,
    },
  });

  for (
    const link of
    seed.questionLinks
  ) {
    const definition =
      await findQuestion(
        link.questionCode,
      );

    await prisma.planningQuestionRequirement.create({
      data: {
        tenantId:
          TENANT_ID,

        questionDefinitionId:
          definition.id,

        requirementRuleId:
          rule.id,

        purpose:
          link.purpose,
      },
    });
  }

  return rule;
}

async function main() {
  console.log(
    "Seeding Federal OSHA Excavation Requirements...",
  );

  console.log(
    `Tenant: ${TENANT_ID}`,
  );

  const pack =
    await findOrCreatePack();

  console.log(
    `✓ Requirement Pack: ${pack.name}`,
  );

  for (
    const requirement of
    requirements
  ) {
    const rule =
      await upsertRequirement(
        pack.id,
        requirement,
      );

    console.log(
      `✓ ${rule.ruleCode}`,
    );

    for (
      const link of
      requirement.questionLinks
    ) {
      console.log(
        `  ↳ ${link.questionCode} (${link.purpose})`,
      );
    }
  }

  console.log("");
  console.log(
    "Federal OSHA Excavation Requirement seed complete.",
  );

  console.log("");
  console.log(
    "Expected Guided Planning behavior:",
  );

  console.log(
    "1. Confirm EXCAVATION and/or UNDERGROUND_UTILITIES.",
  );

  console.log(
    "2. Applicable excavation questions continue to appear normally.",
  );

  console.log(
    "3. Linked questions display the Federal / OSHA provenance badge.",
  );

  console.log(
    '4. "Why Qoreva is asking" displays the applicable OSHA requirement and citation.',
  );

  console.log(
    "5. Removing the triggering activity removes the applicable requirement provenance.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Federal OSHA Excavation Requirement seed failed:",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  })
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
