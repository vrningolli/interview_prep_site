/* "Today" — Prep Coach's home screen. First visit: a 3-question setup that builds the
   study plan. After that: countdown, streak, today's tasks, what's due, and the next
   mock interview, so a returning visitor always knows what to do next. */
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Check, Flame, Mic, Network, RotateCcw, Settings2, Target } from "lucide-react";
import { COMPANIES, COMPANY_ORDER, CompanyKey } from "../data/companies";
import { DESIGNS } from "../data/systemDesign";
import { buildPlan, currentWeek, daysUntil, HOUR_CHOICES, PlanTask, WEEK_CHOICES } from "../prep/planner";
import { isDue, usePrepState } from "../prep/store";
import { dueNow, useReviewItems } from "../review/store";
import { useSessions } from "../interview/store";
import { LEVELS, Level, MODE_LABEL, Mode, RUBRIC, average } from "../interview/prompts";
import { lastWeek, streak } from "../activity";
import { useProfile } from "../profile";
import { track } from "../analytics";
import { Tab } from "../types";
import { useInstall } from "../pwa";
import "../today.css";

/** "Install Prep Hub" — a native prompt where the browser offers one, Add-to-Home-Screen steps on iPhone. */
function InstallCard() {
  const { kind, install } = useInstall();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("prep-install-dismissed") === "1";
    } catch {
      return false;
    }
  });
  if (!kind || hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem("prep-install-dismissed", "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <section className="today-card today-install">
      <div>
        <img src="icons/icon-192.png" alt="" />
        <p>
          <b>Install Prep Hub</b> —{" "}
          {kind === "ios" ? (
            <>
              tap the <b>Share</b> button, then <b>Add to Home Screen</b>. It opens full-screen like an app and works offline.
            </>
          ) : (
            "open it from your home screen or dock, full-screen, with offline lessons."
          )}
        </p>
      </div>
      <div className="today-row">
        {kind === "prompt" && (
          <button className="btn-primary" onClick={install}>
            Install app
          </button>
        )}
        <button className="btn" onClick={dismiss}>
          Not now
        </button>
      </div>
    </section>
  );
}

/** Plan length that fits the time left: the shortest plan that covers it (6–16 weeks),
    so a new user starts at week 1 instead of landing mid-plan. */
function weeksFor(date: string | null): number | undefined {
  const d = daysUntil(date);
  if (d === null || d < 0) return undefined;
  const need = Math.ceil(d / 7);
  return WEEK_CHOICES.find((w) => w >= need) ?? WEEK_CHOICES[WEEK_CHOICES.length - 1];
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function Today({
  onTab,
  onOpenTopic,
  onOpenDesign,
  onMock,
}: {
  onTab: (t: Tab) => void;
  onOpenTopic: (cat: "ds" | "algo", key: string) => void;
  onOpenDesign: (key: string) => void;
  onMock: (mode: Mode) => void;
}) {
  const [profile, setProfile] = useProfile();
  const prep = usePrepState();
  const [editing, setEditing] = useState(false);

  if (!profile.onboarded || editing) {
    return (
      <Onboarding
        initial={{ companies: prep.state.config.companies, date: prep.state.config.targetDate, hours: prep.state.config.hoursPerDay, level: profile.level }}
        firstTime={!profile.onboarded}
        onDone={(v) => {
          prep.setConfig({ companies: v.companies, targetDate: v.date, hoursPerDay: v.hours, ...(weeksFor(v.date) ? { weeks: weeksFor(v.date) } : {}) });
          setProfile({ onboarded: true, level: v.level });
          if (!profile.onboarded) track("onboarded", `${v.companies.join("+")}:${v.level}:${v.date ? "dated" : "nodate"}`);
          setEditing(false);
        }}
        onCancel={profile.onboarded ? () => setEditing(false) : undefined}
      />
    );
  }

  return (
    <Dashboard
      level={profile.level}
      onEdit={() => setEditing(true)}
      onTab={onTab}
      onOpenTopic={onOpenTopic}
      onOpenDesign={onOpenDesign}
      onMock={onMock}
    />
  );
}

/* ------------------------------------------------------------ onboarding */

function Onboarding({
  initial,
  firstTime,
  onDone,
  onCancel,
}: {
  initial: { companies: CompanyKey[]; date: string | null; hours: number; level: Level };
  firstTime: boolean;
  onDone: (v: { companies: CompanyKey[]; date: string | null; hours: number; level: Level }) => void;
  onCancel?: () => void;
}) {
  const [companies, setCompanies] = useState<CompanyKey[]>(firstTime ? [] : initial.companies);
  const [date, setDate] = useState(initial.date ?? "");
  const [noDate, setNoDate] = useState(!firstTime && !initial.date);
  const [hours, setHours] = useState(initial.hours);
  const [level, setLevel] = useState<Level>(initial.level);

  const toggle = (c: CompanyKey) => setCompanies((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));
  const ready = companies.length > 0 && (noDate || !!date);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="onb">
      <div className="onb-card">
        <span className="kicker-sm">{firstTime ? "Welcome to Prep Coach" : "Your plan"}</span>
        <h2>{firstTime ? "Let's build your plan — 3 quick questions" : "Update your plan"}</h2>
        <p className="hero-sub">We'll turn your answers into a week-by-week plan and a daily to-do list. You can change them any time.</p>

        <div className="onb-q">
          <b>1. Where are you interviewing?</b>
          <div className="onb-chips">
            {COMPANY_ORDER.map((c) => (
              <button key={c} className={`onb-chip ${companies.includes(c) ? "on" : ""}`} onClick={() => toggle(c)} aria-pressed={companies.includes(c)}>
                {companies.includes(c) && <Check size={14} />} {COMPANIES[c].name}
              </button>
            ))}
          </div>
          <span className="onb-hint">Pick one or more. Interviewing elsewhere? Pick the closest — the core skills are the same.</span>
        </div>

        <div className="onb-q">
          <b>2. When is your interview?</b>
          <div className="onb-row">
            <input className="field" type="date" min={today} value={date} disabled={noDate} onChange={(e) => setDate(e.target.value)} aria-label="Interview date" />
            <label className="solved-toggle">
              <input type="checkbox" checked={noDate} onChange={(e) => setNoDate(e.target.checked)} /> Not scheduled yet
            </label>
          </div>
        </div>

        <div className="onb-q onb-two">
          <label className="mfield">
            <b>3. Hours per day</b>
            <select className="field" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {HOUR_CHOICES.map((h) => (
                <option key={h} value={h}>
                  {h} {h === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </label>
          <label className="mfield">
            <b>Your level</b>
            <select className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {(Object.keys(LEVELS) as Level[]).map((l) => (
                <option key={l} value={l}>
                  {LEVELS[l]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="onb-actions">
          <button className="btn-primary" disabled={!ready} onClick={() => onDone({ companies, date: noDate ? null : date, hours, level })}>
            {firstTime ? "Build my plan" : "Save"} <ArrowRight size={16} />
          </button>
          {onCancel && (
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          {!ready && <span className="onb-hint">{companies.length ? "Pick a date, or tick “Not scheduled yet”." : "Pick at least one company."}</span>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- dashboard */

function Dashboard({
  level,
  onEdit,
  onTab,
  onOpenTopic,
  onOpenDesign,
  onMock,
}: {
  level: Level;
  onEdit: () => void;
  onTab: (t: Tab) => void;
  onOpenTopic: (cat: "ds" | "algo", key: string) => void;
  onOpenDesign: (key: string) => void;
  onMock: (mode: Mode) => void;
}) {
  const prep = usePrepState();
  const { state } = prep;
  const plan = useMemo(() => buildPlan(state.config), [state.config]);
  const sessions = useSessions();
  const reviewsDue = dueNow(useReviewItems()).length;
  const problemsDue = state.weak.filter(isDue).length;
  const st = streak();
  const week7 = lastWeek();
  const left = daysUntil(state.config.targetDate);
  const companies = state.config.companies.map((c) => COMPANIES[c].name);

  // This week's plan (by date), or the first week that still has open tasks.
  const weekN = currentWeek(plan) ?? plan.weeks.find((w) => w.tasks.some((t) => !state.done[t.id]))?.n ?? 1;
  const week = plan.weeks.find((w) => w.n === weekN) ?? plan.weeks[0];
  const open = week.tasks.filter((t) => !state.done[t.id]);
  // Catch up first: unfinished tasks from earlier weeks come before this week's.
  const backlog = plan.weeks.filter((w) => w.n < week.n).flatMap((w) => w.tasks.filter((t) => !state.done[t.id]));
  const todays: PlanTask[] = [...backlog, ...open].slice(0, 3);
  const weekDone = week.tasks.length - open.length;

  // Mock interviews: recent results and the weakest rubric area.
  const scored = sessions.history.filter((h) => h.scorecard);
  const last = scored[0];
  const weakest = useMemo(() => {
    const totals = new Map<string, { sum: number; n: number; mode: Mode }>();
    for (const h of scored.slice(0, 6)) {
      for (const s of h.scorecard!.scores) {
        const t = totals.get(s.dimension) ?? { sum: 0, n: 0, mode: h.setup.mode };
        t.sum += s.score;
        t.n++;
        totals.set(s.dimension, t);
      }
    }
    let worst: { dim: string; avg: number; mode: Mode } | null = null;
    for (const [dim, t] of totals) if (!worst || t.sum / t.n < worst.avg) worst = { dim, avg: t.sum / t.n, mode: t.mode };
    return worst;
  }, [scored]);

  // Suggest the round type practised least so far.
  const suggested: Mode = useMemo(() => {
    const counts: Record<Mode, number> = { coding: 0, sd: 0, behavioral: 0 };
    sessions.history.forEach((h) => counts[h.setup.mode]++);
    const order: Mode[] = level === "senior" ? ["sd", "coding", "behavioral"] : ["coding", "behavioral", "sd"];
    return order.reduce((best, m) => (counts[m] < counts[best] ? m : best), order[0]);
  }, [sessions.history, level]);

  // A different classic design each day.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const designOfDay = DESIGNS[dayIndex % DESIGNS.length];

  const tick = (t: PlanTask) => {
    if (!state.done[t.id]) track("task_done", t.pillar);
    prep.toggleTask(t.id);
  };

  return (
    <div className="today">
      <section className="today-hero">
        <div>
          <span className="kicker-sm">{greeting()}</span>
          <h2>
            {left === null
              ? "Let's keep the momentum going"
              : left < 0
                ? "Your interview date has passed — how did it go?"
                : left === 0
                  ? "Interview day. You've got this."
                  : `${left} day${left === 1 ? "" : "s"} until your ${companies.join(" / ")} interview`}
          </h2>
          <p className="hero-sub">
            Week {week.n} of {plan.config.weeks}: <b>{week.focus}</b>
          </p>
        </div>
        <div className="today-streak" title="Days in a row you practised">
          <span className={`flame ${st.today ? "lit" : ""}`}>
            <Flame size={22} />
          </span>
          <b>{st.days}</b>
          <span>day streak</span>
          <div className="streak-dots" aria-label="Last 7 days">
            {week7.map((on, i) => (
              <i key={i} className={on ? "on" : ""} />
            ))}
          </div>
          {!st.today && <small>{st.days ? "Practise today to keep it" : "Start one today"}</small>}
        </div>
        <button className="linky today-edit" onClick={onEdit}>
          <Settings2 size={14} /> Edit plan
        </button>
      </section>

      <div className="today-grid">
        <section className="today-card today-tasks">
          <header>
            <h3>
              <Target size={17} /> Today's plan
            </h3>
            <span className="muted-cell">
              {backlog.length > 0 ? `${backlog.length} to catch up · ` : ""}
              {weekDone}/{week.tasks.length} done this week
            </span>
          </header>
          {todays.length === 0 ? (
            <p className="empty">This week is done. 🎉 Pull tasks from next week, or do a mock interview.</p>
          ) : (
            <ul>
              {todays.map((t) => (
                <li key={t.id}>
                  <label>
                    <input type="checkbox" checked={!!state.done[t.id]} onChange={() => tick(t)} />
                    <span>{t.label}</span>
                  </label>
                  {t.topic && (
                    <button className="linky" onClick={() => onOpenTopic(t.topic!.cat, t.topic!.key)}>
                      Open lesson
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button className="btn" onClick={() => onTab("prep")}>
            <CalendarDays size={15} /> Full plan
          </button>
        </section>

        <section className="today-card today-mock">
          <header>
            <h3>
              <Mic size={17} /> Mock interview
            </h3>
            {scored.length > 0 && <span className="muted-cell">{scored.length} scored</span>}
          </header>
          {last?.scorecard ? (
            <p>
              Last: <b>{last.scorecard.verdict}</b> ({average(last.scorecard).toFixed(1)}/4) on {MODE_LABEL[last.setup.mode].toLowerCase()}.
              {weakest && (
                <>
                  {" "}
                  Weakest area: <b>{weakest.dim}</b> ({weakest.avg.toFixed(1)}/4).
                </>
              )}
            </p>
          ) : (
            <p>Rehearse with Veeru, the AI interviewer: questions, hints, follow-ups and a scorecard.</p>
          )}
          <button className="btn-primary" onClick={() => onMock(weakest && RUBRIC[weakest.mode].includes(weakest.dim) ? weakest.mode : suggested)}>
            Start a {MODE_LABEL[weakest?.mode ?? suggested].toLowerCase()} round <ArrowRight size={15} />
          </button>
        </section>

        <section className="today-card">
          <header>
            <h3>
              <RotateCcw size={17} /> Due for review
            </h3>
          </header>
          <div className="today-due">
            <button onClick={() => onTab("review")}>
              <b>{reviewsDue}</b>
              <span>flashcards</span>
            </button>
            <button onClick={() => onTab("prep")}>
              <b>{problemsDue}</b>
              <span>problems to redo</span>
            </button>
          </div>
          <p className="muted-cell">Spaced repetition: a few minutes a day beats a cram session.</p>
        </section>

        <section className="today-card">
          <header>
            <h3>
              <Network size={17} /> Design of the day
            </h3>
          </header>
          <p>
            <b>{designOfDay.title}</b> — {designOfDay.prompt}
          </p>
          <div className="today-row">
            <button className="btn" onClick={() => onOpenDesign(designOfDay.key)}>
              <BookOpen size={15} /> Walkthrough
            </button>
            <button className="btn" onClick={() => onTab("trainer")}>
              Pattern drill
            </button>
          </div>
        </section>

        <InstallCard />
      </div>
    </div>
  );
}
