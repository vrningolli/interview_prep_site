export type Category = "ds" | "algo";

export type Tab = "today" | Category | "sd" | "trainer" | "review" | "mock" | "kit" | "cheatsheet" | "prep";

export interface Lesson {
  level?: "beginner" | "intermediate" | "advanced" | string;
  title: string;
  body: string;
  example: string;
}

export interface Problem {
  title: string;
  body: string;
  hint: string;
  example?: string;
  solution?: string;
  lc?: boolean;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
  why: string;
}

export interface CheatSheetEntry {
  oneLiner: string;
  keyOps: [string, string][];
  useWhen: string;
  pattern: string;
  gotcha: string;
}

export interface DeepLesson {
  title: string;
  body: string;
  example: string;
}

export interface Enrichment {
  patternCues?: string[];
  interviewTips?: string[];
  realWorld?: string[];
  deepLessons?: DeepLesson[];
}

export interface Topic {
  key: string;
  cat: Category;
  title: string;
  emoji: string;
  plain: string;
  analogy: string;
  lessons: Lesson[];
  complexity: [string, string, string][];
  useYes: string[];
  useNo: string[];
  code: string;
  problems: Record<"easy" | "medium" | "hard", Problem[]>;
  quiz: QuizQuestion[];
  cheatsheet: CheatSheetEntry | null;
  enrichment: Enrichment | null;
}

export interface RoadmapWeek {
  week: string;
  focus: string;
  items: string[];
}

export interface Drill {
  q: string;
  opts: string[];
  correct: number;
  signal: string;
  why: string;
}

export interface Content {
  topics: Topic[];
  roadmap: RoadmapWeek[];
  drills: Drill[];
}
