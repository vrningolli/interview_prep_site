/* Company Prep — the multi-company interview roadmap.
   Container: owns persisted state, regenerates the plan, and switches views. */

import { useMemo, useRef, useState } from "react";
import { COMPANIES, PILLARS, PillarKey } from "../data/companies";
import { buildPlan, currentWeek, daysUntil } from "../prep/planner";
import { isDue, usePrepState } from "../prep/store";
import Ring from "./prep/Ring";
import PlanSetup from "./prep/PlanSetup";
import PlanBoard from "./prep/PlanBoard";
import CompanyGuide from "./prep/CompanyGuide";
import ResourceLibrary from "./prep/ResourceLibrary";
import StoryBank from "./prep/StoryBank";
import WeakLog from "./prep/WeakLog";

type View = "plan" | "companies" | "resources" | "stories" | "log";

const VIEWS: { key: View; label: string; emoji: string }[] = [
  { key: "plan", label: "Plan", emoji: "🗺️" },
  { key: "companies", label: "Companies", emoji: "🏢" },
  { key: "resources", label: "Resources", emoji: "🔗" },
  { key: "stories", label: "Story bank", emoji: "💬" },
  { key: "log", label: "Problem log", emoji: "📓" },
];

export default function CompanyPrep({ onOpenTopic }: { onOpenTopic: (cat: "ds" | "algo", key: string) => void }) {
  const store = usePrepState();
  const { state } = store;
  const [view, setView] = useState<View>("plan");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const plan = useMemo(() => buildPlan(state.config), [state.config]);

  const stats = useMemo(() => {
    const ids = plan.weeks.flatMap((w) => w.tasks.map((t) => ({ id: t.id, pillar: t.pillar })));
    const done = ids.filter((t) => state.done[t.id]);
    const byPillar = (p: PillarKey) => {
      const all = ids.filter((t) => t.pillar === p);
      const d = all.filter((t) => state.done[t.id]);
      return { total: all.length, done: d.length, pct: all.length ? (d.length / all.length) * 100 : 0 };
    };
    return {
      total: ids.length,
      done: done.length,
      pct: ids.length ? (done.length / ids.length) * 100 : 0,
      // A pillar with no tasks would otherwise sit at a misleading 0%.
      pillars: (Object.keys(PILLARS) as PillarKey[]).map((p) => ({ p, ...byPillar(p) })).filter((x) => x.total > 0),
    };
  }, [plan, state.done]);

  const left = daysUntil(state.config.targetDate);
  const week = currentWeek(plan);
  const dueCount = state.weak.filter(isDue).length;

  const onImport = async (file?: File) => {
    if (!file) return;
    const err = await store.importJSON(file);
    setNotice(err || "Progress imported.");
    setTimeout(() => setNotice(""), 4000);
  };

  return (
    <div className="prep">
      <section className="prep-hero">
        <Ring pct={stats.pct} />
        <div className="hero-body">
          <h2>Company Prep</h2>
          <p className="hero-sub">
            A {plan.config.weeks}-week plan for{" "}
            <b>{plan.config.companies.map((c) => COMPANIES[c].name).join(" · ")}</b> at {plan.config.hoursPerDay} hrs/day.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <b>
                {stats.done}/{stats.total}
              </b>
              <span>tasks done</span>
            </div>
            {left !== null && (
              <div className={`stat ${left < 0 ? "" : left <= 14 ? "hot" : ""}`}>
                <b>{left < 0 ? "—" : left}</b>
                <span>{left < 0 ? "date passed" : left === 1 ? "day to go" : "days to go"}</span>
              </div>
            )}
            {week !== null && (
              <div className="stat">
                <b>{week}</b>
                <span>current week</span>
              </div>
            )}
            <div className="stat">
              <b>{state.stories.length}</b>
              <span>STAR stories</span>
            </div>
            <div className={`stat ${dueCount ? "hot" : ""}`}>
              <b>{dueCount}</b>
              <span>problems due</span>
            </div>
          </div>
          <div className="pillar-bars">
            {stats.pillars.map(({ p, pct, done, total }) => (
              <div key={p} className="pillar-bar" title={`${done}/${total} ${PILLARS[p].label} tasks`}>
                <span className="pillar-bar-key">
                  {PILLARS[p].emoji} {PILLARS[p].short}
                </span>
                <span className="pillar-track">
                  <span className={`pillar-fill pillar-${p}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="pillar-num">{Math.round(pct)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-tools">
          <button className="btn" onClick={store.exportJSON} title="Download all progress as JSON">
            ⤓ Export
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} title="Restore from an exported file">
            ⤒ Import
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm("Clear every ticked task? Stories and the problem log are kept.")) store.resetProgress();
            }}
          >
            Reset ticks
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              onImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {notice && <div className="callout win">{notice}</div>}

      <nav className="prep-nav" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            className={`prep-tab ${view === v.key ? "on" : ""}`}
            onClick={() => setView(v.key)}
          >
            <span aria-hidden>{v.emoji}</span> {v.label}
            {v.key === "log" && dueCount > 0 && <span className="due-badge">{dueCount}</span>}
          </button>
        ))}
      </nav>

      {view === "plan" && (
        <>
          <PlanSetup plan={plan} onChange={store.setConfig} />
          <PlanBoard
            plan={plan}
            done={state.done}
            onToggle={store.toggleTask}
            onBulk={store.setWeekDone}
            onOpenTopic={onOpenTopic}
          />
          <div className="callout">
            <strong>Rules that outrank the schedule.</strong> Narrate every solve out loud — a silently correct answer
            reads as a fail in the interviewer's notes. State time and space complexity unprompted. Log every problem
            here, and redo anything you missed. 150 problems understood by pattern beat 400 memorised.
          </div>
        </>
      )}

      {view === "companies" && <CompanyGuide companies={plan.config.companies} />}
      {view === "resources" && <ResourceLibrary companies={plan.config.companies} />}
      {view === "stories" && (
        <StoryBank
          companies={plan.config.companies}
          stories={state.stories}
          onAdd={store.addStory}
          onUpdate={store.updateStory}
          onRemove={store.removeStory}
        />
      )}
      {view === "log" && (
        <WeakLog items={state.weak} onAdd={store.addWeak} onUpdate={store.updateWeak} onRemove={store.removeWeak} />
      )}
    </div>
  );
}
