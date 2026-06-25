export function isAgentEnabled(): boolean {
  return process.env.AGENT_ENABLED !== "false";
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function assertAgentAvailable(): { ok: true } | { ok: false; status: number; error: string } {
  if (!isAgentEnabled()) {
    return { ok: false, status: 503, error: "AI agent is disabled (AGENT_ENABLED=false)" };
  }
  if (!getOpenAiApiKey()) {
    return { ok: false, status: 503, error: "OPENAI_API_KEY is not configured" };
  }
  return { ok: true };
}
