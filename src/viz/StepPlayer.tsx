import { Brain, Lightbulb, Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Viz, Row } from "./frames";

const SPEEDS = [0.5, 1, 2] as const;

function CellsRow({ row }: { row: Row }) {
  const kind = row.kind ?? "row";
  return (
    <div className={`viz-line viz-${kind}`}>
      {row.title && <div className="viz-row-title">{row.title}</div>}
      <div className={`viz-cells viz-cells-${kind}`}>
        {row.cells.map((cell, i) => (
          <span key={i} className="viz-cellwrap">
            <span className={`viz-cell state-${cell.s ?? "default"}`}>{cell.v}</span>
            {cell.l ? <span className="viz-cell-label">{cell.l}</span> : null}
            {kind === "chain" && (
              <span className="viz-arrow">{i === row.cells.length - 1 ? "→ ∅" : "→"}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function StepPlayer({ viz }: { viz: Viz }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  // Predict ("Quiz me") mode
  const [quizMe, setQuizMe] = useState(false);
  const [pending, setPending] = useState<number | null>(null); // frame index gated by a question
  const [pick, setPick] = useState<number | null>(null);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [pScore, setPScore] = useState({ right: 0, total: 0 });
  const timer = useRef<number>();

  const n = viz.frames.length;
  const frame = viz.frames[Math.min(step, n - 1)];
  const hasPredicts = viz.frames.some((f) => f.predict);

  // Reset when the visualization changes (topic switch).
  useEffect(() => {
    setStep(0);
    setPlaying(false);
    setPending(null);
    setPick(null);
    setAnswered(new Set());
    setPScore({ right: 0, total: 0 });
  }, [viz]);

  /** Advance to the next frame — but in Quiz-me mode, gate on its predict question. */
  const advance = () => {
    const next = Math.min(step + 1, n - 1);
    if (next === step) return;
    const p = viz.frames[next].predict;
    if (quizMe && p && !answered.has(next)) {
      setPending(next);
      setPick(null);
      setPlaying(false);
      return;
    }
    setStep(next);
  };

  useEffect(() => {
    if (!playing || pending !== null) return;
    timer.current = window.setTimeout(() => {
      if (step + 1 >= n) {
        setPlaying(false);
        return;
      }
      advance();
    }, 2200 / speed);
    return () => window.clearTimeout(timer.current);
  });

  const answerPredict = (i: number) => {
    if (pending === null || pick !== null) return;
    const p = viz.frames[pending].predict!;
    setPick(i);
    setAnswered((prev) => new Set(prev).add(pending));
    setPScore((s) => ({ right: s.right + (i === p.correct ? 1 : 0), total: s.total + 1 }));
  };

  const continueAfterPredict = () => {
    if (pending === null) return;
    setStep(pending);
    setPending(null);
    setPick(null);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      if (pending === null) advance();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      if (pending === null) setStep((s) => Math.max(s - 1, 0));
    } else if (e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (pending === null) setPlaying((p) => !p);
    }
  };

  const predict = pending !== null ? viz.frames[pending].predict! : null;

  return (
    <div className="viz" tabIndex={0} onKeyDown={onKey} aria-label={`${viz.title} step player`}>
      <div className="viz-head">
        <h4>{viz.title}</h4>
        <span className="viz-progress">
          {pScore.total > 0 && (
            <span className="viz-predict-score"><Brain size={14} /> {pScore.right}/{pScore.total} predicted · </span>
          )}
          Step {step + 1} / {n}
        </span>
      </div>
      <p className="viz-intro">{viz.intro}</p>

      {predict ? (
        <div className="viz-predict">
          <div className="viz-predict-q"><Brain size={15} /> Predict: {predict.q}</div>
          <div className="quiz-options">
            {predict.opts.map((o, i) => (
              <button
                key={i}
                className={`quiz-option ${pick !== null && i === predict.correct ? "correct" : ""} ${pick !== null && i === pick && i !== predict.correct ? "wrong" : ""}`}
                disabled={pick !== null}
                onClick={() => answerPredict(i)}
              >
                {o}
              </button>
            ))}
          </div>
          {pick !== null && (
            <div className="viz-predict-after">
              <span className={pick === predict.correct ? "viz-predict-right" : "viz-predict-wrong"}>
                {pick === predict.correct ? "✓ Exactly right!" : `Not quite — it's “${predict.opts[predict.correct]}”.`}
              </span>
              <button className="btn-primary" onClick={continueAfterPredict}>
                See it happen →
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="viz-stage">
            {frame.rows.map((r, i) => (
              <CellsRow key={i} row={r} />
            ))}
            {frame.vars && (
              <div className="viz-vars">
                {Object.entries(frame.vars).map(([k, v]) => (
                  <span key={k} className="viz-var">
                    <b>{k}</b> = {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="viz-caption">{frame.caption}</div>
          {frame.note && <div className="viz-note"><Lightbulb size={15} /> {frame.note}</div>}
        </>
      )}

      <div className="viz-controls">
        <button onClick={() => { setPending(null); setPick(null); setStep(0); }} disabled={step === 0 && pending === null} aria-label="Restart">
          <SkipBack size={15} />
        </button>
        <button
          onClick={() => { setPending(null); setPick(null); setStep((s) => Math.max(s - 1, 0)); }}
          disabled={step === 0 && pending === null}
          aria-label="Previous step"
        >
          ‹
        </button>
        <button
          className="viz-play"
          onClick={() => setPlaying((p) => !p)}
          disabled={pending !== null}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (<><Pause size={15} /> Pause</>) : step >= n - 1 ? (<><RotateCcw size={15} /> Replay</>) : (<><Play size={15} /> Play</>)}
        </button>
        <button onClick={advance} disabled={step >= n - 1 || pending !== null} aria-label="Next step">
          ›
        </button>
        <input
          className="viz-scrub"
          type="range"
          min={0}
          max={n - 1}
          value={pending ?? step}
          onChange={(e) => {
            setPlaying(false);
            setPending(null);
            setPick(null);
            setStep(parseInt(e.target.value));
          }}
          aria-label="Scrub through steps"
        />
        <div className="viz-speeds">
          {SPEEDS.map((s) => (
            <button key={s} className={speed === s ? "active" : ""} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
        {hasPredicts && (
          <button
            className={`viz-quizme ${quizMe ? "active" : ""}`}
            onClick={() => setQuizMe((q) => !q)}
            title="Pause before key steps and ask you to predict what happens next"
          >
            <Brain size={14} /> Quiz me
          </button>
        )}
      </div>

      <pre className="viz-code">
        {viz.code.map((lineText, i) => (
          <div key={i} className={`viz-code-line ${frame.line === i && pending === null ? "hl" : ""}`}>
            {lineText || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
