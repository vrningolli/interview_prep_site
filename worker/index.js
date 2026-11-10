/**
 * Cloudflare Worker for DS Coach.
 *
 * Static files (the site and /ai-lab/) are served straight from ./dist by the
 * assets binding; only /api/* reaches this code (see run_worker_first in
 * wrangler.jsonc). Two APIs share Cloudflare Workers AI's free daily allowance:
 * the AI Lab's agent runner (/api/agent/*) and Prep Coach's mock interviewer
 * (/api/interview/*). /api/event records anonymous product analytics.
 *
 * Abuse guards, since anyone can call a public endpoint:
 *   - same-origin browsers only (Origin must match this site)
 *   - per-IP rate limit (RATE_LIMITER binding)
 *   - small, validated request bodies and a capped response length
 */

/** Workers AI model. Small + fast keeps the free allowance going further. */
export const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const ROLES = new Set(["system", "user", "assistant"]);

/** Per-endpoint limits. The mock interviewer sends a whole conversation, so it gets
    more room than a one-shot AI Lab run; the client trims history to fit. */
export const LIMITS = {
  agent: { maxMessages: 12, maxChars: 12000, maxOutput: 1500 },
  interview: { maxMessages: 60, maxChars: 22000, maxOutput: 1200 },
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Returns the cleaned messages array, or an error string. */
export function validateMessages(body, limits = LIMITS.agent) {
  const { maxMessages, maxChars } = limits;
  const messages = body && body.messages;
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > maxMessages) return `at most ${maxMessages} messages`;
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string") return "each message needs a role and text content";
    total += m.content.length;
    clean.push({ role: m.role, content: m.content });
  }
  if (total > maxChars) return `prompt too long (max ${maxChars} characters)`;
  if (!clean.some((m) => m.role === "user" && m.content.trim())) return "a user message is required";
  return clean;
}

async function handleChat(request, env, kind = "agent") {
  const limits = LIMITS[kind];
  const limiter = kind === "interview" ? env.INTERVIEW_LIMITER : env.RATE_LIMITER;
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  // Browsers always send Origin on a cross-origin or POST fetch; reject other sites' pages.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: "Cross-origin requests are not allowed." });

  if (limiter) {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const { success } = await limiter.limit({ key: ip });
    if (!success) return json(429, { error: "Too many messages — the free model allows a few per minute." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Body must be JSON." });
  }
  const messages = validateMessages(body, limits);
  if (typeof messages === "string") return json(400, { error: messages });

  try {
    const stream = await env.AI.run(MODEL, { messages, stream: true, max_tokens: limits.maxOutput });
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

/** Product analytics: anonymous events written to Workers Analytics Engine.
    Stored per event: name, detail, page, country, and one number. No IPs, no IDs. */
const EVENT_NAME = /^[a-z_]{2,32}$/;

export async function handleEvent(request, env) {
  if (request.method !== "POST") return json(405, { error: "Use POST." });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: "Cross-origin requests are not allowed." });
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Body must be JSON." });
  }
  const event = body && body.event;
  if (typeof event !== "string" || !EVENT_NAME.test(event)) return json(400, { error: "Bad event name." });
  const detail = typeof body.detail === "string" ? body.detail.slice(0, 80) : "";
  const path = typeof body.path === "string" ? body.path.slice(0, 100) : "";
  const value = Number.isFinite(body.value) ? body.value : 0;
  const country = (request.cf && request.cf.country) || "";
  if (env.EVENTS) {
    env.EVENTS.writeDataPoint({ indexes: [event], blobs: [event, detail, path, country], doubles: [value] });
  }
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/agent/chat") return handleChat(request, env, "agent");
    if (pathname === "/api/interview/chat") return handleChat(request, env, "interview");
    if (pathname === "/api/event") return handleEvent(request, env);
    if (pathname === "/api/interview/status") return json(200, { model: MODEL.split("/").pop(), available: !!env.AI });
    if (pathname === "/api/agent/status") return json(200, { model: MODEL.split("/").pop(), available: !!env.AI });
    if (pathname.startsWith("/api/")) return json(404, { error: "Not found." });
    return env.ASSETS.fetch(request);
  },
};
