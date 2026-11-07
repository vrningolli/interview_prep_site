/* Every study link in one filterable place. Company-specific links only show
   when that company is one of your targets. */

import { useMemo, useState } from "react";
import {
  ALL_RESOURCES,
  COMPANIES,
  CompanyKey,
  GROUP_LABELS,
  ResourceGroup,
  ResourceLink,
} from "../../data/companies";

const GROUP_ORDER: ResourceGroup[] = ["dsa", "sd", "behavioral", "mock", "domain", "frontend"];

export default function ResourceLibrary({ companies }: { companies: CompanyKey[] }) {
  const [freeOnly, setFreeOnly] = useState(false);
  const [q, setQ] = useState("");

  const grouped = useMemo(() => {
    const query = q.trim().toLowerCase();
    const visible = ALL_RESOURCES.filter((r) => {
      if (r.companies && !r.companies.some((c) => companies.includes(c))) return false;
      if (freeOnly && r.cost === "paid") return false;
      if (query && !`${r.label} ${r.note ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
    return GROUP_ORDER.map((g) => ({ group: g, items: visible.filter((r) => r.group === g) })).filter(
      (x) => x.items.length
    );
  }, [companies, freeOnly, q]);

  const total = grouped.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="resources">
      <div className="res-toolbar">
        <input
          className="res-search"
          type="search"
          placeholder="Filter resources…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="res-toggle">
          <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
          Free &amp; freemium only
        </label>
        <span className="res-count">{total} links</span>
      </div>

      {grouped.map(({ group, items }) => (
        <section key={group} className="res-group">
          <h3>{GROUP_LABELS[group]}</h3>
          <ul className="res-list">
            {items.map((r) => (
              <ResourceRow key={r.url + r.label} r={r} />
            ))}
          </ul>
        </section>
      ))}

      {!total && <p className="empty">No links match that filter.</p>}

      <p className="setup-note">
        The whole spine is free: <b>Grind 75</b> to schedule, <b>NeetCode on YouTube</b> to understand,{" "}
        <b>LeetCode</b> to actually type it, <b>system-design-primer</b> for design. Nothing here requires a
        subscription.
      </p>
    </div>
  );
}

function ResourceRow({ r }: { r: ResourceLink }) {
  return (
    <li className={`res-item ${r.star ? "star" : ""}`}>
      <div className="res-main">
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          {r.label}
        </a>
        {r.note && <span className="link-note">{r.note}</span>}
      </div>
      <div className="res-tags">
        {r.star && <span className="tag tag-star">start here</span>}
        <span className={`tag tag-${r.cost}`}>{r.cost}</span>
        {r.companies?.map((c) => (
          <span key={c} className="tag tag-co" style={{ color: COMPANIES[c].accent, borderColor: COMPANIES[c].accent }}>
            {COMPANIES[c].name}
          </span>
        ))}
      </div>
    </li>
  );
}
