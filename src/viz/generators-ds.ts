/* Step-frame generators for the data-structure topics.
   Each function returns a complete Viz: intro, display code, and a list
   of frames the StepPlayer can scrub through. */
import { Viz, c, row } from "./frames";

export function arrayViz(): Viz {
  const base = [10, 20, 30, 40];
  const idx = ["[0]", "[1]", "[2]", "[3]", "[4]"];
  const plain = (vals: (string | number)[], hi = -1, done = -1) =>
    row(vals.map((v, i) => c(v, i === hi ? "active" : i === done ? "done" : "default", idx[i])), "arr");
  return {
    title: "Read O(1) vs insert-at-front O(n)",
    intro: "First watch an instant indexed read, then watch what unshift really costs: every element must move.",
    code: [
      "arr[2];                 // read: ONE address calculation",
      "// arr.unshift(5) under the hood:",
      "for (let i = arr.length; i > 0; i--)",
      "  arr[i] = arr[i - 1];  // shift each element right",
      "arr[0] = 5;             // finally place the new value",
    ],
    frames: [
      { caption: "Our array. Elements sit side-by-side in one memory block — the index is just an offset.", rows: [plain(base)], line: 0 },
      { caption: "Read arr[2]: address = start + 2 × size. One multiplication, straight to the box. O(1) at any array size.", rows: [plain(base, 2)], line: 0, vars: { "address math": "start + 2×4" } },
      { caption: "Now insert 5 at the FRONT. There is no free box at index 0 — everyone must move right first.", rows: [plain(base)], line: 1 },
      { caption: "Shift 40 from index 3 to index 4.", rows: [row([c(10), c(20), c(30), c("·", "dim"), c(40, "active", "[4]")], "arr")], line: 3, vars: { i: 4 } },
      { caption: "Shift 30 right…", rows: [row([c(10), c(20), c("·", "dim"), c(30, "active"), c(40, "done")], "arr")], line: 3, vars: { i: 3 } },
      { caption: "Shift 20 right…", rows: [row([c(10), c("·", "dim"), c(20, "active"), c(30, "done"), c(40, "done")], "arr")], line: 3, vars: { i: 2 } },
      { caption: "Shift 10 right. That was n moves for ONE insert — this is why unshift is O(n).", rows: [row([c("·", "dim"), c(10, "active"), c(20, "done"), c(30, "done"), c(40, "done")], "arr")], line: 3, vars: { i: 1 } },
      { caption: "Finally place 5 at index 0. Compare: push at the END would have been a single step.", rows: [row([c(5, "active", "[0]"), c(10, "done"), c(20, "done"), c(30, "done"), c(40, "done")], "arr")], line: 4, note: "Read by index: O(1) · Insert at front: O(n)" },
    ],
  };
}

export function linkedlistViz(): Viz {
  const done = (vals: number[]) => row(vals.map((v) => c(v, "done")), "reversed so far (prev)", "chain");
  const todo = (vals: number[], hi = 0) => row(vals.map((v, i) => c(v, i === hi ? "active" : "default")), "remaining (curr →)", "chain");
  return {
    title: "Reverse a linked list — three pointers",
    intro: "The classic interview question. Watch prev grow while curr shrinks — and note the save-next-first step that prevents the #1 pointer bug.",
    code: [
      "let prev = null, curr = head;",
      "while (curr) {",
      "  const nxt = curr.next; // SAVE before rewiring!",
      "  curr.next = prev;      // flip the arrow",
      "  prev = curr;           // reversed part grows",
      "  curr = nxt;            // advance",
      "}",
      "return prev;             // new head",
    ],
    frames: [
      { caption: "Start: prev is empty, curr sits on the head (10).", rows: [done([]), todo([10, 20, 30])], line: 0, vars: { prev: "null", curr: 10 } },
      { caption: "Save nxt = 20 first. If we flipped the arrow now without saving, the rest of the list (20→30) would be lost forever.", rows: [done([]), todo([10, 20, 30])], line: 2, vars: { prev: "null", curr: 10, nxt: 20 } },
      { predict: { q: "We flip 10's arrow onto prev (null), then advance. Which node leads the reversed part now?", opts: ["10", "20", "Still null"], correct: 0 }, caption: "Flip 10's arrow to point at prev (null), then move both pointers up. 10 is now the reversed part.", rows: [done([10]), todo([20, 30])], line: 5, vars: { prev: 10, curr: 20 } },
      { caption: "Same dance for 20: save nxt = 30, flip its arrow onto 10.", rows: [done([10]), todo([20, 30])], line: 2, vars: { prev: 10, curr: 20, nxt: 30 } },
      { caption: "Now 20 → 10. The reversed chain grows at its head.", rows: [done([20, 10]), todo([30])], line: 5, vars: { prev: 20, curr: 30 } },
      { caption: "Last node: save nxt = null, flip 30's arrow onto 20.", rows: [done([20, 10]), todo([30])], line: 2, vars: { prev: 20, curr: 30, nxt: "null" } },
      { caption: "curr is null — the loop ends. prev points at 30, the new head. O(n) time, O(1) space, zero nodes copied.", rows: [done([30, 20, 10])], line: 7, vars: { prev: 30, curr: "null" }, note: "Returned list: 30 → 20 → 10 → ∅" },
    ],
  };
}

export function stackViz(): Viz {
  const input = "({[]})";
  const inRow = (hi: number) => row([...input].map((ch, i) => c(ch, i === hi ? "active" : i < hi ? "dim" : "default")), "input");
  const st = (items: string[], hi = -1) => row(items.map((ch, i) => c(ch, i === hi ? "active" : "default")), "stack (top on right)", "stack");
  return {
    title: "Balanced brackets with a stack",
    intro: "Openers get pushed; every closer must match the most recent opener — exactly what LIFO gives you for free.",
    code: [
      "const match = { ')':'(', ']':'[', '}':'{' };",
      "for (const ch of s) {",
      "  if ('([{'.includes(ch)) stack.push(ch);",
      "  else if (stack.pop() !== match[ch]) return false;",
      "}",
      "return stack.length === 0;",
    ],
    frames: [
      { caption: "Scan '({[]})' left to right. Openers go on the stack; closers must match the top.", rows: [inRow(-1), st([])], line: 1 },
      { caption: "'(' is an opener → push.", rows: [inRow(0), st(["("], 0)], line: 2 },
      { caption: "'{' opener → push. The stack remembers what's waiting to be closed, newest on top.", rows: [inRow(1), st(["(", "{"], 1)], line: 2 },
      { caption: "'[' opener → push.", rows: [inRow(2), st(["(", "{", "["], 2)], line: 2 },
      { predict: { q: "Next char is ']'. For the string to stay balanced, the popped top must be…", opts: ["'[' — the most recent opener", "'{' — the first opener", "'(' — any opener works"], correct: 0 }, caption: "']' is a closer. Pop the top — '[' — and it matches. ✓", rows: [inRow(3), st(["(", "{"])], line: 3, vars: { popped: "[", needed: "[" } },
      { caption: "'}' closer. Pop '{' — matches. ✓ Notice we ALWAYS match the most recent unclosed opener.", rows: [inRow(4), st(["("])], line: 3, vars: { popped: "{", needed: "{" } },
      { caption: "')' closer. Pop '(' — matches. ✓", rows: [inRow(5), st([])], line: 3, vars: { popped: "(", needed: "(" } },
      { caption: "End of input with an EMPTY stack → balanced. A leftover opener (or an early closer) would mean false.", rows: [st([])], line: 5, note: "Balanced ✓ — counting alone can't catch ')(' ; order is everything." },
    ],
  };
}

export function queueViz(): Viz {
  const q = (items: string[], hiNew = -1, leaving = "") =>
    row(
      items.map((v, i) => c(v, i === hiNew ? "active" : "default", i === 0 ? "front" : i === items.length - 1 ? "back" : "")),
      leaving ? `queue — ${leaving} was served` : "queue"
    );
  return {
    title: "FIFO in action — enqueue & dequeue",
    intro: "First in, first out — a fair line. This exact discipline is what makes BFS explore level by level.",
    code: [
      "queue.push('Alice');   // enqueue at the back",
      "queue.push('Bob');",
      "queue.push('Carol');",
      "queue.shift();         // dequeue from the front",
      "// NB: shift() is O(n) — real code uses a deque/index",
    ],
    frames: [
      { caption: "Alice arrives — joins at the back (which is also the front; she's alone).", rows: [q(["Alice"], 0)], line: 0 },
      { caption: "Bob arrives — joins BEHIND Alice. No cutting in line.", rows: [q(["Alice", "Bob"], 1)], line: 1 },
      { caption: "Carol arrives — joins at the back.", rows: [q(["Alice", "Bob", "Carol"], 2)], line: 2 },
      { caption: "Serve! The FRONT leaves first: Alice was first in, so she's first out.", rows: [q(["Bob", "Carol"], -1, "Alice")], line: 3 },
      { caption: "Serve again — Bob leaves. Arrival order is perfectly preserved.", rows: [q(["Carol"], -1, "Bob")], line: 3 },
      { caption: "This fairness is why BFS uses a queue: nodes at distance 1 are ALL served before any node at distance 2 — guaranteeing shortest paths.", rows: [q(["Carol"])], line: 4, note: "Queue = BFS engine. Stack would dive deep instead (DFS)." },
    ],
  };
}

export function hashtableViz(): Viz {
  const nums = [2, 7, 4, 5];
  const arr = (hi: number) => row(nums.map((v, i) => c(v, i === hi ? "active" : i < hi ? "dim" : "default", `[${i}]`)), "nums · target 9");
  const map = (entries: [number, number][]) => row(entries.length ? entries.map(([k, v]) => c(`${k}→${v}`, "done")) : [c("(empty)", "dim")], "seen map (value → index)");
  return {
    title: "Two Sum in one pass with a hash map",
    intro: "The single most useful hash-table pattern: for each number, ask the map 'have you seen my complement?' — O(1) per question.",
    code: [
      "const seen = new Map();",
      "for (let i = 0; i < nums.length; i++) {",
      "  const need = target - nums[i];",
      "  if (seen.has(need)) return [seen.get(need), i];",
      "  seen.set(nums[i], i);",
      "}",
    ],
    frames: [
      { caption: "nums = [2, 7, 4, 5], target 9. Brute force checks all pairs — O(n²). The map does it in one pass.", rows: [arr(-1), map([])], line: 0 },
      { caption: "i=0, value 2. I need 9−2=7. Is 7 in the map? No — store 2→0 for the future.", rows: [arr(0), map([])], line: 3, vars: { i: 0, need: 7, "in map?": "no" } },
      { caption: "2 is now remembered. Every future number can find it in O(1).", rows: [arr(0), map([[2, 0]])], line: 4, vars: { i: 0 } },
      { predict: { q: "i=1, value 7 → we need 9 − 7 = 2. Is 2 already in the map?", opts: ["Yes — stored at index 0 → done!", "No — store 7 and continue", "The map is empty"], correct: 0 }, caption: "i=1, value 7. I need 9−7=2. Is 2 in the map? YES — at index 0!", rows: [arr(1), map([[2, 0]])], line: 3, vars: { i: 1, need: 2, "in map?": "YES → index 0" } },
      { caption: "Answer: [0, 1]. One scan, one O(1) lookup per element — O(n) total instead of O(n²).", rows: [row([c(2, "done", "[0]"), c(7, "done", "[1]"), c(4, "dim"), c(5, "dim")], "nums"), map([[2, 0]])], line: 3, note: "Pattern: 'find a pair/partner' → hash map of what you've seen." },
    ],
  };
}

export function treeViz(): Viz {
  const lv = (states: Record<number, "active" | "done" | "dim">) => [
    row([c(50, states[50])], "root"),
    row([c(30, states[30]), c(70, states[70])], "level 1"),
    row([c(20, states[20]), c(40, states[40]), c(60, states[60]), c(80, states[80])], "level 2"),
  ];
  return {
    title: "BST search — halve the tree at every step",
    intro: "Searching 40 among 7 values takes 3 comparisons, not 7. Watch entire subtrees get eliminated (greyed out) by each decision.",
    code: [
      "function search(node, x) {",
      "  if (!node) return null;",
      "  if (x === node.val) return node;   // found",
      "  if (x < node.val)  return search(node.left,  x);",
      "  else               return search(node.right, x);",
      "}",
    ],
    frames: [
      { caption: "The BST rule at every node: left subtree < node < right subtree. We search for 40.", rows: lv({}), line: 0, vars: { target: 40 } },
      { caption: "Compare with the root: 40 < 50 → go LEFT. The whole right subtree (70, 60, 80) can never contain 40 — eliminated without looking.", rows: lv({ 50: "active", 70: "dim", 60: "dim", 80: "dim" }), line: 3, vars: { target: 40, node: 50, decision: "40 < 50 → left" } },
      { predict: { q: "Now at node 30, still hunting 40. Which way?", opts: ["Left — smaller values live there", "Right — 40 > 30", "Stop — not found"], correct: 1 }, caption: "Compare with 30: 40 > 30 → go RIGHT. Now 20 is eliminated too. Each comparison halves what's left.", rows: lv({ 50: "dim", 30: "active", 70: "dim", 60: "dim", 80: "dim", 20: "dim" }), line: 4, vars: { target: 40, node: 30, decision: "40 > 30 → right" } },
      { caption: "40 === 40 — found in 3 steps. A balanced BST with 1,000,000 nodes needs only ~20 steps: that's log₂(n).", rows: lv({ 50: "dim", 30: "dim", 70: "dim", 60: "dim", 80: "dim", 20: "dim", 40: "done" }), line: 2, note: "Balanced: O(log n). Skewed (sorted inserts): degrades to O(n) — that's why AVL/Red-Black trees rotate." },
    ],
  };
}

export function heapViz(): Viz {
  const idx = (vals: (string | number)[], hi: number[] = [], done: number[] = []) =>
    row(vals.map((v, i) => c(v, hi.includes(i) ? "active" : done.includes(i) ? "done" : "default", `[${i}]`)), "heap array · parent(i) = ⌊(i−1)/2⌋");
  return {
    title: "Min-heap: push (bubble up), extract (sift down)",
    intro: "A tree stored in a flat array. Push 2 and watch it bubble up; then extract the min and watch the new root sift down.",
    code: [
      "push(x): append at the end",
      "  while (x < parent(x)) swap up   // bubble up",
      "extractMin(): take root [0]",
      "  move last element to the root",
      "  while (bigger than a child) swap with smaller child",
    ],
    frames: [
      { caption: "Min-heap [1, 3, 5, 7, 9]. Rule: every parent ≤ its children, so the minimum is always at index 0.", rows: [idx([1, 3, 5, 7, 9])], line: 0 },
      { caption: "push(2): append at the end — index 5. Its parent is index (5−1)>>1 = 2, value 5.", rows: [idx([1, 3, 5, 7, 9, 2], [5])], line: 0, vars: { parent: "5 @ [2]" } },
      { predict: { q: "New value 2 sits under parent 5. What happens?", opts: ["Swap — the child is smaller than the parent", "Nothing — the heap rule holds", "2 jumps straight to the root"], correct: 0 }, caption: "2 < 5 → swap them. The new value bubbles one level up.", rows: [idx([1, 3, 2, 7, 9, 5], [2], [5])], line: 1, vars: { compare: "2 < 5 → swap" } },
      { caption: "New parent is index 0, value 1. 2 > 1 → stop. Heap rule restored in O(log n) swaps.", rows: [idx([1, 3, 2, 7, 9, 5], [], [2])], line: 1, vars: { compare: "2 > 1 → stop" } },
      { caption: "extractMin(): the answer is the root, 1. To fill the hole, move the LAST element (5) to the root.", rows: [idx([5, 3, 2, 7, 9], [0])], line: 3, vars: { extracted: 1 } },
      { predict: { q: "Root 5 must sift down. Its children are 3 and 2 — swap with which?", opts: ["3 — the left child", "2 — always the SMALLER child", "Whichever, it doesn't matter"], correct: 1 }, caption: "Sift down: 5's children are 3 and 2. Swap with the SMALLER child (2) — that keeps the rule intact.", rows: [idx([2, 3, 5, 7, 9], [2], [0])], line: 4, vars: { children: "3, 2", swap: "with 2" } },
      { caption: "5 has no children left — done. New min (2) is at the top. Peek O(1), push/extract O(log n).", rows: [idx([2, 3, 5, 7, 9], [], [0])], line: 4, note: "This is the engine behind priority queues, Top-K, Dijkstra, and stream medians." },
    ],
  };
}

export function graphViz(): Viz {
  const nodes = ["A", "B", "C", "D", "E"];
  const g = (visited: string[], cur: string, seen: string[]) =>
    row(nodes.map((n) => c(n, n === cur ? "active" : visited.includes(n) ? "done" : seen.includes(n) ? "warn" : "default")), "graph  A—B, A—C, B—D, C—D, D—E");
  const q = (items: string[]) => row(items.length ? items.map((v) => c(v)) : [c("(empty)", "dim")], "queue");
  return {
    title: "BFS — explore in rings with a queue",
    intro: "Green = visited, amber = discovered & waiting in the queue. Watch the wave expand one distance-ring at a time.",
    code: [
      "const queue = [start]; seen = {start}",
      "while (queue.length) {",
      "  const node = queue.shift();      // FIFO!",
      "  visit(node);",
      "  for (const nb of graph[node])",
      "    if (!seen.has(nb)) { seen.add(nb); queue.push(nb); }",
      "}",
    ],
    frames: [
      { caption: "Start BFS at A. Edges: A—B, A—C, B—D, C—D, D—E.", rows: [g([], "", ["A"]), q(["A"])], line: 0 },
      { caption: "Dequeue A, visit it. Discover neighbours B and C → into the queue. They are distance 1.", rows: [g([], "A", ["B", "C"]), q(["B", "C"])], line: 3, vars: { visiting: "A", dist: 0 } },
      { caption: "Dequeue B (front of the line). Discover D → enqueue. Note C was discovered BEFORE D — the queue preserves that.", rows: [g(["A"], "B", ["C", "D"]), q(["C", "D"])], line: 3, vars: { visiting: "B", dist: 1 } },
      { predict: { q: "Dequeue C — but its neighbour D is already marked 'seen'. What happens to D?", opts: ["Enqueued a second time", "Skipped — no node enters the queue twice", "BFS restarts from D"], correct: 1 }, caption: "Dequeue C. Its neighbour D is already marked seen — skip it. No node enters the queue twice.", rows: [g(["A", "B"], "C", ["D"]), q(["D"])], line: 5, vars: { visiting: "C", dist: 1 } },
      { caption: "Dequeue D (distance 2). Discover E.", rows: [g(["A", "B", "C"], "D", ["E"]), q(["E"])], line: 3, vars: { visiting: "D", dist: 2 } },
      { caption: "Dequeue E (distance 3). Queue empty — done. Visit order A,B,C,D,E went ring by ring: THAT'S why first arrival = shortest path.", rows: [g(["A", "B", "C", "D"], "E", []), q([])], line: 3, note: "Swap the queue for a stack and you get DFS: A, C, D, E, B — diving deep instead." },
    ],
  };
}

export function trieViz(): Viz {
  const word = (chars: [string, ("active" | "done" | "dim" | "default")?][], title: string) =>
    row(chars.map(([ch, s]) => c(ch, s)), title, "chain");
  return {
    title: "Trie — words that share prefixes share paths",
    intro: "Insert cat, car, dog — then answer startsWith('ca') without scanning any word list.",
    code: [
      "insert(word):",
      "  node = root",
      "  for (ch of word) node = node[ch] ||= {}",
      "  node.isEnd = true",
      "startsWith(p): walk p; false if any step missing",
    ],
    frames: [
      { caption: "Insert 'cat': no branches exist yet, so create c → a → t and mark t as a word end (✱).", rows: [word([["c", "active"], ["a", "active"], ["t✱", "active"]], "cat")], line: 2 },
      { caption: "Insert 'car': c and a ALREADY EXIST — reuse them (green). Only r is new. Shared prefix = shared path = saved memory.", rows: [word([["c", "done"], ["a", "done"], ["t✱", "dim"]], "cat"), word([["c", "done"], ["a", "done"], ["r✱", "active"]], "car — reuses c,a")], line: 2 },
      { caption: "Insert 'dog': no shared prefix with c-words — a fresh branch from the root.", rows: [word([["c", "dim"], ["a", "dim"], ["t✱", "dim"]], "cat"), word([["c", "dim"], ["a", "dim"], ["r✱", "dim"]], "car"), word([["d", "active"], ["o", "active"], ["g✱", "active"]], "dog")], line: 2 },
      { caption: "Query startsWith('ca'): walk c → a. Both steps exist → true. Cost: 2 steps — regardless of whether we stored 3 words or 3 million.", rows: [word([["c", "active"], ["a", "active"], ["t✱", "done"]], "…cat"), word([["c", "active"], ["a", "active"], ["r✱", "done"]], "…car"), word([["d", "dim"], ["o", "dim"], ["g✱", "dim"]], "dog")], line: 4, vars: { query: "ca", steps: 2 } },
      { caption: "Every word under the 'ca' node is a completion: cat, car. That's autocomplete — walk the prefix, then collect the subtree.", rows: [word([["c", "done"], ["a", "done"], ["t✱", "done"]], "cat ✓"), word([["c", "done"], ["a", "done"], ["r✱", "done"]], "car ✓")], line: 4, note: "Lookup cost = O(word length), independent of dictionary size." },
    ],
  };
}

export function setViz(): Viz {
  const input = [1, 2, 2, 3, 3, 3, 4];
  const inRow = (hi: number) => row(input.map((v, i) => c(v, i === hi ? "active" : i < hi ? "dim" : "default")), "input array");
  const setRow = (items: number[], rejected = false) =>
    row(items.length ? items.map((v, i) => c(v, rejected && i === items.length - 1 ? "warn" : "done")) : [c("(empty)", "dim")], "set");
  return {
    title: "Deduplicate with a Set",
    intro: "A set silently refuses duplicates — the perfect 'have I seen this before?' machine at O(1) per check.",
    code: [
      "const seen = new Set();",
      "for (const n of arr) {",
      "  seen.add(n); // duplicate? silently ignored",
      "}",
      "const unique = [...seen];",
    ],
    frames: [
      { caption: "Input [1, 2, 2, 3, 3, 3, 4]. We'll add each value; the set keeps at most one copy.", rows: [inRow(-1), setRow([])], line: 0 },
      { caption: "add(1) — new, accepted.", rows: [inRow(0), setRow([1])], line: 2 },
      { caption: "add(2) — new, accepted.", rows: [inRow(1), setRow([1, 2])], line: 2 },
      { caption: "add(2) again — the set hashes it, finds it already present, and does NOTHING. No error, no duplicate.", rows: [inRow(2), setRow([1, 2], true)], line: 2, vars: { "has(2)?": "yes → ignored" } },
      { caption: "add(3) — accepted.", rows: [inRow(3), setRow([1, 2, 3])], line: 2 },
      { caption: "The two remaining 3s bounce off; add(4) is accepted.", rows: [inRow(6), setRow([1, 2, 3, 4])], line: 2 },
      { caption: "Spread back into an array: [1, 2, 3, 4]. Total cost O(n) — versus O(n²) for checking each element against all others.", rows: [setRow([1, 2, 3, 4])], line: 4, note: "One-liner to remember: const unique = [...new Set(arr)]" },
    ],
  };
}
