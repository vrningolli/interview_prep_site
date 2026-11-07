/* Interview meta-skills: Big-O primer, input-size → complexity guide,
   UMPIRE framework, edge cases, JS traps, and a final-48h plan. */

const BIG_O_ROWS: [string, string, string, string][] = [
  ["O(1)", "Constant", "Hash lookup, array index, stack push", "Instant at any size"],
  ["O(log n)", "Logarithmic", "Binary search, balanced BST ops", "1M items → ~20 steps"],
  ["O(n)", "Linear", "Single scan, two pointers, Kadane", "1M items → 1M steps: fine"],
  ["O(n log n)", "Linearithmic", "Merge/quick sort, sort-then-sweep", "The cost of sorting first"],
  ["O(n²)", "Quadratic", "Nested loops, bubble sort", "10⁴ ok, 10⁵ too slow (~10¹⁰)"],
  ["O(2ⁿ)", "Exponential", "All subsets, naive recursion", "n > ~25 is hopeless"],
  ["O(n!)", "Factorial", "All permutations", "n > ~11 is hopeless"],
];

const SIZE_ROWS: [string, string, string][] = [
  ["n ≤ 12", "O(n!) or O(2ⁿ · n)", "Permutations, full backtracking"],
  ["n ≤ 25", "O(2ⁿ)", "Subsets, bitmask, backtracking with pruning"],
  ["n ≤ 1,000", "O(n²)", "Nested loops, 2-D DP tables"],
  ["n ≤ 100,000", "O(n log n)", "Sorting, heaps, sort-then-sweep"],
  ["n ≤ 10,000,000", "O(n)", "One pass: hash map, two pointers, sliding window, Kadane"],
  ["n larger / queries", "O(log n) or O(1)", "Binary search, precomputed prefix sums, hash lookup"],
];

const UMPIRE: [string, string, string][] = [
  [
    "U — Understand",
    "Restate the problem in your own words. Ask: sorted? duplicates? negatives? empty input? size bounds? expected output format?",
    "“So I'm given an unsorted integer array and a target, and I return the indices of the two numbers that sum to it. Can I assume exactly one solution? Can I use the same element twice?”",
  ],
  [
    "M — Match",
    "Say which pattern the problem smells like, out loud. This is where the Pattern Trainer pays off.",
    "“Finding a pair that sums to a target — that's either two pointers on sorted input, or a hash map if I keep it unsorted.”",
  ],
  [
    "P — Plan",
    "Describe the approach in plain English BEFORE coding. State the expected time and space complexity now.",
    "“One pass: for each number I check the map for target minus it; if present, done — otherwise store it. O(n) time, O(n) space.”",
  ],
  [
    "I — Implement",
    "Code it cleanly. Narrate as you go. Use real variable names (seen, left, right — not a, b, x).",
    "Talk while typing: “I'll iterate with index i so I can return positions…”",
  ],
  [
    "R — Review",
    "Trace through one small example line by line, out loud, before declaring victory. Pick a tricky one, not the happy path.",
    "“Let me trace [3, 3] with target 6… i=0: need 3, map empty, store 3→0. i=1: need 3, found at 0 → return [0, 1]. ✓”",
  ],
  [
    "E — Evaluate",
    "State the final complexity and mention trade-offs or follow-ups without being asked.",
    "“O(n) time, O(n) space. If memory were tight and I could sort, two pointers gives O(1) extra space but loses original indices.”",
  ],
];

const EDGE_CASES = [
  'Empty input ([], "", null) — the #1 forgotten case',
  "Single element — many loops silently skip",
  "All duplicates / all identical values",
  "Negative numbers and zero (breaks sliding window & greedy assumptions)",
  "Already sorted / reverse sorted input",
  "Target at the very first or very last position (off-by-one)",
  "Very large input — will your recursion blow the stack?",
  "Cycles (linked lists, graphs) — will you loop forever?",
];

const GOTCHAS: [string, string][] = [
  ["[10, 9, 1].sort() → [1, 10, 9]", ".sort() compares as STRINGS by default. Always pass a comparator: .sort((a, b) => a - b)."],
  ["5 / 2 → 2.5", "No integer division in JS. Use Math.floor(5 / 2), or (5 / 2) | 0 for positives. Critical in binary search mid calculation."],
  ["arr.shift() is O(n)", "Using an array as a BFS queue makes it O(n²) on big inputs. Say it out loud: “in production I'd use a real deque / index pointer.”"],
  ["{} keys are strings", "obj[1] and obj['1'] are the same key. Use Map when keys are numbers or objects."],
  ["-7 % 3 → -1", "JS % keeps the sign of the dividend. For a safe positive mod: ((a % n) + n) % n."],
  ["0.1 + 0.2 !== 0.3", "Floating point. Compare with a tolerance, or work in integers (cents, not dollars)."],
  ["const copy = arr does NOT copy", "Arrays and objects are references. Clone with [...arr] or structuredClone for deep copies — a classic backtracking bug."],
  ["Numbers overflow silently", "Beyond Number.MAX_SAFE_INTEGER (≈9×10¹⁵) math goes wrong with no error. Mention BigInt if products can get huge."],
];

export default function InterviewKit() {
  return (
    <div className="topic-card">
      <h2>🧭 Interview Kit</h2>
      <div className="plain-english">
        <strong>Everything that isn't a data structure</strong>
        Interviews grade four things: <em>communication, problem solving, clean code, and verification</em> — not just
        the right answer. This page covers the meta-skills: reading Big-O, guessing the intended complexity from input
        size, a step-by-step framework for any problem, and the JavaScript traps that sink candidates.
      </div>

      <h3>📈 Big-O in one table</h3>
      <p className="demo-intro">
        Read it as “if the input doubles, how much more work do I do?” Drop constants, keep the dominant term: O(2n +
        10) is O(n); nested loops multiply; halving each step means log.
      </p>
      <table className="complexity-table">
        <thead>
          <tr>
            <th>Big-O</th>
            <th>Name</th>
            <th>Typical source</th>
            <th>Gut feel</th>
          </tr>
        </thead>
        <tbody>
          {BIG_O_ROWS.map((r, i) => (
            <tr key={i}>
              <td>
                <code>{r[0]}</code>
              </td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>🔮 Guess the intended solution from n</h3>
      <p className="demo-intro">
        Interviewers (and LeetCode constraints) leak the answer: input size tells you the target complexity. A computer
        does roughly 10⁷–10⁸ simple operations per second.
      </p>
      <table className="complexity-table">
        <thead>
          <tr>
            <th>Input size</th>
            <th>Target complexity</th>
            <th>Techniques that fit</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_ROWS.map((r, i) => (
            <tr key={i}>
              <td>
                <b>{r[0]}</b>
              </td>
              <td>
                <code>{r[1]}</code>
              </td>
              <td>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>🧩 UMPIRE — a framework for any problem</h3>
      <p className="demo-intro">
        Worked example: Two Sum. The 🗣️ lines are literally what you say — interviewers grade the narration as much as
        the code.
      </p>
      <div className="kit-steps">
        {UMPIRE.map(([step, what, say], i) => (
          <div key={i} className="kit-step">
            <h4>{step}</h4>
            <p>{what}</p>
            <div className="kit-say">🗣️ {say}</div>
          </div>
        ))}
      </div>

      <h3>🧨 Edge cases to check every single time</h3>
      <div className="plain-english">
        <ul className="kit-edges">
          {EDGE_CASES.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>

      <h3>⚠️ JavaScript-specific interview traps</h3>
      <div className="kit-gotchas">
        {GOTCHAS.map(([bad, fix], i) => (
          <div key={i} className="kit-gotcha">
            <code>{bad}</code>
            <p>{fix}</p>
          </div>
        ))}
      </div>

      <h3>⏱️ The last 48 hours before the interview</h3>
      <div className="plain-english">
        <ol className="kit-edges">
          <li>
            <b>2 days before:</b> one full Pattern Trainer round + skim the Cheat Sheet. Redo 2–3 problems you
            previously failed, from scratch.
          </li>
          <li>
            <b>1 day before:</b> one easy + one medium problem, timed at 25 minutes each, narrating out loud alone.
            Then stop — cramming hurts.
          </li>
          <li>
            <b>Day of:</b> skim the Cheat Sheet once. In the interview: never code in silence, and never say “done”
            before tracing an example.
          </li>
        </ol>
      </div>
    </div>
  );
}
