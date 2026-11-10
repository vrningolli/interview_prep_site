/* Persistence for mock interviews: the session in progress (survives a refresh),
   past sessions with their scorecards, and provider settings. */
import { useLocalStorage } from "../state";
import type { ProviderKind } from "./llm";
import { DEFAULT_CLAUDE_MODEL } from "./llm";
import type { Scorecard, Setup, Turn } from "./prompts";

export interface Session {
  id: string;
  setup: Setup;
  startedAt: number;
  endedAt?: number;
  turns: Turn[];
  scratchpad: string;
  scorecard?: Scorecard;
  rawReport?: string;
  provider: ProviderKind;
}

const MAX_HISTORY = 25;

export function useSessions() {
  const [active, setActive] = useLocalStorage<Session | null>("prep-mock-active", null);
  const [history, setHistory] = useLocalStorage<Session[]>("prep-mock-history", []);

  const finish = (s: Session) => {
    setHistory((h) => [s, ...h.filter((x) => x.id !== s.id)].slice(0, MAX_HISTORY));
    setActive(null);
  };
  const remove = (id: string) => setHistory((h) => h.filter((x) => x.id !== id));
  return { active, setActive, history, finish, remove };
}

export interface ProviderSettings {
  kind: ProviderKind;
  model: string;
  remember: boolean;
}

export function useProviderSettings() {
  return useLocalStorage<ProviderSettings>("prep-mock-provider", {
    kind: "free",
    model: DEFAULT_CLAUDE_MODEL,
    remember: false,
  });
}

/* The API key is kept for this tab only (sessionStorage) unless the visitor ticks "remember". */
const KEY_NAME = "prep-mock-claude-key";

export function loadKey(): string {
  try {
    return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || "";
  } catch {
    return "";
  }
}

export function saveKey(key: string, remember: boolean) {
  try {
    sessionStorage.setItem(KEY_NAME, key);
    if (remember && key) localStorage.setItem(KEY_NAME, key);
    else localStorage.removeItem(KEY_NAME);
  } catch {
    /* storage unavailable */
  }
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
