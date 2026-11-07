/* One hands-on coding challenge per topic. Each runs against real test cases
   in a sandboxed worker — this is where watching turns into implementing. */
import { TestCase } from "./runner";

export interface Challenge {
  id: string;
  topicKey: string;
  title: string;
  prompt: string;
  fnName: string;
  starter: string;
  hint: string;
  normalize?: "sorted" | "setOfSets";
  tests: TestCase[];
}

export const CHALLENGES: Record<string, Challenge> = {
  array: {
    id: "lab-array",
    topicKey: "array",
    title: "Reverse an array in place",
    prompt: "Return the array reversed. Aim for O(1) extra space — swap from both ends.",
    fnName: "reverseArray",
    starter: `function reverseArray(arr) {
  // Two pointers: swap ends, move inward.

  return arr;
}`,
    hint: "let l = 0, r = arr.length - 1; swap arr[l] and arr[r], then l++, r--, until they meet.",
    tests: [
      { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { args: [[1, 2]], expected: [2, 1] },
      { args: [[7]], expected: [7] },
      { args: [[]], expected: [] },
    ],
  },

  linkedlist: {
    id: "lab-linkedlist",
    topicKey: "linkedlist",
    title: "Reverse a linked list",
    prompt:
      "You get the head of a linked list (nodes look like { value, next }). Return the head of the reversed list. Exactly what the visualizer above walks through!",
    fnName: "reverseList",
    starter: `function reverseList(head) {
  // Nodes: { value, next }. Last node has next = null.
  // Three pointers: prev, curr, and a saved next.
  let prev = null;
  let curr = head;

  return prev;
}`,
    hint: "Inside the loop: save curr.next FIRST, then curr.next = prev, then advance prev and curr.",
    tests: [
      { args: [{ __list: [10, 20, 30] }], expected: { __list: [30, 20, 10] } },
      { args: [{ __list: [1, 2] }], expected: { __list: [2, 1] } },
      { args: [{ __list: [5] }], expected: { __list: [5] } },
      { args: [{ __list: [] }], expected: { __list: [] } },
    ],
  },

  stack: {
    id: "lab-stack",
    topicKey: "stack",
    title: "Valid parentheses",
    prompt: "Given a string of brackets ()[]{}  return true if every bracket closes in the right order.",
    fnName: "isValid",
    starter: `function isValid(s) {
  const stack = [];
  const match = { ')': '(', ']': '[', '}': '{' };

  return stack.length === 0;
}`,
    hint: "Push openers. On a closer, pop and compare against match[ch] — mismatch or empty pop means false.",
    tests: [
      { args: ["()"], expected: true },
      { args: ["()[]{}"], expected: true },
      { args: ["(]"], expected: false },
      { args: ["([)]"], expected: false },
      { args: ["{[]}"], expected: true },
      { args: ["("], expected: false },
      { args: [")("], expected: false },
    ],
  },

  queue: {
    id: "lab-queue",
    topicKey: "queue",
    title: "Queue built from two stacks",
    prompt:
      "Process a list of operations using ONLY two arrays used as stacks (push/pop — no shift/unshift!). Ops: ['enqueue', x] → output null; ['dequeue'] / ['peek'] → output the front value; ['empty'] → output boolean. Return the array of outputs.",
    fnName: "runQueueOps",
    starter: `function runQueueOps(ops) {
  const inStack = [];
  const outStack = [];
  const outputs = [];
  // When outStack is empty, drain inStack into it (reversing order).

  return outputs;
}`,
    hint: "enqueue: inStack.push(x). dequeue/peek: if outStack is empty, pop everything from inStack into outStack first — the front of the queue is now on top of outStack.",
    tests: [
      {
        args: [[["enqueue", 1], ["enqueue", 2], ["peek"], ["dequeue"], ["dequeue"], ["empty"]]],
        expected: [null, null, 1, 1, 2, true],
      },
      {
        args: [[["enqueue", 5], ["dequeue"], ["enqueue", 6], ["enqueue", 7], ["dequeue"], ["peek"]]],
        expected: [null, 5, null, null, 6, 7],
      },
    ],
  },

  hashtable: {
    id: "lab-hashtable",
    topicKey: "hashtable",
    title: "Two Sum (one pass)",
    prompt: "Return the indices of the two numbers adding up to target. One pass, one Map — the pattern from the visualizer.",
    fnName: "twoSum",
    starter: `function twoSum(nums, target) {
  const seen = new Map(); // value -> index

}`,
    hint: "For each nums[i], compute need = target - nums[i]. If seen.has(need) return [seen.get(need), i]; otherwise seen.set(nums[i], i).",
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
    ],
  },

  tree: {
    id: "lab-tree",
    topicKey: "tree",
    title: "Max depth of a binary tree",
    prompt: "Nodes look like { val, left, right }. Return the number of levels (empty tree → 0). Two lines of recursion.",
    fnName: "maxDepth",
    starter: `function maxDepth(root) {
  // Base case: an empty tree has depth 0.
  // Otherwise: 1 + the deeper of the two subtrees.

}`,
    hint: "if (!root) return 0; return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));",
    tests: [
      { args: [{ __tree: [3, 9, 20, null, null, 15, 7] }], expected: 3 },
      { args: [{ __tree: [1, null, 2] }], expected: 2 },
      { args: [{ __tree: [] }], expected: 0 },
      { args: [{ __tree: [1] }], expected: 1 },
    ],
  },

  heap: {
    id: "lab-heap",
    topicKey: "heap",
    title: "Kth largest element",
    prompt:
      "Return the k-th largest element of nums. Sorting works (O(n log n)) — for bonus style, keep a min-heap of size k like the Top-K pattern teaches.",
    fnName: "findKthLargest",
    starter: `function findKthLargest(nums, k) {

}`,
    hint: "Quick version: sort descending and take index k-1. Heap version: push each number into a size-capped min-structure; evict the smallest when size > k.",
    tests: [
      { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
      { args: [[1], 1], expected: 1 },
    ],
  },

  graph: {
    id: "lab-graph",
    topicKey: "graph",
    title: "Number of islands",
    prompt: "Grid of 1 (land) and 0 (water). Count the connected groups of land (4-directional). Flood-fill each island so you don't count it twice.",
    fnName: "numIslands",
    starter: `function numIslands(grid) {
  let count = 0;
  // For each cell that is 1: count++, then flood-fill (DFS/BFS)
  // turning the whole island into 0s.

  return count;
}`,
    hint: "function sink(r, c) { if out of bounds or grid[r][c] !== 1 return; grid[r][c] = 0; recurse on the 4 neighbours; }",
    tests: [
      { args: [[[1, 1, 0], [0, 1, 0], [0, 0, 1]]], expected: 2 },
      { args: [[[1, 1, 1, 1, 0], [1, 1, 0, 1, 0], [1, 1, 0, 0, 0], [0, 0, 0, 0, 0]]], expected: 1 },
      { args: [[[0]]], expected: 0 },
      { args: [[[1, 0, 1, 0, 1]]], expected: 3 },
    ],
  },

  trie: {
    id: "lab-trie",
    topicKey: "trie",
    title: "Count words with a prefix",
    prompt:
      "Given a word list and a prefix, return how many words start with that prefix. A loop works; building a real trie node structure is the bonus.",
    fnName: "countPrefix",
    starter: `function countPrefix(words, prefix) {

}`,
    hint: "Simple: words.filter(w => w.startsWith(prefix)).length. Trie version: insert all words, walk the prefix, count word-ends in the subtree.",
    tests: [
      { args: [["cat", "car", "care", "dog"], "ca"], expected: 3 },
      { args: [["cat", "car", "care", "dog"], "d"], expected: 1 },
      { args: [["cat", "car"], "cat"], expected: 1 },
      { args: [["a", "ab"], ""], expected: 2 },
      { args: [[], "x"], expected: 0 },
    ],
  },

  set: {
    id: "lab-set",
    topicKey: "set",
    title: "Longest consecutive sequence",
    prompt: "Unsorted integers — return the length of the longest run of consecutive values, in O(n). No sorting!",
    fnName: "longestConsecutive",
    starter: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  // Only start counting at numbers n where n-1 is NOT in the set.

  return best;
}`,
    hint: "for (const n of set): if set.has(n-1) continue; walk n, n+1, n+2… while in the set, track the max length.",
    tests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[10]], expected: 1 },
    ],
  },

  binarysearch: {
    id: "lab-binarysearch",
    topicKey: "binarysearch",
    title: "Classic binary search",
    prompt: "Sorted array — return the index of target, or -1. Must be O(log n): no linear scans, no indexOf.",
    fnName: "search",
    starter: `function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);

  }
  return -1;
}`,
    hint: "Three cases at mid: equal → return mid; nums[mid] < target → lo = mid + 1; else hi = mid - 1.",
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[5], 5], expected: 0 },
      { args: [[2, 5], 2], expected: 0 },
      { args: [[], 3], expected: -1 },
    ],
  },

  sorting: {
    id: "lab-sorting",
    topicKey: "sorting",
    title: "Implement merge sort",
    prompt: "Return a sorted copy of the array — by writing merge sort yourself (split, recurse, merge). Using .sort() defeats the purpose!",
    fnName: "mergeSort",
    starter: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  // 1. split in half   2. mergeSort both halves   3. merge them

}`,
    hint: "merge(a, b): walk both with two pointers, always taking the smaller front element; append leftovers at the end.",
    tests: [
      { args: [[5, 2, 3, 1]], expected: [1, 2, 3, 5] },
      { args: [[5, 1, 1, 2, 0, 0]], expected: [0, 0, 1, 1, 2, 5] },
      { args: [[3, -1, 4, -5]], expected: [-5, -1, 3, 4] },
      { args: [[]], expected: [] },
    ],
  },

  recursion: {
    id: "lab-recursion",
    topicKey: "recursion",
    title: "Fibonacci with memoization",
    prompt: "Return the n-th Fibonacci number (fib(0)=0, fib(1)=1). Naive recursion works for small n but crawls — add a memo so fib(35) is instant.",
    fnName: "fib",
    starter: `function fib(n, memo = {}) {
  // Base cases first. Then: check the memo BEFORE recursing,
  // and store the result before returning.

}`,
    hint: "if (n <= 1) return n; if (n in memo) return memo[n]; memo[n] = fib(n-1, memo) + fib(n-2, memo); return memo[n];",
    tests: [
      { args: [0], expected: 0 },
      { args: [1], expected: 1 },
      { args: [10], expected: 55 },
      { args: [20], expected: 6765 },
      { args: [35], expected: 9227465 },
    ],
  },

  bfsdfs: {
    id: "lab-bfsdfs",
    topicKey: "bfsdfs",
    title: "Flood fill",
    prompt: "Like the paint-bucket tool: starting at (sr, sc), recolor every 4-directionally connected cell of the same starting color. Return the grid.",
    fnName: "floodFill",
    starter: `function floodFill(image, sr, sc, color) {
  const start = image[sr][sc];
  if (start === color) return image; // nothing to do!

  return image;
}`,
    hint: "DFS: fill(r, c) → if out of bounds or image[r][c] !== start, return; set image[r][c] = color; recurse into the 4 neighbours.",
    tests: [
      { args: [[[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2], expected: [[2, 2, 2], [2, 2, 0], [2, 0, 1]] },
      { args: [[[0, 0, 0], [0, 0, 0]], 0, 0, 0], expected: [[0, 0, 0], [0, 0, 0]] },
      { args: [[[0, 1], [1, 1]], 1, 1, 5], expected: [[0, 5], [5, 5]] },
    ],
  },

  dp: {
    id: "lab-dp",
    topicKey: "dp",
    title: "Coin change (min coins)",
    prompt: "Fewest coins to make the amount, or -1 if impossible. Greedy fails here — build a dp table from 0 up to amount.",
    fnName: "coinChange",
    starter: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  // dp[a] = 1 + min(dp[a - coin]) over every coin that fits.

  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    hint: "for (let a = 1; a <= amount; a++) for (const c of coins) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);",
    tests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0 },
      { args: [[1, 3, 4], 6], expected: 2 },
    ],
  },

  twopointers: {
    id: "lab-twopointers",
    topicKey: "twopointers",
    title: "Two sum on a sorted array",
    prompt: "The array is SORTED. Return the indices of the two numbers summing to target — O(n) time, O(1) space. No hash map allowed (that's the point!).",
    fnName: "twoSumSorted",
    starter: `function twoSumSorted(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {

  }
}`,
    hint: "sum too small → l++ (need bigger). Too big → r-- (need smaller). Equal → return [l, r].",
    tests: [
      { args: [[1, 4, 6, 9, 11], 15], expected: [1, 4] },
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[-3, 0, 3, 8], 0], expected: [0, 2] },
      { args: [[1, 2], 3], expected: [0, 1] },
    ],
  },

  slidingwindow: {
    id: "lab-slidingwindow",
    topicKey: "slidingwindow",
    title: "Max sum of a size-k window",
    prompt: "Return the maximum sum of any k consecutive elements — in O(n), reusing the previous window's sum like the visualizer shows.",
    fnName: "maxSumWindow",
    starter: `function maxSumWindow(arr, k) {
  // Sum the first k elements, then slide:
  // add the entering element, subtract the leaving one.

}`,
    hint: "sum += arr[i] - arr[i - k] per slide; track best = Math.max(best, sum).",
    tests: [
      { args: [[2, 5, 1, 8, 2, 9, 1], 3], expected: 19 },
      { args: [[1, 2], 2], expected: 3 },
      { args: [[5], 1], expected: 5 },
      { args: [[3, -1, 4, -1, 5], 2], expected: 4 },
    ],
  },

  backtracking: {
    id: "lab-backtracking",
    topicKey: "backtracking",
    title: "All subsets (power set)",
    prompt: "Return every subset of the distinct numbers. Choose → recurse → un-choose, exactly like the visualizer. Any order is accepted.",
    fnName: "subsets",
    starter: `function subsets(nums) {
  const results = [];
  const path = [];
  function walk(start) {
    results.push([...path]);   // copy! path keeps mutating
    for (let i = start; i < nums.length; i++) {
      // choose, recurse, un-choose

    }
  }
  walk(0);
  return results;
}`,
    hint: "Inside the loop: path.push(nums[i]); walk(i + 1); path.pop(); — the pop is the un-choose.",
    normalize: "setOfSets",
    tests: [
      { args: [[1, 2, 3]], expected: [[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]] },
      { args: [[0]], expected: [[], [0]] },
      { args: [[]], expected: [[]] },
    ],
  },

  greedy: {
    id: "lab-greedy",
    topicKey: "greedy",
    title: "Jump game",
    prompt: "nums[i] is your max jump length from position i. Can you reach the last index? Greedy: track the furthest index reachable so far.",
    fnName: "canJump",
    starter: `function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    // If i is beyond reach, you're stuck.
    // Otherwise extend reach.

  }
  return true;
}`,
    hint: "if (i > reach) return false; reach = Math.max(reach, i + nums[i]);",
    tests: [
      { args: [[2, 3, 1, 1, 4]], expected: true },
      { args: [[3, 2, 1, 0, 4]], expected: false },
      { args: [[0]], expected: true },
      { args: [[1, 0, 1]], expected: false },
    ],
  },

  intervals: {
    id: "lab-intervals",
    topicKey: "intervals",
    title: "Merge overlapping intervals",
    prompt: "Merge every overlapping pair of [start, end] intervals. Sort by start first — then one sweep, exactly like the visualizer.",
    fnName: "mergeIntervals",
    starter: `function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [intervals[0]];

  return out;
}`,
    hint: "For each [s, e]: const last = out[out.length-1]; if (s <= last[1]) last[1] = Math.max(last[1], e); else out.push([s, e]);",
    normalize: "sorted",
    tests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
      { args: [[]], expected: [] },
    ],
  },

  unionfind: {
    id: "lab-unionfind",
    topicKey: "unionfind",
    title: "Count connected components",
    prompt: "n nodes (0…n-1) and an edge list. Return the number of connected components using Union-Find: start at n, subtract one per successful union.",
    fnName: "countComponents",
    starter: `function countComponents(n, edges) {
  const parent = [...Array(n).keys()];
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path compression
      x = parent[x];
    }
    return x;
  }
  let components = n;
  // union each edge; decrement components on a real merge

  return components;
}`,
    hint: "for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra !== rb) { parent[rb] = ra; components--; } }",
    tests: [
      { args: [5, [[0, 1], [1, 2], [3, 4]]], expected: 2 },
      { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: 1 },
      { args: [4, []], expected: 4 },
      { args: [3, [[0, 1], [0, 2], [1, 2]]], expected: 1 },
    ],
  },
};
