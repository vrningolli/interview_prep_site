/* Verifies every Code Lab challenge: runs a known-correct reference solution
   through the same conversion/normalization harness the worker uses, and
   asserts all expected test values are right. Run: node scripts/verify-challenges.mjs */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/* Load CHALLENGES from the TS file by stripping the (minimal) type syntax. */
let src = fs.readFileSync(path.join(here, "..", "src", "lab", "challenges.ts"), "utf8");
src = src.replace(/import[^;]+;/, "");
src = src.replace(/export interface Challenge \{[\s\S]*?\n\}/, "");
src = src.replace(/export const CHALLENGES: Record<string, Challenge> =/, "globalThis.__CHALLENGES =");
new Function(src)();
const CHALLENGES = globalThis.__CHALLENGES;

/* ── Same harness logic as the worker ── */
function toList(arr) {
  let head = null, tail = null;
  for (const v of arr) {
    const n = { value: v, next: null };
    if (!head) head = n; else tail.next = n;
    tail = n;
  }
  return head;
}
function fromList(node) {
  const out = []; let guard = 0;
  while (node && guard++ < 10000) { out.push(node.value); node = node.next; }
  return out;
}
function toTree(arr) {
  if (!arr.length) return null;
  const nodes = arr.map((v) => (v === null ? null : { val: v, left: null, right: null }));
  let i = 1;
  for (let p = 0; p < nodes.length && i < nodes.length; p++) {
    if (!nodes[p]) continue;
    nodes[p].left = i < nodes.length ? nodes[i++] : null;
    nodes[p].right = i < nodes.length ? nodes[i++] : null;
  }
  return nodes[0];
}
const conv = (a) =>
  a && typeof a === "object" && !Array.isArray(a)
    ? "__list" in a ? toList(a.__list) : "__tree" in a ? toTree(a.__tree) : a
    : a;
function norm(v, normalize) {
  if (normalize === "sorted" && Array.isArray(v))
    return v.slice().sort((a, b) => (Array.isArray(a) ? a[0] - b[0] : a - b));
  if (normalize === "setOfSets" && Array.isArray(v))
    return v
      .map((x) => x.slice().sort((a, b) => a - b))
      .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
  return v;
}

/* ── Reference solutions ── */
const REF = {
  array: function reverseArray(arr) { for (let l = 0, r = arr.length - 1; l < r; l++, r--) [arr[l], arr[r]] = [arr[r], arr[l]]; return arr; },
  linkedlist: function reverseList(head) { let prev = null, curr = head; while (curr) { const nxt = curr.next; curr.next = prev; prev = curr; curr = nxt; } return prev; },
  stack: function isValid(s) { const st = [], m = { ")": "(", "]": "[", "}": "{" }; for (const ch of s) { if ("([{".includes(ch)) st.push(ch); else if (st.pop() !== m[ch]) return false; } return st.length === 0; },
  queue: function runQueueOps(ops) {
    const inS = [], outS = [], out = [];
    const shift = () => { if (!outS.length) while (inS.length) outS.push(inS.pop()); };
    for (const [op, x] of ops) {
      if (op === "enqueue") { inS.push(x); out.push(null); }
      else if (op === "dequeue") { shift(); out.push(outS.pop()); }
      else if (op === "peek") { shift(); out.push(outS[outS.length - 1]); }
      else out.push(inS.length + outS.length === 0);
    }
    return out;
  },
  hashtable: function twoSum(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { const need = target - nums[i]; if (seen.has(need)) return [seen.get(need), i]; seen.set(nums[i], i); } },
  tree: function maxDepth(root) { return root ? 1 + Math.max(REF.tree(root.left), REF.tree(root.right)) : 0; },
  heap: function findKthLargest(nums, k) { return nums.slice().sort((a, b) => b - a)[k - 1]; },
  graph: function numIslands(grid) {
    let count = 0;
    const sink = (r, c) => { if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== 1) return; grid[r][c] = 0; sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1); };
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) if (grid[r][c] === 1) { count++; sink(r, c); }
    return count;
  },
  trie: (words, prefix) => words.filter((w) => w.startsWith(prefix)).length,
  set: function longestConsecutive(nums) { const set = new Set(nums); let best = 0; for (const n of set) { if (set.has(n - 1)) continue; let len = 1; while (set.has(n + len)) len++; best = Math.max(best, len); } return best; },
  binarysearch: function search(nums, target) { let lo = 0, hi = nums.length - 1; while (lo <= hi) { const mid = lo + ((hi - lo) >> 1); if (nums[mid] === target) return mid; if (nums[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; },
  sorting: function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = arr.length >> 1;
    const a = REF.sorting(arr.slice(0, mid)), b = REF.sorting(arr.slice(mid));
    const out = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
    return out.concat(a.slice(i), b.slice(j));
  },
  recursion: function fib(n, memo = {}) { if (n <= 1) return n; if (n in memo) return memo[n]; return (memo[n] = REF.recursion(n - 1, memo) + REF.recursion(n - 2, memo)); },
  bfsdfs: function floodFill(image, sr, sc, color) {
    const start = image[sr][sc];
    if (start === color) return image;
    const fill = (r, c) => { if (r < 0 || c < 0 || r >= image.length || c >= image[0].length || image[r][c] !== start) return; image[r][c] = color; fill(r + 1, c); fill(r - 1, c); fill(r, c + 1); fill(r, c - 1); };
    fill(sr, sc);
    return image;
  },
  dp: function coinChange(coins, amount) { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; },
  twopointers: function twoSumSorted(nums, target) { let l = 0, r = nums.length - 1; while (l < r) { const s = nums[l] + nums[r]; if (s === target) return [l, r]; if (s < target) l++; else r--; } },
  slidingwindow: function maxSumWindow(arr, k) { let sum = 0; for (let i = 0; i < k; i++) sum += arr[i]; let best = sum; for (let i = k; i < arr.length; i++) { sum += arr[i] - arr[i - k]; best = Math.max(best, sum); } return best; },
  backtracking: function subsets(nums) { const results = [], path = []; (function walk(start) { results.push([...path]); for (let i = start; i < nums.length; i++) { path.push(nums[i]); walk(i + 1); path.pop(); } })(0); return results; },
  greedy: function canJump(nums) { let reach = 0; for (let i = 0; i < nums.length; i++) { if (i > reach) return false; reach = Math.max(reach, i + nums[i]); } return true; },
  intervals: function mergeIntervals(intervals) { if (!intervals.length) return []; intervals.sort((a, b) => a[0] - b[0]); const out = [intervals[0]]; for (const [s, e] of intervals.slice(1)) { const last = out[out.length - 1]; if (s <= last[1]) last[1] = Math.max(last[1], e); else out.push([s, e]); } return out; },
  unionfind: function countComponents(n, edges) { const parent = [...Array(n).keys()]; const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }; let comp = n; for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra !== rb) { parent[rb] = ra; comp--; } } return comp; },
};

let errors = 0;
for (const [key, ch] of Object.entries(CHALLENGES)) {
  const fn = REF[key];
  if (!fn) { console.error(`FAIL: no reference solution for '${key}'`); errors++; continue; }
  ch.tests.forEach((test, i) => {
    const fresh = JSON.parse(JSON.stringify(test));
    let out = fn(...fresh.args.map(conv));
    let expected = fresh.expected;
    if (expected && typeof expected === "object" && !Array.isArray(expected) && "__list" in expected) {
      out = fromList(out);
      expected = expected.__list;
    }
    const got = JSON.stringify(norm(out, ch.normalize));
    const exp = JSON.stringify(norm(expected, ch.normalize));
    if (got !== exp) {
      console.error(`FAIL: ${key} test ${i}: got ${got}, expected ${exp}`);
      errors++;
    }
  });
}
console.log(errors === 0 ? `PASS — all ${Object.keys(CHALLENGES).length} challenges verified against reference solutions.` : `${errors} failure(s).`);
process.exit(errors ? 1 : 0);
