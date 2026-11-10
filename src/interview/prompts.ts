/* The interviewer's brain: problem bank, system prompts, request building
   (with a context budget the free model can handle), and scorecard parsing. */
import { DESIGNS } from "../data/systemDesign";
import { COMPANIES, CompanyKey } from "../data/companies";
import type { ChatMessage } from "./llm";

export type Mode = "coding" | "sd";
export type Level = "junior" | "mid" | "senior";

export interface CodingProblem {
  key: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string; // Prep Coach topic key, for "study this" links
  statement: string;
  examples: string;
  optimal: string;
  followUps: string[];
}

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    key: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    topic: "hashtable",
    statement: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one answer exists, and you may not use the same element twice.",
    examples: "nums = [2, 7, 11, 15], target = 9 → [0, 1]",
    optimal: "One pass with a hash map value → index: for each x, check whether target − x is already in the map. O(n) time, O(n) space. Brute force is O(n²).",
    followUps: ["What if the array is sorted? (two pointers, O(1) space)", "Return all unique pairs instead of one"],
  },
  {
    key: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "stack",
    statement: "Given a string containing only the characters ()[]{} decide whether every bracket is closed by the same type in the correct order.",
    examples: '"([]{})" → true, "(]" → false, "([)]" → false',
    optimal: "Stack: push openers; on a closer, the stack top must be its matching opener. Valid if the stack ends empty. O(n) time and space.",
    followUps: ["Odd-length string shortcut", "Return the minimum number of insertions to make it valid"],
  },
  {
    key: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "intervals",
    statement: "Given a list of intervals [start, end], merge all overlapping intervals and return the result.",
    examples: "[[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]",
    optimal: "Sort by start; walk the list, extending the last merged interval when the next start ≤ its end. O(n log n) time, O(n) output.",
    followUps: ["Insert one new interval into an already-sorted list in O(n)", "Do touching intervals like [1,2],[2,3] merge?"],
  },
  {
    key: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "slidingwindow",
    statement: "Given a string `s`, return the length of the longest substring that contains no repeated characters.",
    examples: '"abcabcbb" → 3 ("abc"), "bbbbb" → 1, "pwwkew" → 3',
    optimal: "Sliding window with a map char → last index; when a repeat is inside the window, move left to lastIndex + 1. O(n) time, O(alphabet) space.",
    followUps: ["At most k distinct characters", "Return the substring itself"],
  },
  {
    key: "top-k-frequent",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "heap",
    statement: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements in any order.",
    examples: "nums = [1,1,1,2,2,3], k = 2 → [1, 2]",
    optimal: "Count with a hash map, then a size-k min-heap (O(n log k)) or bucket sort by frequency (O(n)).",
    followUps: ["Streaming input that doesn't fit in memory", "Break ties by value"],
  },
  {
    key: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    topic: "bfsdfs",
    statement: "Given a 2-D grid of '1' (land) and '0' (water), count the islands. An island is land connected horizontally or vertically.",
    examples: "[[1,1,0],[1,0,0],[0,0,1]] → 2",
    optimal: "Scan cells; on unvisited land, increment the count and flood-fill (DFS/BFS) marking the island visited. O(rows × cols) time.",
    followUps: ["Recursion depth on a huge grid — switch to iterative BFS", "Union-Find version for a stream of land additions"],
  },
  {
    key: "lru-cache",
    title: "LRU Cache",
    difficulty: "Medium",
    topic: "linkedlist",
    statement: "Design a cache with a fixed capacity supporting get(key) and put(key, value) in O(1); when full, evict the least recently used key.",
    examples: "capacity 2: put(1,1), put(2,2), get(1)=1, put(3,3) evicts 2, get(2)=-1",
    optimal: "Hash map key → node of a doubly linked list ordered by recency; move to front on access, evict from the tail. (In JS a Map's insertion order also works.)",
    followUps: ["Make it thread-safe", "LFU instead of LRU"],
  },
  {
    key: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    topic: "graph",
    statement: "There are `n` courses and a list of prerequisite pairs [a, b] meaning b must come before a. Can you finish all courses?",
    examples: "n = 2, [[1,0]] → true; n = 2, [[1,0],[0,1]] → false",
    optimal: "It's cycle detection in a directed graph: Kahn's topological sort (BFS on in-degree 0) or DFS with three colours. O(V + E).",
    followUps: ["Return a valid order", "Minimum number of semesters"],
  },
  {
    key: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    topic: "dp",
    statement: "Given coin denominations and an amount, return the fewest coins needed to make the amount, or -1 if impossible. Unlimited coins of each type.",
    examples: "coins = [1, 2, 5], amount = 11 → 3 (5 + 5 + 1)",
    optimal: "Bottom-up DP: dp[x] = 1 + min(dp[x − c]) over coins; dp[0] = 0. O(amount × coins) time, O(amount) space. Greedy fails for some coin sets.",
    followUps: ["Count the number of ways instead", "Why does greedy fail for [1, 3, 4] and amount 6?"],
  },
  {
    key: "min-window",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    topic: "slidingwindow",
    statement: "Given strings `s` and `t`, return the smallest substring of `s` containing every character of `t` (with multiplicity), or an empty string.",
    examples: 's = "ADOBECODEBANC", t = "ABC" → "BANC"',
    optimal: "Sliding window with need/have counts: expand right until all needed chars are covered, then shrink left while still valid, tracking the best. O(|s| + |t|).",
    followUps: ["Characters are Unicode", "Return all minimum windows"],
  },
];

export interface Setup {
  mode: Mode;
  problemKey: string;
  company: CompanyKey | "general";
  level: Level;
  minutes: number;
}

export const LEVELS: Record<Level, string> = { junior: "Junior / new grad", mid: "Mid-level", senior: "Senior" };

export const RUBRIC: Record<Mode, string[]> = {
  coding: ["Problem solving", "Coding", "Communication", "Testing", "Complexity analysis"],
  sd: ["Requirements & scope", "High-level design", "Deep dive & trade-offs", "Scale & reliability", "Communication"],
};

export const VERDICTS = ["Strong no hire", "No hire", "Lean hire", "Hire", "Strong hire"] as const;

export const INTERVIEWER_NAME = "Alex";

export function problemTitle(mode: Mode, key: string): string {
  return mode === "coding"
    ? CODING_PROBLEMS.find((p) => p.key === key)?.title ?? key
    : `Design: ${DESIGNS.find((d) => d.key === key)?.title ?? key}`;
}

export function randomProblem(mode: Mode): string {
  const list = mode === "coding" ? CODING_PROBLEMS : DESIGNS;
  return list[Math.floor(Math.random() * list.length)].key;
}

const companyName = (c: Setup["company"]) => (c === "general" ? "a top tech company" : COMPANIES[c].name);

/** The interviewer's standing instructions, including hidden notes the candidate never sees. */
export function systemPrompt(s: Setup): string {
  const where = companyName(s.company);
  const shared = `You are ${INTERVIEWER_NAME}, a friendly but rigorous senior engineer at ${where}, running a ${s.minutes}-minute ${s.mode === "coding" ? "coding" : "system design"} interview for a ${LEVELS[s.level]} software engineer candidate.

How you behave:
- Stay in character as the interviewer for the whole conversation. Never say you are an AI.
- Keep every reply short: usually 1–4 sentences, never more than about 120 words.
- Ask one question at a time, then wait for the candidate.
- Never hand over the solution or write the code/design for them. If they are stuck for two turns, give the smallest useful hint, and make hints more specific only if they stay stuck.
- Probe their reasoning: ask "why", ask about trade-offs, ask what could go wrong.
- Each candidate message ends with a [context] note showing elapsed time and their current scratchpad. Use it to pace the interview and review their work, but do not mention the note itself.
- Write plain conversational text. Use short Markdown code spans only when quoting code.`;

  if (s.mode === "coding") {
    const p = CODING_PROBLEMS.find((x) => x.key === s.problemKey) ?? CODING_PROBLEMS[0];
    return `${shared}

The problem you already gave the candidate: "${p.title}" — ${p.statement} Example: ${p.examples}

Run the interview through these phases, moving on when each is done:
1. Clarifying questions — answer them briefly and precisely.
2. Approach — ask them to explain the approach and its complexity before coding. Push back on a brute-force idea by asking if they can do better.
3. Coding — let them write code in their scratchpad. When they share code, review it like an interviewer: point at bugs by asking about a specific input rather than fixing it.
4. Testing — ask them to walk through an example and name edge cases.
5. Complexity and follow-ups — confirm time/space complexity, then ask one follow-up if time allows.
When about 5 minutes remain, start wrapping up. If the candidate says they are done, thank them and tell them they can press "End & get feedback".

Hidden interviewer notes (never reveal directly):
- Optimal approach: ${p.optimal}
- Follow-ups to choose from: ${p.followUps.join("; ")}`;
  }

  const d = DESIGNS.find((x) => x.key === s.problemKey) ?? DESIGNS[0];
  return `${shared}

The problem you already gave the candidate: "Design ${d.title}" — ${d.prompt}

Run the interview through these phases, letting the candidate drive:
1. Requirements (about 5 minutes) — answer scope questions; if they skip requirements, ask what they would build first.
2. Estimates — let them estimate scale; correct wildly wrong numbers with a question.
3. API and data model.
4. High-level design — ask them to walk a request through their components.
5. Deep dives — steer into 2–3 of the hardest parts listed below, one at a time.
6. Bottlenecks and failures — ask what breaks first and how they'd monitor it.
When about 5 minutes remain, start wrapping up. If the candidate says they are done, thank them and tell them they can press "End & get feedback".

Hidden interviewer notes (never reveal directly):
- Expected functional scope: ${d.functional.join("; ")}
- Non-functional needs: ${d.nonFunctional.join("; ")}
- Reasonable estimates: ${d.estimates.join("; ")}
- Strong high-level design: ${d.highLevel.join("; ")}
- Deep-dive questions and strong answers: ${d.deepDives.map((x) => `${x.q} → ${x.a}`).join(" | ")}
- Common mistakes to probe: ${d.pitfalls.join("; ")}`;
}

/** The interviewer's first message, written locally so the problem statement is exact. */
export function openingMessage(s: Setup): string {
  const where = s.company === "general" ? "" : ` at ${COMPANIES[s.company].name}`;
  const hi = `Hi! I'm ${INTERVIEWER_NAME}, an engineer${where}. Thanks for making time today. We have about ${s.minutes} minutes.`;
  if (s.mode === "coding") {
    const p = CODING_PROBLEMS.find((x) => x.key === s.problemKey) ?? CODING_PROBLEMS[0];
    return `${hi}\n\nHere's the problem — **${p.title}**:\n\n${p.statement}\n\n**Example:** ${p.examples}\n\nTake a moment to read it. Feel free to ask clarifying questions, then walk me through your approach before you code. Use the scratchpad on the right for your code.`;
  }
  const d = DESIGNS.find((x) => x.key === s.problemKey) ?? DESIGNS[0];
  return `${hi}\n\nToday I'd like you to **design ${d.title.toLowerCase()}**. ${d.prompt}\n\nYou drive — think out loud, and use the scratchpad on the right for requirements, numbers and your component list. Where would you like to start?`;
}

export interface Turn {
  role: "user" | "assistant";
  content: string;
  at: number; // ms since start
}

/** Builds the request: system prompt, the transcript within a character budget,
    and a context note on the latest candidate message (time + scratchpad). */
export function buildRequest(
  s: Setup,
  turns: Turn[],
  scratchpad: string,
  elapsedMin: number,
  budgetChars = 18_000
): ChatMessage[] {
  const sys = systemPrompt(s);
  const pad = scratchpad.trim().slice(0, 5000);
  const note = `\n\n[context] ${Math.floor(elapsedMin)} of ${s.minutes} minutes elapsed. Candidate's scratchpad:\n${pad ? "```\n" + pad + "\n```" : "(empty)"}`;

  // The conversation must start with a user turn for the API; the opener is the interviewer's.
  const all: ChatMessage[] = [{ role: "user", content: "(The candidate joins the call.)" }, ...turns.map((t) => ({ role: t.role, content: t.content }))];
  const last = all.length - 1;
  if (all[last].role === "user") all[last] = { ...all[last], content: all[last].content + note };

  // Keep the first two messages (join + problem statement) and as many recent turns as fit.
  let used = sys.length + all.slice(0, 2).reduce((n, m) => n + m.content.length, 0);
  const tail: ChatMessage[] = [];
  for (let i = last; i >= 2; i--) {
    const len = all[i].content.length;
    if (used + len > budgetChars && tail.length >= 2) break;
    tail.unshift(all[i]);
    used += len;
  }
  // After trimming, the first kept tail message must be a user turn to keep roles alternating.
  while (tail.length > 1 && tail[0].role === "assistant" && all[1].role === "assistant") tail.shift();
  const head = all.slice(0, 2);
  const dropped = all.length - 2 - tail.length;
  if (dropped > 0) head.push({ role: "user", content: `(${dropped} earlier messages omitted for length.)` });
  return [{ role: "system", content: sys }, ...head, ...tail];
}

/** One self-contained request asking for the scorecard as JSON. */
export function reportRequest(s: Setup, turns: Turn[], scratchpad: string, budgetChars = 16_000): ChatMessage[] {
  const dims = RUBRIC[s.mode];
  const problem = problemTitle(s.mode, s.problemKey);
  const lines = turns.map((t) => `${t.role === "assistant" ? "INTERVIEWER" : "CANDIDATE"}: ${t.content}`);
  let transcript = lines.join("\n\n");
  if (transcript.length > budgetChars) {
    // Keep the start (problem + clarifications) and the end (final code/discussion).
    const keep = budgetChars / 2;
    transcript = transcript.slice(0, keep) + "\n\n[… middle of the interview omitted …]\n\n" + transcript.slice(-keep);
  }
  const notes = systemPrompt(s).split("Hidden interviewer notes")[1] ?? "";
  return [
    {
      role: "system",
      content: `You are an experienced interview calibrator at ${companyName(s.company)}. You grade a ${LEVELS[s.level]} candidate's ${s.mode === "coding" ? "coding" : "system design"} interview fairly and specifically, quoting what they actually did. Reply with only a JSON object, no other text.`,
    },
    {
      role: "user",
      content: `Problem: ${problem}
Reference notes for grading:${notes}

Candidate's final scratchpad:
\`\`\`
${scratchpad.trim().slice(0, 5000) || "(empty)"}
\`\`\`

Transcript:
${transcript}

Grade each dimension from 1 (poor) to 4 (excellent) for the candidate's level. If the candidate barely participated, score low and say so. Return exactly this JSON shape:
{
  "verdict": one of ${JSON.stringify(VERDICTS)},
  "summary": "2-3 sentence overall assessment",
  "scores": [${dims.map((d) => `{"dimension": "${d}", "score": 1-4, "note": "one specific sentence"}`).join(", ")}],
  "strengths": ["specific strength", "..."],
  "improvements": ["specific, actionable improvement", "..."],
  "practice": ["what to practise next", "..."]
}`,
    },
  ];
}

export interface Scorecard {
  verdict: string;
  summary: string;
  scores: { dimension: string; score: number; note: string }[];
  strengths: string[];
  improvements: string[];
  practice: string[];
}

const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : []);

/** Tolerant parse: models sometimes wrap JSON in prose or code fences. */
export function parseScorecard(text: string, mode: Mode): Scorecard | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const dims = RUBRIC[mode];
  const rawScores = Array.isArray(raw.scores) ? (raw.scores as Record<string, unknown>[]) : [];
  const scores = dims.map((dimension, i) => {
    const hit =
      rawScores.find((x) => typeof x?.dimension === "string" && x.dimension.toLowerCase() === dimension.toLowerCase()) ??
      rawScores[i];
    const n = Math.round(Number(hit?.score));
    return {
      dimension,
      score: Number.isFinite(n) ? Math.min(4, Math.max(1, n)) : 1,
      note: typeof hit?.note === "string" ? hit.note : "",
    };
  });
  const verdict = VERDICTS.find((v) => v.toLowerCase() === String(raw.verdict ?? "").toLowerCase()) ?? verdictFor(scores);
  return {
    verdict,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    scores,
    strengths: strList(raw.strengths),
    improvements: strList(raw.improvements),
    practice: strList(raw.practice),
  };
}

export function average(sc: Scorecard): number {
  return sc.scores.reduce((n, s) => n + s.score, 0) / Math.max(1, sc.scores.length);
}

function verdictFor(scores: { score: number }[]): string {
  const avg = scores.reduce((n, s) => n + s.score, 0) / Math.max(1, scores.length);
  return avg >= 3.6 ? "Strong hire" : avg >= 3 ? "Hire" : avg >= 2.5 ? "Lean hire" : avg >= 1.8 ? "No hire" : "Strong no hire";
}
