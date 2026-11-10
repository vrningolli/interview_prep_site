/* "Bring your own key" Claude calls for the mock interviewer.

   The visitor's key goes straight from their browser to the Claude API; no server
   of ours sees it. `dangerouslyAllowBrowser` is the SDK's explicit opt-in for that
   case — it would be wrong for a key the site owns. Loaded lazily by llm.ts. */
import Anthropic from "@anthropic-ai/sdk";
import { LlmError, type ChatMessage } from "./llm";

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const SUPPORTS_FALLBACK = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

const client = (apiKey: string) => new Anthropic({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true });

function explain(err: unknown): LlmError {
  if (err instanceof LlmError) return err;
  if (err instanceof Anthropic.APIUserAbortError) return new LlmError("Stopped.");
  if (err instanceof Anthropic.AuthenticationError) {
    return new LlmError("Claude rejected the API key (401).", "Check the key at console.anthropic.com → API keys.");
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new LlmError("This key can't use that model (403).", "Pick another model, or check the key's workspace.");
  }
  if (err instanceof Anthropic.NotFoundError) return new LlmError("Model not found (404).", "Pick another model.");
  if (err instanceof Anthropic.RateLimitError) return new LlmError("Claude rate limit hit (429).", "Wait a moment and send again.");
  if (err instanceof Anthropic.APIConnectionError) return new LlmError("Couldn't reach the Claude API.", "Check your connection.");
  if (err instanceof Anthropic.APIError) return new LlmError(`Claude API error ${err.status ?? ""}`.trim() + ".", err.message);
  return new LlmError(err instanceof Error ? err.message : String(err));
}

/** Confirms the key works and can see the model (free — uses no tokens). */
export async function claudeCheck(apiKey: string, model: string): Promise<string> {
  try {
    const info = await client(apiKey).models.retrieve(model);
    return info.display_name || model;
  } catch (err) {
    throw explain(err);
  }
}

export async function claudeStream(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  onDelta: (t: string) => void,
  opts: { signal?: AbortSignal; effort: "low" | "medium" | "high" }
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns: Anthropic.Beta.BetaMessageParam[] = messages
    .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const fallback = SUPPORTS_FALLBACK.has(model);
  let full = "";
  try {
    const stream = client(apiKey).beta.messages.stream(
      {
        model,
        max_tokens: 16000,
        // Interview turns are short conversational replies; the final report gets more thought.
        output_config: { effort: opts.effort },
        ...(system ? { system } : {}),
        messages: turns,
        // If a safety classifier declines, re-run on Anthropic's recommended fallback model.
        ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { signal: opts.signal }
    );
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        full += event.delta.text;
        onDelta(event.delta.text);
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") throw new LlmError("Claude declined this request.", "Try rephrasing.");
    if (final.stop_reason === "max_tokens") onDelta("\n\n[Reply reached the length limit.]");
  } catch (err) {
    throw explain(err);
  }
  return full;
}
