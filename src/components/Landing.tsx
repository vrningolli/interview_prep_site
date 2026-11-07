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
  PlayCircle,
  RotateCcw,
  Sparkles,
  Puzzle,
  CalendarCheck,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import rawContent from "../data/content.json";
import type { Content } from "../types";
import { COMPANY_ORDER, COMPANIES } from "../data/companies";

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
  { Icon: PlayCircle, title: "Step-through visualizers", text: "Watch arrays shift, pointers move and trees rebalance — one step at a time." },
  { Icon: Crosshair, title: "Pattern Trainer", text: "Read a problem, pick the technique. Builds the instinct interviews test." },
  { Icon: Building2, title: "Company Prep", text: "Study plans, interview loops and a STAR story bank for top tech companies." },
  { Icon: FileText, title: "Cheat Sheets", text: "Big-O tables and when-to-use guides for a last-minute refresh." },
  { Icon: Map, title: "AI learning journey", text: "Claude Code lessons — skills, agents, hooks, MCP and plugins — on one map." },
  { Icon: Bot, title: "AI Agent Runner", text: "Try every lab on a free AI model, or bring your own Claude API key." },
];

const PREP_POINTS = [
  `${dsCount} data structures & ${algoCount} algorithms, each with a visualizer`,
  `${problemCount} graded problems with hints and solutions`,
  "Pattern trainer, spaced review and cheat sheets",
  `Company plans for ${companyNames.join(", ")}`,
];
const LAB_POINTS = [
  `${AI_LAB_LESSONS} lessons on a guided learning journey`,
  "Skills, subagents, hooks, MCP, commands & plugins",
  "Template Studio that generates real config files",
  "Agent Runner to try each lab with AI",
];

/** A static preview of the Prep Coach visualizer, used as the hero illustration. */
function HeroPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-bar">
        <span />
        <span />
        <span />
        <em>Prep Coach · Array</em>
      </div>
      <div className="preview-body">
        <div className="preview-label">Insert at front — O(n)</div>
        <div className="preview-cells">
          {[5, 10, 20, 30, 40].map((v, i) => (
            <div key={v} className={"preview-cell" + (i === 0 ? " is-new" : "")}>
              <b>{v}</b>
              <small>[{i}]</small>
            </div>
          ))}
        </div>
        <div className="preview-code">
          <code>
            <span className="tok-k">for</span> (let i = n; i &gt; 0; i--) arr[i] = arr[i - 1];
          </code>
        </div>
        <div className="preview-controls">
          <span className="preview-play">▶ Play</span>
          <div className="preview-track">
            <div />
          </div>
          <span className="preview-step">Step 5 / 8</span>
        </div>
      </div>
      <div className="preview-chip chip-a">
        <Check size={14} strokeWidth={3} /> Topic learned
      </div>
      <div className="preview-chip chip-b">
        <Zap size={14} /> 3 reviews due
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> Interview prep + AI skills, in one place
          </span>
          <h1>Prepare for coding interviews with confidence.</h1>
          <p className="hero-lead">
            Prep Hub combines a visual data-structures &amp; algorithms coach with a hands-on AI engineering lab — so
            you can master the fundamentals and the tools modern teams use.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary" href="#prep">
              Start Prep Coach <ArrowRight size={17} />
            </a>
            <a className="btn btn-secondary" href="ai-lab/">
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
            <p>Everything for the coding rounds — learn it, practice it, review it.</p>
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

      <section className="stats-band" aria-label="By the numbers">
        {STATS.map((s) => (
          <div className="stat" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className="cta-band">
        <h2>Start preparing today</h2>
        <p>No account, no paywall. Open a topic and you're learning in seconds.</p>
        <div className="hero-ctas">
          <a className="btn btn-light" href="#prep">
            Start Prep Coach <ArrowRight size={17} />
          </a>
          <a className="btn btn-outline-light" href="ai-lab/">
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
          <span>© {new Date().getFullYear()} Prep Hub</span>
          <span className="made-by">
            made with <span className="heart" aria-label="love">♥</span> · Virupaksh N
          </span>
        </div>
      </footer>
    </div>
  );
}
