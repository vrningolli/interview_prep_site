/**
 * Cloudflare Worker for DS Coach.
 *
 * Static files (the site and /ai-lab/) are served straight from ./dist by the
 * assets binding; only /api/* reaches this code (see run_worker_first in
 * wrangler.jsonc). The one API is the AI Lab's free agent model, backed by
 * Cloudflare Workers AI's free daily allowance.
 *
 * Abuse guards, since anyone can call a public endpoint:
 *   - same-origin browsers only (Origin must match this site)
 *   - per-IP rate limit (RATE_LIMITER binding)
 *   - small, validated request bodies and a capped response length
 */

/** Workers AI model. Small + fast keeps the free allowance going further. */
export const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const MAX_OUTPUT_TOKENS = 1500;
const MAX_MESSAGES = 12;
const MAX_TOTAL_CHARS = 12000;
const ROLES = new Set(["system", "user", "assistant"]);

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Returns the cleaned messages array, or an error string. */
export function validateMessages(body) {
  const messages = body && body.messages;
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return `at most ${MAX_MESSAGES} messages`;
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string") return "each message needs a role and text content";
    total += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  if (total > MAX_TOTAL_CHARS) return `prompt too long (max ${MAX_TOTAL_CHARS} characters)`;
  if (!clean.some((m) => m.role === "user" && m.content.trim())) return "a user message is required";
  return clean;
}

async function handleChat(request, env) {
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  // Browsers always send Origin on a cross-origin or POST fetch; reject other sites' pages.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: "Cross-origin requests are not allowed." });

  if (env.RATE_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json(429, { error: "Too many runs — the free model allows a few per minute." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Body must be JSON." });
  }
  const messages = validateMessages(body);
  if (typeof messages === "string") return json(400, { error: messages });

  try {
    const stream = await env.AI.run(MODEL, { messages, stream: true, max_tokens: MAX_OUTPUT_TOKENS });
    return new Response(stream, {
      headers: { "content-type": "text/event-stream", "cache-control": "no-store" },
    });
  } catch (err) {
    const msg = String((err && err.message) || err);
    // Workers AI reports an exhausted free allowance as an error mentioning neurons / limits.
    if (/neuron|limit|quota|capacity/i.test(msg)) {
      return json(429, { error: "The free model's daily allowance is used up — try again tomorrow, or use your own Claude key." });
    }
    console.error("Workers AI error:", msg);
    return json(502, { error: "The free model is unavailable right now." });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/agent/chat") return handleChat(request, env);
    if (pathname === "/api/agent/status") return json(200, { model: MODEL.split("/").pop(), available: !!env.AI });
    if (pathname.startsWith("/api/")) return json(404, { error: "Not found." });
    return env.ASSETS.fetch(request);
  },
};
