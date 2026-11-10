/* Privacy-friendly product analytics.

   Events go to the site's own Worker (/api/event), which writes them to Cloudflare
   Workers Analytics Engine. No cookies, no user IDs, no IP addresses are stored —
   just the event name, a short detail, a number, the page and the visitor's country.
   Skipped on localhost and when the browser sends Do Not Track. */

export type EventName =
  | "page_view"
  | "tab_view"
  | "design_opened"
  | "mock_from_design"
  | "interview_started"
  | "interview_finished"
  | "interview_discarded"
  | "tests_run"
  | "claude_key_checked";

export function track(event: EventName, detail = "", value = 0): void {
  try {
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || navigator.doNotTrack === "1") return;
    const body = JSON.stringify({ event, detail: detail.slice(0, 80), value, path: location.pathname });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/event", blob)) {
      void fetch("/api/event", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {
    /* analytics must never break the app */
  }
}
