import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Building2,
  Check,
  Crosshair,
  FileText,
  GraduationCap,
  Map,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Puzzle,
  CalendarCheck,
  ShieldCheck,
  Smartphone,
  Zap,
  Mic,
  Network,
} from "lucide-react";
import { useEffect, useState } from "react";
import rawContent from "../data/content.json";
import Mascot from "./Mascot";
import type { Content } from "../types";
import { COMPANY_ORDER, COMPANIES } from "../data/companies";
import { DESIGNS } from "../data/systemDesign";
import { PricingCards } from "./Pricing";

/** Direct visits to /#pricing land on the pricing section. */
function useScrollToPricing() {
  useEffect(() => {
    if (location.hash === "#pricing") setTimeout(() => document.getElementById("pricing")?.scrollIntoView(), 60);
  }, []);
}

const content = rawContent as unknown as Content;

// Live counts from the actual content, so the page never overstates.
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
  { value: problemCount, label: "Practice problems" },
  { value: content.drills.length, label: "Pattern drills" },
  { value: AI_LAB_LESSONS, label: "AI Lab lessons" },
];

const STEPS: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: BookOpen, title: "Learn", text: "Plain-English lessons with an analogy and a step-by-step visualizer for every topic." },
  { Icon: Puzzle, title: "Practice", text: "Easy-to-hard problems with hints, plus a trainer that builds pattern recognition." },
  { Icon: RotateCcw, title: "Review", text: "Spaced-repetition review and one-page cheat sheets so it sticks." },
  { Icon: CalendarCheck, title: "Plan", text: "A week-by-week plan tuned to the company you're interviewing with." },
];

const FEATURES: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Mic, title: "AI Mock Interviewer", text: "Coding, system design and behavioral rounds with Veeru — hidden tests, voice mode and a rubric scorecard." },
  { Icon: Network, title: "System Design", text: `A 6-step framework, core building blocks and ${DESIGNS.length} classic designs with full walkthroughs.` },
  { Icon: PlayCircle, title: "Step-through visualizers", text: "Watch arrays shift, pointers move and trees rebalance — one step at a time." },
  { Icon: Crosshair, title: "Pattern Trainer", text: "Read a problem, pick the technique. Builds the instinct interviews test." },
  { Icon: Building2, title: "Company Prep", text: "Study plans, interview loops and a STAR story bank for top tech companies." },
  { Icon: FileText, title: "Cheat Sheets", text: "Big-O tables and when-to-use guides for a last-minute refresh." },
  { Icon: Map, title: "AI learning journey", text: "Claude Code lessons — skills, agents, hooks, MCP and plugins — on one map." },
  { Icon: Bot, title: "AI Agent Runner", text: "Try every lab on a free AI model, or bring your own Claude API key." },
];

const SAMPLE_SCORES: [string, number, string][] = [
  ["Requirements & scope", 4, "Pinned scope, scale and read receipts in the first five minutes."],
  ["Deep dive & trade-offs", 3, "Good per-conversation ordering; skipped retries until prompted."],
  ["Scale & reliability", 2, "No plan for a gateway server failing mid-conversation."],
];

const PREP_POINTS = [
  `${dsCount} data structures & ${algoCount} algorithms, each with a visualizer`,
  `${problemCount} graded problems with hints and solutions`,
  `System design track with ${DESIGNS.length} classic design walkthroughs`,
  "AI mock interviews — coding, system design & behavioral — with scorecards",
  "Pattern trainer, spaced review and cheat sheets",
  `Company plans for ${companyNames.join(", ")}`,
];
const LAB_POINTS = [
  `${AI_LAB_LESSONS} lessons on a guided learning journey`,
  "Skills, subagents, hooks, MCP, commands & plugins",
  "Template Studio that generates real config files",
  "Agent Runner to try each lab with AI",
];

/** Frames of "insert 5 at the front": every element shifts right one slot, then 5 drops in. */
const FRAMES: { cells: (number | null)[]; hot: number | null; line: 0 | 1 | 2; caption: string }[] = [
  { cells: [10, 20, 30, 40, null], hot: null, line: 0, caption: "Goal: insert 5 at index 0 of a 4-element array." },
  { cells: [10, 20, 30, 40, 40], hot: 4, line: 1, caption: "No free slot at the front — shift 40 right first." },
  { cells: [10, 20, 30, 30, 40], hot: 3, line: 1, caption: "Shift 30 right." },
  { cells: [10, 20, 20, 30, 40], hot: 2, line: 1, caption: "Shift 20 right." },
  { cells: [10, 10, 20, 30, 40], hot: 1, line: 1, caption: "Shift 10 right — index 0 is now free." },
  { cells: [5, 10, 20, 30, 40], hot: 0, line: 2, caption: "Write 5. Four moves for one insert — that's O(n)." },
];

/** A live, looping preview of the Prep Coach step-through visualizer (the hero illustration). */
function HeroPreview() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(
    () => !(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );

  useEffect(() => {
    if (!playing) return;
    // Linger on the last frame, then loop.
    const delay = step === FRAMES.length - 1 ? 2600 : 1150;
    const t = window.setTimeout(() => setStep((s) => (s + 1) % FRAMES.length), delay);
    return () => window.clearTimeout(t);
  }, [playing, step]);

  const frame = FRAMES[step];
  const done = step === FRAMES.length - 1;
  return (
    <div className="preview">
      <div className="preview-bar">
        <span />
        <span />
        <span />
        <em>Prep Coach · Array visualizer</em>
      </div>
      <div className="preview-body">
        <div className="preview-label">Insert at front — O(n)</div>
        <div className="preview-cells" aria-hidden="true">
          {frame.cells.map((v, i) => (
            <div
              key={i}
              className={
                "preview-cell" + (v === null ? " is-empty" : "") + (frame.hot === i ? (done ? " is-new" : " is-hot") : "")
              }
            >
              <b>{v ?? "·"}</b>
              <small>[{i}]</small>
            </div>
          ))}
        </div>
        <p className="preview-caption" aria-live="polite">
          {frame.caption}
        </p>
        <div className="preview-code" aria-hidden="true">
          <code className={frame.line === 1 ? "on" : ""}>
            <span className="tok-k">for</span> (let i = n; i &gt; 0; i--) arr[i] = arr[i - 1];
          </code>
          <code className={frame.line === 2 ? "on" : ""}>arr[0] = 5;</code>
        </div>
        <div className="preview-controls">
          <button
            type="button"
            className="preview-play"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause preview" : "Play preview"}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? "Pause" : "Play"}
          </button>
          <div className="preview-track">
            <div style={{ width: `${((step + 1) / FRAMES.length) * 100}%` }} />
          </div>
          <span className="preview-step">
            Step {step + 1} / {FRAMES.length}
          </span>
        </div>
      </div>
      <div className={"preview-chip chip-a" + (done ? " show" : "")}>
        <Check size={14} strokeWidth={3} /> Topic learned
      </div>
      <div className="preview-chip chip-b show">
        <Zap size={14} /> 3 reviews due
      </div>
    </div>
  );
}

export default function Landing() {
  useScrollToPricing();
  return (
    <div className="landing">
      <Mascot />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> Interview prep + AI skills, in one place
          </span>
          <h1>Prep Insights</h1>
          <p className="hero-lead">
            Prep Hub combines a visual data-structures &amp; algorithms coach with a hands-on AI engineering lab — so
            you can master the fundamentals and the tools modern teams use.
          </p>
          <div className="hero-ctas">
            <a className="lp-btn lp-primary" href="#prep">
              Start Prep Coach <ArrowRight size={17} />
            </a>
            <a className="lp-btn lp-secondary" href="ai-lab/">
              Explore AI Lab
            </a>
          </div>
          <ul className="hero-trust">
            <li>
              <Check size={15} /> Free to use
            </li>
            <li>
              <ShieldCheck size={15} /> No sign-up
            </li>
            <li>
              <Smartphone size={15} /> Works on any device
            </li>
          </ul>
        </div>
        <HeroPreview />
      </section>

      <section className="logos" aria-label="Companies covered">
        <span>Study plans for interviews at</span>
        <div>
          {companyNames.map((n) => (
            <b key={n}>{n}</b>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <span className="kicker">Products</span>
          <h2>Two tools. One preparation plan.</h2>
          <p>Use them together or on their own — your progress is saved automatically in your browser.</p>
        </div>
        <div className="products">
          <a className="product" href="#prep">
            <div className="product-icon">
              <GraduationCap size={22} />
            </div>
            <h3>Prep Coach</h3>
            <p>Everything for coding and system-design rounds — learn it, practise it, then rehearse it with an AI interviewer.</p>
            <ul>
              {PREP_POINTS.map((t) => (
                <li key={t}>
                  <Check size={16} /> {t}
                </li>
              ))}
            </ul>
            <span className="product-cta">
              Open Prep Coach <ArrowRight size={16} />
            </span>
          </a>
          <a className="product product-lab" href="ai-lab/">
            <div className="product-icon">
              <Bot size={22} />
            </div>
            <h3>AI Lab</h3>
            <p>A hands-on academy for Claude Code, the AI coding assistant.</p>
            <ul>
              {LAB_POINTS.map((t) => (
                <li key={t}>
                  <Check size={16} /> {t}
                </li>
              ))}
            </ul>
            <span className="product-cta">
              Open AI Lab <ArrowRight size={16} />
            </span>
          </a>
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <span className="kicker">How it works</span>
          <h2>A clear path from first lesson to final round</h2>
        </div>
        <ol className="steps">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li className="step" key={title}>
              <div className="step-top">
                <span className="step-icon">
                  <Icon size={20} />
                </span>
                <span className="step-num">0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block">
        <div className="block-head">
          <span className="kicker">AI mock interviews</span>
          <h2>Finish every practice round with a real scorecard</h2>
          <p>Veeru asks follow-ups, runs your code against hidden tests, and grades you the way interviewers do.</p>
        </div>
        <div className="sample-score">
          <div className="sample-head">
            <div>
              <span className="kicker-sm">Example scorecard · System design</span>
              <h3>Design: Chat / messaging app</h3>
            </div>
            <span className="verdict verdict-mid">Lean hire · 3.0/4</span>
          </div>
          <div className="report-scores">
            {SAMPLE_SCORES.map(([dim, score, note]) => (
              <div key={dim} className="report-score">
                <div className="report-score-head">
                  <b>{dim}</b>
                  <span>{score}/4</span>
                </div>
                <div className="pillar-track">
                  <span className={`pillar-fill score-${score}`} style={{ width: `${(score / 4) * 100}%` }} />
                </div>
                <p>{note}</p>
              </div>
            ))}
          </div>
          <a className="btn-primary sample-cta" href="#prep/mock">
            Try a free mock interview <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <span className="kicker">Features</span>
          <h2>Everything you need, nothing you don't</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map(({ Icon, title, text }) => (
            <div className="feature" key={title}>
              <span className="feature-icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block" id="pricing">
        <div className="block-head">
          <span className="kicker">Pricing</span>
          <h2>Start free. Go Pro when you're ready.</h2>
          <p>Everything you need to prepare is free. Pro adds a Claude-powered interviewer and deeper feedback.</p>
        </div>
        <PricingCards source="landing" />
      </section>

      <section className="stats-band" aria-label="By the numbers">
        {STATS.map((s) => (
          <div className="lp-stat" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className="cta-band">
        <h2>Start preparing today</h2>
        <p>No account, no paywall. Open a topic and you're learning in seconds.</p>
        <div className="hero-ctas">
          <a className="lp-btn lp-light" href="#prep">
            Start Prep Coach <ArrowRight size={17} />
          </a>
          <a className="lp-btn lp-outline-light" href="ai-lab/">
            Explore AI Lab
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <a className="site-brand" href="#">
            <span className="site-logo">
              <GraduationCap size={18} strokeWidth={2.2} />
            </span>
            <span>Prep Hub</span>
          </a>
          <p>Visual interview prep and hands-on AI engineering lessons.</p>
        </div>
        <div className="footer-col">
          <h4>Products</h4>
          <a href="#prep">Prep Coach</a>
          <a href="ai-lab/">AI Lab</a>
        </div>
        <div className="footer-col">
          <h4>Prep Coach</h4>
          <a href="#prep">Data structures</a>
          <a href="#prep">Algorithms</a>
          <a href="#prep">Company prep</a>
        </div>
        <div className="footer-col">
          <h4>AI Lab</h4>
          <a href="ai-lab/#world">Learning journey</a>
          <a href="ai-lab/#lessons">Lessons</a>
          <a href="ai-lab/#agent">Agent Runner</a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Prep Hub · <a href="#privacy">Privacy</a>
          </span>
          <span className="made-by">
            made with <span className="heart" aria-label="love">♥</span> · Virupaksh N
          </span>
        </div>
      </footer>
    </div>
  );
}
