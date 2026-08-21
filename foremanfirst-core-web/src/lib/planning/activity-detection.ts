import { prisma } from "@/lib/prisma";

type DetectPlanningActivitiesInput = {
  tenantId: string;
  scopeText: string;
};

type ActivityMatch = {
  id: string;
  activityCode: string;
  name: string;
  category: string;
  isHighRisk: boolean;
  matchedKeywords: string[];
  score: number;
  sourceType: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeyword(value: string) {
  return normalizeText(value);
}

export async function detectPlanningActivities({
  tenantId,
  scopeText,
}: DetectPlanningActivitiesInput): Promise<ActivityMatch[]> {
  const normalizedScope = normalizeText(scopeText);

  if (!normalizedScope) {
    return [];
  }

  const definitions =
    await prisma.planningActivityDefinition.findMany({
      where: {
        isActive: true,
        isArchived: false,

        OR: [
          {
            scopeKey: "QOREVA",
            tenantId: null,
          },
          {
            scopeKey: `TENANT:${tenantId}`,
            tenantId,
          },
        ],
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const matches: ActivityMatch[] = [];

  for (const definition of definitions) {
    const rawKeywords = Array.isArray(definition.keywords)
      ? definition.keywords
      : [];

    const matchedKeywords = rawKeywords
      .filter(
        (keyword): keyword is string =>
          typeof keyword === "string",
      )
      .map(normalizeKeyword)
      .filter(
        (keyword) =>
          keyword.length > 0 &&
          normalizedScope.includes(keyword),
      );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const uniqueMatchedKeywords = [
      ...new Set(matchedKeywords),
    ];

    /*
     * V1 deterministic confidence score.
     *
     * One keyword match = 60
     * Each additional unique match = +10
     * Maximum deterministic score = 95
     *
     * This is NOT a safety risk score.
     * It only represents confidence that the
     * activity applies to the entered scope.
     */
    const score = Math.min(
      95,
      60 +
        Math.max(
          0,
          uniqueMatchedKeywords.length - 1,
        ) *
          10,
    );

    matches.push({
      id: definition.id,
      activityCode: definition.activityCode,
      name: definition.name,
      category: definition.category,
      isHighRisk: definition.isHighRisk,
      matchedKeywords: uniqueMatchedKeywords,
      score,
      sourceType: definition.sourceType,
    });
  }

  return matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.isHighRisk !== b.isHighRisk) {
      return a.isHighRisk ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}