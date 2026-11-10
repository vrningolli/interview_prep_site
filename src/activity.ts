/* Practice streak: the set of days (local time) on which the visitor practised.
   Stored only in this browser. Fed by analytics.track() for practice events. */

const KEY = "prep-activity";

const localDay = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 10);
};

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markActive(): void {
  const days = load();
  const today = localDay();
  if (days.includes(today)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...days, today].slice(-120)));
  } catch {
    /* storage full or blocked */
  }
}

/** Consecutive practice days ending today (or yesterday, so the streak survives until you practise today). */
export function streak(now = new Date()): { days: number; today: boolean } {
  const set = new Set(load());
  const today = set.has(localDay(now));
  const d = new Date(now);
  if (!today) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(localDay(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return { days: n, today };
}

/** Days practised in the last 7 days, oldest first. */
export function lastWeek(now = new Date()): boolean[] {
  const set = new Set(load());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return set.has(localDay(d));
  });
}
