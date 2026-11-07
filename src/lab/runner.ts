/* Sandboxed test runner: user code executes inside a Web Worker built from a
   Blob, so an infinite loop can be terminated and the page never freezes.
   Special arg/expected encodings let tests express linked lists and binary
   trees as plain arrays: { __list: [1,2,3] } and { __tree: [3,9,20,null,...] }. */

export interface TestCase {
  args: unknown[];
  expected: unknown;
}

export interface TestResult {
  pass: boolean;
  got?: string;
  expected?: string;
  error?: string;
}

export interface RunOutcome {
  fatal?: string;
  timeout?: boolean;
  results?: TestResult[];
}

const WORKER_SRC = `
self.onmessage = function (e) {
  var code = e.data.code, fnName = e.data.fnName, tests = e.data.tests, normalize = e.data.normalize;
  var fn;
  try {
    fn = new Function(code + "\\n;return " + fnName + ";")();
    if (typeof fn !== "function") throw new Error("Define a function named '" + fnName + "'");
  } catch (err) {
    self.postMessage({ fatal: String((err && err.message) || err) });
    return;
  }
  function toList(arr) {
    var head = null, tail = null;
    for (var i = 0; i < arr.length; i++) {
      var n = { value: arr[i], next: null };
      if (!head) head = n; else tail.next = n;
      tail = n;
    }
    return head;
  }
  function fromList(node) {
    var out = [], guard = 0;
    while (node && guard++ < 10000) { out.push(node.value); node = node.next; }
    return out;
  }
  function toTree(arr) {
    if (!arr.length) return null;
    var nodes = arr.map(function (v) { return v === null ? null : { val: v, left: null, right: null }; });
    var i = 1;
    for (var p = 0; p < nodes.length && i < nodes.length; p++) {
      if (!nodes[p]) continue;
      nodes[p].left = i < nodes.length ? nodes[i++] : null;
      nodes[p].right = i < nodes.length ? nodes[i++] : null;
    }
    return nodes[0];
  }
  function conv(a) {
    if (a && typeof a === "object" && !Array.isArray(a)) {
      if ("__list" in a) return toList(a.__list);
      if ("__tree" in a) return toTree(a.__tree);
    }
    return a;
  }
  function norm(v) {
    if (normalize === "sorted" && Array.isArray(v))
      return v.slice().sort(function (a, b) { return Array.isArray(a) ? a[0] - b[0] : a - b; });
    if (normalize === "setOfSets" && Array.isArray(v))
      return v.map(function (x) { return x.slice().sort(function (a, b) { return a - b; }); })
        .sort(function (a, b) {
          var sa = JSON.stringify(a), sb = JSON.stringify(b);
          return sa < sb ? -1 : sa > sb ? 1 : 0;
        });
    return v;
  }
  function show(v) {
    var s;
    try { s = JSON.stringify(v); } catch (err) { return "[unserializable value]"; }
    return s === undefined ? String(v) : s;
  }
  var results = [];
  for (var t = 0; t < tests.length; t++) {
    var test = tests[t];
    try {
      var out = fn.apply(null, test.args.map(conv));
      var expected = test.expected;
      if (expected && typeof expected === "object" && !Array.isArray(expected) && "__list" in expected) {
        out = fromList(out);
        expected = expected.__list;
      }
      var got = norm(out), exp = norm(expected);
      results.push({ pass: show(got) === show(exp), got: show(got), expected: show(exp) });
    } catch (err2) {
      results.push({ pass: false, error: String((err2 && err2.message) || err2), expected: show(test.expected) });
    }
  }
  self.postMessage({ results: results });
};
`;

export function runTests(
  code: string,
  fnName: string,
  tests: TestCase[],
  normalize?: string
): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "application/javascript" }));
    const worker = new Worker(url);
    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve({ timeout: true });
    }, 4000);
    worker.onmessage = (e) => {
      window.clearTimeout(timer);
      cleanup();
      resolve(e.data as RunOutcome);
    };
    worker.onerror = (e) => {
      window.clearTimeout(timer);
      cleanup();
      resolve({ fatal: e.message || "Worker error" });
    };
    // Deep-copy tests so mutating solutions (e.g. flood fill) get fresh inputs.
    worker.postMessage({ code, fnName, tests: JSON.parse(JSON.stringify(tests)), normalize });
  });
}
