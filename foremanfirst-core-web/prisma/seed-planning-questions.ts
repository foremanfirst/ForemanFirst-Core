import "dotenv/config";
import {
  PrismaClient,
  Prisma,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const QOREVA_SCOPE = "QOREVA";

type QuestionSeed = {
  questionCode: string;
  category: string;
  section?: string;
  questionText: string;
  helpText?: string;
  questionType:
    | "Text"
    | "TextArea"
    | "Boolean"
    | "SingleSelect"
    | "MultiSelect"
    | "Number"
    | "Date"
    | "Person"
    | "Equipment";
  options?: string[];
  unit?: string;
  isRequired?: boolean;
  isCritical?: boolean;
  sortOrder: number;
  rules?: Array<{
    ruleType:
      | "Always"
      | "ActivityDetected"
      | "AnswerEquals"
      | "AnswerContains";
    conditions: Prisma.InputJsonValue;
    action?: "Show";
    priority?: number;
  }>;
};

const questions: QuestionSeed[] = [
  // =========================================================
  // CORE SCOPE
  // =========================================================
  {
    questionCode: "CORE_SCOPE_DESCRIPTION",
    category: "Core",
    section: "Scope",
    questionText:
      "Describe the work your crew will perform.",
    helpText:
      "Provide enough detail for Qoreva to understand the planned scope and work sequence.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 10,
    rules: [
      {
        ruleType: "Always",
        conditions: {},
      },
    ],
  },
  {
    questionCode: "CORE_WORK_LOCATION",
    category: "Core",
    section: "Scope",
    questionText:
      "Where will the work be performed?",
    helpText:
      "Identify the building, area, floor, elevation, zone, or other specific work location.",
    questionType: "Text",
    isRequired: true,
    isCritical: true,
    sortOrder: 20,
    rules: [
      {
        ruleType: "Always",
        conditions: {},
      },
    ],
  },
  {
    questionCode: "CORE_CREW_SIZE",
    category: "Core",
    section: "Crew",
    questionText:
      "How many workers are expected in the crew?",
    questionType: "Number",
    unit: "workers",
    isRequired: true,
    sortOrder: 30,
    rules: [
      {
        ruleType: "Always",
        conditions: {},
      },
    ],
  },
  {
    questionCode: "CORE_EQUIPMENT_TOOLS",
    category: "Core",
    section: "Equipment",
    questionText:
      "What equipment and tools will be used?",
    helpText:
      "Include powered equipment, vehicles, lifts, hand tools, power tools, and specialty equipment.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 40,
    rules: [
      {
        ruleType: "Always",
        conditions: {},
      },
    ],
  },
  {
    questionCode: "CORE_MATERIALS",
    category: "Core",
    section: "Materials",
    questionText:
      "What materials, chemicals, or substances will be used?",
    helpText:
      "Include fuels, adhesives, coatings, solvents, gases, concrete products, and other materials that may affect planning.",
    questionType: "TextArea",
    isRequired: false,
    sortOrder: 50,
    rules: [
      {
        ruleType: "Always",
        conditions: {},
      },
    ],
  },

  // =========================================================
  // MOBILE EQUIPMENT
  // =========================================================
  {
    questionCode: "MOBILE_EQUIPMENT_TYPES",
    category: "Mobile Equipment",
    section: "Equipment",
    questionText:
      "What mobile equipment will be used?",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 100,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "MOBILE_EQUIPMENT",
        },
      },
    ],
  },
  {
    questionCode: "MOBILE_EQUIPMENT_PEDESTRIANS",
    category: "Mobile Equipment",
    section: "Interaction",
    questionText:
      "Will workers or pedestrians be exposed to moving equipment?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 110,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "MOBILE_EQUIPMENT",
        },
      },
    ],
  },
  {
    questionCode: "MOBILE_EQUIPMENT_CONTROLS",
    category: "Mobile Equipment",
    section: "Interaction",
    questionText:
      "How will equipment and pedestrian interaction be controlled?",
    helpText:
      "Examples may include exclusion zones, designated travel paths, spotters, barricades, signage, or scheduling.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 120,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "MOBILE_EQUIPMENT_PEDESTRIANS",
          value: "true",
        },
      },
    ],
  },

  // =========================================================
  // EXCAVATION / UNDERGROUND UTILITIES
  // =========================================================
  {
    questionCode: "EXCAVATION_MAX_DEPTH",
    category: "Excavation",
    section: "Excavation",
    questionText:
      "What is the expected maximum excavation depth?",
    questionType: "Number",
    unit: "feet",
    isRequired: true,
    isCritical: true,
    sortOrder: 200,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "EXCAVATION",
        },
      },
    ],
  },
  {
    questionCode: "EXCAVATION_UTILITIES_PRESENT",
    category: "Excavation",
    section: "Underground Utilities",
    questionText:
      "Are underground utilities present or potentially present in the work area?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 210,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "EXCAVATION",
        },
      },
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "UNDERGROUND_UTILITIES",
        },
      },
    ],
  },
  {
    questionCode: "UTILITY_LOCATE_METHOD",
    category: "Underground Utilities",
    section: "Verification",
    questionText:
      "How will underground utilities be located?",
    helpText:
      "Identify applicable locating methods such as 811/MISS DIG, private locating, drawings, survey data, or other approved methods.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 220,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "EXCAVATION_UTILITIES_PRESENT",
          value: "true",
        },
      },
    ],
  },
  {
    questionCode: "UTILITY_POSITIVE_EXPOSURE",
    category: "Underground Utilities",
    section: "Verification",
    questionText:
      "Will positive exposure or daylighting be required before mechanical excavation?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 230,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "EXCAVATION_UTILITIES_PRESENT",
          value: "true",
        },
      },
    ],
  },
  {
    questionCode: "UTILITY_EXPOSURE_METHOD",
    category: "Underground Utilities",
    section: "Verification",
    questionText:
      "What method will be used to positively expose or verify the utility?",
    helpText:
      "Examples may include hand digging, hydro-vacuum excavation, or another approved non-destructive method.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 240,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "UTILITY_POSITIVE_EXPOSURE",
          value: "true",
        },
      },
    ],
  },

  // =========================================================
  // ELECTRICAL / LOTO
  // =========================================================
  {
    questionCode: "ELECTRICAL_ENERGY_PRESENT",
    category: "Electrical / LOTO",
    section: "Energy",
    questionText:
      "Is electrical or other hazardous energy present that could affect the work?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 300,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "ELECTRICAL_LOTO",
        },
      },
    ],
  },
  {
    questionCode: "ELECTRICAL_DEENERGIZED",
    category: "Electrical / LOTO",
    section: "Energy",
    questionText:
      "Will the affected equipment or circuit be de-energized before work begins?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 310,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "ELECTRICAL_ENERGY_PRESENT",
          value: "true",
        },
      },
    ],
  },
  {
    questionCode: "LOTO_REQUIRED",
    category: "Electrical / LOTO",
    section: "LOTO",
    questionText:
      "Is lockout/tagout required for this work?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 320,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "ELECTRICAL_ENERGY_PRESENT",
          value: "true",
        },
      },
    ],
  },
  {
    questionCode: "LOTO_RESPONSIBLE_PERSON",
    category: "Electrical / LOTO",
    section: "LOTO",
    questionText:
      "Who is responsible for applying and verifying the required energy isolation?",
    questionType: "Person",
    isRequired: true,
    isCritical: true,
    sortOrder: 330,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode: "LOTO_REQUIRED",
          value: "true",
        },
      },
    ],
  },

  // =========================================================
  // WORKING AT HEIGHTS
  // =========================================================
  {
    questionCode: "HEIGHT_WORK_METHOD",
    category: "Working at Heights",
    section: "Fall Protection",
    questionText:
      "How will workers access and perform the elevated work?",
    helpText:
      "Examples include MEWP, scaffold, ladder, stair tower, platform, or another approved access method.",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 400,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "WORK_AT_HEIGHT",
        },
      },
    ],
  },
  {
    questionCode: "HEIGHT_FALL_EXPOSURE",
    category: "Working at Heights",
    section: "Fall Protection",
    questionText:
      "Will workers be exposed to an unprotected fall hazard?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 410,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "WORK_AT_HEIGHT",
        },
      },
    ],
  },
  {
    questionCode: "HEIGHT_FALL_CONTROL",
    category: "Working at Heights",
    section: "Fall Protection",
    questionText:
      "What fall prevention or fall protection system will be used?",
    questionType: "TextArea",
    isRequired: true,
    isCritical: true,
    sortOrder: 420,
    rules: [
      {
        ruleType: "AnswerEquals",
        conditions: {
          questionCode:
            "HEIGHT_FALL_EXPOSURE",
          value: "true",
        },
      },
    ],
  },

  // =========================================================
  // MEWP
  // =========================================================
  {
    questionCode: "MEWP_TYPE",
    category: "MEWP",
    section: "Equipment",
    questionText:
      "What type of MEWP will be used?",
    questionType: "SingleSelect",
    options: [
      "Boom Lift",
      "Scissor Lift",
      "Vertical Mast Lift",
      "Other",
    ],
    isRequired: true,
    isCritical: true,
    sortOrder: 500,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "MEWP",
        },
      },
    ],
  },
  {
    questionCode: "MEWP_OPERATOR_QUALIFIED",
    category: "MEWP",
    section: "Operator",
    questionText:
      "Are the assigned MEWP operators trained and authorized for the equipment being used?",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 510,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "MEWP",
        },
      },
    ],
  },
  {
    questionCode: "MEWP_GROUND_CONDITIONS",
    category: "MEWP",
    section: "Setup",
    questionText:
      "Are the travel path and setup area suitable for the MEWP?",
    helpText:
      "Consider grade, holes, soft ground, overhead hazards, obstructions, traffic, and access limitations.",
    questionType: "Boolean",
    isRequired: true,
    isCritical: true,
    sortOrder: 520,
    rules: [
      {
        ruleType: "ActivityDetected",
        conditions: {
          activityCode: "MEWP",
        },
      },
    ],
  },
];

async function upsertQuestion(
  question: QuestionSeed,
) {
  const definition =
    await prisma.planningQuestionDefinition.upsert({
      where: {
        tenantId_questionCode_version: {
          tenantId: QOREVA_SCOPE,
          questionCode:
            question.questionCode,
          version: 1,
        },
      },

      update: {
        category: question.category,
        section: question.section ?? null,
        questionText:
          question.questionText,
        helpText:
          question.helpText ?? null,
        questionType:
          question.questionType,
        options:
          question.options ?? undefined,
        unit: question.unit ?? null,
        isRequired:
          question.isRequired ?? false,
        isCritical:
          question.isCritical ?? false,
        sortOrder: question.sortOrder,
        sourceType: "Qoreva",
        isActive: true,
        isArchived: false,
        archivedAt: null,
      },

      create: {
        tenantId: QOREVA_SCOPE,
        questionCode:
          question.questionCode,
        version: 1,
        category: question.category,
        section: question.section ?? null,
        questionText:
          question.questionText,
        helpText:
          question.helpText ?? null,
        questionType:
          question.questionType,
        options:
          question.options ?? undefined,
        unit: question.unit ?? null,
        isRequired:
          question.isRequired ?? false,
        isCritical:
          question.isCritical ?? false,
        sortOrder: question.sortOrder,
        sourceType: "Qoreva",
        isActive: true,
      },
    });

  await prisma.planningQuestionRule.deleteMany({
    where: {
      questionDefinitionId:
        definition.id,
    },
  });

  if (
    question.rules &&
    question.rules.length > 0
  ) {
    await prisma.planningQuestionRule.createMany({
      data: question.rules.map(
        (rule, index) => ({
          tenantId: QOREVA_SCOPE,
          questionDefinitionId:
            definition.id,
          ruleType: rule.ruleType,
          conditions: rule.conditions,
          action:
            rule.action ?? "Show",
          priority:
            rule.priority ?? index,
          isActive: true,
        }),
      ),
    });
  }

  return definition;
}

async function main() {
  console.log(
    "Seeding Qoreva Planning guided question library...",
  );

  for (const question of questions) {
    await upsertQuestion(question);

    console.log(
      `✓ ${question.questionCode}`,
    );
  }

  console.log(
    `Qoreva guided question library seeded: ${questions.length} questions.`,
  );
}

main()
  .catch((error) => {
    console.error(
      "Planning question seed failed:",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });