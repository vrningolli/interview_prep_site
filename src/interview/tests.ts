/* Runs the candidate's code against a problem's hidden tests in the same sandboxed
   Web Worker Prep Coach's Code Lab uses (infinite loops are cut off after 4 s). */
import { runTests } from "../lab/runner";
import { CODING_PROBLEMS, RunSummary } from "./prompts";

const clip = (s: string, n = 90) => (s.length > n ? s.slice(0, n) + "…" : s);

export async function runInterviewTests(problemKey: string, code: string): Promise<RunSummary> {
  const p = CODING_PROBLEMS.find((x) => x.key === problemKey);
  if (!p) return { passed: 0, total: 0, fatal: "unknown problem", failing: [], code };
  const total = p.tests.length;
  const out = await runTests(code + "\n" + (p.harness ?? ""), p.fnName, p.tests, p.normalize);
  if (out.timeout) return { passed: 0, total, fatal: "timed out after 4 seconds (infinite loop?)", failing: [], code };
  if (out.fatal || !out.results) return { passed: 0, total, fatal: out.fatal ?? "no results", failing: [], code };

  const label = p.harness ? "LRUCache ops" : p.fnName;
  const failing = out.results
    .map((r, i) => {
      if (r.pass) return null;
      const args = clip(p.tests[i].args.map((a) => JSON.stringify(a)).join(", "));
      const got = r.error ? `threw "${clip(r.error, 60)}"` : `got ${clip(r.got ?? "undefined", 60)}`;
      return `${label}(${args}) expected ${clip(r.expected ?? "", 60)}, ${got}`;
    })
    .filter((x): x is string => !!x);
  return {
    passed: out.results.filter((r) => r.pass).length,
    total,
    failing: failing.slice(0, 3),
    code,
  };
}
