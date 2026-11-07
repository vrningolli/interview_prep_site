/* Persisted state for the Company Prep tab: plan config, ticked tasks,
   the STAR story bank and the weak-problem log — plus JSON export/import. */

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "../state";
import { CompanyKey, COMPANIES } from "../data/companies";
import { PlanConfig, DEFAULT_CONFIG } from "./planner";

export const PREP_STORAGE_KEY = "dscoach-prep-v1";

export interface Story {
  id: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  /** Rubric ids namespaced by company, e.g. "amazon:ownership". */
  tags: string[];
}

export interface WeakItem {
  id: string;
  name: string;
  url: string;
  pattern: string;
  /** 1 = no idea, 5 = could teach it. */
  confidence: number;
  /** ISO yyyy-mm-dd of the last attempt. */
  lastAttempt: string;
}

export interface PrepState {
  config: PlanConfig;
  done: Record<string, boolean>;
  stories: Story[];
  weak: WeakItem[];
}

const EMPTY: PrepState = { config: DEFAULT_CONFIG, done: {}, stories: [], weak: [] };

/** Days added before a problem comes back, by how confident you felt. */
const REVIEW_INTERVAL: Record<number, number> = { 1: 2, 2: 4, 3: 7, 4: 14, 5: 30 };

export function todayISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function nextReviewISO(item: WeakItem): string {
  const base = new Date(`${item.lastAttempt}T00:00:00`);
  if (Number.isNaN(base.getTime())) return item.lastAttempt;
  base.setDate(base.getDate() + (REVIEW_INTERVAL[item.confidence] ?? 7));
  return base.toISOString().slice(0, 10);
}

/** Negative = overdue by that many days. */
export function daysToReview(item: WeakItem): number {
  const due = new Date(`${nextReviewISO(item)}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / 86400000);
}

export function isDue(item: WeakItem): boolean {
  return daysToReview(item) <= 0;
}

/** How many stories cover each rubric item of the selected companies. */
export function rubricCoverage(
  stories: Story[],
  companies: CompanyKey[]
): { company: CompanyKey; id: string; label: string; hint: string; count: number }[] {
  return companies.flatMap((c) =>
    COMPANIES[c].rubric.map((r) => ({
      company: c,
      id: r.id,
      label: r.label,
      hint: r.hint,
      count: stories.filter((s) => s.tags.includes(`${c}:${r.id}`)).length,
    }))
  );
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function usePrepState() {
  const [state, setState] = useLocalStorage<PrepState>(PREP_STORAGE_KEY, EMPTY);

  // Guard against a partially-written or older payload.
  const safe: PrepState = useMemo(
    () => ({
      config: { ...DEFAULT_CONFIG, ...(state?.config ?? {}) },
      done: state?.done ?? {},
      stories: state?.stories ?? [],
      weak: state?.weak ?? [],
    }),
    [state]
  );

  const setConfig = useCallback(
    (patch: Partial<PlanConfig>) => setState((s) => ({ ...s, config: { ...s.config, ...patch } })),
    [setState]
  );

  const toggleTask = useCallback(
    (id: string) =>
      setState((s) => {
        const done = { ...s.done };
        if (done[id]) delete done[id];
        else done[id] = true;
        return { ...s, done };
      }),
    [setState]
  );

  const setWeekDone = useCallback(
    (ids: string[], value: boolean) =>
      setState((s) => {
        const done = { ...s.done };
        ids.forEach((id) => {
          if (value) done[id] = true;
          else delete done[id];
        });
        return { ...s, done };
      }),
    [setState]
  );

  const addStory = useCallback(
    (story: Omit<Story, "id">) => setState((s) => ({ ...s, stories: [...s.stories, { ...story, id: uid() }] })),
    [setState]
  );

  const updateStory = useCallback(
    (id: string, patch: Partial<Story>) =>
      setState((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    [setState]
  );

  const removeStory = useCallback(
    (id: string) => setState((s) => ({ ...s, stories: s.stories.filter((x) => x.id !== id) })),
    [setState]
  );

  const addWeak = useCallback(
    (item: Omit<WeakItem, "id">) => setState((s) => ({ ...s, weak: [...s.weak, { ...item, id: uid() }] })),
    [setState]
  );

  const updateWeak = useCallback(
    (id: string, patch: Partial<WeakItem>) =>
      setState((s) => ({ ...s, weak: s.weak.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    [setState]
  );

  const removeWeak = useCallback(
    (id: string) => setState((s) => ({ ...s, weak: s.weak.filter((x) => x.id !== id) })),
    [setState]
  );

  const resetProgress = useCallback(() => setState((s) => ({ ...s, done: {} })), [setState]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ ...safe, exportedAt: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [safe]);

  const importJSON = useCallback(
    async (file: File): Promise<string> => {
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== "object") return "That file isn't valid prep JSON.";
        setState({
          config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
          done: parsed.done ?? {},
          stories: Array.isArray(parsed.stories) ? parsed.stories : [],
          weak: Array.isArray(parsed.weak) ? parsed.weak : [],
        });
        return "";
      } catch {
        return "Couldn't read that file — is it the JSON this app exported?";
      }
    },
    [setState]
  );

  return {
    state: safe,
    setConfig,
    toggleTask,
    setWeekDone,
    addStory,
    updateStory,
    removeStory,
    addWeak,
    updateWeak,
    removeWeak,
    resetProgress,
    exportJSON,
    importJSON,
  };
}
