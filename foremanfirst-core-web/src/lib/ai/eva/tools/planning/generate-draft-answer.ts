/**
 * Eva Planning — Generate Draft Answer
 *
 * Bridges Eva's controlled tool architecture to the existing
 * Qoreva Planning answer-generation engine.
 *
 * This tool ONLY generates a draft suggestion.
 *
 * It does not:
 * - write to the Planning Record
 * - approve anything
 * - determine official risk
 * - declare controls effective
 * - verify controls
 * - submit the Planning Record
 *
 * Safety principle:
 * AI assists. Qualified people make final decisions.
 */

import {
  generateEvaDraftAnswer,
  type EvaQuestionContext,
} from "@/lib/ai/eva";

export async function generateEvaPlanningDraftAnswer(
  context: EvaQuestionContext,
) {
  return generateEvaDraftAnswer(context);
}
