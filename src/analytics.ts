import { markActive } from "./activity";

/* Privacy-friendly product analytics.

   Events go to the site's own Worker (/api/event), which writes them to Cloudflare
   Workers Analytics Engine. No cookies, accounts, names or IP addresses are stored:
   just the event name, a short detail, a number, the page, the visitor's country, and
   a random anonymous visitor ID kept in this browser's localStorage (so we can count
   unique and returning visitors without knowing who anyone is).
   Skipped on localhost and when the browser sends Do Not Track. */

const VISITOR_KEY = "prep-visitor";

/** Random per-browser ID plus first-visit date. Clearing site data resets it. */
function visitor(): { vid: string; kind: "new" | "returning" } {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const saved = JSON.parse(localStorage.getItem(VISITOR_KEY) || "null") as { id?: string; first?: string } | null;
    if (saved?.id && saved.first) return { vid: saved.id, kind: saved.first === today ? "new" : "returning" };
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ id, first: today }));
    return { vid: id, kind: "new" };
  } catch {
    return { vid: "", kind: "new" }; // storage blocked: still count the event, just not the visitor
  }
}

export type EventName =
  | "page_view"
  | "tab_view"
  | "design_opened"
  | "mock_from_design"
  | "interview_started"
  | "interview_finished"
  | "interview_discarded"
  | "tests_run"
  | "claude_key_checked"
  | "scorecard_shared"
  | "task_done"
  | "onboarded"
  | "pricing_viewed"
  | "upgrade_clicked"
  | "price_feedback";

/** Events that count as practising, for the streak on the Today screen. */
const PRACTICE = new Set<EventName>(["design_opened", "interview_started", "interview_finished", "tests_run", "task_done"]);

export function track(event: EventName, detail = "", value = 0): void {
  if (PRACTICE.has(event)) markActive(); // local streak, works even with analytics off
  try {
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || navigator.doNotTrack === "1") return;
    const { vid, kind } = visitor();
    const body = JSON.stringify({ event, detail: detail.slice(0, 80), value, path: location.pathname, vid, kind });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/event", blob)) {
      void fetch("/api/event", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {
    /* analytics must never break the app */
  }
}
