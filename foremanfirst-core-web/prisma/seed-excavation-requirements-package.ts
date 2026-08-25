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

const OSHA_PACK_NAME =
  "Federal OSHA Construction — Excavation & Trenching";

const GM_PACK_NAME =
  "GM Special Safety Conditions — Excavation & Trenching";

const OSHA_VERSION = 1;
const GM_VERSION = 1;

type QuestionLinkSeed = {
  questionCode: string;
  purpose:
    | "Information"
    | "Validation"
    | "ControlConfirmation";
};

type RuleSeed = {
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

  questionLinks:
    QuestionLinkSeed[];
};

type PackSeed = {
  name: string;
  description: string;
  packType:
    | "Federal"
    | "Owner";
  organizationName: string;
  version: number;

  /*
   * Federal OSHA applies tenant-wide under the current
   * tenant-scoped resolver.
   *
   * GM is restricted to projects whose configured
   * client/owner name is General Motors or GM.
   */
  applicability:
    Prisma.InputJsonValue | null;

  rules: RuleSeed[];
};

const ACTIVITY_TRIGGER = {
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
} satisfies Prisma.InputJsonValue;

const EXCAVATION_ONLY_TRIGGER = {
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
} satisfies Prisma.InputJsonValue;

/*
 * Resolution groups are deliberately granular.
 *
 * One source rule should not be forced into multiple unrelated
 * comparison groups. OSHA 1926.651(b) is therefore represented
 * as discrete requirement rules instead of one oversized rule.
 *
 * The current verified OSHA and GM requirements in the two
 * utility groups are ADDITIVE:
 *
 * - OSHA establishes the Federal location / verification duty.
 * - GM adds owner-specific planning / method requirements.
 *
 * Qoreva therefore preserves both. It does not declare one
 * "controlling" merely because Owner follows Federal in the
 * source hierarchy.
 */
const GROUP_UTILITY_IDENTIFICATION =
  "EXCAVATION_UTILITY_IDENTIFICATION";

const GROUP_UTILITY_APPROACH =
  "EXCAVATION_UTILITY_APPROACH_METHOD";

const packs: PackSeed[] = [
  {
    name:
      OSHA_PACK_NAME,

    description:
      "Federal OSHA construction baseline requirements used by Qoreva Planning for excavation, trenching, underground-installation verification, and cave-in protection.",

    packType:
      "Federal",

    organizationName:
      "Occupational Safety and Health Administration",

    version:
      OSHA_VERSION,

    applicability:
      null,

    rules: [
      {
        ruleCode:
          "OSHA_1926_651_B1_B2_UTILITY_IDENTIFICATION",

        title:
          "Underground Installation Identification Before Excavation",

        requirementText:
          "Before excavation begins, the estimated location of underground installations that may reasonably be encountered must be determined, and applicable utility companies or owners must be contacted for available location information.",

        category:
          "Excavation / Underground Utilities",

        severity:
          "Critical",

        triggerConditions:
          ACTIVITY_TRIGGER,

        requiredInformation: {
          items: [
            {
              code:
                "UTILITIES_PRESENT",

              description:
                "Whether underground installations are present or reasonably expected in the work area.",
            },

            {
              code:
                "UTILITY_IDENTIFICATION_METHOD",

              description:
                "How the estimated underground-installation locations will be identified before excavation.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Determine the estimated location of underground installations before excavation begins.",

            "Contact applicable utility companies or owners and obtain available location information before excavation begins.",
          ],
        },

        sourceDocumentName:
          "29 CFR Part 1926 Subpart P — Excavations",

        sourcePage:
          "§ 1926.651(b)(1)-(2)",

        sourceReference: {
          authority:
            "Occupational Safety and Health Administration",

          jurisdiction:
            "Federal",

          regulation:
            "29 CFR 1926.651",

          citation:
            "29 CFR 1926.651(b)(1)-(2)",

          subject:
            "Underground installation identification",

          sourceType:
            "Regulation",

          resolution: {
            groupKey:
              GROUP_UTILITY_IDENTIFICATION,

            relationship:
              "Additive",
          },
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
        ],
      },

      {
        ruleCode:
          "OSHA_1926_651_B3_EXACT_UTILITY_LOCATION",

        title:
          "Exact Underground Installation Location Near Excavation",

        requirementText:
          "When excavation approaches the estimated location of an underground installation, its exact location must be determined by safe and acceptable means.",

        category:
          "Excavation / Underground Utilities",

        severity:
          "Critical",

        triggerConditions:
          ACTIVITY_TRIGGER,

        requiredInformation: {
          items: [
            {
              code:
                "UTILITY_EXACT_LOCATION_METHOD",

              description:
                "The safe and acceptable method used to determine the exact underground-installation location as excavation approaches it.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "As excavation approaches an estimated underground-installation location, determine the exact location using safe and acceptable means.",

            "Do not represent hydro excavation, vacuum excavation, or hand digging as a universal OSHA mandate unless another applicable requirement specifically requires that method.",
          ],
        },

        sourceDocumentName:
          "29 CFR Part 1926 Subpart P — Excavations",

        sourcePage:
          "§ 1926.651(b)(3)",

        sourceReference: {
          authority:
            "Occupational Safety and Health Administration",

          jurisdiction:
            "Federal",

          regulation:
            "29 CFR 1926.651",

          citation:
            "29 CFR 1926.651(b)(3)",

          subject:
            "Exact location of underground installations",

          sourceType:
            "Regulation",

          resolution: {
            groupKey:
              GROUP_UTILITY_APPROACH,

            relationship:
              "Additive",
          },
        },

        questionLinks: [
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
          "OSHA_1926_651_B4_EXPOSED_INSTALLATIONS",

        title:
          "Protection of Exposed Underground Installations",

        requirementText:
          "While an excavation remains open, underground installations must be protected, supported, or removed as necessary to safeguard employees.",

        category:
          "Excavation / Underground Utilities",

        severity:
          "Critical",

        triggerConditions:
          ACTIVITY_TRIGGER,

        requiredInformation: {
          items: [
            {
              code:
                "EXPOSED_INSTALLATIONS",

              description:
                "Whether underground installations will be exposed or unsupported while the excavation remains open.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Protect, support, or remove exposed underground installations as necessary to safeguard employees while the excavation remains open.",
          ],
        },

        sourceDocumentName:
          "29 CFR Part 1926 Subpart P — Excavations",

        sourcePage:
          "§ 1926.651(b)(4)",

        sourceReference: {
          authority:
            "Occupational Safety and Health Administration",

          jurisdiction:
            "Federal",

          regulation:
            "29 CFR 1926.651",

          citation:
            "29 CFR 1926.651(b)(4)",

          subject:
            "Protection of exposed underground installations",

          sourceType:
            "Regulation",
        },

        /*
         * No dedicated question exists yet for exposed-installation
         * support/protection. Keep this rule active and standalone so
         * the Draft Builder / requirements layer can still consume it.
         * A future Guided Intake question can link here without changing
         * the rule identity.
         */
        questionLinks: [],
      },

      {
        ruleCode:
          "OSHA_1926_652_A_CAVE_IN_PROTECTION",

        title:
          "Excavation Cave-In Protection",

        requirementText:
          "Employees in excavations must be protected from cave-ins by an adequate protective system unless the excavation is entirely in stable rock or is less than 5 feet deep and a competent person finds no indication of a potential cave-in.",

        category:
          "Excavation / Protective Systems",

        severity:
          "Critical",

        triggerConditions:
          EXCAVATION_ONLY_TRIGGER,

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
            "Protect employees from cave-ins using an adequate protective system when required.",

            "Do not use excavation depth alone to determine whether cave-in protection is required.",

            "For excavations less than 5 feet deep, the exception applies only when a competent person finds no indication of a potential cave-in.",

            "Protective systems must be capable of resisting the loads intended or reasonably expected to be applied to the system.",
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
    ],
  },

  {
    name:
      GM_PACK_NAME,

    description:
      "General Motors owner-specific excavation and underground-utility requirements from the GM Special Safety Conditions, Revision May 22, 2023.",

    packType:
      "Owner",

    organizationName:
      "General Motors",

    version:
      GM_VERSION,

    applicability: {
      ownerNames: [
        "General Motors",
        "GM",
      ],
    },

    rules: [
      {
        ruleCode:
          "GM_SSC_5_24_1A_UTILITY_IDENTIFICATION",

        title:
          "Underground Utility Identification Method",

        requirementText:
          "The excavation plan must identify underground utilities and document the method used to identify them.",

        category:
          "Excavation / Underground Utilities",

        severity:
          "Critical",

        triggerConditions:
          ACTIVITY_TRIGGER,

        requiredInformation: {
          items: [
            {
              code:
                "GM_UTILITY_IDENTIFICATION_METHOD",

              description:
                "The method used by the excavation plan to identify underground utilities.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Identify underground utilities before excavation work proceeds.",

            "Document the utility-identification method in the excavation planning record.",
          ],
        },

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "§ 5.24 — Pre-Excavation Activities 1(a)",

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

          resolution: {
            groupKey:
              GROUP_UTILITY_IDENTIFICATION,

            relationship:
              "Additive",
          },
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
        ],
      },

      {
        ruleCode:
          "GM_SSC_5_24_1B_UTILITY_APPROACH_METHOD",

        title:
          "Excavation Method Near Underground Utilities",

        requirementText:
          "The excavation plan must define the excavation method to be used when equipment gets close to an underground utility, such as hand digging, hydro excavation, or vacuum excavation.",

        category:
          "Excavation / Underground Utilities",

        severity:
          "Critical",

        triggerConditions:
          ACTIVITY_TRIGGER,

        requiredInformation: {
          items: [
            {
              code:
                "GM_UTILITY_APPROACH_METHOD",

              description:
                "The excavation method the plan will use when equipment approaches an underground utility.",
            },
          ],
        },

        requiredControls: {
          controls: [
            "Define the excavation method that will be used when equipment approaches an underground utility.",

            "Use the applicable hand-digging, hydro-excavation, vacuum-excavation, or other approved method required by the plan.",
          ],
        },

        sourceDocumentName:
          "GM Special Safety Conditions",

        sourcePage:
          "§ 5.24 — Pre-Excavation Activities 1(b)",

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

          resolution: {
            groupKey:
              GROUP_UTILITY_APPROACH,

            relationship:
              "Additive",
          },
        },

        questionLinks: [
          {
            questionCode:
              "UTILITY_POSITIVE_EXPOSURE",

            purpose:
              "ControlConfirmation",
          },
        ],
      },
    ],
  },
];

/*
 * The first OSHA excavation seed used one combined
 * 1926.651(b)(1)-(4) rule. The resolution engine now needs
 * granular comparison subjects, so this package retires that
 * oversized seed rule after the replacement rules are created.
 */
const LEGACY_RULE_CODES = [
  "OSHA_1926_651_B_UNDERGROUND_INSTALLATIONS",
];

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

async function upsertPack(
  seed: PackSeed,
) {
  const existing =
    await prisma.requirementPack.findFirst({
      where: {
        tenantId:
          TENANT_ID,

        name:
          seed.name,

        packType:
          seed.packType,

        version:
          seed.version,

        isArchived:
          false,
      },
    });

  if (existing) {
    /*
     * Preserve a configured applicability object when the pack
     * already exists. This avoids accidentally broadening a pack
     * that an environment has already scoped more precisely.
     */
    return prisma.requirementPack.update({
      where: {
        id:
          existing.id,
      },

      data: {
        description:
          seed.description,

        organizationName:
          seed.organizationName,

        status:
          "Active",

        applicability:
          existing.applicability ??
          seed.applicability ??
          Prisma.JsonNull,

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
        seed.name,

      description:
        seed.description,

      packType:
        seed.packType,

      organizationName:
        seed.organizationName,

      version:
        seed.version,

      status:
        "Active",

      applicability:
        seed.applicability ??
        Prisma.JsonNull,

      isActive:
        true,

      isArchived:
        false,
    },
  });
}

async function upsertRule({
  requirementPackId,
  seed,
}: {
  requirementPackId: string;
  seed: RuleSeed;
}) {
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
   * The seed owns the linkage configuration for these rules.
   * Rebuild links so rerunning the seed cannot leave obsolete
   * links behind.
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

async function retireLegacyRules(
  oshaPackId: string,
) {
  const retired =
    await prisma.requirementRule.updateMany({
      where: {
        requirementPackId:
          oshaPackId,

        ruleCode: {
          in:
            LEGACY_RULE_CODES,
        },

        isActive:
          true,
      },

      data: {
        isActive:
          false,

        status:
          "Retired",
      },
    });

  return retired.count;
}

async function main() {
  console.log(
    "Seeding complete Excavation Requirements package...",
  );

  console.log(
    `Tenant: ${TENANT_ID}`,
  );

  const seededPackIds =
    new Map<string, string>();

  for (
    const packSeed of
    packs
  ) {
    const pack =
      await upsertPack(
        packSeed,
      );

    seededPackIds.set(
      packSeed.name,
      pack.id,
    );

    console.log("");
    console.log(
      `✓ ${pack.packType} Pack: ${pack.name}`,
    );

    for (
      const ruleSeed of
      packSeed.rules
    ) {
      const rule =
        await upsertRule({
          requirementPackId:
            pack.id,

          seed:
            ruleSeed,
        });

      console.log(
        `  ✓ ${rule.ruleCode}`,
      );

      for (
        const link of
        ruleSeed.questionLinks
      ) {
        console.log(
          `    ↳ ${link.questionCode} (${link.purpose})`,
        );
      }
    }
  }

  const oshaPackId =
    seededPackIds.get(
      OSHA_PACK_NAME,
    );

  if (!oshaPackId) {
    throw new Error(
      "OSHA pack was not created.",
    );
  }

  const retiredCount =
    await retireLegacyRules(
      oshaPackId,
    );

  console.log("");
  console.log(
    `✓ Retired ${retiredCount} legacy oversized OSHA rule(s).`,
  );

  console.log("");
  console.log(
    "Resolution configuration:",
  );

  console.log(
    `✓ ${GROUP_UTILITY_IDENTIFICATION} → Additive`,
  );

  console.log(
    `✓ ${GROUP_UTILITY_APPROACH} → Additive`,
  );

  console.log("");
  console.log(
    "Expected behavior:",
  );

  console.log(
    "1. Federal OSHA excavation requirements apply tenant-wide.",
  );

  console.log(
    "2. GM owner requirements apply only when the project owner/client matches General Motors or GM, unless an existing environment has a more specific applicability configuration.",
  );

  console.log(
    "3. OSHA + GM utility-identification requirements resolve as Additive.",
  );

  console.log(
    "4. OSHA + GM utility-approach requirements resolve as Additive.",
  );

  console.log(
    "5. Qoreva does not declare an Owner rule controlling merely because it is an Owner requirement.",
  );

  console.log(
    "6. Linked Step 5 questions retain Federal / OSHA and Owner Requirement provenance.",
  );

  console.log("");
  console.log(
    "Complete Excavation Requirements package seed finished.",
  );
}

main()
  .catch((error) => {
    console.error(
      "Excavation Requirements package seed failed:",
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