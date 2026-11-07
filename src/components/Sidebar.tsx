import { Tab, Topic } from "../types";
import { useReviewItems, dueNow } from "../review/store";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "ds", label: "Data Structures", emoji: "📦" },
  { key: "algo", label: "Algorithms", emoji: "⚡" },
  { key: "trainer", label: "Pattern Trainer", emoji: "🎯" },
  { key: "review", label: "Review", emoji: "🔁" },
  { key: "kit", label: "Interview Kit", emoji: "🧭" },
  { key: "cheatsheet", label: "Cheat Sheet", emoji: "📋" },
  { key: "prep", label: "Company Prep", emoji: "🎯" },
];

export default function Sidebar({
  topics,
  tab,
  topicKey,
  search,
  learnedSet,
  open,
  onTab,
  onTopic,
  onSearch,
  onClose,
  searchRef,
}: {
  topics: Topic[];
  tab: Tab;
  topicKey: string;
  search: string;
  learnedSet: Set<string>;
  open: boolean;
  onTab: (t: Tab) => void;
  onTopic: (key: string) => void;
  onSearch: (q: string) => void;
  onClose: () => void;
  searchRef: React.RefObject<HTMLInputElement>;
}) {
  const total = topics.length;
  const learned = topics.filter((t) => learnedSet.has(`${t.cat}:${t.key}`)).length;
  const reviewDue = dueNow(useReviewItems()).length;
  const listTopics =
    tab === "ds" || tab === "algo"
      ? topics.filter(
          (t) => t.cat === tab && (!search || t.title.toLowerCase().includes(search.trim().toLowerCase()))
        )
      : [];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">DS</div>
        <div className="brand-text">
          <div className="brand-title">DS Coach</div>
          <div className="brand-sub">Interactive Interview Prep</div>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
          ✕
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search topics…"
          autoComplete="off"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>

      <div className="cat-nav" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`cat-btn ${tab === t.key ? "active" : ""}`}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => onTab(t.key)}
          >
            <span>{t.emoji}</span> {t.label}
            {t.key === "review" && reviewDue > 0 && <span className="due-badge">{reviewDue}</span>}
          </button>
        ))}
      </div>

      {listTopics.length > 0 && (
        <>
          <div className="sidebar-section-label">Topics</div>
          <nav className="topic-nav" aria-label="Topics">
            {listTopics.map((t) => (
              <button
                key={t.key}
                className={`topic-btn ${t.key === topicKey ? "active" : ""}`}
                onClick={() => onTopic(t.key)}
              >
                {t.emoji} {t.title}
                {learnedSet.has(`${t.cat}:${t.key}`) && <span className="topic-check">✓</span>}
              </button>
            ))}
          </nav>
        </>
      )}

      <div className="sidebar-footer">
        <div className="progress-wrap">
          <div className="progress-row">
            <span className="progress-label">Progress</span>
            <span className="progress-text">
              {learned} / {total} topics
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${total ? (learned / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
