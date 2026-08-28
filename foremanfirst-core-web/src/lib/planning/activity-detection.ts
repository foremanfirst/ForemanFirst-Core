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
    .replace(/[/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const tokenAliases: Record<string, string> = {
  aerial: "mewp",
  backhoe: "equipment",
  backing: "back",
  boomlift: "mewp",
  breaker: "electrical",
  circuit: "electrical",
  conduit: "utility",
  digging: "excavate",
  dug: "excavate",
  electrical: "electric",
  energized: "electric",
  excavated: "excavate",
  excavating: "excavate",
  excavation: "excavate",
  excavator: "equipment",
  grader: "equipment",
  grading: "grade",
  hydrovac: "daylight",
  locate: "locate",
  located: "locate",
  locating: "locate",
  locates: "locate",
  lockout: "loto",
  manlift: "mewp",
  markings: "marking",
  mobile: "equipment",
  panel: "electrical",
  scissorlift: "mewp",
  spotters: "spotter",
  utilities: "utility",
  vehicles: "vehicle",
  voltage: "electric",
};

function canonicalizeToken(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();

  if (!normalized) {
    return "";
  }

  const compact =
    normalized.replace(/\s+/g, "");

  if (tokenAliases[compact]) {
    return tokenAliases[compact];
  }

  if (tokenAliases[normalized]) {
    return tokenAliases[normalized];
  }

  if (
    normalized.endsWith("ies") &&
    normalized.length > 4
  ) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (
    normalized.endsWith("ing") &&
    normalized.length > 6
  ) {
    return normalized.slice(0, -3);
  }

  if (
    normalized.endsWith("ed") &&
    normalized.length > 5
  ) {
    return normalized.slice(0, -2);
  }

  if (
    normalized.endsWith("s") &&
    normalized.length > 4
  ) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/g)
    .map(canonicalizeToken)
    .filter(Boolean);
}

function normalizeKeyword(value: string) {
  return normalizeText(value);
}

function exactKeywordMatches(
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
    `(^|\\s)${escaped}(?=\\s|$)`,
    "i",
  );

  return pattern.test(
    normalizedScope,
  );
}

function canonicalKeywordMatches(
  scopeTokens: string[],
  keyword: string,
) {
  const keywordTokens =
    tokenize(keyword);

  if (
    keywordTokens.length === 0 ||
    scopeTokens.length === 0
  ) {
    return false;
  }

  /*
   * A single-token keyword is considered a match
   * only when the canonical token is actually
   * present in the scope.
   */
  if (keywordTokens.length === 1) {
    return scopeTokens.includes(
      keywordTokens[0],
    );
  }

  /*
   * For multi-token phrases, require every
   * canonical keyword token to be present.
   *
   * This intentionally allows minor wording
   * differences such as:
   *
   *   "underground utilities"
   *   "verify underground utility"
   *
   * while still avoiding broad fuzzy matching.
   */
  return keywordTokens.every(
    (token) =>
      scopeTokens.includes(token),
  );
}

function keywordMatches(
  normalizedScope: string,
  scopeTokens: string[],
  keyword: string,
) {
  if (!keyword) {
    return false;
  }

  return (
    exactKeywordMatches(
      normalizedScope,
      keyword,
    ) ||
    canonicalKeywordMatches(
      scopeTokens,
      keyword,
    )
  );
}

function removeOverlappingMatches(
  keywords: string[],
) {
  const sorted = [
    ...new Set(keywords),
  ].sort(
    (a, b) =>
      b.length - a.length,
  );

  const retained: string[] = [];

  for (const keyword of sorted) {
    const overlapsExisting =
      retained.some(
        (existing) =>
          existing.includes(
            keyword,
          ) ||
          keyword.includes(
            existing,
          ),
      );

    if (!overlapsExisting) {
      retained.push(keyword);
    }
  }

  return retained;
}

function getActivityContextBoost(
  activityCode: string,
  normalizedScope: string,
) {
  /*
   * Conservative domain signals.
   *
   * These do NOT create a match by themselves.
   * They only strengthen a keyword-backed match.
   * This prevents Qoreva from inventing an
   * activity based on a loose contextual clue.
   */
  switch (activityCode) {
    case "EXCAVATION":
      return /\b(excavat|trench|dig|grade|backfill)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "UNDERGROUND_UTILITIES":
      return /\b(utility|utilities|underground|conduit|daylight|hydrovac|locate|marking)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "MOBILE_EQUIPMENT":
      return /\b(equipment|excavator|dozer|loader|grader|backhoe|forklift|telehandler)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "ELECTRICAL_LOTO":
      return /\b(electric|electrical|energized|loto|lockout|panel|breaker|circuit|voltage)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "MEWP":
      return /\b(mewp|boom lift|scissor lift|aerial lift|manlift)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "HOT_WORK":
      return /\b(weld|welding|grind|grinding|torch|cutting|hot work)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "RIGGING_MATERIAL_HANDLING":
      return /\b(rig|rigging|hoist|lifting|sling|shackle|chain fall)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "WORK_AT_HEIGHT":
      return /\b(height|elevated|roof|ladder|scaffold|fall protection)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "CHEMICAL_USE":
      return /\b(chemical|epoxy|primer|paint|coating|adhesive|solvent|cement)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    case "TRAFFIC_VEHICLE_INTERACTION":
      return /\b(traffic|roadway|vehicle|truck|delivery|spotter|flagger|pedestrian)\b/i.test(
        normalizedScope,
      )
        ? 5
        : 0;

    default:
      return 0;
  }
}

export async function detectPlanningActivities({
  tenantId,
  scopeText,
}: DetectPlanningActivitiesInput): Promise<
  ActivityMatch[]
> {
  const normalizedScope =
    normalizeText(scopeText);

  if (!normalizedScope) {
    return [];
  }

  const scopeTokens =
    tokenize(scopeText);

  const definitions =
    await prisma.planningActivityDefinition.findMany(
      {
        where: {
          isActive: true,
          isArchived: false,

          OR: [
            {
              scopeKey:
                "QOREVA",
              tenantId: null,
            },
            {
              scopeKey:
                `TENANT:${tenantId}`,
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
      },
    );

  const matches:
    ActivityMatch[] = [];

  for (
    const definition of
    definitions
  ) {
    const rawKeywords =
      Array.isArray(
        definition.keywords,
      )
        ? definition.keywords
        : [];

    const normalizedKeywords =
      rawKeywords
        .filter(
          (
            keyword,
          ): keyword is string =>
            typeof keyword ===
            "string",
        )
        .map(
          normalizeKeyword,
        )
        .filter(Boolean);

    const matchedKeywords =
      removeOverlappingMatches(
        normalizedKeywords.filter(
          (keyword) =>
            keywordMatches(
              normalizedScope,
              scopeTokens,
              keyword,
            ),
        ),
      );

    if (
      matchedKeywords.length ===
      0
    ) {
      continue;
    }

    const baseScore =
      60 +
      Math.max(
        0,
        matchedKeywords.length -
          1,
      ) *
        10;

    const contextBoost =
      getActivityContextBoost(
        definition.activityCode,
        normalizedScope,
      );

    const score = Math.min(
      95,
      baseScore +
        contextBoost,
    );

    matches.push({
      id: definition.id,
      activityCode:
        definition.activityCode,
      name: definition.name,
      category:
        definition.category,
      isHighRisk:
        definition.isHighRisk,
      matchedKeywords,
      score,
      sourceType:
        definition.sourceType,
    });
  }

  const specializedMatches =
    matches.filter(
      (match) =>
        match.activityCode !==
        "GENERAL_WORK",
    );

  const filteredMatches =
    specializedMatches.length >
    0
      ? specializedMatches
      : matches;

  return filteredMatches.sort(
    (a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (
        a.isHighRisk !==
        b.isHighRisk
      ) {
        return a.isHighRisk
          ? -1
          : 1;
      }

      return a.name.localeCompare(
        b.name,
      );
    },
  );
}
