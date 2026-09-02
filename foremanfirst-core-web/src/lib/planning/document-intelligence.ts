const AI_READY_STATUSES = new Set([
  "complete",
  "completed",
  "processed",
  "ready",
  "success",
  "succeeded",
]);

export function normalizeAiProcessingStatus(
  status: string | null | undefined,
): string {
  return status?.trim().toLowerCase() ?? "";
}

export function isAiProcessingReady(
  status: string | null | undefined,
): boolean {
  return AI_READY_STATUSES.has(
    normalizeAiProcessingStatus(status),
  );
}
