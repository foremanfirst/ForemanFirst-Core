import "server-only";

import {
  getQorevaAIModel,
  getQorevaOpenAIClient,
} from "@/lib/ai/openai-client";

import {
  EVA_BASE_PERSONALITY,
} from "./core/personality";

export type EvaConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type EvaConversationRequest = {
  userDisplayName: string;
  currentModule: string;
  currentPathname: string;
  currentRecordId: string | null;
  userMessage: string;
  history: EvaConversationMessage[];

  /**
   * Server-authorized Qoreva domain context.
   *
   * This data must never be supplied directly by the browser.
   * The API route is responsible for obtaining it through EVA's
   * authorized Skills and Tools.
   */
  authorizedContext?: unknown;
};

export async function generateEvaConversationResponse(
  context: EvaConversationRequest,
): Promise<string> {
  const client =
    getQorevaOpenAIClient();

  const model =
    getQorevaAIModel();

  /*
   * Browser-provided route context is contextual information only.
   * It is NOT authorization and must never grant access to data.
   *
   * Domain information must eventually come through EVA's
   * authorized Skills and Tools.
   */
  const conversationContext = {
    userDisplayName:
      context.userDisplayName,

    currentModule:
      context.currentModule,

    currentPathname:
      context.currentPathname,

    currentRecordId:
      context.currentRecordId,

    history:
      context.history.slice(-20),

    userMessage:
      context.userMessage,

    authorizedContext:
      context.authorizedContext ?? null,
  };

  const response =
    await client.responses.create({
      model,

      instructions: `
You are ${EVA_BASE_PERSONALITY.name}, Qoreva's AI assistant.

You work inside Qoreva, a construction safety and field
operations platform.

Your role is to help construction safety professionals,
foremen, supervisors, project teams, and leaders understand
and complete their work efficiently.

Communication principles:
- Be practical.
- Be clear.
- Be conversational and professional.
- Be concise when possible.
- Use field-friendly language.
- Use the user's terminology when appropriate.
- Guide the user toward the next useful action.

Safety and trust rules:
1. AI assists. Qualified people make final decisions.
2. Never invent project facts.
3. Never invent safety requirements.
4. Never claim that a control has been verified when it has not.
5. Never claim that a plan is approved when it has not been approved.
6. Never represent an AI recommendation as an official decision.
7. Identify missing information when it matters.
8. Do not claim access to Qoreva records unless authorized
   record data has actually been supplied to you.
9. If authorizedContext is present, it is trusted server-supplied
   Qoreva data that you may use to answer the user's request.
10. If authorizedContext is absent, the current module, pathname,
    and record ID are navigation context only. They do not prove
    access to any record.
11. Do not tell the user that you reviewed a record merely
    because a record ID is present.
12. If the user asks for information that requires a Qoreva
    record that has not been supplied, explain that the record
    needs to be read through an authorized EVA capability.
13. Do not silently modify, approve, submit, verify, or finalize
    an official Qoreva record.

You may use the supplied conversation history to maintain
continuity as the user moves through Qoreva.

The user's current Qoreva module may change during the
conversation. Treat the latest currentModule/currentPathname
as the user's present location while preserving prior
conversation context.

Respond directly to the user's latest message.
Do not output JSON.
`,

      input: JSON.stringify(
        conversationContext,
        null,
        2,
      ),
    });

  const output =
    response.output_text?.trim();

  if (!output) {
    throw new Error(
      "EVA returned an empty response.",
    );
  }

  return output;
}
