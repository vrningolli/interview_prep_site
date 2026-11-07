import rawContent from "../data/content.json";
import type { Content } from "../types";
import { COMPANY_ORDER, COMPANIES } from "../data/companies";

const content = rawContent as unknown as Content;

// Live counts from the actual content, so the landing page never overstates.
const dsCount = content.topics.filter((t) => t.cat === "ds").length;
const algoCount = content.topics.filter((t) => t.cat === "algo").length;
const problemCount = content.topics.reduce(
  (n, t) => n + Object.values(t.problems || {}).reduce((m, list) => m + list.length, 0),
  0
);
const companyNames = COMPANY_ORDER.map((k) => COMPANIES[k].name);
/** Lessons in the AI Lab (a separate app at /ai-lab/ — update if lessons are added). */
const AI_LAB_LESSONS = 11;

const STATS = [
  { value: content.topics.length, label: "DSA topics" },
  { value: problemCount, label: "practice problems" },
  { value: content.drills.length, label: "pattern drills" },
  { value: AI_LAB_LESSONS, label: "AI lab lessons" },
];

const STEPS = [
  { emoji: "📖", title: "Learn", text: "Plain-English lessons with an analogy and a step-by-step visualizer for every topic." },
  { emoji: "🧩", title: "Practice", text: "Easy → hard problems with hints, and a trainer that teaches you to spot the pattern." },
  { emoji: "🔁", title: "Review", text: "Spaced-repetition review and one-page cheat sheets so it sticks before the interview." },
  { emoji: "🎯", title: "Plan", text: `A week-by-week plan tuned for ${companyNames.join(", ")}.` },
];

const FEATURES = [
  { emoji: "🎬", title: "Step-through visualizers", text: "Watch arrays shift, pointers move and trees rebalance — one step at a time." },
  { emoji: "🎯", title: "Pattern Trainer", text: "Read a problem, pick the technique. Builds the instinct interviews test." },
  { emoji: "🏢", title: "Company Prep", text: "Study plans, interview loops and STAR story bank for top tech companies." },
  { emoji: "📋", title: "Cheat Sheets", text: "Big-O tables and when-to-use guides for a last-minute refresh." },
  { emoji: "🗺️", title: "AI Learning Journey", text: "A map of Claude Code lessons — skills, agents, hooks, MCP and plugins." },
  { emoji: "🤖", title: "AI Agent Runner", text: "Run any lab on a free AI model, or with your own Claude key." },
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <span className="hero-eyebrow">Free · No sign-up · Works on your phone</span>
        <h1>
          Crack the coding interview.
          <br />
          <span className="hero-accent">Learn to build with AI.</span>
        </h1>
        <p className="hero-lead">
          Two hands-on study tools in one place: <b>Prep Coach</b> for data structures, algorithms and company
          interview plans, and <b>AI Lab</b> for learning Claude Code by doing.
        </p>
        <div className="hero-ctas">
          <a className="btn-primary" href="#prep">
            Start Prep Coach →
          </a>
          <a className="btn-ghost" href="ai-lab/">
            Explore AI Lab
          </a>
        </div>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tiles" aria-label="Choose a tool">
        <a className="tile tile-prep" href="#prep">
          <div className="tile-icon">📦</div>
          <h2>Prep Coach</h2>
          <p>Everything for the coding rounds — learn it, practice it, review it.</p>
          <ul>
            <li>
              {dsCount} data structures &amp; {algoCount} algorithms with visualizers
            </li>
            <li>{problemCount} graded problems with hints and solutions</li>
            <li>Pattern trainer, spaced review &amp; cheat sheets</li>
            <li>Company prep plans for {companyNames.join(" · ")}</li>
          </ul>
          <span className="tile-cta">Open Prep Coach →</span>
        </a>
        <a className="tile tile-lab" href="ai-lab/">
          <div className="tile-icon">🤖</div>
          <h2>AI Lab</h2>
          <p>A hands-on academy for Claude Code — the AI coding tool.</p>
          <ul>
            <li>{AI_LAB_LESSONS} lessons on a game-like journey map</li>
            <li>Skills, subagents, hooks, MCP, commands &amp; plugins</li>
            <li>Template Studio to generate real config files</li>
            <li>Agent Runner: try each lab on a free AI model</li>
          </ul>
          <span className="tile-cta">Open AI Lab →</span>
        </a>
      </section>

      <section className="how">
        <h2 className="section-title">How Prep Hub helps you</h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step" key={s.title}>
              <span className="step-num">{i + 1}</span>
              <div className="step-emoji">{s.emoji}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">What's inside</h2>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <span className="feature-emoji">{f.emoji}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready to start?</h2>
        <p>Your progress saves in this browser — no account needed.</p>
        <div className="hero-ctas">
          <a className="btn-primary" href="#prep">
            Start Prep Coach →
          </a>
          <a className="btn-ghost" href="ai-lab/">
            Explore AI Lab
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>
          <b>Prep Hub</b> · Prep Coach &amp; AI Lab
        </span>
        <span className="made-by">
          made with <span className="heart" aria-label="love">♥</span> · Virupaksh N
        </span>
      </footer>
    </div>
  );
}
