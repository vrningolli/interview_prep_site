import { useMemo, useState } from "react";
import { Drill } from "../types";
import { useLocalStorage } from "../state";
import { recordMiss } from "../review/store";

function shuffled(n: number): number[] {
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function PatternTrainer({ drills }: { drills: Drill[] }) {
  const [round, setRound] = useState(0); // bump to reshuffle
  const order = useMemo(() => shuffled(drills.length), [drills.length, round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useLocalStorage("dscoach-trainer-best", 0);

  const finished = idx >= order.length;
  const d = finished ? null : drills[order[idx]];
  const answered = picked !== null;

  const restart = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setPicked(null);
    setScore(0);
  };

  if (finished) {
    if (score > best) setBest(score);
    const pct = Math.round((score / order.length) * 100);
    const verdict =
      pct >= 90
        ? "Interview-ready pattern recognition. Keep it warm with a round every few days."
        : pct >= 70
          ? "Solid — review the patterns you missed on their topic pages, then run another round."
          : "Pattern recognition needs reps. Revisit the Algorithms tab, then retry — this skill improves fast.";
    return (
      <div className="topic-card">
        <h2>🎯 Pattern Trainer</h2>
        <div className="trainer-summary">
          <div className="trainer-summary-score">
            {score} / {order.length}
          </div>
          <p>{verdict}</p>
          {score > best && <p className="trainer-newbest">🎉 New best run!</p>}
          <button className="btn-primary" onClick={restart}>
            Run another round (reshuffled)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-card">
      <h2>🎯 Pattern Trainer</h2>
      <div className="plain-english">
        <strong>The real interview skill</strong>
        Interviews are won in the first 2 minutes — when you read the problem and recognize <em>which technique fits</em>.
        Don't solve it — just name the pattern. The feedback teaches you the <em>signal words</em> that give each pattern
        away.
      </div>
      <div className="trainer-status">
        <span className="trainer-chip">
          Question {idx + 1} / {order.length}
        </span>
        <span className="trainer-chip trainer-score">Score: {score}</span>
        <span className="trainer-chip">
          Best run: {best} / {drills.length}
        </span>
      </div>

      <div className="quiz-question">{d!.q}</div>
      <div className="quiz-options">
        {d!.opts.map((o, i) => (
          <button
            key={i}
            className={`quiz-option ${answered && i === d!.correct ? "correct" : ""} ${answered && i === picked && i !== d!.correct ? "wrong" : ""}`}
            disabled={answered}
            onClick={() => {
              if (answered) return;
              setPicked(i);
              if (i === d!.correct) setScore((s) => s + 1);
              else recordMiss(`drill:${order[idx]}`, "drill", { index: order[idx] });
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <div className={`quiz-feedback show ${picked === d!.correct ? "right" : "wrong"}`}>
            <b>Signal words:</b> {d!.signal}
            <br />
            {d!.why}
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setIdx(idx + 1);
              setPicked(null);
            }}
          >
            Next problem →
          </button>
        </>
      )}
    </div>
  );
}
