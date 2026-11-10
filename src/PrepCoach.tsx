import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import rawContent from "./data/content.json";
import { Content, Tab, Topic } from "./types";
import { useStoredSet } from "./state";
import Sidebar from "./components/Sidebar";
import TopicPage from "./components/TopicPage";
import PatternTrainer from "./components/PatternTrainer";
import ReviewDeck from "./components/ReviewDeck";
import InterviewKit from "./components/InterviewKit";
import CheatSheet from "./components/CheatSheet";
import CompanyPrep from "./components/CompanyPrep";
import SystemDesign from "./components/SystemDesign";
import MockInterview, { MockPreset } from "./components/MockInterview";
import { track } from "./analytics";

const content = rawContent as unknown as Content;

const TAB_NAMES: Record<Tab, string> = {
  ds: "Data Structures",
  algo: "Algorithms",
  sd: "System Design",
  trainer: "Pattern Trainer",
  mock: "Mock Interview",
  review: "Review",
  kit: "Interview Kit",
  cheatsheet: "Cheat Sheet",
  prep: "Company Prep",
};

/** The Prep Coach study app (sidebar + topics + tools), shown at #prep. */
/** Deep links like #prep/mock or #prep/sd open a tab directly (used by the landing page). */
const tabFromHash = (): Tab => {
  const t = location.hash.split("/")[1] as Tab | undefined;
  return t && t in TAB_NAMES ? t : "ds";
};

export default function PrepCoach() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [mockPreset, setMockPreset] = useState<MockPreset | null>(null);
  const [sdOpen, setSdOpen] = useState<string | null>(null);
  const [topicKey, setTopicKey] = useState("array");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { set: learnedSet, toggle: toggleLearned } = useStoredSet("dscoach-done");
  const { set: solvedSet, toggle: toggleSolved } = useStoredSet("dscoach-solved");
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Prep Coach is light-only.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    track("tab_view", tab);
  }, [tab]);

  const clearPreset = useCallback(() => setMockPreset(null), []);

  const topic: Topic | undefined = content.topics.find((t) => t.key === topicKey);

  const navTopics = useMemo(
    () => (tab === "ds" || tab === "algo" ? content.topics.filter((t) => t.cat === tab) : []),
    [tab]
  );

  const selectTab = (t: Tab) => {
    setTab(t);
    setSdOpen(null);
    setDrawerOpen(false);
    if (t === "ds" || t === "algo") {
      const first = content.topics.find((x) => x.cat === t);
      if (first && (!topic || topic.cat !== t)) setTopicKey(first.key);
    }
    mainRef.current?.scrollTo({ top: 0 });
  };

  const selectTopic = (key: string) => {
    setTopicKey(key);
    setDrawerOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };

  /** Jump straight from a plan task into the lesson for that topic. */
  const openTopic = (cat: "ds" | "algo", key: string) => {
    setTab(cat);
    setTopicKey(key);
    setDrawerOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  };

  /** System Design → "Mock interview this": jump to the mock tab with that design preselected. */
  const mockDesign = (designKey: string) => {
    track("mock_from_design", designKey);
    setMockPreset({ mode: "sd", problemKey: designKey });
    setTab("mock");
    mainRef.current?.scrollTo({ top: 0 });
  };

  /** Mock report → study links. */
  const studyTopic = (key: string) => {
    const t = content.topics.find((x) => x.key === key);
    if (t) openTopic(t.cat, t.key);
  };
  const openDesign = (key: string) => {
    setSdOpen(key);
    setTab("sd");
    mainRef.current?.scrollTo({ top: 0 });
  };

  const move = (dir: 1 | -1) => {
    if (!navTopics.length || !topic) return;
    const idx = navTopics.findIndex((t) => t.key === topic.key);
    const next = navTopics[(idx + dir + navTopics.length) % navTopics.length];
    selectTopic(next.key);
  };

  // Global shortcuts: Alt+←/→ topics, / search.
  // (Plain arrows belong to the focused StepPlayer.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.defaultPrevented) return;
      if (e.altKey && e.key === "ArrowRight") move(1);
      else if (e.altKey && e.key === "ArrowLeft") move(-1);
      else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="app-shell">
      <Sidebar
        topics={content.topics}
        tab={tab}
        topicKey={topicKey}
        search={search}
        learnedSet={learnedSet}
        open={drawerOpen}
        onTab={selectTab}
        onTopic={selectTopic}
        onSearch={setSearch}
        onClose={() => setDrawerOpen(false)}
        searchRef={searchRef}
      />

      <div className="main" ref={mainRef}>
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-center">
            <span className="crumb-cat">{TAB_NAMES[tab]}</span>
            {(tab === "ds" || tab === "algo") && topic && (
              <>
                <span className="crumb-sep">›</span>
                <span className="crumb-topic">
                  {topic.title}
                </span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            {(tab === "ds" || tab === "algo") && (
              <>
                <button className="icon-btn" onClick={() => move(-1)} title="Previous topic (Alt+←)" aria-label="Previous topic">
                  <ChevronLeft size={17} />
                </button>
                <button className="icon-btn" onClick={() => move(1)} title="Next topic (Alt+→)" aria-label="Next topic">
                  <ChevronRight size={17} />
                </button>
              </>
            )}
          </div>
        </header>

        <main className={`content ${tab === "prep" || tab === "mock" ? "wide" : ""}`}>
          {(tab === "ds" || tab === "algo") && topic && (
            <TopicPage
              topic={topic}
              learned={learnedSet.has(`${topic.cat}:${topic.key}`)}
              onToggleLearned={() => toggleLearned(`${topic.cat}:${topic.key}`)}
              solvedSet={solvedSet}
              onToggleSolved={toggleSolved}
            />
          )}
          {tab === "trainer" && <PatternTrainer drills={content.drills} />}
          {tab === "review" && <ReviewDeck content={content} />}
          {tab === "kit" && <InterviewKit />}
          {tab === "cheatsheet" && <CheatSheet topics={content.topics} />}
          {tab === "prep" && <CompanyPrep onOpenTopic={openTopic} />}
          {tab === "sd" && <SystemDesign key={sdOpen ?? "sd"} initialDesign={sdOpen} onMock={mockDesign} />}
          {tab === "mock" && (
            <MockInterview
              preset={mockPreset}
              onPresetUsed={clearPreset}
              onStudyTopic={studyTopic}
              onOpenDesign={openDesign}
            />
          )}
        </main>

        <footer className="footer">
          <p>Built for learning — click around, nothing is scary, everything is reversible.</p>
          <p className="footer-shortcut">
            <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> switch topics · <kbd>/</kbd> search ·
            click a visualizer, then <kbd>←</kbd>/<kbd>→</kbd>/<kbd>space</kbd> to step &amp; play
          </p>
        </footer>
      </div>

      {drawerOpen && <div className="scrim show" onClick={() => setDrawerOpen(false)} />}
    </div>
  );
}
