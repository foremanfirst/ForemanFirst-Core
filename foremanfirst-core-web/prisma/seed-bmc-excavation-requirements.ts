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

const TENANT_ID =
  "development-tenant";

const PACK_ID =
  "bmc-excavation-requirements-v1";

const PACK_NAME =
  "Barton Malow Company Safety Manual — Excavation & Trenching";

const ORGANIZATION_NAME =
  "Barton Malow";

const REVISION =
  "July 14, 2020";

const prisma =
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });

function json(
  value: unknown,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

type QuestionLink = {
  questionCode: string;
  purpose:
    | "Information"
    | "Validation"
    | "ControlConfirmation";
};

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

  sourcePage: string;

  sourceReference:
    Prisma.InputJsonValue;

  questionLinks:
    QuestionLink[];
};

const excavationTrigger =
  json({
    match:
      "ANY",

    conditions: [
      {
        type:
          "ActivityDetected",

        activityCodes: [
          "EXCAVATION",
        ],
      },
    ],
  });

const utilityTrigger =
  json({
    match:
      "ANY",

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
  });

const requirements:
  RequirementSeed[] = [
  {
    ruleCode:
      "BMC_EXCAVATION_PLAN_REVIEW",

    title:
      "Excavation Plan Review and Concurrence",

    requirementText:
      "Before ground disturbance, excavation, or trenching begins, the Contractor must submit an Excavation Plan to Barton Malow for review and concurrence. The plan must identify the proposed boundaries, expected depth, and required safety precautions.",

    category:
      "Excavation / Planning",

    severity:
      "Critical",

    triggerConditions:
      excavationTrigger,

    requiredInformation:
      json({
        items: [
          {
            code:
              "EXCAVATION_PLAN",

            description:
              "Confirmation that the excavation plan identifies boundaries, depth, and required safety precautions.",
          },

          {
            code:
              "BMC_REVIEW_STATUS",

            description:
              "Confirmation that Barton Malow review and concurrence occurred before ground disturbance.",
          },
        ],
      }),

    requiredControls:
      json({
        controls: [
          "Prepare the excavation plan before ground disturbance.",

          "Identify proposed excavation boundaries and depth.",

          "Document required excavation safety precautions.",

          "Submit the excavation plan to Barton Malow for review and concurrence before excavation or trenching begins.",
        ],
      }),

    sourcePage:
      "Page 48 — Excavation Plan",

    sourceReference:
      json({
        authority:
          "Barton Malow Company",

        requirementType:
          "GC",

        document:
          "Barton Malow Company Safety Manual",

        revision:
          REVISION,

        subject:
          "Excavation Plan",

        resolution: {
          relationship:
            "Additive",
        },
      }),

    /*
     * No existing generic Guided Planning question directly
     * represents GC excavation-plan concurrence yet.
     *
     * Keep this requirement active in the resolver and Draft
     * Builder without forcing it onto an unrelated question.
     */
    questionLinks: [
      {
        questionCode:
          "EXCAVATION_PLAN_REVIEWED",

        purpose:
          "ControlConfirmation",
      },
    ],
  },

  {
    ruleCode:
      "BMC_UTILITY_DAYLIGHT_VERIFICATION",

    title:
      "Underground Utility Daylighting and Verification",

    requirementText:
      "The Barton Malow representative or assigned representative must work directly with the Contractor to safely hand dig or otherwise pothole/daylight underground utilities to verify their location and depth where they may conflict with excavation activities.",

    category:
      "Excavation / Underground Utilities",

    severity:
      "Critical",

    triggerConditions:
      utilityTrigger,

    requiredInformation:
      json({
        items: [
          {
            code:
              "UTILITY_VERIFICATION_METHOD",

            description:
              "The safe method used to pothole or daylight underground utilities and verify location and depth.",
          },
        ],
      }),

    requiredControls:
      json({
        controls: [
          "Coordinate utility verification with the Barton Malow representative or assigned representative.",

          "Safely hand dig, pothole, hydro excavate, or otherwise daylight utilities as applicable.",

          "Verify both utility location and depth before conflicting excavation activities proceed.",
        ],
      }),

    sourcePage:
      "Page 48 — Pot Hole or Hydro Excavation Verification",

    sourceReference:
      json({
        authority:
          "Barton Malow Company",

        requirementType:
          "GC",

        document:
          "Barton Malow Company Safety Manual",

        revision:
          REVISION,

        subject:
          "Utility daylighting and verification",

        resolution: {
          groupKey:
            "EXCAVATION_UTILITY_APPROACH_METHOD",

          relationship:
            "Additive",
        },
      }),

    questionLinks: [
      {
        questionCode:
          "UTILITY_POSITIVE_EXPOSURE",

        purpose:
          "ControlConfirmation",
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
      "BMC_UTILITY_WITHIN_4FT_MONITORING",

    title:
      "Monitoring Within Four Feet of Underground Services",

    requirementText:
      "When excavation activities are within four feet of underground services, a Barton Malow representative or designated representative must be physically present for onsite monitoring.",

    category:
      "Excavation / Underground Utilities",

    severity:
      "Critical",

    triggerConditions:
      utilityTrigger,

    requiredInformation:
      json({
        items: [
          {
            code:
              "UTILITY_PROXIMITY",

            description:
              "Whether excavation activities will occur within four feet of underground services.",
          },

          {
            code:
              "MONITORING_REPRESENTATIVE",

            description:
              "Identification of the Barton Malow or designated representative who will provide onsite monitoring when required.",
          },
        ],
      }),

    requiredControls:
      json({
        controls: [
          "Determine whether excavation activities will occur within four feet of underground services.",

          "When within four feet, ensure a Barton Malow representative or designated representative is physically present for onsite monitoring.",

          "Do not proceed with work inside the four-foot condition without the required monitoring presence.",
        ],
      }),

    sourcePage:
      "Page 48 — Pot Hole or Hydro Excavation Verification",

    sourceReference:
      json({
        authority:
          "Barton Malow Company",

        requirementType:
          "GC",

        document:
          "Barton Malow Company Safety Manual",

        revision:
          REVISION,

        subject:
          "Monitoring near underground services",
      }),

    /*
     * We intentionally do not attach this rule to a generic
     * question yet because Qoreva does not currently have a
     * dedicated utility-proximity / four-foot monitoring question.
     *
     * The requirement remains available to the Requirements
     * Resolver and generated planning controls.
     */
    questionLinks: [
      {
        questionCode:
          "UTILITY_WITHIN_4FT",

        purpose:
          "Information",
      },

      {
        questionCode:
          "UTILITY_PROXIMITY_MONITOR",

        purpose:
          "ControlConfirmation",
      },
    ],
  },
];

async function findQuestion(
  questionCode: string,
) {
  const question =
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

  if (!question) {
    throw new Error(
      `Planning question ${questionCode} was not found.`,
    );
  }

  return question;
}

async function upsertRequirementPack() {
  return prisma.requirementPack.upsert({
    where: {
      id:
        PACK_ID,
    },

    update: {
      tenantId:
        TENANT_ID,

      name:
        PACK_NAME,

      description:
        "Barton Malow Company excavation and trenching requirements used when Barton Malow is assigned to the project as the General Contractor.",

      packType:
        "GC",

      organizationName:
        ORGANIZATION_NAME,

      version:
        1,

      status:
        "Approved",

      applicability:
        json({
          organizationRoles: [
            {
              role:
                "GC",

              organizationName:
                ORGANIZATION_NAME,
            },
          ],
        }),

      isActive:
        true,

      isArchived:
        false,

      archivedAt:
        null,
    },

    create: {
      id:
        PACK_ID,

      tenantId:
        TENANT_ID,

      name:
        PACK_NAME,

      description:
        "Barton Malow Company excavation and trenching requirements used when Barton Malow is assigned to the project as the General Contractor.",

      packType:
        "GC",

      organizationName:
        ORGANIZATION_NAME,

      version:
        1,

      status:
        "Approved",

      applicability:
        json({
          organizationRoles: [
            {
              role:
                "GC",

              organizationName:
                ORGANIZATION_NAME,
            },
          ],
        }),

      isActive:
        true,

      isArchived:
        false,
    },
  });
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
          "Barton Malow Company Safety Manual",

        sourcePage:
          seed.sourcePage,

        sourceReference:
          seed.sourceReference,

        status:
          "Approved",

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
          "Barton Malow Company Safety Manual",

        sourcePage:
          seed.sourcePage,

        sourceReference:
          seed.sourceReference,

        status:
          "Approved",

        isActive:
          true,
      },
    });

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
    const question =
      await findQuestion(
        link.questionCode,
      );

    await prisma.planningQuestionRequirement.create({
      data: {
        tenantId:
          TENANT_ID,

        questionDefinitionId:
          question.id,

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
    "Seeding BMC Excavation Requirements...",
  );

  const pack =
    await upsertRequirementPack();

  console.log(
    `✓ GC Pack: ${pack.name}`,
  );

  for (
    const seed of
    requirements
  ) {
    const rule =
      await upsertRequirement(
        pack.id,
        seed,
      );

    console.log(
      `✓ ${rule.ruleCode}`,
    );

    for (
      const link of
      seed.questionLinks
    ) {
      console.log(
        `  ↳ ${link.questionCode} (${link.purpose})`,
      );
    }
  }

  console.log("");
  console.log(
    "BMC excavation requirement seed complete.",
  );

  console.log("");
  console.log(
    "Expected behavior:",
  );

  console.log(
    "1. Pack applies only when Barton Malow is assigned as project GC.",
  );

  console.log(
    "2. Utility daylighting requirement appears as GC provenance on linked questions.",
  );

  console.log(
    "3. Excavation Plan and four-foot monitoring requirements remain available to the resolver even without dedicated Guided Planning questions.",
  );

  console.log(
    "4. OSHA + GM + Barton Malow may all apply simultaneously without source precedence automatically selecting a winner.",
  );
}

main()
  .catch((error) => {
    console.error(
      "BMC excavation seed failed:",
    );

    console.error(error);

    process.exitCode =
      1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
