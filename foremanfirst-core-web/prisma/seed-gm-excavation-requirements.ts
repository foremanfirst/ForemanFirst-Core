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

const TENANT_ID =
  process.argv[2] ??
  "development-tenant";

const PACK_NAME =
  "GM Special Safety Conditions — Excavation & Trenching";

const PACK_VERSION = 1;

async function findQuestion(
  questionCode: string,
) {
  const question =
    await prisma.planningQuestionDefinition.findFirst({
      where: {
        questionCode,
        isActive: true,
        isArchived: false,

        OR: [
          {
            tenantId: "QOREVA",
          },
          {
            tenantId: TENANT_ID,
          },
        ],
      },

      orderBy: [
        {
          version: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  if (!question) {
    throw new Error(
      `Planning question ${questionCode} was not found.`,
    );
  }

  return question;
}

async function main() {
  console.log(
    "Seeding GM Excavation Requirements...",
  );

  /*
   * ---------------------------------------------------------
   * GM OWNER REQUIREMENT PACK
   * ---------------------------------------------------------
   *
   * This development seed applies the GM Owner pack
   * tenant-wide so we can prove the hierarchy.
   *
   * Production applicability will later be driven by
   * project Owner / Requirement Pack assignment.
   */
  let pack =
    await prisma.requirementPack.findFirst({
      where: {
        tenantId: TENANT_ID,
        name: PACK_NAME,
        packType: "Owner",
        version: PACK_VERSION,
        isArchived: false,
      },
    });

  if (pack) {
    pack =
      await prisma.requirementPack.update({
        where: {
          id: pack.id,
        },

        data: {
          description:
            "General Motors Special Safety Conditions excavation and trenching requirements.",

          organizationName:
            "General Motors",

          status:
            "Active",

          applicability:
            Prisma.JsonNull,

          approvalRouting:
            Prisma.JsonNull,

          isActive:
            true,

          isArchived:
            false,

          archivedAt:
            null,
        },
      });
  } else {
    pack =
      await prisma.requirementPack.create({
        data: {
          tenantId: TENANT_ID,

          name: PACK_NAME,

          description:
            "General Motors Special Safety Conditions excavation and trenching requirements.",

          packType:
            "Owner",

          organizationName:
            "General Motors",

          version:
            PACK_VERSION,

          status:
            "Active",

          isActive:
            true,

          isArchived:
            false,
        },
      });
  }

  console.log(
    `✓ Owner Pack: ${pack.name}`,
  );

  /*
   * ---------------------------------------------------------
   * GM 5.24 — UNDERGROUND UTILITY IDENTIFICATION
   * ---------------------------------------------------------
   */
  const utilityIdentification =
    await prisma.requirementRule.upsert({
      where: {
        requirementPackId_ruleCode: {
          requirementPackId:
            pack.id,

          ruleCode:
            "GM_SSC_5_24_1A_UTILITY_IDENTIFICATION",
        },
      },

      update: {
        tenantId:
          TENANT_ID,

        title:
          "Underground Utility Identification Method",

        requirementText:
          "The excavation plan must identify underground utilities and document the method used to identify them.",

        category:
          "Excavation / Underground Utilities",

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
                "UTILITY_IDENTIFICATION_METHOD",

              description:
                "Method used to identify underground utilities.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Identify underground utilities before excavation.",

            "Document the method used to identify the underground utilities.",

            "Use appropriate locating methods based on site conditions and available information.",
          ],
        },

        severity:
          "Critical",

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "Section 5.24 — Risk Mitigation Requirement for Excavation and Trenching",

        sourceReference: {
          authority:
            "General Motors",

          requirementType:
            "Owner",

          citation:
            "GM SSC §5.24, Pre-Excavation Activities 1(a)",

          revision:
            "May 22, 2023",

          subject:
            "Underground utility identification",
        },

        status:
          "Active",

        isActive:
          true,
      },

      create: {
        tenantId:
          TENANT_ID,

        requirementPackId:
          pack.id,

        ruleCode:
          "GM_SSC_5_24_1A_UTILITY_IDENTIFICATION",

        title:
          "Underground Utility Identification Method",

        requirementText:
          "The excavation plan must identify underground utilities and document the method used to identify them.",

        category:
          "Excavation / Underground Utilities",

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
                "UTILITY_IDENTIFICATION_METHOD",

              description:
                "Method used to identify underground utilities.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Identify underground utilities before excavation.",

            "Document the method used to identify the underground utilities.",

            "Use appropriate locating methods based on site conditions and available information.",
          ],
        },

        severity:
          "Critical",

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "Section 5.24 — Risk Mitigation Requirement for Excavation and Trenching",

        sourceReference: {
          authority:
            "General Motors",

          requirementType:
            "Owner",

          citation:
            "GM SSC §5.24, Pre-Excavation Activities 1(a)",

          revision:
            "May 22, 2023",

          subject:
            "Underground utility identification",
        },

        status:
          "Active",

        isActive:
          true,
      },
    });

  /*
   * ---------------------------------------------------------
   * GM 5.24 — APPROACHING UNDERGROUND UTILITIES
   * ---------------------------------------------------------
   */
  const utilityApproach =
    await prisma.requirementRule.upsert({
      where: {
        requirementPackId_ruleCode: {
          requirementPackId:
            pack.id,

          ruleCode:
            "GM_SSC_5_24_1B_UTILITY_APPROACH_METHOD",
        },
      },

      update: {
        tenantId:
          TENANT_ID,

        title:
          "Excavation Method Near Underground Utilities",

        requirementText:
          "The excavation plan must define the excavation method to be used when equipment gets close to an underground utility, such as hand digging, hydro excavation, or vacuum excavation.",

        category:
          "Excavation / Underground Utilities",

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
                "UTILITY_APPROACH_METHOD",

              description:
                "Method used when excavation equipment approaches an underground utility.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Define the excavation method that will be used when equipment approaches an underground utility.",

            "Use the applicable hand-digging, hydro-excavation, vacuum-excavation, or other approved method required by the plan.",
          ],
        },

        severity:
          "Critical",

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "Section 5.24 — Risk Mitigation Requirement for Excavation and Trenching",

        sourceReference: {
          authority:
            "General Motors",

          requirementType:
            "Owner",

          citation:
            "GM SSC §5.24, Pre-Excavation Activities 1(b)",

          revision:
            "May 22, 2023",

          subject:
            "Excavation near underground utilities",
        },

        status:
          "Active",

        isActive:
          true,
      },

      create: {
        tenantId:
          TENANT_ID,

        requirementPackId:
          pack.id,

        ruleCode:
          "GM_SSC_5_24_1B_UTILITY_APPROACH_METHOD",

        title:
          "Excavation Method Near Underground Utilities",

        requirementText:
          "The excavation plan must define the excavation method to be used when equipment gets close to an underground utility, such as hand digging, hydro excavation, or vacuum excavation.",

        category:
          "Excavation / Underground Utilities",

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
                "UTILITY_APPROACH_METHOD",

              description:
                "Method used when excavation equipment approaches an underground utility.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Define the excavation method that will be used when equipment approaches an underground utility.",

            "Use the applicable hand-digging, hydro-excavation, vacuum-excavation, or other approved method required by the plan.",
          ],
        },

        severity:
          "Critical",

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "Section 5.24 — Risk Mitigation Requirement for Excavation and Trenching",

        sourceReference: {
          authority:
            "General Motors",

          requirementType:
            "Owner",

          citation:
            "GM SSC §5.24, Pre-Excavation Activities 1(b)",

          revision:
            "May 22, 2023",

          subject:
            "Excavation near underground utilities",
        },

        status:
          "Active",

        isActive:
          true,
      },
    });

  /*
   * ---------------------------------------------------------
   * QUESTION LINKS
   * ---------------------------------------------------------
   */
  await prisma.planningQuestionRequirement.deleteMany({
    where: {
      requirementRuleId: {
        in: [
          utilityIdentification.id,
          utilityApproach.id,
        ],
      },
    },
  });

  const utilitiesPresent =
    await findQuestion(
      "EXCAVATION_UTILITIES_PRESENT",
    );

  const locateMethod =
    await findQuestion(
      "UTILITY_LOCATE_METHOD",
    );

  const positiveExposure =
    await findQuestion(
      "UTILITY_POSITIVE_EXPOSURE",
    );

  await prisma.planningQuestionRequirement.createMany({
    data: [
      {
        tenantId:
          TENANT_ID,

        questionDefinitionId:
          utilitiesPresent.id,

        requirementRuleId:
          utilityIdentification.id,

        purpose:
          "Information",
      },

      {
        tenantId:
          TENANT_ID,

        questionDefinitionId:
          locateMethod.id,

        requirementRuleId:
          utilityIdentification.id,

        purpose:
          "Validation",
      },

      {
        tenantId:
          TENANT_ID,

        questionDefinitionId:
          positiveExposure.id,

        requirementRuleId:
          utilityApproach.id,

        purpose:
          "ControlConfirmation",
      },
    ],
  });

  console.log(
    "✓ GM SSC §5.24 1(a) linked",
  );

  console.log(
    "✓ GM SSC §5.24 1(b) linked",
  );

  console.log("");
  console.log(
    "GM excavation requirement seed complete.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
