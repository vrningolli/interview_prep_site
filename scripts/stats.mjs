#!/usr/bin/env node
/* Prints Prep Hub's product analytics from Workers Analytics Engine.

   Usage:
     CF_ACCOUNT_ID=... CF_API_TOKEN=... npm run stats            # last 7 days
     CF_ACCOUNT_ID=... CF_API_TOKEN=... npm run stats -- 30      # last 30 days

   The API token needs the "Account Analytics: Read" permission
   (dash.cloudflare.com → My Profile → API Tokens → Create Token). */

const account = process.env.CF_ACCOUNT_ID;
const token = process.env.CF_API_TOKEN;
const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 7));

if (!account || !token) {
  console.error("Set CF_ACCOUNT_ID and CF_API_TOKEN (Account Analytics: Read). See the comment at the top of this file.");
  process.exit(1);
}

const DATASET = "prep_hub_events";
const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;

async function sql(query) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: query,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Analytics Engine ${res.status}: ${text}`);
  return JSON.parse(text).data ?? [];
}

function table(title, rows, cols) {
  console.log(`\n${title}`);
  if (!rows.length) return console.log("  (no data yet)");
  const widths = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length)));
  console.log("  " + cols.map((c, i) => c.padEnd(widths[i])).join("  "));
  for (const r of rows) console.log("  " + cols.map((c, i) => String(r[c] ?? "").padEnd(widths[i])).join("  "));
}

// _sample_interval accounts for Analytics Engine's sampling at high volume.
// blob1 event · blob2 detail · blob3 page · blob4 country · blob5 visitor ID · blob6 new/returning.
// Visitor counts are COUNT(DISTINCT) over sampled rows, so treat them as close estimates.
const hasVid = `blob5 != ''`;
const queries = [
  ["Visitors", `SELECT COUNT(DISTINCT blob5) AS unique_visitors, SUM(_sample_interval) AS events FROM ${DATASET} WHERE ${since} AND ${hasVid}`, ["unique_visitors", "events"]],
  ["New vs returning visitors", `SELECT blob6 AS kind, COUNT(DISTINCT blob5) AS visitors FROM ${DATASET} WHERE ${since} AND ${hasVid} GROUP BY kind`, ["kind", "visitors"]],
  ["Daily active visitors", `SELECT toDate(timestamp) AS day, COUNT(DISTINCT blob5) AS visitors, SUM(_sample_interval) AS events FROM ${DATASET} WHERE ${since} AND ${hasVid} GROUP BY day ORDER BY day`, ["day", "visitors", "events"]],
  ["Funnel (unique visitors)", `SELECT blob1 AS step, COUNT(DISTINCT blob5) AS visitors FROM ${DATASET} WHERE ${since} AND ${hasVid} AND blob1 IN ('page_view', 'tab_view', 'interview_started', 'tests_run', 'interview_finished') GROUP BY step ORDER BY visitors DESC`, ["step", "visitors"]],
  ["Pricing demand (unique visitors)", `SELECT blob1 AS step, COUNT(DISTINCT blob5) AS visitors, SUM(_sample_interval) AS events FROM ${DATASET} WHERE ${since} AND blob1 IN ('pricing_viewed', 'upgrade_clicked', 'price_feedback') GROUP BY step ORDER BY visitors DESC`, ["step", "visitors", "events"]],
  ["Upgrade clicks (billing:currency:source)", `SELECT blob2 AS click, SUM(_sample_interval) AS count FROM ${DATASET} WHERE ${since} AND blob1 = 'upgrade_clicked' GROUP BY click ORDER BY count DESC`, ["click", "count"]],
  ["Is the price fair? (answer:billing:currency)", `SELECT blob2 AS answer, SUM(_sample_interval) AS count FROM ${DATASET} WHERE ${since} AND blob1 = 'price_feedback' GROUP BY answer ORDER BY count DESC`, ["answer", "count"]],
  ["Events", `SELECT blob1 AS event, SUM(_sample_interval) AS count FROM ${DATASET} WHERE ${since} GROUP BY event ORDER BY count DESC`, ["event", "count"]],
  ["Daily page views", `SELECT toDate(timestamp) AS day, SUM(_sample_interval) AS views FROM ${DATASET} WHERE ${since} AND blob1 = 'page_view' GROUP BY day ORDER BY day`, ["day", "views"]],
  ["Prep Coach tabs", `SELECT blob2 AS tab, SUM(_sample_interval) AS views FROM ${DATASET} WHERE ${since} AND blob1 = 'tab_view' GROUP BY tab ORDER BY views DESC`, ["tab", "views"]],
  ["Interviews started (mode:problem:provider)", `SELECT blob2 AS interview, SUM(_sample_interval) AS count FROM ${DATASET} WHERE ${since} AND blob1 = 'interview_started' GROUP BY interview ORDER BY count DESC LIMIT 20`, ["interview", "count"]],
  ["Interviews finished", `SELECT blob2 AS result, SUM(_sample_interval) AS count, round(AVG(double1), 2) AS avg_score FROM ${DATASET} WHERE ${since} AND blob1 = 'interview_finished' GROUP BY result ORDER BY count DESC LIMIT 20`, ["result", "count", "avg_score"]],
  ["Designs opened", `SELECT blob2 AS design, SUM(_sample_interval) AS count FROM ${DATASET} WHERE ${since} AND blob1 = 'design_opened' GROUP BY design ORDER BY count DESC`, ["design", "count"]],
  ["Countries", `SELECT blob4 AS country, SUM(_sample_interval) AS events FROM ${DATASET} WHERE ${since} GROUP BY country ORDER BY events DESC LIMIT 10`, ["country", "events"]],
];

console.log(`Prep Hub analytics — last ${days} day${days === 1 ? "" : "s"}`);
for (const [title, q, cols] of queries) {
  try {
    table(title, await sql(q), cols);
  } catch (err) {
    console.log(`\n${title}\n  ${err.message}`);
  }
}
