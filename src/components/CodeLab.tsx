import { Code, Lightbulb, OctagonAlert, PartyPopper, Timer, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import { CHALLENGES } from "../lab/challenges";
import { runTests, RunOutcome } from "../lab/runner";
import { useLocalStorage, useStoredSet } from "../state";
import { Topic } from "../types";

function fmtArg(a: unknown): string {
  if (a && typeof a === "object" && !Array.isArray(a)) {
    const o = a as Record<string, unknown>;
    if ("__list" in o) return `list ${JSON.stringify(o.__list)}`;
    if ("__tree" in o) return `tree ${JSON.stringify(o.__tree)}`;
  }
  return JSON.stringify(a);
}

/* Mount with key={topic.key} so per-challenge state resets on topic switch. */
export default function CodeLab({ topic }: { topic: Topic }) {
  const challenge = CHALLENGES[topic.key];
  if (!challenge) return null;
  return <CodeLabInner challengeKey={topic.key} />;
}

function CodeLabInner({ challengeKey }: { challengeKey: string }) {
  const challenge = CHALLENGES[challengeKey];
  const [code, setCode] = useLocalStorage(`dscoach-code-${challenge.id}`, challenge.starter);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { set: solvedLabs, toggle: toggleSolvedLab } = useStoredSet("dscoach-lab-solved");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const solved = solvedLabs.has(challenge.id);

  const run = async () => {
    setRunning(true);
    setOutcome(null);
    const result = await runTests(code, challenge.fnName, challenge.tests, challenge.normalize);
    setRunning(false);
    setOutcome(result);
    const allPass = !!result.results && result.results.every((r) => r.pass);
    if (allPass && !solved) toggleSolvedLab(challenge.id);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current!;
      const { selectionStart: s, selectionEnd: end } = ta;
      setCode(code.slice(0, s) + "  " + code.slice(end));
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
    // Keep global shortcuts (d, /) out of the editor.
    e.stopPropagation();
  };

  const allPass = !!outcome?.results && outcome.results.every((r) => r.pass);

  return (
    <section>
      <h3>
        <Code size={18} /> Code it yourself
        {solved && <span className="lab-solved-chip"><Trophy size={13} /> solved</span>}
      </h3>
      <div className="codelab">
        <div className="codelab-head">
          <h4>{challenge.title}</h4>
          <button
            className="btn-ghost codelab-reset"
            onClick={() => {
              setCode(challenge.starter);
              setOutcome(null);
            }}
          >
            ↺ Reset code
          </button>
        </div>
        <p className="codelab-prompt">{challenge.prompt}</p>

        <textarea
          ref={taRef}
          className="codelab-editor"
          value={code}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          rows={Math.max(10, code.split("\n").length + 2)}
          aria-label="Code editor"
        />

        <div className="codelab-actions">
          <button className="btn-primary codelab-run" onClick={run} disabled={running}>
            {running ? "Running…" : "▶ Run tests"}
          </button>
          {!showHint && (
            <button className="btn-ghost" onClick={() => setShowHint(true)}>
              <Lightbulb size={14} /> Hint
            </button>
          )}
        </div>
        {showHint && <div className="problem-hint"><Lightbulb size={15} /> {challenge.hint}</div>}

        {outcome?.timeout && (
          <div className="codelab-fatal"><Timer size={15} /> Timed out after 4s — infinite loop? Check your loop/recursion exit condition.</div>
        )}
        {outcome?.fatal && <div className="codelab-fatal"><OctagonAlert size={15} /> {outcome.fatal}</div>}
        {outcome?.results && (
          <div className="codelab-results">
            {allPass && (
              <div className="codelab-pass-banner">
                <PartyPopper size={16} /> All {outcome.results.length} tests pass — you implemented it!
              </div>
            )}
            {outcome.results.map((r, i) => (
              <div key={i} className={`codelab-test ${r.pass ? "pass" : "fail"}`}>
                <span className="codelab-test-icon">{r.pass ? "✓" : "✗"}</span>
                <code className="codelab-test-args">
                  {challenge.fnName}({challenge.tests[i].args.map(fmtArg).join(", ")})
                </code>
                {!r.pass && (
                  <span className="codelab-test-detail">
                    {r.error ? `threw: ${r.error}` : `got ${r.got}, expected ${r.expected}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
