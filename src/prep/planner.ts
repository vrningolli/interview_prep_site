/* Turns (companies × weeks × hours-per-day) into a concrete week-by-week plan.
   Task ids are content-based, not week-based, so re-planning from 10 weeks to
   6 keeps every checkbox you already ticked. */

import { CompanyKey, COMPANIES, PillarKey, blendWeights } from "../data/companies";

export interface PlanConfig {
  companies: CompanyKey[];
  weeks: number;
  hoursPerDay: number;
  /** ISO yyyy-mm-dd, or null if no date set yet. */
  targetDate: string | null;
}

export const DEFAULT_CONFIG: PlanConfig = {
  companies: ["google", "meta", "amazon", "microsoft"],
  weeks: 10,
  hoursPerDay: 2.5,
  targetDate: null,
};

export const WEEK_CHOICES = [6, 8, 10, 12, 16];
export const HOUR_CHOICES = [1, 1.5, 2, 2.5, 3, 4];

export interface PlanTask {
  id: string;
  label: string;
  pillar: PillarKey | "mock";
  /** Set when the task exists only because a given company was selected. */
  company?: CompanyKey;
  /** Deep-link into this app's own lesson pages. */
  topic?: { cat: "ds" | "algo"; key: string };
}

export interface PlanWeek {
  n: number;
  phase: 1 | 2 | 3;
  focus: string;
  problemTarget: number;
  tasks: PlanTask[];
}

export interface PlanPhase {
  n: 1 | 2 | 3;
  title: string;
  blurb: string;
  from: number;
  to: number;
}

export interface Plan {
  config: PlanConfig;
  weights: Record<PillarKey, number>;
  phases: PlanPhase[];
  weeks: PlanWeek[];
  hoursPerWeek: number;
  totalProblems: number;
  taskCount: number;
}

/* -------------------------------- modules ------------------------------- */

interface Module {
  id: string;
  label: string;
  load: number;
  tier: 1 | 2;
  topic?: { cat: "ds" | "algo"; key: string };
}

const DSA_MODULES: Module[] = [
  { id: "arrays-hashing", label: "Arrays & Hashing", load: 3, tier: 1, topic: { cat: "ds", key: "array" } },
  { id: "hashmap", label: "Hash Maps & Sets", load: 1, tier: 1, topic: { cat: "ds", key: "hashtable" } },
  { id: "two-pointers", label: "Two Pointers", load: 2, tier: 1, topic: { cat: "algo", key: "twopointers" } },
  { id: "sliding-window", label: "Sliding Window", load: 2, tier: 1, topic: { cat: "algo", key: "slidingwindow" } },
  { id: "stack", label: "Stack & Monotonic Stack", load: 2, tier: 1, topic: { cat: "ds", key: "stack" } },
  { id: "binary-search", label: "Binary Search (incl. on answer)", load: 2, tier: 1, topic: { cat: "algo", key: "binarysearch" } },
  { id: "linked-list", label: "Linked List", load: 2, tier: 1, topic: { cat: "ds", key: "linkedlist" } },
  { id: "recursion", label: "Recursion & call-stack thinking", load: 1, tier: 1, topic: { cat: "algo", key: "recursion" } },
  { id: "trees", label: "Trees — BFS, DFS, BST", load: 3, tier: 1, topic: { cat: "ds", key: "tree" } },
  { id: "tries", label: "Tries", load: 1, tier: 1, topic: { cat: "ds", key: "trie" } },
  { id: "heap", label: "Heap / Priority Queue & top-K", load: 2, tier: 1, topic: { cat: "ds", key: "heap" } },
  { id: "backtracking", label: "Backtracking", load: 2, tier: 2, topic: { cat: "algo", key: "backtracking" } },
  { id: "graphs", label: "Graphs — BFS/DFS, grids", load: 3, tier: 2, topic: { cat: "ds", key: "graph" } },
  { id: "adv-graphs", label: "Union-Find & topological sort", load: 2, tier: 2, topic: { cat: "algo", key: "unionfind" } },
  { id: "dp-1d", label: "1-D Dynamic Programming", load: 3, tier: 2, topic: { cat: "algo", key: "dp" } },
  { id: "dp-2d", label: "2-D Dynamic Programming", load: 2, tier: 2, topic: { cat: "algo", key: "dp" } },
  { id: "greedy", label: "Greedy", load: 2, tier: 2, topic: { cat: "algo", key: "greedy" } },
  { id: "intervals", label: "Intervals", load: 1, tier: 2, topic: { cat: "algo", key: "intervals" } },
  { id: "sorting", label: "Sorting, math & bit tricks", load: 1, tier: 2, topic: { cat: "algo", key: "sorting" } },
];

const SD_MODULES: string[] = [
  "Primer: scalability basics + latency numbers you should know",
  "Caching, CDNs and load balancing",
  "Databases: SQL vs NoSQL, indexing, sharding",
  "Queues, streams and async workers",
  "Consistency, replication and CAP in the real world",
  "Design drill: URL shortener + API rate limiter",
  "Design drill: chat / messaging with presence",
  "Design drill: news feed & fan-out",
  "Design drill: search typeahead or web crawler",
  "Design drill: video upload & streaming",
];

const DOMAIN_MODULES: string[] = [
  "JS traps pass: sort comparator, integer division, % sign, Map vs object",
  "Implement a linked list and a heap from scratch, no reference",
  "Re-read the Interview Kit: Big-O table + input size → target complexity",
  "Implement a trie and a union-find from scratch",
  "Language depth: closures, async/await, prototypes — say them out loud",
  "Write the test harness you can retype from memory in any editor",
];

const BEHAVIORAL_MODULES: string[] = [
  "Brain-dump 10 raw experiences worth telling",
  "Write 2 STAR stories, each with a number in the result",
  "Write 2 more STAR stories — pick your weakest rubric gaps",
  "Add metrics to every story: latency, cost, users, revenue, time saved",
  "Write 2 conflict / disagreement stories",
  "Write 2 failure stories, ending in what changed afterwards",
  "Rehearse your 5 strongest stories aloud, 2 minutes each",
  "Prepare 3 questions to ask each interviewer",
];

/* --------------------------- company injections -------------------------- */

interface Injection {
  phase: 1 | 2 | 3;
  id: string;
  label: string;
  pillar: PillarKey | "mock";
  /** Repeat in every week of the phase instead of once. */
  weekly?: boolean;
}

const INJECTIONS: Record<CompanyKey, Injection[]> = {
  google: [
    { phase: 1, id: "g-aloud", label: "Solve aloud — state time AND space complexity unprompted", pillar: "dsa", weekly: true },
    { phase: 1, id: "g-doc", label: "Practice in a plain Google Doc: no autocomplete, no run button", pillar: "dsa" },
    { phase: 2, id: "g-followup", label: "Follow-up drill: 'now it doesn't fit in memory' on 5 solved problems", pillar: "dsa" },
    { phase: 2, id: "g-googleyness", label: "Map 4 stories onto Google's four hiring attributes", pillar: "behavioral" },
    { phase: 3, id: "g-techdev", label: "Google Tech Dev Guide interview path — one full pass", pillar: "dsa" },
  ],
  meta: [
    { phase: 1, id: "m-pace", label: "Time every problem — 20 minutes, hard stop", pillar: "dsa", weekly: true },
    { phase: 2, id: "m-speed", label: "Speed drill: 2 problems in 45 minutes, back to back", pillar: "dsa", weekly: true },
    { phase: 2, id: "m-nocompile", label: "Write 5 solutions in a plain editor and only then run them", pillar: "dsa" },
    { phase: 3, id: "m-tagged", label: "Meta-tagged LeetCode list — full pass on the top 50", pillar: "dsa" },
    { phase: 3, id: "m-jedi", label: "'Jedi' rehearsal: conflict, ambiguity and feedback stories aloud", pillar: "behavioral" },
  ],
  amazon: [
    { phase: 1, id: "a-lp2", label: "Add 2 Leadership Principle stories to the bank", pillar: "behavioral", weekly: true },
    { phase: 1, id: "a-oa", label: "Take one full Online Assessment simulation (2 problems, 70 min)", pillar: "dsa" },
    { phase: 2, id: "a-lp-gaps", label: "Fill your LP coverage gaps — aim for 2 stories per principle", pillar: "behavioral", weekly: true },
    { phase: 2, id: "a-lld", label: "LLD drill: parking lot, elevator, or a deck of cards", pillar: "sd" },
    { phase: 3, id: "a-barraiser", label: "Bar Raiser dry run: 45 minutes of pure LP questions with follow-ups", pillar: "mock" },
    { phase: 3, id: "a-metrics", label: "Audit every story — does each one end with a hard number?", pillar: "behavioral" },
  ],
  microsoft: [
    { phase: 1, id: "ms-tests", label: "Write test cases before declaring any problem done", pillar: "dsa", weekly: true },
    { phase: 2, id: "ms-ood", label: "OOD drill: design clean classes for a real feature, then critique them", pillar: "sd" },
    { phase: 2, id: "ms-comp", label: "Map stories to the 6 core competencies + a growth-mindset failure", pillar: "behavioral" },
    { phase: 3, id: "ms-aa", label: "Rehearse the 'As Appropriate' round: architecture + competencies", pillar: "mock" },
  ],
};

/* -------------------------------- helpers ------------------------------- */

/** Split modules into `buckets` groups of roughly equal load, order preserved.
   Every bucket gets at least one module whenever there are enough to go round —
   otherwise long plans pile up early and leave empty weeks at the end. */
function bucketByLoad(modules: Module[], buckets: number): Module[][] {
  const out: Module[][] = Array.from({ length: buckets }, () => []);
  if (buckets <= 0 || !modules.length) return out;

  if (modules.length <= buckets) {
    modules.forEach((m, i) => out[Math.floor((i * buckets) / modules.length)].push(m));
    return out;
  }

  let remainingLoad = modules.reduce((s, m) => s + m.load, 0);
  let bucket = 0;
  let filled = 0;

  modules.forEach((m, i) => {
    const modulesLeft = modules.length - i; // this one included
    const bucketsLeft = buckets - bucket;
    const target = remainingLoad / bucketsLeft;
    // Move on once this bucket has carried its share — but only while every
    // remaining bucket can still be handed a module of its own.
    const wantAdvance = filled >= target && modulesLeft >= bucketsLeft - 1;
    // And move on regardless if staying would strand a later bucket empty.
    const mustAdvance = modulesLeft < bucketsLeft;
    if (filled > 0 && bucketsLeft > 1 && (wantAdvance || mustAdvance)) {
      bucket++;
      filled = 0;
    }
    out[bucket].push(m);
    filled += m.load;
    remainingLoad -= m.load;
  });
  return out;
}

/** Spread `items` across `slots` weeks, front-loaded, never more than one per week. */
function spread<T>(items: T[], slots: number): (T | undefined)[] {
  const out: (T | undefined)[] = Array.from({ length: slots }, () => undefined);
  if (slots <= 0 || !items.length) return out;
  const n = Math.min(items.length, slots);
  for (let i = 0; i < n; i++) {
    out[Math.floor((i * slots) / n)] = items[i];
  }
  return out;
}

/* ------------------------------- generator ------------------------------ */

export function buildPlan(config: PlanConfig): Plan {
  const companies = config.companies.length ? config.companies : DEFAULT_CONFIG.companies;
  const weights = blendWeights(companies);
  const totalWeeks = Math.max(4, config.weeks);

  const polish = Math.max(1, Math.round(totalWeeks * 0.2));
  const study = totalWeeks - polish;
  const p1 = Math.max(1, Math.round(study * 0.58));
  const p2 = Math.max(1, study - p1);

  const phases: PlanPhase[] = [
    { n: 1, title: "Foundations", blurb: "Core patterns until they are boring. Breadth first, no exotic topics.", from: 1, to: p1 },
    { n: 2, title: "Advanced patterns", blurb: "Graphs and DP — where these loops are actually won or lost.", from: p1 + 1, to: p1 + p2 },
    { n: 3, title: "Simulation & polish", blurb: "Stop learning, start performing. Mocks, timed loops, weak-area repair.", from: p1 + p2 + 1, to: totalWeeks },
  ];

  // Hours → weekly problem target. ~6 study days/week, ~40 min per problem
  // including the write-up you should be doing afterwards.
  const hoursPerWeek = Math.round(config.hoursPerDay * 6 * 10) / 10;
  const dsaHours = (hoursPerWeek * weights.dsa) / 100;
  const weeklyProblems = Math.max(4, Math.round(dsaHours / 0.67));

  const tier1 = DSA_MODULES.filter((m) => m.tier === 1);
  const tier2 = DSA_MODULES.filter((m) => m.tier === 2);
  const p1Buckets = bucketByLoad(tier1, p1);
  const p2Buckets = bucketByLoad(tier2, p2);

  // Parallel tracks are sized by the blended weighting: an Amazon-heavy plan
  // gets more behavioral weeks, a Google-heavy one more design/DSA weeks.
  const sdCount = Math.max(2, Math.round((study * weights.sd) / 22));
  const behCount = Math.max(2, Math.round((study * weights.behavioral) / 18));
  const domCount = Math.max(2, Math.round((study * weights.domain) / 14));
  const sdTrack = spread(SD_MODULES.slice(0, sdCount), study);
  const behTrack = spread(BEHAVIORAL_MODULES.slice(0, behCount), study);
  const domTrack = spread(DOMAIN_MODULES.slice(0, domCount), study);

  const weeks: PlanWeek[] = [];

  for (let n = 1; n <= totalWeeks; n++) {
    const phase: 1 | 2 | 3 = n <= p1 ? 1 : n <= p1 + p2 ? 2 : 3;
    const tasks: PlanTask[] = [];
    let focus: string;

    if (phase === 3) {
      const idx = n - (p1 + p2) - 1;
      const last = n === totalWeeks;
      focus = last ? "Taper — revision only" : idx === 0 ? "Weak-area repair + first mocks" : "Full timed loops";
      if (last) {
        tasks.push(
          { id: "t-blind75", label: "Re-skim Blind 75 — recognition only, do not grind", pillar: "dsa" },
          { id: "t-notes", label: "Re-read your own problem log and cheat sheet", pillar: "dsa" },
          { id: "t-stories", label: "Read your story bank once, out loud", pillar: "behavioral" },
          { id: "t-logistics", label: "Check logistics: setup, editor, water, no new hard problems", pillar: "behavioral" }
        );
      } else if (idx === 0) {
        tasks.push(
          { id: "t-weak", label: "Redo every problem flagged in your weak log, from scratch", pillar: "dsa" },
          { id: "t-mock1", label: "Mock interview #1 (Pramp or interviewing.io)", pillar: "mock" },
          { id: "t-mock2", label: "Mock interview #2 — different interviewer, different topic", pillar: "mock" },
          { id: "t-sd-mock", label: "System design mock — whiteboard one design end to end", pillar: "mock" }
        );
      } else {
        tasks.push(
          { id: `t-loop-${idx}`, label: "Timed loop: 2 × 45-min coding rounds back to back", pillar: "dsa" },
          { id: `t-mock-${idx + 2}`, label: `Mock interview #${idx + 2}`, pillar: "mock" },
          { id: `t-review-${idx}`, label: "Re-solve everything you missed in the mocks", pillar: "dsa" },
          { id: `t-stories-${idx}`, label: "Story bank: rehearse aloud, 2 minutes each, no notes", pillar: "behavioral" }
        );
      }
    } else {
      const bucket = phase === 1 ? p1Buckets[n - 1] ?? [] : p2Buckets[n - p1 - 1] ?? [];
      focus = bucket.map((m) => m.label).join(" → ") || "Mixed practice — repair whatever is shaky";
      bucket.forEach((m) =>
        tasks.push({ id: `dsa:${m.id}`, label: m.label, pillar: "dsa", topic: m.topic })
      );
      if (!bucket.length) {
        tasks.push({
          id: `dsa:mixed:w${n}`,
          label: "Mixed set: pull random problems across every pattern covered so far",
          pillar: "dsa",
        });
      }
      tasks.push({
        id: `dsa:target:w${n}`,
        label: `Hit ~${weeklyProblems} problems this week, logging each one`,
        pillar: "dsa",
      });

      const studyIdx = n - 1;
      const sd = sdTrack[studyIdx];
      if (sd) tasks.push({ id: `sd:${SD_MODULES.indexOf(sd)}`, label: sd, pillar: "sd" });
      const beh = behTrack[studyIdx];
      if (beh) tasks.push({ id: `beh:${BEHAVIORAL_MODULES.indexOf(beh)}`, label: beh, pillar: "behavioral" });
      const dom = domTrack[studyIdx];
      if (dom) tasks.push({ id: `dom:${DOMAIN_MODULES.indexOf(dom)}`, label: dom, pillar: "domain" });
    }

    // Company-specific work, appended so it reads as "and because you're
    // targeting X, also do this".
    companies.forEach((c) => {
      INJECTIONS[c]
        .filter((inj) => inj.phase === phase)
        .forEach((inj) => {
          const firstOfPhase = n === phases[phase - 1].from;
          if (!inj.weekly && !firstOfPhase) return;
          tasks.push({
            id: inj.weekly ? `${inj.id}:w${n}` : inj.id,
            label: inj.label,
            pillar: inj.pillar,
            company: c,
          });
        });
    });

    weeks.push({ n, phase, focus, problemTarget: phase === 3 ? 0 : weeklyProblems, tasks });
  }

  return {
    config: { ...config, companies, weeks: totalWeeks },
    weights,
    phases,
    weeks,
    hoursPerWeek,
    totalProblems: weeklyProblems * (p1 + p2),
    taskCount: weeks.reduce((s, w) => s + w.tasks.length, 0),
  };
}

/** Days between today and the target date; null when no date is set. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Which plan week today falls in, given the target date. Null if unknowable. */
export function currentWeek(plan: Plan): number | null {
  const left = daysUntil(plan.config.targetDate);
  if (left === null) return null;
  const weeksLeft = Math.ceil(left / 7);
  const wk = plan.config.weeks - weeksLeft + 1;
  if (wk < 1) return null;
  return Math.min(plan.config.weeks, wk);
}

export function companyName(k: CompanyKey): string {
  return COMPANIES[k].name;
}
