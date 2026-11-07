/* Spaced-repetition store. Anything you get wrong (quiz question, trainer
   drill) or peek at (problem solution) becomes a review item. Grading right
   pushes it up the ladder 1 → 3 → 7 → 14 → 30 days, then it graduates out;
   grading wrong resets it and shows it again in ~10 minutes. */
import { useSyncExternalStore } from "react";

export type ReviewType = "quiz" | "drill" | "problem";

export interface ReviewPayload {
  topicKey?: string;
  qIndex?: number;
  index?: number;
  title?: string;
  level?: string;
}

export interface ReviewItem {
  id: string;
  type: ReviewType;
  payload: ReviewPayload;
  stage: number; // index into STAGES_DAYS already completed
  due: number; // epoch ms
  added: number;
}

export const STAGES_DAYS = [1, 3, 7, 14, 30];
const DAY = 86_400_000;
const KEY = "dscoach-review";

function load(): Record<string, ReviewItem> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

let cache: Record<string, ReviewItem> = load();
let snapshot: ReviewItem[] = Object.values(cache);
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* non-fatal */
  }
  snapshot = Object.values(cache);
  listeners.forEach((l) => l());
}

export function recordMiss(id: string, type: ReviewType, payload: ReviewPayload) {
  const now = Date.now();
  cache = { ...cache, [id]: { id, type, payload, stage: 0, due: now, added: cache[id]?.added ?? now } };
  persist();
}

export function gradeItem(id: string, correct: boolean) {
  const it = cache[id];
  if (!it) return;
  const now = Date.now();
  if (correct) {
    if (it.stage >= STAGES_DAYS.length) {
      const { [id]: _gone, ...rest } = cache;
      cache = rest; // graduated 🎓
    } else {
      cache = { ...cache, [id]: { ...it, stage: it.stage + 1, due: now + STAGES_DAYS[it.stage] * DAY } };
    }
  } else {
    cache = { ...cache, [id]: { ...it, stage: 0, due: now + 10 * 60_000 } };
  }
  persist();
}

export function removeItem(id: string) {
  if (!cache[id]) return;
  const { [id]: _gone, ...rest } = cache;
  cache = rest;
  persist();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** All review items (stable snapshot; re-renders on any store change). */
export function useReviewItems(): ReviewItem[] {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export function dueNow(items: ReviewItem[], now = Date.now()): ReviewItem[] {
  return items.filter((i) => i.due <= now).sort((a, b) => a.due - b.due);
}

export function formatDueIn(due: number, now = Date.now()): string {
  const ms = due - now;
  if (ms <= 0) return "now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 48) return `in ${hours} h`;
  return `in ${Math.round(ms / DAY)} days`;
}
