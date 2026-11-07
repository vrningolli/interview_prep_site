import { useEffect, useState } from "react";
import { QuizQuestion } from "../types";
import { recordMiss } from "../review/store";

/** Multi-question quiz with per-question feedback and a final verdict. */
export default function Quiz({ questions, topicKey }: { questions: QuizQuestion[]; topicKey: string }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }, [topicKey]);

  if (!questions.length) return null;

  if (finished) {
    const verdict =
      score === questions.length
        ? "Perfect — you own this topic."
        : score >= Math.ceil(questions.length / 2)
          ? "Good — reread the lesson for the one(s) you missed."
          : "Worth another pass through the lessons above before moving on.";
    return (
      <section className="quiz-section">
        <div className="quiz-header">
          <h2>🎯 Quick Check</h2>
        </div>
        <div className="trainer-summary">
          <div className="trainer-summary-score">
            {score} / {questions.length}
          </div>
          <p>{verdict}</p>
          <button
            className="btn-primary"
            onClick={() => {
              setIdx(0);
              setPicked(null);
              setScore(0);
              setFinished(false);
            }}
          >
            Retry quiz
          </button>
        </div>
      </section>
    );
  }

  const q = questions[idx];
  const answered = picked !== null;

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === q.correct) setScore((s) => s + 1);
    else recordMiss(`quiz:${topicKey}:${idx}`, "quiz", { topicKey, qIndex: idx });
  };

  return (
    <section className="quiz-section">
      <div className="quiz-header">
        <h2>🎯 Quick Check</h2>
        <span className="quiz-pill">
          {idx + 1} of {questions.length}
          {idx > 0 ? ` · score ${score}/${idx + (answered ? 1 : 0)}` : ""}
        </span>
      </div>
      <div className="quiz-question">{q.q}</div>
      <div className="quiz-options">
        {q.opts.map((o, i) => (
          <button
            key={i}
            className={`quiz-option ${answered && i === q.correct ? "correct" : ""} ${answered && i === picked && i !== q.correct ? "wrong" : ""}`}
            disabled={answered}
            onClick={() => pick(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {answered && (
        <>
          <div className={`quiz-feedback show ${picked === q.correct ? "right" : "wrong"}`}>
            {picked === q.correct ? "✓ Correct! " : "Not quite. "}
            {q.why}
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              if (idx + 1 < questions.length) {
                setIdx(idx + 1);
                setPicked(null);
              } else {
                setFinished(true);
              }
            }}
          >
            {idx + 1 < questions.length ? "Next question →" : "See result"}
          </button>
        </>
      )}
    </section>
  );
}
