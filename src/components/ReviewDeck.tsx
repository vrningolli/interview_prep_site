import { useState } from "react";
import { Content, QuizQuestion } from "../types";
import {
  ReviewItem,
  useReviewItems,
  dueNow,
  gradeItem,
  removeItem,
  formatDueIn,
  STAGES_DAYS,
} from "../review/store";

/* Resolve a review item back to a presentable question/problem from content. */
function resolve(item: ReviewItem, content: Content) {
  if (item.type === "quiz") {
    const topic = content.topics.find((t) => t.key === item.payload.topicKey);
    const q = topic?.quiz[item.payload.qIndex ?? -1];
    return q ? { kind: "mcq" as const, q, source: `${topic!.emoji} ${topic!.title} quiz` } : null;
  }
  if (item.type === "drill") {
    const d = content.drills[item.payload.index ?? -1];
    return d
      ? {
          kind: "mcq" as const,
          q: { q: d.q, opts: d.opts, correct: d.correct, why: `Signal: ${d.signal} — ${d.why}` } as QuizQuestion,
          source: "🎯 Pattern Trainer",
        }
      : null;
  }
  const topic = content.topics.find((t) => t.key === item.payload.topicKey);
  const prob = topic
    ? Object.values(topic.problems)
        .flat()
        .find((p) => p.title === item.payload.title)
    : null;
  return prob
    ? { kind: "problem" as const, prob, source: `${topic!.emoji} ${topic!.title} · ${item.payload.level}` }
    : null;
}

function McqCard({
  q,
  source,
  onGrade,
}: {
  q: QuizQuestion;
  source: string;
  onGrade: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div className="review-card">
      <div className="review-source">{source}</div>
      <div className="quiz-question">{q.q}</div>
      <div className="quiz-options">
        {q.opts.map((o, i) => (
          <button
            key={i}
            className={`quiz-option ${answered && i === q.correct ? "correct" : ""} ${answered && i === picked && i !== q.correct ? "wrong" : ""}`}
            disabled={answered}
            onClick={() => setPicked(i)}
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
          <button className="btn-primary" onClick={() => onGrade(picked === q.correct)}>
            Continue →
          </button>
        </>
      )}
    </div>
  );
}

export default function ReviewDeck({ content }: { content: Content }) {
  const items = useReviewItems();
  // Freeze "now" per grading action, not per second, to keep renders stable.
  const [now, setNow] = useState(() => Date.now());
  const due = dueNow(items, now);
  const upcoming = items.filter((i) => i.due > now).sort((a, b) => a.due - b.due);

  const current = due[0];
  const resolved = current ? resolve(current, content) : null;

  // Item points at content that no longer exists — drop it silently.
  if (current && !resolved) {
    removeItem(current.id);
    return null;
  }

  const grade = (ok: boolean) => {
    gradeItem(current!.id, ok);
    setNow(Date.now());
  };

  return (
    <div className="topic-card">
      <h2>🔁 Review</h2>
      <div className="plain-english">
        <strong>Spaced repetition — beat the forgetting curve</strong>
        Everything you miss (quiz questions, trainer drills) or peek at (problem solutions) lands here. Answer it right
        and it comes back in {STAGES_DAYS.join(" → ")} days, then graduates. Miss it and it returns in 10 minutes. Five
        minutes of review a day beats an hour of cramming.
      </div>

      {due.length > 0 && (
        <div className="trainer-status">
          <span className="trainer-chip trainer-score">{due.length} due now</span>
          <span className="trainer-chip">{upcoming.length} scheduled</span>
        </div>
      )}

      {current && resolved ? (
        resolved.kind === "mcq" ? (
          <McqCard key={current.id + current.due} q={resolved.q} source={resolved.source} onGrade={grade} />
        ) : (
          <div className="review-card">
            <div className="review-source">{resolved.source}</div>
            <div className="quiz-question">{resolved.prob.title}</div>
            <p className="problem-body">{resolved.prob.body}</p>
            <div className="problem-hint">💡 {resolved.prob.hint}</div>
            <p className="review-ask">
              You previously needed the solution for this one. Solve it again now — on paper or in your head — then
              grade yourself honestly:
            </p>
            <div className="review-grade-row">
              <button className="btn-primary" onClick={() => grade(true)}>
                ✓ Solved it cold
              </button>
              <button className="btn-ghost" onClick={() => grade(false)}>
                Still shaky — show me again soon
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="trainer-summary">
          <div className="trainer-summary-score">✅</div>
          <p>
            {items.length === 0
              ? "Nothing to review yet. Miss a quiz question or peek at a solution, and it will show up here automatically."
              : "All caught up! Come back when the next items are due."}
          </p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="review-upcoming">
          <h3>📅 Coming up</h3>
          <ul>
            {upcoming.slice(0, 8).map((i) => {
              const r = resolve(i, content);
              return (
                <li key={i.id}>
                  <span className="review-upcoming-title">
                    {r ? (r.kind === "mcq" ? r.q.q : r.prob.title) : i.id}
                  </span>
                  <span className="review-upcoming-due">{formatDueIn(i.due, now)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
