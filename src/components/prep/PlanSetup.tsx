/* The knobs that regenerate the plan: companies, length, hours/day, target date. */

import { CompanyKey, COMPANIES, COMPANY_ORDER, PILLARS, PillarKey } from "../../data/companies";
import { HOUR_CHOICES, Plan, WEEK_CHOICES, daysUntil } from "../../prep/planner";

export default function PlanSetup({
  plan,
  onChange,
}: {
  plan: Plan;
  onChange: (patch: Partial<Plan["config"]>) => void;
}) {
  const { companies, weeks, hoursPerDay, targetDate } = plan.config;
  const left = daysUntil(targetDate);
  const weeksLeft = left === null ? null : Math.ceil(left / 7);
  const mismatch = weeksLeft !== null && weeksLeft > 0 && Math.abs(weeksLeft - weeks) >= 2;

  const toggleCompany = (k: CompanyKey) => {
    const next = companies.includes(k) ? companies.filter((c) => c !== k) : [...companies, k];
    if (!next.length) return; // always keep at least one target
    onChange({ companies: COMPANY_ORDER.filter((c) => next.includes(c)) });
  };

  return (
    <section className="prep-setup">
      <div className="setup-block">
        <div className="setup-label">Target companies</div>
        <div className="company-chips">
          {COMPANY_ORDER.map((k) => {
            const c = COMPANIES[k];
            const on = companies.includes(k);
            return (
              <button
                key={k}
                className={`company-chip ${on ? "on" : ""}`}
                style={on ? { borderColor: c.accent, background: `${c.accent}1a` } : undefined}
                onClick={() => toggleCompany(k)}
                aria-pressed={on}
              >
                <span className="company-mark" style={{ background: c.accent }}>
                  {c.mark}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="setup-row">
        <div className="setup-block">
          <div className="setup-label">Plan length</div>
          <div className="seg">
            {WEEK_CHOICES.map((w) => (
              <button key={w} className={`seg-btn ${weeks === w ? "on" : ""}`} onClick={() => onChange({ weeks: w })}>
                {w}w
              </button>
            ))}
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-label">Hours per day</div>
          <div className="seg">
            {HOUR_CHOICES.map((h) => (
              <button
                key={h}
                className={`seg-btn ${hoursPerDay === h ? "on" : ""}`}
                onClick={() => onChange({ hoursPerDay: h })}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="setup-block">
          <div className="setup-label">Interview date</div>
          <input
            className="date-input"
            type="date"
            value={targetDate ?? ""}
            onChange={(e) => onChange({ targetDate: e.target.value || null })}
          />
        </div>
      </div>

      <div className="mix-row">
        <span className="setup-label">Your blended mix</span>
        <div className="mix-bar">
          {(Object.keys(PILLARS) as PillarKey[]).map((p) => (
            <span
              key={p}
              className={`mix-seg mix-${p}`}
              style={{ width: `${plan.weights[p]}%` }}
              title={`${PILLARS[p].label} — ${plan.weights[p]}%`}
            />
          ))}
        </div>
        <div className="mix-legend">
          {(Object.keys(PILLARS) as PillarKey[]).map((p) => (
            <span key={p} className="mix-key">
              <i className={`mix-dot mix-${p}`} /> {PILLARS[p].short} {plan.weights[p]}%
            </span>
          ))}
        </div>
      </div>

      <p className="setup-note">
        {plan.hoursPerWeek} hrs/week · ~{plan.weeks[0]?.problemTarget ?? 0} problems/week · ~{plan.totalProblems}{" "}
        problems before the taper.
      </p>

      {mismatch && (
        <div className="callout warn">
          Your interview is <strong>{weeksLeft} weeks</strong> out but this plan is <strong>{weeks} weeks</strong> long.
          {weeksLeft < weeks
            ? " Shorten the plan so the taper actually lands on your interview week."
            : " You have room — lengthen the plan or raise your weekly target."}
        </div>
      )}
    </section>
  );
}
