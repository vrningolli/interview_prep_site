/* Step-frame generators for the algorithm topics. */
import { Viz, c, row, CellState } from "./frames";

export function binarysearchViz(): Viz {
  const arr = [3, 8, 15, 21, 37, 42, 57, 63];
  const r = (lo: number, hi: number, mid = -1, found = -1) =>
    row(
      arr.map((v, i) => {
        const s: CellState = i === found ? "done" : i === mid ? "active" : i < lo || i > hi ? "dim" : "default";
        const l = i === found ? "found" : i === mid ? "mid" : i === lo ? "lo" : i === hi ? "hi" : "";
        return c(v, s, l);
      }),
      "sorted array · target 37"
    );
  return {
    title: "Binary search — halve the range every step",
    intro: "Greyed-out cells are eliminated WITHOUT ever being looked at. 8 elements → at most 3 comparisons.",
    code: [
      "let lo = 0, hi = arr.length - 1;",
      "while (lo <= hi) {",
      "  const mid = lo + ((hi - lo) >> 1);",
      "  if (arr[mid] === target) return mid;",
      "  if (arr[mid] < target) lo = mid + 1;",
      "  else hi = mid - 1;",
      "}",
    ],
    frames: [
      { caption: "Search 37. The range is the whole array: lo=0, hi=7.", rows: [r(0, 7)], line: 0, vars: { lo: 0, hi: 7 } },
      { predict: { q: "mid lands on 21 and the target is 37. What can we throw away?", opts: ["The left half — 37 must be right of 21", "The right half — 37 must be left of 21", "Nothing yet"], correct: 0 }, caption: "mid = 3 → value 21. 21 < 37, so 37 (if present) must be RIGHT of mid. Everything left of index 4 is eliminated in one comparison.", rows: [r(0, 7, 3)], line: 4, vars: { mid: 3, "arr[mid]": 21, decision: "21 < 37 → go right" } },
      { predict: { q: "New mid is 42, target is still 37. Which way now?", opts: ["Right — keep growing", "Left — 42 overshot the target", "Return -1"], correct: 1 }, caption: "New range lo=4, hi=7. mid = 5 → value 42. 42 > 37 → go LEFT; indices 5-7 eliminated.", rows: [r(4, 7, 5)], line: 5, vars: { mid: 5, "arr[mid]": 42, decision: "42 > 37 → go left" } },
      { caption: "Range is a single cell: lo=4, hi=4. mid = 4 → value 37. Found!", rows: [r(4, 4, 4)], line: 3, vars: { mid: 4, "arr[mid]": 37 } },
      { caption: "3 comparisons for 8 items. The magic scales: 1,000,000 items need only ~20. Requirement: the data must be SORTED (or the condition monotonic).", rows: [r(4, 4, -1, 4)], line: 3, note: "log₂(1,000,000) ≈ 20 — this is why 'sorted' in a problem statement should ring a bell." },
    ],
  };
}

export function sortingViz(): Viz {
  const r = (vals: number[], sortedUpto: number, moving = -1) =>
    row(vals.map((v, i) => c(v, i === moving ? "active" : i < sortedUpto ? "done" : "default")), "insertion sort");
  return {
    title: "Insertion sort — grow a sorted region",
    intro: "Green cells are the sorted region growing from the left. The outlined value slides left until it finds its place.",
    code: [
      "for (let i = 1; i < arr.length; i++) {",
      "  const key = arr[i];",
      "  let j = i - 1;",
      "  while (j >= 0 && arr[j] > key) {",
      "    arr[j + 1] = arr[j]; j--;   // shift right",
      "  }",
      "  arr[j + 1] = key;             // insert",
      "}",
    ],
    frames: [
      { caption: "Start with [7, 3, 5, 2]. The first element alone is trivially 'sorted'.", rows: [r([7, 3, 5, 2], 1)], line: 0 },
      { caption: "Take key = 3. Compare with 7: 7 > 3, so 7 shifts right and 3 slides in front.", rows: [r([7, 3, 5, 2], 1, 1)], line: 3, vars: { key: 3, compare: "7 > 3 → shift" } },
      { caption: "[3, 7] sorted. The sorted region grew by one.", rows: [r([3, 7, 5, 2], 2)], line: 6 },
      { caption: "Take key = 5. 7 > 5 → shift 7 right. 3 < 5 → stop. Insert 5 between them.", rows: [r([3, 7, 5, 2], 2, 2)], line: 3, vars: { key: 5, compare: "7>5 shift · 3<5 stop" } },
      { caption: "[3, 5, 7] sorted.", rows: [r([3, 5, 7, 2], 3)], line: 6 },
      { predict: { q: "key = 2 must be inserted into sorted [3, 5, 7]. How many elements shift right?", opts: ["1", "2", "3 — all of them"], correct: 2 }, caption: "Take key = 2. It's smaller than everything — 7, 5, 3 ALL shift right. Worst case is a full shift per element: that's the O(n²).", rows: [r([3, 5, 7, 2], 3, 3)], line: 4, vars: { key: 2, shifts: 3 } },
      { caption: "[2, 3, 5, 7] — done. Insertion sort: O(n²) worst, but O(n) on nearly-sorted data and great for tiny arrays (real sorts use it below ~16 elements).", rows: [r([2, 3, 5, 7], 4)], line: 7, note: "For guaranteed O(n log n) + stability → merge sort. In-place average O(n log n) → quicksort." },
    ],
  };
}

export function recursionViz(): Viz {
  const st = (items: string[], hi = -1) =>
    row(items.map((v, i) => c(v, i === hi ? "active" : v.includes("=") ? "done" : "default")), "call stack (top = current)", "stack");
  return {
    title: "factorial(4) — the call stack, live",
    intro: "Calls pile UP until the base case, then answers flow back DOWN as the stack unwinds. Recursion is just a stack you don't see.",
    code: [
      "function fact(n) {",
      "  if (n === 1) return 1;      // base case",
      "  return n * fact(n - 1);     // trust the smaller call",
      "}",
    ],
    frames: [
      { caption: "fact(4) starts. It needs fact(3) before it can finish — so it WAITS on the stack.", rows: [st(["fact(4) … waiting"], 0)], line: 2, vars: { n: 4 } },
      { caption: "fact(3) needs fact(2). Every waiting call holds its own n in its own stack frame.", rows: [st(["fact(4) … waiting", "fact(3) … waiting"], 1)], line: 2, vars: { n: 3 } },
      { caption: "fact(2) needs fact(1). The stack is now 3 frames deep — this is the O(n) space cost of recursion.", rows: [st(["fact(4) … waiting", "fact(3) … waiting", "fact(2) … waiting"], 2)], line: 2, vars: { n: 2 } },
      { predict: { q: "fact(1) is called. What happens next?", opts: ["It calls fact(0)", "Base case — it returns 1 immediately", "Stack overflow"], correct: 1 }, caption: "fact(1) hits the BASE CASE — it returns 1 immediately, no further calls. Without this line the stack would grow forever → stack overflow.", rows: [st(["fact(4) … waiting", "fact(3) … waiting", "fact(2) … waiting", "fact(1) = 1"], 3)], line: 1, vars: { n: 1, returns: 1 } },
      { caption: "Unwind: fact(2) resumes with the answer 1 → returns 2 × 1 = 2.", rows: [st(["fact(4) … waiting", "fact(3) … waiting", "fact(2) = 2"], 2)], line: 2, vars: { returns: 2 } },
      { caption: "fact(3) resumes → returns 3 × 2 = 6.", rows: [st(["fact(4) … waiting", "fact(3) = 6"], 1)], line: 2, vars: { returns: 6 } },
      { caption: "fact(4) resumes → returns 4 × 6 = 24. Stack empty, done. Two ingredients of every correct recursion: a base case, and progress toward it.", rows: [st(["fact(4) = 24"], 0)], line: 2, note: "fact(4) = 24 · time O(n), space O(n) for the stack frames" },
    ],
  };
}

export function bfsdfsViz(): Viz {
  const nodes = ["A", "B", "C", "D", "E", "F"];
  const g = (done: string[], cur: string, waiting: string[], title: string) =>
    row(nodes.map((n) => c(n, n === cur ? "active" : done.includes(n) ? "done" : waiting.includes(n) ? "warn" : "default")), title);
  const store = (items: string[], kind: string) => row(items.length ? items.map((v) => c(v)) : [c("(empty)", "dim")], kind);
  return {
    title: "BFS vs DFS — same graph, different soul",
    intro: "Graph: A→(B,C), B→D, C→E, D→F. First BFS with a queue (rings), then DFS with a stack (dives). Compare the visit orders.",
    code: [
      "// BFS: queue.shift()  → explore by distance",
      "// DFS: stack.pop()    → follow one path to the end",
      "store = [start]",
      "while (store not empty):",
      "  node = store.take()",
      "  add unvisited neighbours to store",
    ],
    frames: [
      { caption: "BFS from A. Queue: [A].", rows: [g([], "", ["A"], "BFS"), store(["A"], "queue")], line: 2 },
      { caption: "Visit A → enqueue B, C. Both are distance 1.", rows: [g([], "A", ["B", "C"], "BFS"), store(["B", "C"], "queue")], line: 4, vars: { order: "A" } },
      { caption: "Visit B (front!) → enqueue D. C waits its turn — BFS finishes distance 1 before touching distance 2.", rows: [g(["A"], "B", ["C", "D"], "BFS"), store(["C", "D"], "queue")], line: 4, vars: { order: "A B" } },
      { caption: "Visit C → enqueue E.", rows: [g(["A", "B"], "C", ["D", "E"], "BFS"), store(["D", "E"], "queue")], line: 4, vars: { order: "A B C" } },
      { caption: "Visit D → enqueue F, then E, then F. BFS order: A B C D E F — perfect rings: distance 0, 1, 1, 2, 2, 3.", rows: [g(["A", "B", "C", "D", "E"], "F", [], "BFS"), store([], "queue")], line: 4, vars: { order: "A B C D E F" } },
      { caption: "Now DFS from A with a STACK. Push B, C — but pop takes the NEWEST: C first.", rows: [g([], "A", ["B", "C"], "DFS"), store(["B", "C"], "stack")], line: 4, vars: { order: "A" } },
      { predict: { q: "The DFS stack holds [B, C]. Which node is visited next?", opts: ["B — it was pushed first", "C — pop takes the NEWEST", "Either, randomly"], correct: 1 }, caption: "Visit C → push E. Pop E next — we keep diving down C's branch while B still waits.", rows: [g(["A"], "C", ["B", "E"], "DFS"), store(["B", "E"], "stack")], line: 4, vars: { order: "A C" } },
      { caption: "Visit E — dead end. NOW we backtrack: pop B, then D, then F.", rows: [g(["A", "C"], "E", ["B"], "DFS"), store(["B"], "stack")], line: 4, vars: { order: "A C E" } },
      { caption: "DFS order: A C E B D F — one full path first, then backtrack. Use BFS for shortest paths; DFS for exhaustive exploration, cycle detection, backtracking.", rows: [g(["A", "C", "E", "B", "D"], "F", [], "DFS"), store([], "stack")], line: 4, note: "Same 6 nodes, same edges — the container (queue vs stack) alone changes everything." },
    ],
  };
}

export function dpViz(): Viz {
  const r = (vals: (number | string)[], hi = -1, deps: number[] = []) =>
    row(vals.map((v, i) => c(v, i === hi ? "active" : deps.includes(i) ? "warn" : typeof v === "number" ? "done" : "dim", `dp[${i}]`)), "ways to reach step i");
  return {
    title: "Climbing stairs — DP table fill",
    intro: "Each answer is built from two already-solved smaller answers. Nothing is ever computed twice — that's the whole trick of DP.",
    code: [
      "dp[1] = 1; dp[2] = 2;   // base cases",
      "for (let i = 3; i <= n; i++)",
      "  dp[i] = dp[i-1] + dp[i-2];",
      "return dp[n];",
    ],
    frames: [
      { caption: "n = 6 stairs, climb 1 or 2 at a time. How many distinct ways to the top? Start with what we know for sure.", rows: [r(["·", "·", "·", "·", "·", "·"])], line: 0 },
      { caption: "Base cases: 1 way to reach step 1, 2 ways to reach step 2 (1+1 or 2).", rows: [r([1, 2, "·", "·", "·", "·"], 1)], line: 0, vars: { "dp[1]": 1, "dp[2]": 2 } },
      { caption: "Step 3: you arrived either from step 2 (with a 1-step) or step 1 (with a 2-step). dp[3] = dp[2] + dp[1] = 3. The amber cells are the only lookups needed.", rows: [r([1, 2, 3, "·", "·", "·"], 2, [0, 1])], line: 2, vars: { "dp[3]": "2 + 1 = 3" } },
      { predict: { q: "dp[3] = 3 and dp[2] = 2. What is dp[4]?", opts: ["4", "5", "6"], correct: 1 }, caption: "Step 4 = dp[3] + dp[2] = 5. The naive recursion would recompute dp[2] again here — the table just reads it.", rows: [r([1, 2, 3, 5, "·", "·"], 3, [1, 2])], line: 2, vars: { "dp[4]": "3 + 2 = 5" } },
      { caption: "Step 5 = 5 + 3 = 8.", rows: [r([1, 2, 3, 5, 8, "·"], 4, [2, 3])], line: 2, vars: { "dp[5]": "5 + 3 = 8" } },
      { predict: { q: "dp[5] = 8 and dp[4] = 5. What is dp[6], the final answer?", opts: ["12", "13", "40"], correct: 1 }, caption: "Step 6 = 8 + 5 = 13 ways. O(n) time — the naive recursion tree would have made 2ⁿ calls for the same answer. (Recognize the numbers? It's Fibonacci.)", rows: [r([1, 2, 3, 5, 8, 13], 5, [3, 4])], line: 3, note: "DP = recursion + never solving the same subproblem twice." },
    ],
  };
}

export function twopointersViz(): Viz {
  const arr = [1, 4, 6, 9, 11];
  const r = (l: number, rr: number, found = false) =>
    row(
      arr.map((v, i) => c(v, found && (i === l || i === rr) ? "done" : i === l || i === rr ? "active" : i < l || i > rr ? "dim" : "default", i === l ? "L" : i === rr ? "R" : "")),
      "sorted array · target 15"
    );
  return {
    title: "Two pointers — converge on the pair",
    intro: "Sorted input lets each comparison eliminate a candidate for good. O(n) with zero extra memory.",
    code: [
      "let l = 0, r = arr.length - 1;",
      "while (l < r) {",
      "  const sum = arr[l] + arr[r];",
      "  if (sum === target) return [l, r];",
      "  if (sum < target) l++;   // need bigger",
      "  else r--;                // need smaller",
      "}",
    ],
    frames: [
      { caption: "Find two values summing to 15 in sorted [1, 4, 6, 9, 11]. Pointers start at both ends.", rows: [r(0, 4)], line: 0, vars: { L: 1, R: 11 } },
      { predict: { q: "1 + 11 = 12, target is 15. Which pointer moves?", opts: ["L moves right — we need a bigger sum", "R moves left — we need smaller", "Both move"], correct: 0 }, caption: "1 + 11 = 12 < 15. We need MORE. Moving R left would only shrink the sum — so the only sane move is L++. This safely eliminates 1 from all future pairs.", rows: [r(0, 4)], line: 4, vars: { sum: "12 < 15", move: "L++" } },
      { caption: "4 + 11 = 15 — found! Answer: indices 1 and 4.", rows: [r(1, 4, true)], line: 3, vars: { sum: "15 = target ✓" } },
      { caption: "Why it works: sortedness guarantees every pair we skip would be even further from the target. Brute force checks n²/2 pairs; we checked 2.", rows: [r(1, 4, true)], line: 3, note: "Signal: 'sorted array' + 'find a pair' + 'O(1) space' → two pointers." },
    ],
  };
}

export function slidingwindowViz(): Viz {
  const arr = [2, 5, 1, 8, 2, 9, 1];
  const r = (start: number, best: [number, number] | null = null) =>
    row(
      arr.map((v, i) => {
        const inWin = i >= start && i < start + 3;
        const inBest = best && i >= best[0] && i < best[0] + 3;
        return c(v, inBest ? "done" : inWin ? "active" : "dim", i === start && !inBest ? "win" : "");
      }),
      "window size k = 3"
    );
  return {
    title: "Sliding window — reuse the previous sum",
    intro: "Recomputing each window costs O(n·k). Sliding — add the new edge, drop the old — costs O(1) per move.",
    code: [
      "let sum = arr[0] + arr[1] + arr[2];  // first window",
      "let best = sum;",
      "for (let i = 3; i < arr.length; i++) {",
      "  sum += arr[i] - arr[i - 3];  // slide: add new, drop old",
      "  best = Math.max(best, sum);",
      "}",
    ],
    frames: [
      { caption: "Max sum of any 3 consecutive elements in [2,5,1,8,2,9,1]. First window: 2+5+1 = 8.", rows: [r(0)], line: 0, vars: { sum: 8, best: 8 } },
      { predict: { q: "The window slides one step right. How is the new sum computed?", opts: ["Re-add all 3 window values", "Add the entering value, subtract the leaving one", "Take the max of old and new"], correct: 1 }, caption: "Slide right: ADD 8 (entering), DROP 2 (leaving). sum = 8 + 8 − 2 = 14. Two operations — not a re-scan.", rows: [r(1)], line: 3, vars: { sum: "8+8−2 = 14", best: 14 } },
      { caption: "Slide: +2 −5 → sum = 11. Not better; best stays 14.", rows: [r(2)], line: 3, vars: { sum: 11, best: 14 } },
      { caption: "Slide: +9 −1 → sum = 19. New best!", rows: [r(3)], line: 4, vars: { sum: 19, best: 19 } },
      { caption: "Slide: +1 −8 → sum = 12. Done scanning.", rows: [r(4)], line: 3, vars: { sum: 12, best: 19 } },
      { caption: "Best window: [8, 2, 9] = 19. Total work: O(n). Caveat: for VARIABLE-size windows you grow/shrink by a condition; and negative numbers break 'max-sum' windows — that's Kadane's turf.", rows: [r(-1, [3, 5])], line: 5, note: "Signal: 'longest/shortest/max contiguous run' → sliding window." },
    ],
  };
}

export function backtrackingViz(): Viz {
  const path = (items: number[], hi = false) =>
    row(items.length ? items.map((v, i) => c(v, hi && i === items.length - 1 ? "active" : "default")) : [c("[ ]", "dim")], "current path (choose → recurse → un-choose)");
  const res = (items: string[]) => row(items.length ? items.map((v) => c(v, "done")) : [c("none yet", "dim")], "subsets found");
  return {
    title: "Subsets of [1,2,3] — choose, recurse, un-choose",
    intro: "Watch the current path grow (choose) and shrink (un-choose). Every state of the path is one subset — 2³ = 8 total.",
    code: [
      "function walk(start, path) {",
      "  results.push([...path]);       // record this subset",
      "  for (let i = start; i < nums.length; i++) {",
      "    path.push(nums[i]);          // CHOOSE",
      "    walk(i + 1, path);           // RECURSE",
      "    path.pop();                  // UN-CHOOSE (undo!)",
      "  }",
      "}",
    ],
    frames: [
      { caption: "Start with the empty path — that's already a valid subset: [].", rows: [path([]), res(["[]"])], line: 1 },
      { caption: "CHOOSE 1. Record [1]. Then recurse deeper with candidates {2, 3}.", rows: [path([1], true), res(["[]", "[1]"])], line: 3 },
      { caption: "CHOOSE 2 → record [1,2]. Deeper still.", rows: [path([1, 2], true), res(["[]", "[1]", "[1,2]"])], line: 3 },
      { caption: "CHOOSE 3 → record [1,2,3]. No candidates left — this branch is exhausted.", rows: [path([1, 2, 3], true), res(["[]", "[1]", "[1,2]", "[1,2,3]"])], line: 3 },
      { caption: "UN-CHOOSE 3, un-choose 2 — the pops rewind the path so sibling branches start from a clean [1]. Forgetting this undo is THE classic backtracking bug.", rows: [path([1]), res(["[]", "[1]", "[1,2]", "[1,2,3]"])], line: 5 },
      { caption: "CHOOSE 3 (skipping 2 this time) → record [1,3]. Then un-choose all the way back to [].", rows: [path([1, 3], true), res(["[]", "[1]", "[1,2]", "[1,2,3]", "[1,3]"])], line: 3 },
      { caption: "Branch from 2: record [2], then [2,3].", rows: [path([2, 3], true), res(["[]", "[1]", "[1,2]", "[1,2,3]", "[1,3]", "[2]", "[2,3]"])], line: 3 },
      { caption: "Finally the branch from 3: record [3]. All 2³ = 8 subsets found — the recursion tree visited each exactly once.", rows: [path([3], true), res(["[]", "[1]", "[1,2]", "[1,2,3]", "[1,3]", "[2]", "[2,3]", "[3]"])], line: 3, note: "Same skeleton solves permutations, combinations, N-Queens, Sudoku — add pruning to skip doomed branches early." },
    ],
  };
}

export function greedyViz(): Viz {
  const coins = [25, 10, 5, 1];
  const cr = (hi = -1) => row(coins.map((v, i) => c(v + "¢", i === hi ? "active" : "default")), "coins (largest first)");
  const taken = (items: number[]) => row(items.length ? items.map((v) => c(v + "¢", "done")) : [c("none", "dim")], "taken");
  return {
    title: "Greedy change-making — grab the biggest that fits",
    intro: "Locally best choice at every step. Works beautifully for US coins — and the last frame shows exactly when greedy betrays you.",
    code: [
      "for (const coin of [25, 10, 5, 1])   // largest first",
      "  while (amount >= coin) {",
      "    take(coin);",
      "    amount -= coin;",
      "  }",
    ],
    frames: [
      { caption: "Make 41¢. Greedy rule: always take the LARGEST coin that still fits.", rows: [cr(), taken([])], line: 0, vars: { remaining: "41¢" } },
      { caption: "25 ≤ 41 → take a quarter. Remaining: 16¢.", rows: [cr(0), taken([25])], line: 2, vars: { remaining: "16¢" } },
      { predict: { q: "Remaining: 16¢. Which coin does greedy take next?", opts: ["25¢", "10¢ — the largest that fits", "1¢"], correct: 1 }, caption: "25 > 16, move on. 10 ≤ 16 → take a dime. Remaining: 6¢.", rows: [cr(1), taken([25, 10])], line: 2, vars: { remaining: "6¢" } },
      { caption: "5 ≤ 6 → take a nickel. Remaining: 1¢.", rows: [cr(2), taken([25, 10, 5])], line: 2, vars: { remaining: "1¢" } },
      { caption: "Take a penny. Done: 4 coins — and for US denominations this IS optimal.", rows: [cr(3), taken([25, 10, 5, 1])], line: 2, vars: { remaining: "0¢", coins: 4 } },
      { caption: "Careful: change the coins to {1, 3, 4} and make 6: greedy takes 4+1+1 = 3 coins, optimal is 3+3 = 2. Greedy needs PROOF (exchange argument) — when it fails, reach for DP.", rows: [row([c("4¢", "warn"), c("1¢", "warn"), c("1¢", "warn")], "greedy: 3 coins"), row([c("3¢", "done"), c("3¢", "done")], "optimal: 2 coins")], line: 0, note: "Greedy correct: activity selection, jump game, Huffman. Greedy wrong: general coin change, knapsack → DP." },
    ],
  };
}

export function intervalsViz(): Viz {
  const iv = (items: [string, CellState?][], title: string) => row(items.map(([v, s]) => c(v, s)), title);
  return {
    title: "Merge intervals — sort, then sweep",
    intro: "Unsorted intervals are chaos; sorted by start, overlaps can only involve the interval right before you.",
    code: [
      "intervals.sort((a, b) => a[0] - b[0]);",
      "const out = [intervals[0]];",
      "for (const [s, e] of rest) {",
      "  const last = out[out.length - 1];",
      "  if (s <= last[1]) last[1] = Math.max(last[1], e); // merge",
      "  else out.push([s, e]);                            // gap",
      "}",
    ],
    frames: [
      { caption: "Input: [1,3] [8,10] [2,6] [15,18] — unsorted, overlaps hidden.", rows: [iv([["1–3"], ["8–10"], ["2–6"], ["15–18"]], "input")], line: 0 },
      { caption: "Sort by start: [1,3] [2,6] [8,10] [15,18]. Now any overlap is between NEIGHBOURS only.", rows: [iv([["1–3", "done"], ["2–6"], ["8–10"], ["15–18"]], "sorted")], line: 0 },
      { caption: "[2,6]: does 2 ≤ 3 (previous end)? YES → overlap. Extend the merged interval to [1, max(3,6)] = [1,6].", rows: [iv([["1–3", "dim"], ["2–6", "active"], ["8–10"], ["15–18"]], "sorted"), iv([["1–6", "done"]], "merged")], line: 4, vars: { check: "2 ≤ 3 → merge" } },
      { predict: { q: "Next interval is [8,10]; the merged one ends at 6. Merge or new group?", opts: ["Merge — extend to [1,10]", "New group — 8 starts after 6 ends", "Discard it"], correct: 1 }, caption: "[8,10]: is 8 ≤ 6? NO → gap. Start a new merged interval.", rows: [iv([["1–3", "dim"], ["2–6", "dim"], ["8–10", "active"], ["15–18"]], "sorted"), iv([["1–6", "done"], ["8–10", "done"]], "merged")], line: 5, vars: { check: "8 > 6 → new group" } },
      { caption: "[15,18]: 15 > 10 → another gap, push it. Done: [[1,6], [8,10], [15,18]].", rows: [iv([["1–6", "done"], ["8–10", "done"], ["15–18", "done"]], "merged")], line: 5, note: "O(n log n) for the sort, O(n) sweep. Watch out: decide if touching ([1,3],[3,5]) counts as overlap — ask your interviewer." },
    ],
  };
}

export function unionfindViz(): Viz {
  const p = (vals: number[], hi: number[] = [], done: number[] = []) =>
    row(vals.map((v, i) => c(v, hi.includes(i) ? "active" : done.includes(i) ? "done" : "default", `p[${i}]`)), "parent array · p[i] = i means root");
  return {
    title: "Union-Find — merging friend circles",
    intro: "Each item points to a parent; follow parents to the root = the group's representative. union() rewires roots; find() answers 'same group?'.",
    code: [
      "find(x): while (p[x] !== x) x = p[x]; return x",
      "union(a, b):",
      "  ra = find(a); rb = find(b)",
      "  if (ra === rb) return false  // already connected!",
      "  p[rb] = ra                   // merge groups",
    ],
    frames: [
      { caption: "Six people, everyone their own root: p[i] = i. Six groups.", rows: [p([0, 1, 2, 3, 4, 5])], line: 0, vars: { groups: 6 } },
      { caption: "union(0, 1): roots are 0 and 1 — different. Point 1's root at 0. Groups: {0,1} {2} {3} {4} {5}.", rows: [p([0, 0, 2, 3, 4, 5], [1], [0])], line: 4, vars: { groups: 5 } },
      { caption: "union(2, 3): same story. p[3] = 2. Groups: {0,1} {2,3} {4} {5}.", rows: [p([0, 0, 2, 2, 4, 5], [3], [2])], line: 4, vars: { groups: 4 } },
      { caption: "union(1, 3): find(1) walks 1→0, find(3) walks 3→2. Roots 0 ≠ 2 → merge: p[2] = 0. TWO WHOLE GROUPS fused by rewiring one pointer.", rows: [p([0, 0, 0, 2, 4, 5], [2], [0, 1, 3])], line: 4, vars: { "find(1)": 0, "find(3)": 2, groups: 3 } },
      { caption: "find(3) now walks 3→2→0. Path compression would re-point p[3] straight to 0 while we're here — flattening the tree for next time.", rows: [p([0, 0, 0, 0, 4, 5], [3], [0, 1, 2])], line: 0, vars: { "find(3)": 0, compressed: "p[3] = 0" } },
      { predict: { q: "union(0, 3): find(0) = 0 and find(3) = 0 — the SAME root. What does union return?", opts: ["true — groups merged", "false — this edge would close a cycle", "an error"], correct: 1 }, caption: "union(0, 3): find both → SAME root (0) → return false. That 'false' is gold: it means this edge would close a CYCLE. Kruskal's MST and Redundant Connection are built on it.", rows: [p([0, 0, 0, 0, 4, 5], [], [0, 1, 2, 3])], line: 3, note: "With compression + rank: find/union ≈ O(1) amortized. Components left: 3 → {0,1,2,3} {4} {5}." },
    ],
  };
}
