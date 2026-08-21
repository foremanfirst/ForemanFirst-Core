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

function keywordMatches(
  normalizedScope: string,
  keyword: string,
) {
  if (!keyword) {
    return false;
  }

  const escaped = keyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const pattern = new RegExp(
    `(^|\\s)${escaped}(?=\\s|$|/|-)`,
    "i",
  );

  return pattern.test(normalizedScope);
}

function removeOverlappingMatches(
  keywords: string[],
) {
  const sorted = [...new Set(keywords)].sort(
    (a, b) => b.length - a.length,
  );

  const retained: string[] = [];

  for (const keyword of sorted) {
    const overlapsExisting = retained.some(
      (existing) =>
        existing.includes(keyword) ||
        keyword.includes(existing),
    );

    if (!overlapsExisting) {
      retained.push(keyword);
    }
  }

  return retained;
}

export async function detectPlanningActivities({
  tenantId,
  scopeText,
}: DetectPlanningActivitiesInput): Promise<
  ActivityMatch[]
> {
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
    const rawKeywords = Array.isArray(
      definition.keywords,
    )
      ? definition.keywords
      : [];

    const matchedKeywords =
      removeOverlappingMatches(
        rawKeywords
          .filter(
            (keyword): keyword is string =>
              typeof keyword === "string",
          )
          .map(normalizeKeyword)
          .filter((keyword) =>
            keywordMatches(
              normalizedScope,
              keyword,
            ),
          ),
      );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const score = Math.min(
      95,
      60 +
        Math.max(
          0,
          matchedKeywords.length - 1,
        ) *
          10,
    );

    matches.push({
      id: definition.id,
      activityCode: definition.activityCode,
      name: definition.name,
      category: definition.category,
      isHighRisk: definition.isHighRisk,
      matchedKeywords,
      score,
      sourceType: definition.sourceType,
    });
  }

  const specializedMatches = matches.filter(
    (match) =>
      match.activityCode !== "GENERAL_WORK",
  );

  const filteredMatches =
    specializedMatches.length > 0
      ? specializedMatches
      : matches;

  return filteredMatches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.isHighRisk !== b.isHighRisk) {
      return a.isHighRisk ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}