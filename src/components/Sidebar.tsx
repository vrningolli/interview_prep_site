import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Workflow,
  Crosshair,
  RotateCcw,
  Compass,
  FileText,
  Building2,
  Sparkles,
  ArrowUpRight,
  Search,
  GraduationCap,
  X,
  Check,
  Network,
  Mic,
  Sun,
} from "lucide-react";
import { Tab, Topic } from "../types";
import { useReviewItems, dueNow } from "../review/store";

const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
  { key: "today", label: "Today", Icon: Sun },
  { key: "ds", label: "Data Structures", Icon: Boxes },
  { key: "algo", label: "Algorithms", Icon: Workflow },
  { key: "sd", label: "System Design", Icon: Network },
  { key: "trainer", label: "Pattern Trainer", Icon: Crosshair },
  { key: "mock", label: "Mock Interview", Icon: Mic },
  { key: "review", label: "Review", Icon: RotateCcw },
  { key: "kit", label: "Interview Kit", Icon: Compass },
  { key: "cheatsheet", label: "Cheat Sheet", Icon: FileText },
  { key: "prep", label: "Company Prep", Icon: Building2 },
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
        <div className="brand-mark">
          <GraduationCap size={20} strokeWidth={2} />
        </div>
        <div className="brand-text">
          <div className="brand-title">Prep Coach</div>
          <div className="brand-sub">Interactive Interview Prep</div>
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon">
          <Search size={15} />
        </span>
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
            <t.Icon size={17} strokeWidth={1.9} /> {t.label}
            {t.key === "mock" && <span className="new-badge">AI</span>}
            {t.key === "review" && reviewDue > 0 && <span className="due-badge">{reviewDue}</span>}
          </button>
        ))}
        {/* Separate app, deployed alongside this one at /ai-lab/ (see scripts/build-ai-lab.mjs). */}
        <a className="cat-btn cat-link" href="ai-lab/">
          <Sparkles size={17} strokeWidth={1.9} /> AI Lab
          <span className="cat-link-arrow">
            <ArrowUpRight size={15} />
          </span>
        </a>
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
                {t.title}
                {learnedSet.has(`${t.cat}:${t.key}`) && (
                  <span className="topic-check">
                    <Check size={14} strokeWidth={2.5} />
                  </span>
                )}
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
