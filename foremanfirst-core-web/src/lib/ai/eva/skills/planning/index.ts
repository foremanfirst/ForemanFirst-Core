/**
 * Eva Planning Skill
 *
 * Planning is Eva's first domain capability.
 *
 * The existing PTP Eva implementation remains intact while this
 * Skill becomes the future home for:
 *
 * - Help Me Answer
 * - Improve My Answer
 * - Explain This Question
 * - Identify Missing Information
 * - Planning Review
 * - Planning Readiness
 * - PTP summaries
 * - Requirements context
 *
 * Existing PTP functionality will be migrated here incrementally.
 */

import type {
  EvaSkillDefinition,
} from "../../core/types";

export const EVA_PLANNING_SKILL: EvaSkillDefinition = {
  id: "planning",

  name: "Planning",

  description:
    "Assist users with Qoreva Planning, PTP creation, planning questions, hazards, controls, readiness, and review.",

  status:
    "AVAILABLE",

  requiredPermissions: [
    "READ",
  ],

  actionRisk:
    "DRAFT",
};
