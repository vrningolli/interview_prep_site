/* System Design track: interview framework, building blocks, numbers + estimator,
   and classic design walkthroughs that hand off to the AI mock interviewer. */
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Blocks, Calculator, Check, ChevronLeft, ListOrdered, Mic, Network } from "lucide-react";
import {
  CAPACITY,
  CONCEPTS,
  DESIGNS,
  DesignProblem,
  FRAMEWORK,
  LEVEL_ORDER,
  NUMBERS,
  estimate,
  fmtBytes,
  fmtNum,
} from "../data/systemDesign";
import { useStoredSet } from "../state";
import "../sd-mock.css";
import { track } from "../analytics";

type View = "designs" | "framework" | "concepts" | "numbers";

const VIEWS: { key: View; label: string; Icon: LucideIcon }[] = [
  { key: "designs", label: "Classic designs", Icon: Network },
  { key: "framework", label: "Framework", Icon: ListOrdered },
  { key: "concepts", label: "Building blocks", Icon: Blocks },
  { key: "numbers", label: "Numbers & estimator", Icon: Calculator },
];

const conceptTitle = (key: string) => CONCEPTS.find((c) => c.key === key)?.title ?? key;

export default function SystemDesign({
  onMock,
  initialDesign = null,
}: {
  onMock: (designKey: string) => void;
  initialDesign?: string | null;
}) {
  const [view, setView] = useState<View>("designs");
  const [openDesign, setOpenDesign] = useState<string | null>(initialDesign);
  const [openConcept, setOpenConcept] = useState<string | null>(null);
  const { set: practiced, toggle: togglePracticed } = useStoredSet("sd-practiced");

  const design = DESIGNS.find((d) => d.key === openDesign);

  useEffect(() => {
    if (openDesign) track("design_opened", openDesign);
  }, [openDesign]);
  const done = DESIGNS.filter((d) => practiced.has(d.key)).length;

  const showConcept = (key: string) => {
    setView("concepts");
    setOpenConcept(key);
    setOpenDesign(null);
  };

  return (
    <div className="sd">
      <section className="sd-hero">
        <div>
          <span className="kicker-sm">System design</span>
          <h2>Design systems like a senior engineer</h2>
          <p className="hero-sub">
            A repeatable 45-minute framework, the building blocks every design reuses, and {DESIGNS.length} classic
            problems with full walkthroughs. When you're ready, rehearse any of them with the AI interviewer.
          </p>
        </div>
        <div className="sd-hero-stat">
          <b>
            {done}/{DESIGNS.length}
          </b>
          <span>designs practised</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(done / DESIGNS.length) * 100}%` }} />
          </div>
        </div>
      </section>

      <nav className="prep-nav" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            role="tab"
            aria-selected={view === v.key}
            className={`prep-tab ${view === v.key ? "on" : ""}`}
            onClick={() => {
              setView(v.key);
              setOpenDesign(null);
            }}
          >
            <v.Icon size={15} aria-hidden /> {v.label}
          </button>
        ))}
      </nav>

      {view === "designs" && !design && (
        <DesignList practiced={practiced} onOpen={setOpenDesign} />
      )}
      {view === "designs" && design && (
        <DesignDetail
          d={design}
          practiced={practiced.has(design.key)}
          onTogglePracticed={() => togglePracticed(design.key)}
          onBack={() => setOpenDesign(null)}
          onMock={() => onMock(design.key)}
          onConcept={showConcept}
        />
      )}
      {view === "framework" && <Framework />}
      {view === "concepts" && <Concepts open={openConcept} onToggle={(k) => setOpenConcept(openConcept === k ? null : k)} />}
      {view === "numbers" && <Numbers />}
    </div>
  );
}

function DesignList({ practiced, onOpen }: { practiced: Set<string>; onOpen: (k: string) => void }) {
  return (
    <div className="sd-levels">
      {LEVEL_ORDER.map((level) => (
        <section key={level}>
          <h3 className="sd-level-title">{level}</h3>
          <div className="sd-grid">
            {DESIGNS.filter((d) => d.level === level).map((d) => (
              <button key={d.key} className="sd-card" onClick={() => onOpen(d.key)}>
                <div className="sd-card-head">
                  <b>{d.title}</b>
                  {practiced.has(d.key) && (
                    <span className="sd-done" title="Practised">
                      <Check size={14} strokeWidth={2.6} />
                    </span>
                  )}
                </div>
                <p>{d.prompt}</p>
                <div className="sd-tags">
                  {d.concepts.map((c) => (
                    <span key={c} className="tag">
                      {conceptTitle(c)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Section({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  return (
    <div className="sd-section">
      <h4>{title}</h4>
      <ul className={mono ? "sd-mono" : ""}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function DesignDetail({
  d,
  practiced,
  onTogglePracticed,
  onBack,
  onMock,
  onConcept,
}: {
  d: DesignProblem;
  practiced: boolean;
  onTogglePracticed: () => void;
  onBack: () => void;
  onMock: () => void;
  onConcept: (k: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <article className="sd-detail">
      <button className="linky sd-back" onClick={onBack}>
        <ChevronLeft size={16} /> All designs
      </button>
      <header className="sd-detail-head">
        <div>
          <span className={`sd-level sd-level-${d.level.toLowerCase()}`}>{d.level}</span>
          <h2>Design: {d.title}</h2>
          <p className="sd-prompt">{d.prompt}</p>
        </div>
        <div className="sd-actions">
          <button className="btn-primary" onClick={onMock}>
            <Mic size={16} /> Mock interview this
          </button>
          <label className="solved-toggle">
            <input type="checkbox" checked={practiced} onChange={onTogglePracticed} /> Practised
          </label>
        </div>
      </header>

      <div className="callout">
        <strong>Try it first.</strong> Spend 10 minutes sketching requirements, estimates and a high-level design on
        paper before opening the walkthrough. Recall beats rereading.
      </div>

      {!revealed ? (
        <button className="btn sd-reveal" onClick={() => setRevealed(true)}>
          Show the walkthrough
        </button>
      ) : (
        <div className="sd-walk">
          <div className="sd-two">
            <Section title="1 · Functional requirements" items={d.functional} />
            <Section title="Non-functional requirements" items={d.nonFunctional} />
          </div>
          <Section title="2 · Back-of-envelope" items={d.estimates} />
          <div className="sd-two">
            <Section title="3 · API" items={d.api} mono />
            <Section title="Data model" items={d.dataModel} mono />
          </div>
          <Section title="4 · High-level design" items={d.highLevel} />
          <div className="sd-section">
            <h4>5 · Deep dives</h4>
            {d.deepDives.map((x) => (
              <details key={x.q} className="sd-dive">
                <summary>{x.q}</summary>
                <p>{x.a}</p>
              </details>
            ))}
          </div>
          <div className="sd-section sd-pitfalls">
            <h4>Common mistakes</h4>
            <ul>
              {d.pitfalls.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="sd-section">
            <h4>Building blocks used</h4>
            <div className="sd-tags">
              {d.concepts.map((c) => (
                <button key={c} className="tag tag-btn" onClick={() => onConcept(c)}>
                  {conceptTitle(c)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Framework() {
  return (
    <div className="sd-framework">
      <p className="demo-intro">
        Use the same six steps in every design round. Interviewers grade the process as much as the final diagram.
      </p>
      <ol className="sd-steps">
        {FRAMEWORK.map((s, i) => (
          <li key={s.key} className="sd-step">
            <div className="sd-step-num">{i + 1}</div>
            <div className="sd-step-body">
              <div className="sd-step-head">
                <h3>{s.title}</h3>
                <span className="tag">{s.minutes}</span>
              </div>
              <p className="sd-step-goal">{s.goal}</p>
              <ul>
                {s.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="sd-say">{s.say}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Concepts({ open, onToggle }: { open: string | null; onToggle: (k: string) => void }) {
  return (
    <div className="sd-concepts">
      {CONCEPTS.map((c) => {
        const isOpen = open === c.key;
        return (
          <div key={c.key} className={`sd-concept ${isOpen ? "open" : ""}`}>
            <button className="sd-concept-head" onClick={() => onToggle(c.key)} aria-expanded={isOpen}>
              <b>{c.title}</b>
              <span>{c.oneLiner}</span>
            </button>
            {isOpen && (
              <div className="sd-concept-body">
                <p>{c.explain}</p>
                <div className="sd-two">
                  <div className="use-yes sd-box">
                    <h4>Use when</h4>
                    <ul>
                      {c.useWhen.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="use-no sd-box">
                    <h4>Trade-offs</h4>
                    <ul>
                      {c.tradeoffs.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="sd-say">
                  <b>Interview tip:</b> {c.tip}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NumField({ label, value, onChange, step }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="mfield">
      <span>{label}</span>
      <input
        className="field"
        type="number"
        min={0}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}

function Numbers() {
  const [dau, setDau] = useState(100_000_000);
  const [actions, setActions] = useState(2);
  const [ratio, setRatio] = useState(10);
  const [bytes, setBytes] = useState(500);
  const [years, setYears] = useState(5);
  const out = useMemo(
    () => estimate({ dau, actionsPerUser: actions, readRatio: ratio, bytesPerItem: bytes, years }),
    [dau, actions, ratio, bytes, years]
  );

  return (
    <div className="sd-numbers">
      <section className="sd-calc">
        <h3>Back-of-envelope estimator</h3>
        <p className="demo-intro">Plug in the scale you agreed with the interviewer. Round the answers out loud.</p>
        <div className="sd-calc-grid">
          <NumField label="Daily active users" value={dau} onChange={setDau} step={1_000_000} />
          <NumField label="Writes per user per day" value={actions} onChange={setActions} />
          <NumField label="Reads per write" value={ratio} onChange={setRatio} />
          <NumField label="Bytes per item" value={bytes} onChange={setBytes} step={100} />
          <NumField label="Years of retention" value={years} onChange={setYears} />
        </div>
        <div className="sd-results">
          <div className="stat">
            <b>{fmtNum(out.writesPerSec)}/s</b>
            <span>writes</span>
          </div>
          <div className="stat">
            <b>{fmtNum(out.readsPerSec)}/s</b>
            <span>reads (avg)</span>
          </div>
          <div className="stat hot">
            <b>{fmtNum(out.peakReadsPerSec)}/s</b>
            <span>reads at peak (3×)</span>
          </div>
          <div className="stat">
            <b>{fmtBytes(out.storagePerDay)}</b>
            <span>new data / day</span>
          </div>
          <div className="stat">
            <b>{fmtBytes(out.storageTotal)}</b>
            <span>
              total over {years} yr{years === 1 ? "" : "s"}
            </span>
          </div>
          <div className="stat">
            <b>{fmtBytes(out.readBandwidth)}/s</b>
            <span>read bandwidth</span>
          </div>
        </div>
        <p className="sd-say">
          {out.storageTotal > 10e12
            ? "That's more than one machine holds comfortably — plan to shard."
            : "This fits on a single well-provisioned database with replicas."}{" "}
          {out.peakReadsPerSec > 50_000
            ? "Peak reads are high: put a cache in front of the database."
            : "Reads are manageable with read replicas."}
        </p>
      </section>

      <div className="sd-two">
        <section>
          <h3>Latency numbers</h3>
          <table className="complexity-table">
            <tbody>
              {NUMBERS.map(([a, b, c]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>
                    <b>{b}</b>
                  </td>
                  <td className="muted-cell">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h3>Capacity rules of thumb</h3>
          <table className="complexity-table">
            <tbody>
              {CAPACITY.map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>
                    <b>{b}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
