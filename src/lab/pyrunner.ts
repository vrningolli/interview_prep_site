/* Python test runner: CPython compiled to WebAssembly (Pyodide), inside a Web Worker.

   - Pyodide (~10 MB) loads from the jsDelivr CDN the first time Python is used, then
     stays warm in the worker for the rest of the session.
   - Each run has a time limit; on timeout the worker is terminated (that's the only
     way to stop an infinite loop) and a fresh one is started next time.
   - PY_HARNESS is plain Python so it can be unit-tested with a local interpreter. */
import type { RunOutcome, TestCase } from "./runner";

export const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Runs candidate code against JSON test cases; returns a JSON RunOutcome. */
export const PY_HARNESS = `
import json, copy

def _norm(v, normalize):
    if normalize == "sorted" and isinstance(v, (list, tuple)):
        v = [list(x) if isinstance(x, tuple) else x for x in v]
        try:
            return sorted(v, key=lambda x: x[0] if isinstance(x, list) else x)
        except TypeError:
            return v
    return v

def _show(v):
    try:
        return json.dumps(v, separators=(",", ":"))
    except (TypeError, ValueError):
        return repr(v)

def __prep_run(code, fn_name, tests_json, normalize):
    ns = {"__name__": "__candidate__"}
    try:
        exec(compile(code, "solution.py", "exec"), ns)
    except SyntaxError as e:
        return json.dumps({"fatal": "SyntaxError on line %s: %s" % (e.lineno, e.msg)})
    except Exception as e:
        return json.dumps({"fatal": "%s: %s" % (type(e).__name__, e)})
    fn = ns.get(fn_name)
    if not callable(fn):
        return json.dumps({"fatal": "Define a function named '%s'" % fn_name})
    results = []
    for t in json.loads(tests_json):
        try:
            out = fn(*copy.deepcopy(t["args"]))
            if isinstance(out, tuple):
                out = list(out)
            got, exp = _show(_norm(out, normalize)), _show(_norm(t["expected"], normalize))
            results.append({"pass": got == exp, "got": got, "expected": exp})
        except Exception as e:
            results.append({"pass": False, "error": "%s: %s" % (type(e).__name__, e), "expected": _show(t["expected"])})
    return json.dumps({"results": results})
`;

const WORKER_SRC = `
importScripts(${JSON.stringify(PYODIDE_URL + "pyodide.js")});
let ready = null;
self.onmessage = async (e) => {
  try {
    if (!ready) {
      ready = loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_URL)} }).then(async (py) => {
        await py.runPythonAsync(e.data.harness);
        return py;
      });
    }
    const py = await ready;
    self.postMessage({ type: "loaded" });
    const run = py.globals.get("__prep_run");
    const out = run(e.data.code, e.data.fnName, JSON.stringify(e.data.tests), e.data.normalize || "");
    run.destroy();
    self.postMessage({ type: "done", outcome: JSON.parse(out) });
  } catch (err) {
    ready = null;
    self.postMessage({ type: "done", outcome: { fatal: String((err && err.message) || err) } });
  }
};
`;

let worker: Worker | null = null;
let loaded = false;

function getWorker(): Worker {
  if (!worker) {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "application/javascript" }));
    worker = new Worker(url);
    loaded = false;
  }
  return worker;
}

function kill() {
  worker?.terminate();
  worker = null;
  loaded = false;
}

/** True once Python has been downloaded in this session (later runs are fast). */
export const pythonReady = () => loaded;

/** Starts the Pyodide download early (e.g. when a Python interview begins). */
export function warmPython() {
  if (worker) return;
  runPythonTests("pass", "__none__", [], undefined, 60_000).catch(() => {});
}

/* Runs are queued: each one owns the worker's message handler until it finishes, so a
   test run started while Python is still downloading simply waits its turn. */
let queue: Promise<unknown> = Promise.resolve();

export function runPythonTests(
  code: string,
  fnName: string,
  tests: TestCase[],
  normalize?: string,
  limitMs = 6_000
): Promise<RunOutcome> {
  const next = queue.then(() => runOne(code, fnName, tests, normalize, limitMs));
  queue = next.catch(() => {});
  return next;
}

function runOne(code: string, fnName: string, tests: TestCase[], normalize: string | undefined, limitMs: number): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const w = getWorker();
    // First run includes the download, so allow much longer before giving up.
    let timer = window.setTimeout(onTimeout, loaded ? limitMs : 90_000);
    function onTimeout() {
      const wasLoaded = loaded; // read before kill() resets it
      kill();
      resolve(wasLoaded ? { timeout: true } : { fatal: "Python took too long to load — check your connection and try again." });
    }
    w.onmessage = (e) => {
      if (e.data.type === "loaded" && !loaded) {
        loaded = true;
        window.clearTimeout(timer);
        timer = window.setTimeout(onTimeout, limitMs);
        return;
      }
      if (e.data.type === "done") {
        window.clearTimeout(timer);
        resolve(e.data.outcome as RunOutcome);
      }
    };
    w.onerror = (e) => {
      window.clearTimeout(timer);
      kill();
      resolve({ fatal: e.message || "Couldn't start Python (is the CDN blocked?)" });
    };
    w.postMessage({ harness: PY_HARNESS, code, fnName, tests: JSON.parse(JSON.stringify(tests)), normalize });
  });
}
