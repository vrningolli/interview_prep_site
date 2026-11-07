/* Extracts all learning content from ../interview-prep-site (the original
   vanilla-JS site) into src/data/content.json for the React app.
   The old scripts are loaded in a Node VM with a stub DOM, then their data
   objects are serialized. Run: npm run extract */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const oldSite = path.join(here, "..", "..", "interview-prep-site");
const outFile = path.join(here, "..", "src", "data", "content.json");

function makeEl() {
  const el = {
    style: {}, dataset: {}, innerHTML: "", textContent: "",
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, removeEventListener() {}, appendChild() { return el; },
    setAttribute() {}, getAttribute() { return null; }, focus() {}, blur() {}, click() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    scrollIntoView() {}, disabled: false,
  };
  return el;
}

const sandbox = {
  console, Math, JSON, Set, Map, Array, Object, String, Number, parseInt, parseFloat,
  setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
  Promise, Infinity, isNaN,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: {
    getElementById: () => makeEl(),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {},
    documentElement: makeEl(),
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const f of ["problems.js", "trainer.js", "app.js", "enrichments.js"]) {
  vm.runInContext(fs.readFileSync(path.join(oldSite, f), "utf8"), sandbox, { filename: f });
}

vm.runInContext(
  `__export = { dsTopics, algoTopics, quizzes, QUIZ_EXTRA, CHEATSHEET, CHEATSHEET_ORDER,
     roadmap, PATTERN_DRILLS, ENRICHMENTS, PROBLEM_BANK };`,
  sandbox
);
const X = sandbox.__export;

/* Merge base topic problems with the extended PROBLEM_BANK (dedupe by title). */
function mergedProblems(key, base) {
  const bank = X.PROBLEM_BANK[key] || {};
  const out = {};
  const seen = new Set();
  for (const lv of ["easy", "medium", "hard"]) {
    out[lv] = [];
    for (const p of [...(base[lv] || []), ...(bank[lv] || [])]) {
      const t = (p.title || "").trim().toLowerCase();
      if (seen.has(t)) continue;
      seen.add(t);
      out[lv].push(p);
    }
  }
  return out;
}

function buildTopics(cat, topics) {
  return Object.entries(topics).map(([key, t]) => ({
    key,
    cat,
    title: t.title,
    emoji: t.emoji,
    plain: t.plain,
    analogy: t.analogy,
    lessons: t.lessons,
    complexity: t.complexity,
    useYes: t.useYes,
    useNo: t.useNo,
    code: t.code,
    problems: mergedProblems(key, t.problems || {}),
    quiz: [X.quizzes[`${cat}:${key}`], ...(X.QUIZ_EXTRA[`${cat}:${key}`] || [])].filter(Boolean),
    cheatsheet: X.CHEATSHEET[key] || null,
    enrichment: X.ENRICHMENTS[key] || null,
  }));
}

const content = {
  topics: [...buildTopics("ds", X.dsTopics), ...buildTopics("algo", X.algoTopics)],
  roadmap: X.roadmap,
  drills: X.PATTERN_DRILLS,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(content, null, 1));
console.log(
  `Wrote ${outFile}: ${content.topics.length} topics, ${content.drills.length} drills, ` +
  `${content.topics.reduce((n, t) => n + t.quiz.length, 0)} quiz questions.`
);
