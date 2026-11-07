/* The generated week-by-week board: phases → week cards → checkable tasks. */

import { COMPANIES, PILLARS, PillarKey } from "../../data/companies";
import { Plan, PlanWeek, currentWeek } from "../../prep/planner";

function pillarChip(pillar: PillarKey | "mock") {
  if (pillar === "mock") return { label: "Mock", emoji: "🎤" };
  return { label: PILLARS[pillar].short, emoji: PILLARS[pillar].emoji };
}

function WeekCard({
  week,
  done,
  isNow,
  onToggle,
  onBulk,
  onOpenTopic,
}: {
  week: PlanWeek;
  done: Record<string, boolean>;
  isNow: boolean;
  onToggle: (id: string) => void;
  onBulk: (ids: string[], value: boolean) => void;
  onOpenTopic: (cat: "ds" | "algo", key: string) => void;
}) {
  const ids = week.tasks.map((t) => t.id);
  const doneCount = ids.filter((id) => done[id]).length;
  const pct = ids.length ? (doneCount / ids.length) * 100 : 0;
  const allDone = doneCount === ids.length && ids.length > 0;

  return (
    <article className={`week-card ${allDone ? "complete" : ""} ${isNow ? "now" : ""}`}>
      <header className="week-head">
        <div>
          <div className="week-n">
            Week {week.n}
            {isNow && <span className="now-badge">you are here</span>}
          </div>
          <div className="week-focus">{week.focus}</div>
        </div>
        <button className="week-bulk" onClick={() => onBulk(ids, !allDone)}>
          {allDone ? "Clear" : "All done"}
        </button>
      </header>

      <div className="week-meter">
        <div className="week-meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="week-meta">
        {doneCount}/{ids.length} done
        {week.problemTarget > 0 && <> · target ~{week.problemTarget} problems</>}
      </div>

      <ul className="task-list">
        {week.tasks.map((t) => {
          const chip = pillarChip(t.pillar);
          const isDone = !!done[t.id];
          return (
            <li key={t.id} className={`task ${isDone ? "done" : ""}`}>
              <label className="task-main">
                <input type="checkbox" checked={isDone} onChange={() => onToggle(t.id)} />
                <span className="task-label">{t.label}</span>
              </label>
              <span className="task-tags">
                {t.company && (
                  <span
                    className="task-company"
                    style={{ color: COMPANIES[t.company].accent, borderColor: COMPANIES[t.company].accent }}
                  >
                    {COMPANIES[t.company].name}
                  </span>
                )}
                <span className={`task-pillar pillar-${t.pillar}`}>
                  {chip.emoji} {chip.label}
                </span>
                {t.topic && (
                  <button className="task-link" onClick={() => onOpenTopic(t.topic!.cat, t.topic!.key)}>
                    Study →
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default function PlanBoard({
  plan,
  done,
  onToggle,
  onBulk,
  onOpenTopic,
}: {
  plan: Plan;
  done: Record<string, boolean>;
  onToggle: (id: string) => void;
  onBulk: (ids: string[], value: boolean) => void;
  onOpenTopic: (cat: "ds" | "algo", key: string) => void;
}) {
  const now = currentWeek(plan);

  return (
    <div className="plan-board">
      {plan.phases.map((phase) => {
        const weeks = plan.weeks.filter((w) => w.phase === phase.n);
        const ids = weeks.flatMap((w) => w.tasks.map((t) => t.id));
        const doneCount = ids.filter((id) => done[id]).length;
        const pct = ids.length ? Math.round((doneCount / ids.length) * 100) : 0;
        return (
          <section key={phase.n} className={`phase phase-${phase.n}`}>
            <header className="phase-head">
              <span className="phase-badge">Phase {phase.n}</span>
              <h3>{phase.title}</h3>
              <span className="phase-weeks">
                Weeks {phase.from}–{phase.to}
              </span>
              <span className="phase-pct">{pct}%</span>
            </header>
            <p className="phase-blurb">{phase.blurb}</p>
            <div className="week-grid">
              {weeks.map((w) => (
                <WeekCard
                  key={w.n}
                  week={w}
                  done={done}
                  isNow={now === w.n}
                  onToggle={onToggle}
                  onBulk={onBulk}
                  onOpenTopic={onOpenTopic}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
