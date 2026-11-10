/* Model access for the mock interviewer.

   Two providers:
     - "free":   the site's Worker (POST /api/interview/chat), backed by Cloudflare
                 Workers AI's free allowance. Only exists on the deployed site.
     - "claude": the visitor's own Anthropic API key, called straight from the
                 browser. The SDK chunk loads lazily, only when Claude is used. */

export type Role = "system" | "user" | "assistant";
export interface ChatMessage {
  role: Role;
  content: string;
}

export type ProviderKind = "free" | "claude";

export interface ProviderConfig {
  kind: ProviderKind;
  apiKey: string;
  model: string;
}

export class LlmError extends Error {
  constructor(message: string, readonly hint?: string) {
    super(message);
    this.name = "LlmError";
  }
}

const STATUS_URL = "/api/interview/status";
const CHAT_URL = "/api/interview/chat";

const NOT_DEPLOYED = new LlmError(
  "The free model isn't available here.",
  "It only runs on the deployed site. Locally, choose “Your Claude API key” instead."
);

async function failFor(res: Response): Promise<LlmError> {
  if (res.status === 404) return NOT_DEPLOYED;
  let message = "";
  try {
    message = ((await res.json()) as { error?: string }).error || "";
  } catch {
    /* not JSON */
  }
  if (res.status === 429) {
    return new LlmError(message || "Free model limit reached.", "Wait a minute and send again — or use your own Claude key.");
  }
  return new LlmError(message || `Free model returned ${res.status}.`);
}

/** Reads an SSE body of Workers AI ({response}) or OpenAI-style chunks. */
export async function readSseText(body: ReadableStream<Uint8Array>, onDelta: (t: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload) as { response?: string; choices?: { delta?: { content?: string } }[] };
          const text = chunk.choices?.[0]?.delta?.content ?? chunk.response ?? "";
          if (text) {
            full += text;
            onDelta(text);
          }
        } catch {
          /* partial or keep-alive frame */
        }
      }
    }
  }
  return full;
}

export async function freeStatus(signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(STATUS_URL, { signal });
  } catch {
    throw NOT_DEPLOYED;
  }
  if (!res.ok) throw await failFor(res);
  if (!(res.headers.get("content-type") || "").includes("json")) throw NOT_DEPLOYED;
  const json = (await res.json()) as { model?: string };
  return json.model || "free model";
}

async function freeStream(messages: ChatMessage[], onDelta: (t: string) => void, signal?: AbortSignal): Promise<string> {
  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw new LlmError("Stopped.");
    throw NOT_DEPLOYED;
  }
  if (!res.ok) throw await failFor(res);
  if (!(res.headers.get("content-type") || "").includes("event-stream")) throw NOT_DEPLOYED;
  if (!res.body) throw new LlmError("The free model returned an empty response.");
  return readSseText(res.body, onDelta);
}

/** Streams one model turn from whichever provider is configured. */
export async function chatStream(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  onDelta: (t: string) => void,
  opts: { signal?: AbortSignal; purpose?: "turn" | "report" } = {}
): Promise<string> {
  if (cfg.kind === "claude") {
    if (!cfg.apiKey.trim()) throw new LlmError("Add your Claude API key first.", "Get one at console.anthropic.com → API keys.");
    const { claudeStream } = await import("./claude");
    return claudeStream(cfg.apiKey, cfg.model, messages, onDelta, {
      signal: opts.signal,
      effort: opts.purpose === "report" ? "high" : "low",
    });
  }
  return freeStream(messages, onDelta, opts.signal);
}

export async function checkClaudeKey(apiKey: string, model: string): Promise<string> {
  const { claudeCheck } = await import("./claude");
  return claudeCheck(apiKey, model);
}

export const CLAUDE_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (best)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (faster)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (cheapest)" },
] as const;

export const DEFAULT_CLAUDE_MODEL = "claude-opus-5-5";
