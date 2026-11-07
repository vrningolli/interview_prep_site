/* Per-company briefing: the loop, the weighting, the rubric, and the traps. */

import { CompanyKey, COMPANIES, PILLARS, PillarKey } from "../../data/companies";

export default function CompanyGuide({ companies }: { companies: CompanyKey[] }) {
  return (
    <div className="company-guides">
      {companies.map((k) => {
        const c = COMPANIES[k];
        return (
          <section key={k} className="guide-card" style={{ ["--co" as string]: c.accent }}>
            <header className="guide-head">
              <span className="company-mark lg" style={{ background: c.accent }}>
                {c.mark}
              </span>
              <div>
                <h3>{c.name}</h3>
                <p className="guide-tagline">{c.tagline}</p>
              </div>
            </header>

            <div className="guide-weights">
              {(Object.keys(PILLARS) as PillarKey[]).map((p) => (
                <div key={p} className="weight-item">
                  <div className="weight-val">{c.weights[p]}%</div>
                  <div className="weight-key">
                    {PILLARS[p].emoji} {PILLARS[p].short}
                  </div>
                </div>
              ))}
            </div>

            <h4>The loop</h4>
            <ol className="loop-list">
              {c.loop.map((r, i) => (
                <li key={i}>
                  <b>{r.round}</b>
                  <span>{r.detail}</span>
                </li>
              ))}
            </ol>

            <h4>{c.rubricName}</h4>
            <p className="guide-note">{c.rubricNote}</p>
            <div className="rubric-grid">
              {c.rubric.map((r) => (
                <div key={r.id} className="rubric-item">
                  <b>{r.label}</b>
                  <span>{r.hint}</span>
                </div>
              ))}
            </div>

            <div className="guide-cols">
              <div>
                <h4>Leans hard on</h4>
                <ul className="bullets">
                  {c.signature.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>What actually fails people</h4>
                <ul className="bullets warn">
                  {c.traps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <h4>Official sources</h4>
            <ul className="link-list">
              {c.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                  {l.note && <span className="link-note">{l.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
