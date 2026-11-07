/* STAR story bank. The point is the coverage grid: it shows which of your
   target companies' rubric items still have zero stories behind them. */

import { useMemo, useState } from "react";
import { CompanyKey, COMPANIES } from "../../data/companies";
import { Story, rubricCoverage } from "../../prep/store";

const BLANK: Omit<Story, "id"> = { title: "", situation: "", action: "", result: "", tags: [] };

export default function StoryBank({
  companies,
  stories,
  onAdd,
  onUpdate,
  onRemove,
}: {
  companies: CompanyKey[];
  stories: Story[];
  onAdd: (s: Omit<Story, "id">) => void;
  onUpdate: (id: string, patch: Partial<Story>) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Omit<Story, "id"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const coverage = useMemo(() => rubricCoverage(stories, companies), [stories, companies]);
  const gaps = coverage.filter((c) => c.count === 0).length;

  const shown = filterTag ? stories.filter((s) => s.tags.includes(filterTag)) : stories;

  const startNew = (tag?: string) => {
    setEditingId(null);
    setDraft({ ...BLANK, tags: tag ? [tag] : [] });
  };

  return (
    <div className="story-bank">
      <section className="coverage">
        <div className="coverage-head">
          <h3>Rubric coverage</h3>
          <p className="guide-note">
            {stories.length} {stories.length === 1 ? "story" : "stories"} ·{" "}
            {gaps === 0 ? (
              <b className="ok">every rubric item is covered</b>
            ) : (
              <b className="gap">
                {gaps} rubric {gaps === 1 ? "item has" : "items have"} no story yet
              </b>
            )}
          </p>
        </div>

        {companies.map((k) => {
          const items = coverage.filter((c) => c.company === k);
          return (
            <div key={k} className="coverage-block">
              <div className="coverage-title">
                <span className="company-mark sm" style={{ background: COMPANIES[k].accent }}>
                  {COMPANIES[k].mark}
                </span>
                {COMPANIES[k].rubricName}
              </div>
              <div className="coverage-grid">
                {items.map((it) => {
                  const tag = `${k}:${it.id}`;
                  const level = it.count === 0 ? "none" : it.count === 1 ? "thin" : "good";
                  return (
                    <button
                      key={tag}
                      className={`cov-cell ${level} ${filterTag === tag ? "sel" : ""}`}
                      title={it.hint}
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    >
                      <span className="cov-label">{it.label}</span>
                      <span className="cov-count">{it.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filterTag && (
          <div className="filter-note">
            Showing stories tagged <b>{labelForTag(filterTag)}</b>
            <button className="linky" onClick={() => setFilterTag(null)}>
              clear
            </button>
            <button className="linky" onClick={() => startNew(filterTag)}>
              + write one for this
            </button>
          </div>
        )}
      </section>

      <div className="story-toolbar">
        <button className="btn primary" onClick={() => startNew()}>
          + New story
        </button>
        <span className="setup-note">
          Aim for ~10 stories. Amazon wants two per principle you expect to be asked.
        </span>
      </div>

      {draft && (
        <StoryForm
          value={draft}
          companies={companies}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => {
            if (draft.title.trim()) onAdd(draft);
            setDraft(null);
          }}
        />
      )}

      <div className="story-list">
        {shown.map((s) =>
          editingId === s.id ? (
            <StoryForm
              key={s.id}
              value={s}
              companies={companies}
              onChange={(v) => onUpdate(s.id, v)}
              onCancel={() => setEditingId(null)}
              onSave={() => setEditingId(null)}
            />
          ) : (
            <article key={s.id} className="story-card">
              <header>
                <h4>{s.title || "Untitled story"}</h4>
                <div className="story-actions">
                  <button className="linky" onClick={() => setEditingId(s.id)}>
                    edit
                  </button>
                  <button className="linky danger" onClick={() => onRemove(s.id)}>
                    delete
                  </button>
                </div>
              </header>
              {s.situation && (
                <p>
                  <b>S/T</b> {s.situation}
                </p>
              )}
              {s.action && (
                <p>
                  <b>A</b> {s.action}
                </p>
              )}
              {s.result && (
                <p className={hasNumber(s.result) ? "" : "no-metric"}>
                  <b>R</b> {s.result}
                  {!hasNumber(s.result) && <span className="metric-warn">no number in this result</span>}
                </p>
              )}
              <div className="story-tags">
                {s.tags.map((t) => (
                  <span key={t} className="tag tag-co" style={tagStyle(t)}>
                    {labelForTag(t)}
                  </span>
                ))}
              </div>
            </article>
          )
        )}
        {!shown.length && !draft && (
          <p className="empty">
            No stories yet. Start with the rubric items showing <b>0</b> above — those are the questions you cannot
            currently answer.
          </p>
        )}
      </div>
    </div>
  );
}

function StoryForm({
  value,
  companies,
  onChange,
  onSave,
  onCancel,
}: {
  value: Omit<Story, "id"> | Story;
  companies: CompanyKey[];
  onChange: (v: any) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const set = (patch: Partial<Story>) => onChange({ ...value, ...patch });
  const toggleTag = (tag: string) =>
    set({ tags: value.tags.includes(tag) ? value.tags.filter((t) => t !== tag) : [...value.tags, tag] });

  return (
    <div className="story-form">
      <input
        className="field"
        placeholder="Title — e.g. “Cut checkout latency 40% under a deadline”"
        value={value.title}
        onChange={(e) => set({ title: e.target.value })}
        autoFocus
      />
      <textarea
        className="field"
        rows={2}
        placeholder="Situation & Task — what was going on, and what were you on the hook for?"
        value={value.situation}
        onChange={(e) => set({ situation: e.target.value })}
      />
      <textarea
        className="field"
        rows={3}
        placeholder="Action — what YOU did. Not the team. Be specific about the decisions."
        value={value.action}
        onChange={(e) => set({ action: e.target.value })}
      />
      <textarea
        className="field"
        rows={2}
        placeholder="Result — end with a number. Latency, cost, users, revenue, hours saved."
        value={value.result}
        onChange={(e) => set({ result: e.target.value })}
      />

      <div className="tag-picker">
        {companies.map((k) => (
          <div key={k} className="tag-picker-group">
            <div className="setup-label">
              {COMPANIES[k].name} — {COMPANIES[k].rubricName}
            </div>
            <div className="tag-picker-row">
              {COMPANIES[k].rubric.map((r) => {
                const tag = `${k}:${r.id}`;
                const on = value.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    className={`pick ${on ? "on" : ""}`}
                    style={on ? { borderColor: COMPANIES[k].accent, color: COMPANIES[k].accent } : undefined}
                    onClick={() => toggleTag(tag)}
                    title={r.hint}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button className="btn primary" onClick={onSave}>
          Save story
        </button>
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function hasNumber(text: string): boolean {
  return /\d/.test(text);
}

function labelForTag(tag: string): string {
  const [co, id] = tag.split(":") as [CompanyKey, string];
  const company = COMPANIES[co];
  if (!company) return tag;
  return company.rubric.find((r) => r.id === id)?.label ?? tag;
}

function tagStyle(tag: string) {
  const co = tag.split(":")[0] as CompanyKey;
  const c = COMPANIES[co];
  return c ? { color: c.accent, borderColor: c.accent } : undefined;
}
