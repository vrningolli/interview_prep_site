/* The problem log. Confidence drives when a problem comes back:
   1 → 2 days, 2 → 4, 3 → 1 week, 4 → 2 weeks, 5 → a month. */

import { useMemo, useState } from "react";
import { WeakItem, daysToReview, isDue, nextReviewISO, todayISO } from "../../prep/store";

const PATTERNS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Top-K",
  "Backtracking",
  "Graphs",
  "Union-Find",
  "1-D DP",
  "2-D DP",
  "Greedy",
  "Intervals",
  "Math & Bits",
];

const CONFIDENCE_LABEL: Record<number, string> = {
  1: "No idea",
  2: "Needed the solution",
  3: "Got there slowly",
  4: "Solid",
  5: "Could teach it",
};

export default function WeakLog({
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: WeakItem[];
  onAdd: (i: Omit<WeakItem, "id">) => void;
  onUpdate: (id: string, patch: Partial<WeakItem>) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [confidence, setConfidence] = useState(2);
  const [showAll, setShowAll] = useState(false);

  const { due, later } = useMemo(() => {
    const sorted = [...items].sort((a, b) => daysToReview(a) - daysToReview(b));
    return { due: sorted.filter(isDue), later: sorted.filter((i) => !isDue(i)) };
  }, [items]);

  const weakPatterns = useMemo(() => {
    const tally = new Map<string, number>();
    items.filter((i) => i.confidence <= 2).forEach((i) => tally.set(i.pattern, (tally.get(i.pattern) ?? 0) + 1));
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [items]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), url: url.trim(), pattern, confidence, lastAttempt: todayISO() });
    setName("");
    setUrl("");
  };

  return (
    <div className="weak-log">
      <section className="log-form card-lite">
        <div className="setup-label">Log a problem you just attempted</div>
        <div className="log-row">
          <input
            className="field"
            placeholder="Problem name — e.g. Word Ladder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <input className="field" placeholder="Link (optional)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="log-row">
          <select className="field" value={pattern} onChange={(e) => setPattern(e.target.value)}>
            {PATTERNS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <div className="conf-picker">
            {[1, 2, 3, 4, 5].map((c) => (
              <button
                key={c}
                className={`conf ${confidence === c ? "on" : ""} c${c}`}
                onClick={() => setConfidence(c)}
                title={CONFIDENCE_LABEL[c]}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={submit}>
            Log it
          </button>
        </div>
        <p className="setup-note">{CONFIDENCE_LABEL[confidence]} → comes back in {intervalFor(confidence)}.</p>
      </section>

      {weakPatterns.length > 0 && (
        <div className="callout warn">
          <strong>Your weakest patterns right now:</strong>{" "}
          {weakPatterns.map(([p, n]) => `${p} (${n})`).join(" · ")}. Spend the next session here, not on whatever is
          next in the plan.
        </div>
      )}

      <section className="log-section">
        <h3>
          Due now <span className="count-badge">{due.length}</span>
        </h3>
        {due.length === 0 && <p className="empty">Nothing due. Log what you attempt and this fills itself.</p>}
        <LogTable items={due} onUpdate={onUpdate} onRemove={onRemove} overdue />
      </section>

      {later.length > 0 && (
        <section className="log-section">
          <h3>
            Scheduled <span className="count-badge">{later.length}</span>
            <button className="linky" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "hide" : "show"}
            </button>
          </h3>
          {showAll && <LogTable items={later} onUpdate={onUpdate} onRemove={onRemove} />}
        </section>
      )}
    </div>
  );
}

function LogTable({
  items,
  onUpdate,
  onRemove,
  overdue,
}: {
  items: WeakItem[];
  onUpdate: (id: string, patch: Partial<WeakItem>) => void;
  onRemove: (id: string) => void;
  overdue?: boolean;
}) {
  if (!items.length) return null;
  return (
    <ul className="log-list">
      {items.map((i) => {
        const d = daysToReview(i);
        return (
          <li key={i.id} className={`log-item ${overdue && d < 0 ? "late" : ""}`}>
            <div className="log-main">
              <div className="log-name">
                {i.url ? (
                  <a href={i.url} target="_blank" rel="noopener noreferrer">
                    {i.name}
                  </a>
                ) : (
                  i.name
                )}
              </div>
              <div className="log-meta">
                <span className="tag">{i.pattern}</span>
                <span className={`tag conf-tag c${i.confidence}`}>{CONFIDENCE_LABEL[i.confidence]}</span>
                <span className="log-when">
                  {d < 0 ? `${-d} days overdue` : d === 0 ? "due today" : `in ${d} days`} · {nextReviewISO(i)}
                </span>
              </div>
            </div>
            <div className="log-actions">
              <div className="conf-picker sm">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button
                    key={c}
                    className={`conf ${i.confidence === c ? "on" : ""} c${c}`}
                    title={`Redone today — ${CONFIDENCE_LABEL[c]}`}
                    onClick={() => onUpdate(i.id, { confidence: c, lastAttempt: todayISO() })}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button className="linky danger" onClick={() => onRemove(i.id)}>
                remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function intervalFor(c: number): string {
  return { 1: "2 days", 2: "4 days", 3: "1 week", 4: "2 weeks", 5: "1 month" }[c] ?? "1 week";
}
