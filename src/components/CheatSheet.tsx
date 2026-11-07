import { Boxes, FileText, TriangleAlert, Workflow } from "lucide-react";
import { TopicIcon } from "./Icons";
import { Topic } from "../types";

function Card({ t }: { t: Topic }) {
  const cs = t.cheatsheet;
  if (!cs) return null;
  return (
    <div className="cs-card">
      <div className="cs-card-head">
        <span className="cs-emoji">
          <TopicIcon k={t.key} size={18} />
        </span>
        <h4>{t.title}</h4>
      </div>
      <p className="cs-oneliner">{cs.oneLiner}</p>
      <div className="cs-section">
        <div className="cs-label">Key Big-O</div>
        <div className="cs-ops">
          {cs.keyOps.map(([k, v], i) => (
            <div key={i} className="cs-op">
              <span className="cs-op-k">{k}</span>
              <code>{v}</code>
            </div>
          ))}
        </div>
      </div>
      <div className="cs-section">
        <div className="cs-label">Use when</div>
        <p>{cs.useWhen}</p>
      </div>
      <div className="cs-section">
        <div className="cs-label">Pattern cue</div>
        <p>{cs.pattern}</p>
      </div>
      <div className="cs-section cs-gotcha">
        <div className="cs-label"><TriangleAlert size={13} /> Gotcha</div>
        <p>{cs.gotcha}</p>
      </div>
    </div>
  );
}

export default function CheatSheet({ topics }: { topics: Topic[] }) {
  const ds = topics.filter((t) => t.cat === "ds");
  const algo = topics.filter((t) => t.cat === "algo");
  return (
    <div className="topic-card">
      <h2><FileText size={22} /> Interview Cheat Sheet</h2>
      <div className="plain-english">
        <strong>5-minute revision before the interview</strong>
        Each card: one-line definition, key Big-O, when to use, pattern cue, and the most common gotcha. Skim, don't
        read.
      </div>
      <h3><Boxes size={18} /> Data Structures</h3>
      <div className="cs-grid">
        {ds.map((t) => (
          <Card key={t.key} t={t} />
        ))}
      </div>
      <h3><Workflow size={18} /> Algorithms &amp; Patterns</h3>
      <div className="cs-grid">
        {algo.map((t) => (
          <Card key={t.key} t={t} />
        ))}
      </div>
      <div className="cs-footer">
        <strong>Mental checklist before whiteboarding:</strong>
        <ol>
          <li>Clarify input: sorted? duplicates? size bounds?</li>
          <li>State the brute force + Big-O.</li>
          <li>Spot the pattern cue — match to a technique above.</li>
          <li>State your Big-O target BEFORE coding.</li>
          <li>Trace a tiny example to validate edge cases.</li>
        </ol>
      </div>
    </div>
  );
}
