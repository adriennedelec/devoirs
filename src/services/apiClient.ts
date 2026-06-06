export async function apiDelay(ms = 80): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function cloneApiPayload<T>(payload: T): T {
  return structuredClone(payload);
}
