/* Company interview profiles + the shared study resource library.
   Hand-authored on purpose: this file is NOT touched by `npm run extract`,
   which regenerates data/content.json from the old vanilla site. */

export type CompanyKey = "google" | "meta" | "amazon" | "microsoft";
export type PillarKey = "dsa" | "sd" | "behavioral" | "domain";
export type ResourceGroup = PillarKey | "mock" | "frontend";

export interface RubricItem {
  id: string;
  label: string;
  hint: string;
}

export interface LoopRound {
  round: string;
  detail: string;
}

export interface ResourceLink {
  label: string;
  url: string;
  note?: string;
  cost: "free" | "freemium" | "paid";
  group: ResourceGroup;
  /** Omitted = useful for every company. */
  companies?: CompanyKey[];
  /** Highlighted as a starting point. */
  star?: boolean;
}

export interface CompanyProfile {
  key: CompanyKey;
  name: string;
  mark: string;
  accent: string;
  tagline: string;
  /** Pillar weights, summing to 100. Drives how the generated plan spends time. */
  weights: Record<PillarKey, number>;
  loop: LoopRound[];
  rubricName: string;
  rubricNote: string;
  rubric: RubricItem[];
  /** Topics this company leans on harder than the average FAANG loop. */
  signature: string[];
  /** What actually fails candidates here. */
  traps: string[];
  links: ResourceLink[];
}

export const PILLARS: Record<PillarKey, { label: string; short: string; emoji: string }> = {
  dsa: { label: "Data structures & algorithms", short: "DSA", emoji: "🧩" },
  sd: { label: "System design", short: "System design", emoji: "🏗️" },
  behavioral: { label: "Behavioral & culture", short: "Behavioral", emoji: "💬" },
  domain: { label: "Domain & language depth", short: "Domain", emoji: "🔧" },
};

/* ============================== Google ============================== */

const GOOGLE: CompanyProfile = {
  key: "google",
  name: "Google",
  mark: "G",
  accent: "#4285f4",
  tagline: "Hardest pure-algorithms bar. Committee-reviewed, so consistency beats brilliance.",
  weights: { dsa: 55, sd: 20, behavioral: 15, domain: 10 },
  loop: [
    { round: "Recruiter screen", detail: "Role fit and level calibration. No coding." },
    { round: "Phone/virtual screen · 45 min", detail: "1–2 algorithm problems in a shared doc — no autocomplete, no run button." },
    { round: "Onsite: 2–3 coding rounds · 45 min each", detail: "Algorithms with layered follow-ups. Expect 'now make it work at scale'." },
    { round: "Onsite: system design", detail: "L5+ mostly; L4 gets a lighter design or a deep-dive on your own past work." },
    { round: "Onsite: Googleyness & Leadership", detail: "Behavioral round scored against Google's four hiring attributes." },
    { round: "Hiring Committee → team match", detail: "Strangers read your packet. Interviewer notes are the whole story — which is why narration matters." },
  ],
  rubricName: "Google's four hiring attributes",
  rubricNote:
    "Google deliberately has no Amazon-style principle list. Every round scores some mix of these four, and the Hiring Committee reads the notes rather than meeting you.",
  rubric: [
    { id: "gca", label: "General Cognitive Ability", hint: "How you approach an unfamiliar problem — structure, trade-offs, recovery when stuck." },
    { id: "rrk", label: "Role-Related Knowledge", hint: "Depth where it counts and enough breadth to be dangerous elsewhere." },
    { id: "leadership", label: "Emergent Leadership", hint: "Stepping up without the title — and stepping back when someone else should lead." },
    { id: "googleyness", label: "Googleyness", hint: "Comfort with ambiguity, bias to action, intellectual humility, collaboration." },
  ],
  signature: [
    "Graphs — BFS/DFS, topological sort, Union-Find",
    "Dynamic programming, including 2-D and state-compression",
    "Complexity rigor: state time AND space, unprompted, every time",
    "Open-ended follow-ups: 'what if the input doesn't fit in memory?'",
  ],
  traps: [
    "Silent solving. A correct answer with no narration reads as a fail in the written notes.",
    "Jumping to code before stating the approach and its complexity.",
    "Not testing your own code — trace a tricky example aloud before saying 'done'.",
    "Treating the behavioral round as a formality. It is scored and it sinks people.",
  ],
  links: [
    { label: "Google — How we hire: the interview", url: "https://careers.google.com/how-we-hire/interview/", cost: "free", group: "behavioral", companies: ["google"], star: true },
    { label: "Google — SWE interview prep guide", url: "https://www.google.com/about/careers/applications/candidate-prep/swe", cost: "free", group: "dsa", companies: ["google"], star: true },
    { label: "Google — Interviewing best practices & tips", url: "https://www.google.com/about/careers/applications/interview-tips/", cost: "free", group: "behavioral", companies: ["google"] },
    { label: "Google Tech Dev Guide — Interview path", url: "https://techdevguide.withgoogle.com/paths/interview/", note: "Google's own curated problem playlists", cost: "free", group: "dsa", companies: ["google"] },
    { label: "Interview Warmup (Grow with Google)", url: "https://grow.google/certificates/interview-warmup/", note: "Speak answers aloud, get transcript feedback", cost: "free", group: "behavioral", companies: ["google"] },
  ],
};

/* =============================== Meta =============================== */

const META: CompanyProfile = {
  key: "meta",
  name: "Meta",
  mark: "M",
  accent: "#0866ff",
  tagline: "Speed round. Two problems in 45 minutes, optimal on the first pass, no run button.",
  weights: { dsa: 50, sd: 20, behavioral: 20, domain: 10 },
  loop: [
    { round: "Recruiter screen", detail: "Role, level, timeline. You get access to Meta's own prep guides here." },
    { round: "Technical screen · 45 min", detail: "Typically 2 problems in ~35 coding minutes. Pace is the filter." },
    { round: "Onsite 'Ninja' × 2 · 45 min each", detail: "Two coding rounds, 2 problems each. Optimal solution expected quickly." },
    { round: "Onsite 'Pirate' — system design", detail: "E5 and above. Product-scale design: feed, messaging, presence." },
    { round: "Onsite 'Jedi' — behavioral", detail: "Conflict, ambiguity, feedback, and evidence you move fast." },
    { round: "Debrief → team matching", detail: "Meta hires to the company, then matches you to a team afterwards." },
  ],
  rubricName: "Meta's behavioral signals",
  rubricNote:
    "The 'Jedi' round probes a consistent set of themes. Meta cares less about a named principle list than about whether your stories show speed, ownership, and handling friction well.",
  rubric: [
    { id: "impact", label: "Drive & impact", hint: "What measurably changed because you were there?" },
    { id: "speed", label: "Move fast", hint: "Shipping and iterating over polishing in private for a quarter." },
    { id: "ambiguity", label: "Thriving in ambiguity", hint: "No spec, no owner, unclear priority — and you still moved it forward." },
    { id: "conflict", label: "Conflict & disagreement", hint: "A real disagreement with a peer or manager, and how it resolved." },
    { id: "growth", label: "Growing continuously", hint: "Hard feedback you received, and what visibly changed afterwards." },
  ],
  signature: [
    "Meta-tagged LeetCode list — the overlap with real questions is unusually high",
    "Graphs & BFS/DFS, binary tree paths, matrix traversal",
    "Strings, intervals, and in-place array manipulation",
    "Speed: 2 problems per 45 minutes, correct on the first submission",
  ],
  traps: [
    "Pacing. Spending 30 minutes on problem one means you fail on problem two you never saw.",
    "Brute force first. Here you are expected to reach the optimal approach quickly, then code it.",
    "No compiler and no test runner — syntax errors and off-by-ones are visible.",
    "Vague behavioral stories. Meta wants a number attached to the outcome.",
  ],
  links: [
    { label: "Meta — Hiring process", url: "https://www.metacareers.com/hiring-process/", cost: "free", group: "behavioral", companies: ["meta"], star: true },
    { label: "Meta — Preparing for your technical screen", url: "https://www.metacareers.com/swe-prep-techscreen/", cost: "free", group: "dsa", companies: ["meta"], star: true },
    { label: "Meta — Preparing for your full loop", url: "https://www.metacareers.com/swe-prep-onsite/", cost: "free", group: "dsa", companies: ["meta"] },
    { label: "Meta — Preparing for your SWE interview (blog)", url: "https://www.metacareers.com/blog/preparing-for-your-software-engineering-interview-at-meta/", cost: "free", group: "behavioral", companies: ["meta"] },
    { label: "LeetCode — Meta tagged questions", url: "https://leetcode.com/company/facebook/", note: "Frequency sort needs Premium; the tag list itself is visible", cost: "freemium", group: "dsa", companies: ["meta"] },
  ],
};

/* ============================== Amazon ============================== */

const AMAZON: CompanyProfile = {
  key: "amazon",
  name: "Amazon",
  mark: "A",
  accent: "#ff9900",
  tagline: "Half the loop is behavioral. Leadership Principles are asked in every single round.",
  weights: { dsa: 35, sd: 20, behavioral: 40, domain: 5 },
  loop: [
    { round: "Online Assessment", detail: "2 coding problems (~70 min), plus a work simulation and work-style survey." },
    { round: "Phone screen", detail: "One coding problem plus 1–2 Leadership Principle questions." },
    { round: "Loop × 4–5 · 60 min each", detail: "Every round = ~20 min of LP behavioral questions + ~35 min technical." },
    { round: "Bar Raiser round", detail: "An outside interviewer with veto power. Optimizes for long-term bar, not team need." },
    { round: "Debrief", detail: "Interviewers write up LP evidence verbatim. Weak stories are quoted back and sink the packet." },
  ],
  rubricName: "The 16 Leadership Principles",
  rubricNote:
    "Amazon is the one company where a story bank is not optional. Interviewers are each assigned specific LPs and will ask follow-ups until they hit data. Prepare 2 stories per LP you expect, each with numbers.",
  rubric: [
    { id: "customer-obsession", label: "Customer Obsession", hint: "Start from the customer and work backwards." },
    { id: "ownership", label: "Ownership", hint: "Think long term; never say 'that's not my job'." },
    { id: "invent-simplify", label: "Invent and Simplify", hint: "You found a simpler way, not just a cleverer one." },
    { id: "right-a-lot", label: "Are Right, A Lot", hint: "Strong judgement, and you actively seek disconfirming views." },
    { id: "learn-curious", label: "Learn and Be Curious", hint: "You taught yourself something hard because the problem demanded it." },
    { id: "hire-develop", label: "Hire and Develop the Best", hint: "You raised someone else's bar — mentoring, feedback, interviewing." },
    { id: "highest-standards", label: "Insist on the Highest Standards", hint: "You refused to ship something that was 'good enough'." },
    { id: "think-big", label: "Think Big", hint: "You proposed something bigger than what was asked for." },
    { id: "bias-for-action", label: "Bias for Action", hint: "Speed matters; many decisions are reversible two-way doors." },
    { id: "frugality", label: "Frugality", hint: "You did more with less — constraints bred the invention." },
    { id: "earn-trust", label: "Earn Trust", hint: "You listened, spoke candidly, and admitted you were wrong." },
    { id: "dive-deep", label: "Dive Deep", hint: "You went to the raw data when the summary looked fine." },
    { id: "backbone", label: "Have Backbone; Disagree and Commit", hint: "You challenged respectfully, lost, and then committed fully." },
    { id: "deliver-results", label: "Deliver Results", hint: "You shipped despite setbacks — with the number to prove it." },
    { id: "best-employer", label: "Strive to be Earth's Best Employer", hint: "You made the team a better place to work." },
    { id: "broad-responsibility", label: "Success and Scale Bring Broad Responsibility", hint: "You considered second-order impact beyond your own metric." },
  ],
  signature: [
    "Object-oriented / low-level design (design a parking lot, a deck of cards, an elevator)",
    "Graphs & BFS/DFS on grids, tree traversal, heaps for top-K",
    "STAR stories with hard numbers — latency, cost, adoption, revenue",
    "Two-way vs one-way door framing when you explain a decision",
  ],
  traps: [
    "Generic stories with no metric. 'It went well' is not evidence.",
    "Reusing one story for six LPs. Build a matrix and fill the gaps.",
    "Answering with 'we'. The Bar Raiser is listening for what YOU did.",
    "Underestimating the OA work-style survey — answer as an Amazonian, consistently.",
  ],
  links: [
    { label: "Amazon — The 16 Leadership Principles", url: "https://www.amazon.jobs/content/en/our-workplace/leadership-principles", cost: "free", group: "behavioral", companies: ["amazon"], star: true },
    { label: "Amazon — The interview loop", url: "https://www.amazon.jobs/content/en/how-we-hire/interview-loop", cost: "free", group: "behavioral", companies: ["amazon"], star: true },
    { label: "An Amazon interviewer on what each LP really means", url: "https://www.aboutamazon.com/news/workplace/what-do-each-of-amazons-leadership-principles-really-mean", cost: "free", group: "behavioral", companies: ["amazon"] },
    { label: "LP interview strategies from an Amazon manager", url: "https://www.aboutamazon.com/news/workplace/amazon-leadership-principles-interview", cost: "free", group: "behavioral", companies: ["amazon"] },
    { label: "LeetCode — Amazon tagged questions", url: "https://leetcode.com/company/amazon/", cost: "freemium", group: "dsa", companies: ["amazon"] },
  ],
};

/* ============================= Microsoft ============================ */

const MICROSOFT: CompanyProfile = {
  key: "microsoft",
  name: "Microsoft",
  mark: "MS",
  accent: "#0078d4",
  tagline: "Most practical loop of the four. Clean, tested, explained code beats an exotic algorithm.",
  weights: { dsa: 45, sd: 20, behavioral: 20, domain: 15 },
  loop: [
    { round: "Recruiter screen", detail: "Role fit, level, and which org you'd land in." },
    { round: "Technical screen · 45–60 min", detail: "One or two practical coding problems, often string/array/tree flavoured." },
    { round: "Loop × 4 · 45–60 min each", detail: "Coding plus design; several rounds mix in competency questions." },
    { round: "'As Appropriate' round", detail: "The senior/hiring-manager round, usually last. Broader, more architectural, more behavioral." },
    { round: "Debrief", detail: "Team-based hiring — the loop is largely the team you would actually join." },
  ],
  rubricName: "Microsoft's core competencies",
  rubricNote:
    "Microsoft asks competency-based questions and explicitly recommends the STAR model. Underneath all of it is 'growth mindset' — a learn-it-all beats a know-it-all.",
  rubric: [
    { id: "collaboration", label: "Collaboration", hint: "Communicating effectively inside your team and across teams." },
    { id: "drive-results", label: "Drive for results", hint: "Delivering on commitments and holding yourself accountable." },
    { id: "customer-focus", label: "Customer focus", hint: "Empowering the person on the other end of what you build." },
    { id: "influencing", label: "Influencing for impact", hint: "Persuading others without authority." },
    { id: "judgment", label: "Judgment", hint: "Scoping complex problems and making knowledge-based decisions." },
    { id: "adaptability", label: "Adaptability", hint: "Agility when the situation is ambiguous or shifts under you." },
    { id: "growth-mindset", label: "Growth mindset", hint: "The failure you learned from — Microsoft asks for this one directly." },
  ],
  signature: [
    "Strings, arrays, and binary trees — practical over exotic",
    "Object-oriented design and clean API/class boundaries",
    "'How would you test this?' — say the edge cases before you're asked",
    "Debugging aloud: recovering gracefully from a bug is a positive signal here",
  ],
  traps: [
    "Skipping tests. Microsoft interviewers frequently grade verification explicitly.",
    "Over-engineering. A readable O(n) beats a clever unreadable one.",
    "Forgetting the competency answers — the AA round leans on them hard.",
    "Not asking clarifying questions; ambiguity is often deliberate.",
  ],
  links: [
    { label: "Microsoft — Interview tips", url: "https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html", cost: "free", group: "behavioral", companies: ["microsoft"], star: true },
    { label: "Microsoft — Technical interviewing", url: "https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing", cost: "free", group: "dsa", companies: ["microsoft"], star: true },
    { label: "Microsoft — How we hire", url: "https://careers.microsoft.com/v2/global/en/hiring-tips.html", cost: "free", group: "behavioral", companies: ["microsoft"] },
    { label: "LeetCode — Microsoft tagged questions", url: "https://leetcode.com/company/microsoft/", cost: "freemium", group: "dsa", companies: ["microsoft"] },
  ],
};

export const COMPANIES: Record<CompanyKey, CompanyProfile> = {
  google: GOOGLE,
  meta: META,
  amazon: AMAZON,
  microsoft: MICROSOFT,
};

export const COMPANY_ORDER: CompanyKey[] = ["google", "meta", "amazon", "microsoft"];

/* ====================== Shared resource library ===================== */

export const RESOURCES: ResourceLink[] = [
  // ---- DSA spine ----
  { label: "Tech Interview Handbook — Grind 75", url: "https://www.techinterviewhandbook.org/grind75", note: "Free planner: set your weeks and hours, get an ordered list. No account.", cost: "free", group: "dsa", star: true },
  { label: "Algorithms study cheatsheets", url: "https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/", note: "Per-topic patterns, pitfalls and templates", cost: "free", group: "dsa", star: true },
  { label: "NeetCode — YouTube", url: "https://www.youtube.com/c/neetcode", note: "A free video walkthrough for essentially every list problem", cost: "free", group: "dsa", star: true },
  { label: "NeetCode practice roadmap", url: "https://neetcode.io/practice", note: "Viewing and tracking the list is free; only the Pro courses are paid", cost: "freemium", group: "dsa" },
  { label: "NeetCode 150 — LeetCode list", url: "https://leetcode.com/list/rr2ss0g5", cost: "freemium", group: "dsa" },
  { label: "Blind 75 — LeetCode list", url: "https://leetcode.com/list/oizxjoit", note: "Best fast revision pass in the final weeks", cost: "freemium", group: "dsa" },
  { label: "Grind 75 — LeetCode list", url: "https://leetcode.com/list/rab78cw1", cost: "freemium", group: "dsa" },
  { label: "Grind 169 — LeetCode list", url: "https://leetcode.com/list/rabvlt31", cost: "freemium", group: "dsa" },
  { label: "LeetCode — Top interview 150", url: "https://leetcode.com/studyplan/top-interview-150/", cost: "free", group: "dsa" },

  // ---- Reference implementations ----
  { label: "trekhleb/javascript-algorithms", url: "https://github.com/trekhleb/javascript-algorithms", note: "Data-structure internals — this is the repo this app lives in", cost: "free", group: "domain" },
  { label: "TheAlgorithms/JavaScript", url: "https://github.com/TheAlgorithms/JavaScript", cost: "free", group: "domain" },
  { label: "JoshCrozier/leetcode-javascript", url: "https://github.com/JoshCrozier/leetcode-javascript", note: "JS reference solutions", cost: "free", group: "domain" },
  { label: "ghoshsuman845/Blind-75-JS", url: "https://github.com/ghoshsuman845/Blind-75-JS", cost: "free", group: "domain" },
  { label: "MDN — JavaScript reference", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference", note: "For the language traps: sort comparators, Map vs object, modulo sign", cost: "free", group: "domain" },

  // ---- System design ----
  { label: "donnemartin/system-design-primer", url: "https://github.com/donnemartin/system-design-primer", note: "Free, complete, structured. Make this your spine.", cost: "free", group: "sd", star: true },
  { label: "ashishps1/awesome-system-design-resources", url: "https://github.com/ashishps1/awesome-system-design-resources", note: "Topic notes and diagrams", cost: "free", group: "sd" },
  { label: "ByteByteGo — YouTube", url: "https://www.youtube.com/@ByteByteGo", note: "The YouTube channel is free; the bytebytego.com course is not", cost: "free", group: "sd", star: true },
  { label: "Gaurav Sen — YouTube", url: "https://www.youtube.com/@gkcs", note: "Deep-dive design explanations", cost: "free", group: "sd" },
  { label: "Hello Interview — system design guides", url: "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", note: "Company-flavoured design walkthroughs; core guides are free", cost: "freemium", group: "sd" },
  { label: "Grokking the object-oriented design interview", url: "https://github.com/tssovi/grokking-the-object-oriented-design-interview", note: "For Amazon/Microsoft LLD rounds", cost: "free", group: "sd", companies: ["amazon", "microsoft"] },

  // ---- Behavioral ----
  { label: "STAR method — how to structure a story", url: "https://www.themuse.com/advice/star-interview-method", cost: "free", group: "behavioral", star: true },
  { label: "Tech Interview Handbook — behavioral guide", url: "https://www.techinterviewhandbook.org/behavioral-interview/", cost: "free", group: "behavioral" },
  { label: "Tech Interview Handbook — questions to ask your interviewer", url: "https://www.techinterviewhandbook.org/final-questions/", note: "Every round ends here. Have three ready.", cost: "free", group: "behavioral" },

  // ---- Mocks ----
  { label: "Pramp — free peer mock interviews", url: "https://www.pramp.com/", cost: "free", group: "mock", star: true },
  { label: "interviewing.io", url: "https://interviewing.io/", note: "Anonymous mocks with real FAANG engineers; some free practice", cost: "freemium", group: "mock" },
  { label: "Exponent — mock interview practice", url: "https://www.tryexponent.com/practice", cost: "freemium", group: "mock" },

  // ---- Frontend (optional specialty) ----
  { label: "GreatFrontEnd", url: "https://www.greatfrontend.com/", note: "JS coding + frontend system design", cost: "freemium", group: "frontend" },
  { label: "sudheerj/reactjs-interview-questions", url: "https://github.com/sudheerj/reactjs-interview-questions", cost: "free", group: "frontend" },
  { label: "greatfrontend/top-reactjs-interview-questions", url: "https://github.com/greatfrontend/top-reactjs-interview-questions", cost: "free", group: "frontend" },
  { label: "30 Days of JavaScript — LeetCode", url: "https://leetcode.com/studyplan/30-days-of-javascript/", cost: "free", group: "frontend" },
];

/** Company links folded into the shared library, so one filter drives everything. */
export const ALL_RESOURCES: ResourceLink[] = [
  ...RESOURCES,
  ...COMPANY_ORDER.flatMap((k) => COMPANIES[k].links),
];

export const GROUP_LABELS: Record<ResourceGroup, string> = {
  dsa: "DSA — the spine",
  sd: "System design",
  behavioral: "Behavioral & culture",
  domain: "Language & implementation reference",
  mock: "Mock interviews",
  frontend: "Frontend specialty (optional)",
};

/** Average the pillar weights of the selected companies. */
export function blendWeights(keys: CompanyKey[]): Record<PillarKey, number> {
  const picked = keys.length ? keys : COMPANY_ORDER;
  const sum: Record<PillarKey, number> = { dsa: 0, sd: 0, behavioral: 0, domain: 0 };
  picked.forEach((k) => {
    (Object.keys(sum) as PillarKey[]).forEach((p) => {
      sum[p] += COMPANIES[k].weights[p];
    });
  });
  (Object.keys(sum) as PillarKey[]).forEach((p) => {
    sum[p] = Math.round(sum[p] / picked.length);
  });
  return sum;
}
