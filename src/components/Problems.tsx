import { Dumbbell, Lightbulb, LockOpen } from "lucide-react";
import { useState } from "react";
import { Problem, Topic } from "../types";
import { recordMiss } from "../review/store";

const LEVELS = ["easy", "medium", "hard"] as const;
const LEVEL_META = {
  easy: { label: "Easy" },
  medium: { label: "Medium" },
  hard: { label: "Hard" },
};

function ProblemCard({
  p,
  id,
  topicKey,
  level,
  solved,
  onToggleSolved,
}: {
  p: Problem;
  id: string;
  topicKey: string;
  level: string;
  solved: boolean;
  onToggleSolved: (id: string) => void;
}) {
  // Progressive disclosure: think first, then hint, then solution.
  const [reveal, setReveal] = useState<0 | 1 | 2>(0);
  const solution = p.solution || p.example;
  return (
    <div className={`problem-card ${solved ? "solved" : ""}`}>
      <div className="problem-head">
        <h5>
          {p.title}
          {p.lc && (
            <a
              className="lc-link"
              href={`https://leetcode.com/search/?q=${encodeURIComponent(p.title)}`}
              target="_blank"
              rel="noreferrer"
              title="Search on LeetCode"
            >
              LC ↗
            </a>
          )}
        </h5>
        <label className="solved-toggle">
          <input type="checkbox" checked={solved} onChange={() => onToggleSolved(id)} />
          solved
        </label>
      </div>
      <p className="problem-body">{p.body}</p>
      {reveal === 0 && (
        <button className="btn-ghost" onClick={() => setReveal(1)}>
          <Lightbulb size={14} /> Show hint
        </button>
      )}
      {reveal >= 1 && <div className="problem-hint"><Lightbulb size={15} /> {p.hint}</div>}
      {reveal === 1 && solution && (
        <button
          className="btn-ghost"
          onClick={() => {
            setReveal(2);
            // Needing the solution = worth re-testing later via spaced review.
            recordMiss(`prob:${id}`, "problem", { topicKey, title: p.title, level });
          }}
        >
          <LockOpen size={14} /> Show solution
        </button>
      )}
      {reveal === 2 && solution && <pre className="problem-solution">{solution}</pre>}
    </div>
  );
}

export default function Problems({
  topic,
  solvedSet,
  onToggleSolved,
}: {
  topic: Topic;
  solvedSet: Set<string>;
  onToggleSolved: (id: string) => void;
}) {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("easy");
  const all = LEVELS.flatMap((lv) => topic.problems[lv].map((p) => `${topic.key}::${p.title}`));
  const solvedCount = all.filter((id) => solvedSet.has(id)).length;

  return (
    <section>
      <h3>
        <Dumbbell size={18} /> Practice problems{" "}
        <span className="prob-progress">
          {solvedCount} / {all.length} solved
        </span>
      </h3>
      <div className="level-tabs">
        {LEVELS.map((lv) => {
          const count = topic.problems[lv].length;
          const done = topic.problems[lv].filter((p) => solvedSet.has(`${topic.key}::${p.title}`)).length;
          return (
            <button key={lv} className={`level-tab ${level === lv ? "active" : ""}`} onClick={() => setLevel(lv)}>
              <span className={`lvl-dot lvl-${lv}`} /> {LEVEL_META[lv].label} ({done}/{count})
            </button>
          );
        })}
      </div>
      <div className="problem-list">
        {topic.problems[level].map((p) => {
          const id = `${topic.key}::${p.title}`;
          return (
            <ProblemCard
              key={id}
              p={p}
              id={id}
              topicKey={topic.key}
              level={level}
              solved={solvedSet.has(id)}
              onToggleSolved={onToggleSolved}
            />
          );
        })}
      </div>
    </section>
  );
}
