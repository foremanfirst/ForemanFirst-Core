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

async function main() {
  const activities =
    await prisma.planningActivity.findMany({
      orderBy: {
        updatedAt: "desc",
      },

      take: 20,

      select: {
        planningRecordId: true,
        activityCode: true,
        name: true,
        category: true,
        detectionSource: true,
        aiConfidence: true,
        confirmationStatus: true,
        confirmedBy: true,
        confirmedAt: true,
        isActive: true,
        updatedAt: true,
      },
    });

  console.log(
    `Found ${activities.length} planning activities.`,
  );

  console.dir(activities, {
    depth: null,
  });
}

main()
  .catch((error) => {
    console.error(
      "Planning activity check failed:",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
