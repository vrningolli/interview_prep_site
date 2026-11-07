# DS Coach — Interactive Interview Prep (React edition)

React + Vite + TypeScript rebuild of `../interview-prep-site`, with a step-through
visualizer on every topic.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
```

## What's inside

- **21 topics** (10 data structures, 11 algorithms/patterns) — plain-English intro,
  analogy, 3-level lessons, complexity table, code, curated problems with
  progressive hint → solution reveal, and a 3-question quiz per topic.
- **🎬 Step players** — every topic has a scrubber-driven visualization:
  play/pause/speed, step forward/back, watched variables, narration, and the
  matching code line highlighted per step. Click a player, then use ←/→/space.
- **🎯 Pattern Trainer** — 26 real problem statements; name the pattern, learn the
  signal words. Best-run tracking.
- **🧭 Interview Kit** — Big-O primer, input-size → target-complexity table,
  UMPIRE framework with say-this-out-loud scripts, edge-case checklist, JS traps.
- **💻 Code Lab** — every topic has a real coding challenge with a starter stub
  and test cases, executed in a sandboxed Web Worker (infinite loops get
  terminated after 4s). Verified solvable: `node scripts/verify-challenges.mjs`.
- **🧠 Quiz-me predict mode** — toggle it in any visualizer and it pauses before
  key steps to ask what happens next, then shows the answer animating.
- **🔁 Review (spaced repetition)** — missed quiz questions, missed trainer
  drills, and problems where you peeked at the solution come back on a
  1 → 3 → 7 → 14 → 30-day ladder until you can answer them cold.
- **📋 Cheat Sheet** and **🗺️ 8-week Roadmap**.
- Progress (learned topics, solved problems, lab wins, review schedule,
  quiz/trainer bests) persists in `localStorage`.

## Content pipeline

All lesson/problem/quiz content lives in `src/data/content.json`, generated from
the original vanilla site by:

```bash
npm run extract   # reads ../interview-prep-site/*.js → src/data/content.json
```

Edit content in the old site's files and re-extract, or edit the JSON directly.
The visualizers are code, not extracted content: `src/viz/generators-*.ts`.
