import {
  getQorevaAIModel,
  getQorevaOpenAIClient,
} from "@/lib/ai/openai-client";

export type EvaWorkStepContext = {
  sequence: number;
  title: string;
  description: string | null;
  equipmentTools: string | null;
  materialsChemicals: string | null;
  locationOverride: string | null;
  hazards: string | null;
  controls: string | null;
  safetyCritical: boolean;
};

export type EvaExistingAnswer = {
  questionId: string;
  category: string;
  question: string;
  helpText: string | null;
  isCritical: boolean;
  responseValue: string | null;
  notes: string | null;
};

export type EvaQuestionContext = {
  questionCode: string;
  questionText: string;
  questionType: string;
  helpText: string | null;
  currentAnswer: string | null;
  currentNotes: string | null;

  // What the user is asking Eva to help turn into a
  // professional, task-specific planning response.
  userInstruction: string;

  planTitle: string;
  planType: string;
  workLocation: string | null;
  crewSize: number | null;
  shift: string | null;

  scopeDescription: string | null;
  equipmentTools: string | null;
  materialsChemicals: string | null;
  adjacentWork: string | null;
  specialConditions: string | null;

  requiredPpe: string | null;
  requiredPermits: string | null;
  emergencyPlan: string | null;
  stopWorkTriggers: string | null;

  workSteps: EvaWorkStepContext[];
  existingAnswers: EvaExistingAnswer[];
};

export type EvaDraftAnswer = {
  suggestedAnswer: string;
  explanation: string;
  missingInformation: string[];
  cautions: string[];
};

function parseEvaResponse(
  output: string,
): EvaDraftAnswer {
  try {
    const parsed = JSON.parse(output);

    return {
      suggestedAnswer:
        typeof parsed.suggestedAnswer === "string"
          ? parsed.suggestedAnswer.trim()
          : "",

      explanation:
        typeof parsed.explanation === "string"
          ? parsed.explanation.trim()
          : "",

      missingInformation:
        Array.isArray(parsed.missingInformation)
          ? parsed.missingInformation.filter(
              (value: unknown): value is string =>
                typeof value === "string",
            )
          : [],

      cautions:
        Array.isArray(parsed.cautions)
          ? parsed.cautions.filter(
              (value: unknown): value is string =>
                typeof value === "string",
            )
          : [],
    };
  } catch {
    return {
      suggestedAnswer: output.trim(),
      explanation:
        "Eva generated a suggested planning response using the supplied context.",
      missingInformation: [],
      cautions: [],
    };
  }
}

export async function generateEvaDraftAnswer(
  context: EvaQuestionContext,
): Promise<EvaDraftAnswer> {
  const client =
    getQorevaOpenAIClient();

  const model =
    getQorevaAIModel();

  const response =
    await client.responses.create({
      model,

      instructions: `
You are Eva, the AI planning assistant inside Qoreva.

You help construction safety professionals and field
leaders create clearer, more specific planning responses.

Your job is to ASSIST the person building the plan.

You do not approve the plan.
You do not determine official risk.
You do not declare a hazard controlled.
You do not confirm critical controls.
You do not mark verification complete.
You do not submit or approve a planning record.

Use the supplied planning context.

The "userInstruction" field contains the user's own
description or request for help. Treat it as the user's
intent, not as verified project fact.

Important rules:

1. Never invent project facts.
2. Never invent equipment, materials, personnel,
   permits, procedures, measurements, requirements,
   or site conditions.
3. If important information is missing, identify it.
4. Prefer task-specific language over generic safety language.
5. Keep suggested answers practical and concise enough
   to paste into a planning response.
6. Preserve the user's actual intent.
7. Do not turn an AI suggestion into an official safety decision.
8. If the current answer is already strong, improve clarity
   rather than unnecessarily changing its meaning.
9. Do not claim a client requirement applies unless it is
   present in the supplied context.
10. When information is insufficient, ask for clarification
    rather than guessing.

Return ONLY valid JSON in this structure:

{
  "suggestedAnswer": "string",
  "explanation": "string",
  "missingInformation": ["string"],
  "cautions": ["string"]
}
`,

      input: JSON.stringify(
        context,
        null,
        2,
      ),
    });

  const output =
    response.output_text?.trim();

  if (!output) {
    throw new Error(
      "Eva returned an empty response.",
    );
  }

  return parseEvaResponse(
    output,
  );
}
