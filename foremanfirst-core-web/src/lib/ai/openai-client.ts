import OpenAI from "openai";

export function getQorevaOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured.",
    );
  }

  return new OpenAI({
    apiKey,
  });
}

/*
 * Qoreva currently uses EVA_MODEL as the configured AI model.
 * Keep the existing environment variable during this transition
 * so current deployments do not require configuration changes.
 *
 * This helper is intentionally shared by Eva and future Qoreva
 * intelligence services.
 */
export function getQorevaAIModel() {
  const model = process.env.EVA_MODEL;

  if (!model) {
    throw new Error(
      "EVA_MODEL is not configured.",
    );
  }

  return model;
}
