import { useEffect, useState } from "react";
import { Topic } from "../types";
import { getViz } from "../viz";
import StepPlayer from "../viz/StepPlayer";
import Problems from "./Problems";
import CodeLab from "./CodeLab";
import Quiz from "./Quiz";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function Lessons({ topic }: { topic: Topic }) {
  const [open, setOpen] = useState(0);
  useEffect(() => setOpen(0), [topic.key]);
  return (
    <section>
      <h3>📖 Learn it step by step</h3>
      <div className="lessons-legend">
        <span>
          <span className="lesson-level level-beginner">Beginner</span> concept &amp; basics
        </span>
        <span>
          <span className="lesson-level level-intermediate">Intermediate</span> internals
        </span>
        <span>
          <span className="lesson-level level-advanced">Advanced</span> patterns
        </span>
      </div>
      {topic.lessons.map((lesson, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`lesson ${isOpen ? "open" : ""}`}>
            <button className="lesson-header" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              <span className="lesson-num">{i + 1}</span>
              <h4>{lesson.title}</h4>
              {lesson.level && (
                <span className={`lesson-level level-${lesson.level}`}>{LEVEL_LABEL[lesson.level] ?? lesson.level}</span>
              )}
              <span className="lesson-chevron">{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && (
              <div className="lesson-content">
                <p className="lesson-body">{lesson.body}</p>
                <pre className="lesson-example">{lesson.example}</pre>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

const ENRICH_TABS = [
  { key: "patternCues", label: "🧩 Pattern cues" },
  { key: "interviewTips", label: "🎤 Interview tips" },
  { key: "realWorld", label: "🌍 Real world" },
  { key: "deepLessons", label: "🔬 Deep dives" },
] as const;

function EnrichmentPanel({ topic }: { topic: Topic }) {
  const [tab, setTab] = useState<(typeof ENRICH_TABS)[number]["key"]>("patternCues");
  useEffect(() => setTab("patternCues"), [topic.key]);
  const e = topic.enrichment;
  if (!e) return null;
  const tabs = ENRICH_TABS.filter((t) => (e[t.key]?.length ?? 0) > 0);
  if (!tabs.length) return null;
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <section>
      <h3>🚀 Go deeper</h3>
      <div className="level-tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`level-tab ${active.key === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {active.key === "deepLessons" ? (
        <div className="deep-lessons">
          {e.deepLessons!.map((d, i) => (
            <div key={i} className="lesson open">
              <div className="lesson-content">
                <h4 className="deep-title">{d.title}</h4>
                <p className="lesson-body">{d.body}</p>
                <pre className="lesson-example">{d.example}</pre>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="enrich-list">
          {(e[active.key] as string[]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TopicPage({
  topic,
  learned,
  onToggleLearned,
  solvedSet,
  onToggleSolved,
}: {
  topic: Topic;
  learned: boolean;
  onToggleLearned: () => void;
  solvedSet: Set<string>;
  onToggleSolved: (id: string) => void;
}) {
  const viz = getViz(topic.key);
  return (
    <div className="topic-card">
      <h2>
        {topic.title}
      </h2>

      <div className="plain-english">
        <strong>In plain English</strong>
        {topic.plain}
      </div>
      <div className="analogy">💡 {topic.analogy}</div>

      {viz && (
        <section>
          <h3>🎬 Watch it work — step by step</h3>
          <StepPlayer viz={viz} />
        </section>
      )}

      <Lessons topic={topic} />

      <section>
        <h3>⏱️ How fast is it?</h3>
        <table className="complexity-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Big-O</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {topic.complexity.map(([op, bigO, why], i) => (
              <tr key={i}>
                <td>{op}</td>
                <td>
                  <code>{bigO}</code>
                </td>
                <td>{why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>🧭 When to use it</h3>
        <div className="when-to-use">
          <div className="use-yes">
            <h4>✅ Good fit</h4>
            <ul>
              {topic.useYes.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="use-no">
            <h4>❌ Bad fit</h4>
            <ul>
              {topic.useNo.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3>👨‍💻 Code example</h3>
        <pre className="code-block">{topic.code}</pre>
      </section>

      <EnrichmentPanel topic={topic} />

      <CodeLab key={topic.key} topic={topic} />

      <Problems topic={topic} solvedSet={solvedSet} onToggleSolved={onToggleSolved} />

      <Quiz questions={topic.quiz} topicKey={topic.key} />

      <button className={`mark-done ${learned ? "done" : ""}`} onClick={onToggleLearned}>
        {learned ? "✓ Marked as learned" : "Mark as learned"}
      </button>
    </div>
  );
}
