import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
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

const activities = [
  {
    activityCode: "GENERAL_WORK",
    name: "General Work",
    category: "General",
    description:
      "Baseline construction, installation, maintenance, setup, assembly, or repair activities.",
    keywords: [
      "general work",
      "installation",
      "install",
      "assembly",
      "setup",
      "maintenance",
      "repair",
      "replace",
    ],
    isHighRisk: false,
    sortOrder: 10,
  },

  {
    activityCode: "MOBILE_EQUIPMENT",
    name: "Mobile Equipment",
    category: "Equipment",
    description:
      "Work involving powered mobile equipment, earthmoving equipment, industrial vehicles, or similar equipment.",
    keywords: [
      "excavator",
      "dozer",
      "bulldozer",
      "loader",
      "skid steer",
      "forklift",
      "telehandler",
      "grader",
      "backhoe",
      "roller",
      "compactor",
    ],
    isHighRisk: true,
    sortOrder: 20,
  },

  {
    activityCode: "EXCAVATION",
    name: "Excavation / Trenching",
    category: "Civil",
    description:
      "Excavation, trenching, digging, grading, earth disturbance, backfilling, or similar civil work.",
    keywords: [
      "excavation",
      "excavate",
      "trench",
      "trenching",
      "dig",
      "digging",
      "grading",
      "earthwork",
      "soil",
      "cut",
      "backfill",
      "backfilling",
    ],
    isHighRisk: true,
    sortOrder: 30,
  },

  {
    activityCode: "UNDERGROUND_UTILITIES",
    name: "Underground Utilities",
    category: "Civil",
    description:
      "Work near, around, locating, exposing, installing, or modifying underground utilities.",
    keywords: [
      "underground utility",
      "utility",
      "utilities",
      "conduit",
      "gas line",
      "water line",
      "electrical line",
      "lighting conduit",
      "miss dig",
      "811",
      "gprs",
      "daylight",
      "daylighting",
      "hydrovac",
      "hydro-vac",
    ],
    isHighRisk: true,
    sortOrder: 40,
  },

  {
    activityCode: "ELECTRICAL_LOTO",
    name: "Electrical / LOTO",
    category: "Energy Control",
    description:
      "Electrical work or activities involving hazardous energy isolation, verification, lockout, or tagout.",
    keywords: [
      "electrical",
      "electric",
      "energized",
      "de-energized",
      "deenergized",
      "lockout",
      "tagout",
      "loto",
      "panel",
      "circuit",
      "breaker",
      "voltage",
      "disconnect",
      "energy isolation",
    ],
    isHighRisk: true,
    sortOrder: 50,
  },

  {
    activityCode: "WORK_AT_HEIGHT",
    name: "Working at Heights",
    category: "Fall Protection",
    description:
      "Work where personnel may be exposed to a fall from elevation.",
    keywords: [
      "elevated",
      "height",
      "heights",
      "roof",
      "ladder",
      "scaffold",
      "fall protection",
      "tie off",
      "tie-off",
      "harness",
      "lifeline",
      "leading edge",
    ],
    isHighRisk: true,
    sortOrder: 60,
  },

  {
    activityCode: "MEWP",
    name: "MEWP / Aerial Lift",
    category: "Fall Protection",
    description:
      "Work involving mobile elevating work platforms or aerial lifts.",
    keywords: [
      "mewp",
      "boom lift",
      "scissor lift",
      "aerial lift",
      "man lift",
      "manlift",
      "personnel lift",
    ],
    isHighRisk: true,
    sortOrder: 70,
  },

  {
    activityCode: "HOT_WORK",
    name: "Hot Work",
    category: "Fire Prevention",
    description:
      "Work that produces flame, sparks, heat, molten material, or another ignition source.",
    keywords: [
      "welding",
      "weld",
      "cutting",
      "torch",
      "brazing",
      "soldering",
      "grinding",
      "hot work",
      "spark",
    ],
    isHighRisk: true,
    sortOrder: 80,
  },

  {
    activityCode: "CHEMICAL_USE",
    name: "Materials / Chemical Use",
    category: "Chemical",
    description:
      "Work involving chemicals, hazardous materials, fuels, coatings, adhesives, solvents, or similar substances.",
    keywords: [
      "chemical",
      "chemicals",
      "paint",
      "coating",
      "adhesive",
      "solvent",
      "fuel",
      "epoxy",
      "primer",
      "cement",
      "pvc cement",
      "cleaner",
      "sds",
    ],
    isHighRisk: false,
    sortOrder: 90,
  },

  {
    activityCode: "RIGGING_MATERIAL_HANDLING",
    name: "Rigging / Material Handling",
    category: "Material Handling",
    description:
      "Work involving lifting, rigging, hoisting, suspended loads, or movement of heavy materials.",
    keywords: [
      "rigging",
      "rig",
      "hoisting",
      "hoist",
      "lifting",
      "lift",
      "sling",
      "shackle",
      "chain",
      "come along",
      "chain fall",
      "suspended load",
      "material handling",
    ],
    isHighRisk: true,
    sortOrder: 100,
  },

  {
    activityCode: "TRAFFIC_VEHICLE_INTERACTION",
    name: "Traffic / Vehicle Interaction",
    category: "Traffic Control",
    description:
      "Work exposed to moving equipment, vehicles, haul routes, deliveries, roadways, or public traffic.",
    keywords: [
      "traffic",
      "roadway",
      "road",
      "vehicle",
      "vehicles",
      "spotter",
      "flagger",
      "haul route",
      "truck",
      "delivery",
      "backing",
      "pedestrian",
    ],
    isHighRisk: true,
    sortOrder: 110,
  },
];

async function main() {
  console.log("Seeding Qoreva Planning activity library...");

  for (const activity of activities) {
    await prisma.planningActivityDefinition.upsert({
      where: {
        scopeKey_activityCode: {
          scopeKey: QOREVA_SCOPE,
          activityCode: activity.activityCode,
        },
      },
      update: {
        tenantId: null,
        name: activity.name,
        category: activity.category,
        description: activity.description,
        keywords: activity.keywords,
        isHighRisk: activity.isHighRisk,
        sourceType: "Qoreva",
        sortOrder: activity.sortOrder,
        isActive: true,
        isArchived: false,
        archivedAt: null,
      },
      create: {
        tenantId: null,
        scopeKey: QOREVA_SCOPE,
        activityCode: activity.activityCode,
        name: activity.name,
        category: activity.category,
        description: activity.description,
        keywords: activity.keywords,
        isHighRisk: activity.isHighRisk,
        sourceType: "Qoreva",
        sortOrder: activity.sortOrder,
        isActive: true,
      },
    });

    console.log(`✓ ${activity.name}`);
  }

  console.log(
    `Qoreva Planning activity library seeded: ${activities.length} activities.`,
  );
}

main()
  .catch((error) => {
    console.error("Planning seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });