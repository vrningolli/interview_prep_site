/* AI Mock Interviewer: pick a round, talk to an AI interviewer with a live timer
   and scratchpad, then get a rubric scorecard. Sessions persist in the browser. */
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  FlaskConical,
  XCircle,
  Clock,
  Code2,
  MessagesSquare,
  Mic,
  MicOff,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  KeyRound,
  Network,
  RotateCcw,
  Send,
  Square,
  Trash2,
  Trophy,
} from "lucide-react";
import { DESIGNS } from "../data/systemDesign";
import { COMPANIES, COMPANY_ORDER } from "../data/companies";
import { CLAUDE_MODELS, LlmError, ProviderConfig, chatStream, checkClaudeKey } from "../interview/llm";
import {
  BEHAVIORAL_QUESTIONS,
  CODING_PROBLEMS,
  LANGUAGE_LABEL,
  Language,
  MODE_LABEL,
  LEVELS,
  Level,
  Mode,
  RunSummary,
  Setup,
  Turn,
  average,
  buildRequest,
  openingMessage,
  parseScorecard,
  problemTitle,
  randomProblem,
  reportRequest,
  testNote,
} from "../interview/prompts";
import { runInterviewTests } from "../interview/tests";
import { pythonReady, warmPython } from "../lab/pyrunner";
import { track } from "../analytics";
import { Session, loadKey, newId, saveKey, useProviderSettings, useSessions } from "../interview/store";
import { canDictate, canSpeak, speak, stopSpeaking, useDictation } from "../interview/voice";
import { shareScorecard } from "../interview/share";
import { PREP_STORAGE_KEY } from "../prep/store";
import { useProfile } from "../profile";
import { openUpgrade } from "./Pricing";
import "../sd-mock.css";

export interface MockPreset {
  mode: Mode;
  problemKey: string;
}

/** Context budgets: the free 8B model has a small window; Claude's is huge. */
const BUDGET = { free: { turn: 11_000, report: 9_000 }, claude: { turn: 80_000, report: 80_000 } };

/** What the editor/notes panel starts with for each round. */
function startingPad(setup: Setup): string {
  if (setup.mode === "coding") {
    const p = CODING_PROBLEMS.find((x) => x.key === setup.problemKey);
    return (setup.language === "python" ? p?.pyStarter : p?.starter) ?? "";
  }
  if (setup.mode === "sd") return "";
  // Behavioral: the candidate's own story bank from Company Prep, as private notes.
  let stories: { title: string; situation?: string; action?: string; result?: string }[] = [];
  try {
    stories = JSON.parse(localStorage.getItem(PREP_STORAGE_KEY) || "{}").stories ?? [];
  } catch {
    /* no stories */
  }
  if (!stories.length) {
    return "Situation:\n\nTask:\n\nAction (what I did):\n\nResult (numbers!):\n\nWhat I learned:\n";
  }
  return "My stories (from Company Prep → Story bank):\n\n" + stories.map((st) => `• ${st.title}\n  S: ${st.situation ?? ""}\n  A: ${st.action ?? ""}\n  R: ${st.result ?? ""}`).join("\n\n");
}

const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function MockInterview({
  preset,
  onPresetUsed,
  onStudyTopic,
  onOpenDesign,
}: {
  preset: MockPreset | null;
  onPresetUsed: () => void;
  onStudyTopic: (topicKey: string) => void;
  onOpenDesign: (designKey: string) => void;
}) {
  const sessions = useSessions();
  const [settings, setSettings] = useProviderSettings();
  const [apiKey, setApiKey] = useState(loadKey);
  const [viewId, setViewId] = useState<string | null>(null);

  const cfg: ProviderConfig = { kind: settings.kind, apiKey, model: settings.model };
  const viewing = sessions.history.find((s) => s.id === viewId);

  const start = (setup: Setup) => {
    const s: Session = {
      id: newId(),
      setup,
      startedAt: Date.now(),
      turns: [{ role: "assistant", content: openingMessage(setup), at: 0 }],
      scratchpad: startingPad(setup),
      provider: settings.kind,
    };
    sessions.setActive(s);
    track("interview_started", `${setup.mode}:${setup.problemKey}:${settings.kind}`);
    setViewId(null);
  };

  if (sessions.active) {
    return (
      <Room
        session={sessions.active}
        cfg={cfg}
        update={(fn) => sessions.setActive((prev) => (prev ? fn(prev) : prev))}
        onFinish={(s) => {
          sessions.finish(s);
          setViewId(s.id);
          track("interview_finished", `${s.setup.mode}:${s.setup.problemKey}:${s.scorecard?.verdict ?? "unscored"}`, s.scorecard ? average(s.scorecard) : 0);
        }}
        onDiscard={() => {
          track("interview_discarded", `${sessions.active?.setup.mode}:${sessions.active?.setup.problemKey}`);
          sessions.setActive(null);
        }}
      />
    );
  }

  if (viewing) {
    return (
      <Report
        session={viewing}
        onBack={() => setViewId(null)}
        onRetry={() => start({ ...viewing.setup })}
        onStudyTopic={onStudyTopic}
        onOpenDesign={onOpenDesign}
        onDelete={() => {
          sessions.remove(viewing.id);
          setViewId(null);
        }}
      />
    );
  }

  return (
    <SetupView
      preset={preset}
      onPresetUsed={onPresetUsed}
      settings={settings}
      setSettings={setSettings}
      apiKey={apiKey}
      setApiKey={(k) => {
        setApiKey(k);
        saveKey(k, settings.remember);
      }}
      history={sessions.history}
      onOpen={setViewId}
      onStart={start}
    />
  );
}

/* ---------------------------------------------------------------- setup */

function SetupView({
  preset,
  onPresetUsed,
  settings,
  setSettings,
  apiKey,
  setApiKey,
  history,
  onOpen,
  onStart,
}: {
  preset: MockPreset | null;
  onPresetUsed: () => void;
  settings: ReturnType<typeof useProviderSettings>[0];
  setSettings: ReturnType<typeof useProviderSettings>[1];
  apiKey: string;
  setApiKey: (k: string) => void;
  history: Session[];
  onOpen: (id: string) => void;
  onStart: (s: Setup) => void;
}) {
  const [mode, setMode] = useState<Mode>(preset?.mode ?? "coding");
  const [problemKey, setProblemKey] = useState<string>(preset?.problemKey ?? "random");
  const [company, setCompany] = useState<Setup["company"]>("general");
  const [profile] = useProfile();
  const [level, setLevel] = useState<Level>(profile.level);
  const [minutes, setMinutes] = useState(45);
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("prep-mock-language") === "python" ? "python" : "javascript";
    } catch {
      return "javascript";
    }
  });
  const pickLanguage = (l: Language) => {
    setLanguage(l);
    try {
      localStorage.setItem("prep-mock-language", l);
    } catch {
      /* ignore */
    }
  };
  const [keyState, setKeyState] = useState<{ kind: "idle" | "checking" | "ok" | "err"; text?: string }>({ kind: "idle" });

  // A "Mock interview this" click from System Design arrives as a preset; consume it once.
  useEffect(() => {
    if (preset) {
      setMode(preset.mode);
      setProblemKey(preset.problemKey);
      onPresetUsed();
    }
  }, [preset, onPresetUsed]);

  const problems =
    mode === "coding"
      ? CODING_PROBLEMS.map((p) => ({ key: p.key, label: `${p.title} · ${p.difficulty}` }))
      : mode === "sd"
        ? DESIGNS.map((d) => ({ key: d.key, label: `${d.title} · ${d.level}` }))
        : BEHAVIORAL_QUESTIONS.map((q) => ({ key: q.key, label: q.title }));

  const switchMode = (m: Mode) => {
    setMode(m);
    setProblemKey("random");
  };

  const check = async () => {
    setKeyState({ kind: "checking" });
    try {
      const name = await checkClaudeKey(apiKey, settings.model);
      setKeyState({ kind: "ok", text: `Key works — ${name} is ready.` });
      track("claude_key_checked", "ok");
    } catch (e) {
      const err = e as LlmError;
      setKeyState({ kind: "err", text: `${err.message} ${err.hint ?? ""}` });
    }
  };

  const canStart = settings.kind === "free" || apiKey.trim().length > 0;

  const scored = history.filter((h) => h.scorecard);

  return (
    <div className="mock">
      <section className="sd-hero">
        <div>
          <span className="kicker-sm">AI mock interview</span>
          <h2>Practise with an interviewer who pushes back</h2>
          <p className="hero-sub">
            A live coding, system design or behavioral round with Veeru, an AI interviewer: clarifying questions, hints
            when you're stuck, hidden tests for your code, optional voice — and a rubric scorecard at the end.
          </p>
        </div>
        {scored.length > 0 && (
          <div className="sd-hero-stat">
            <b>{scored.length}</b>
            <span>interviews scored</span>
            <span className="mock-trend" aria-label="Recent average scores">
              {scored
                .slice(0, 8)
                .reverse()
                .map((h) => {
                  const avg = average(h.scorecard!);
                  return <i key={h.id} style={{ height: `${(avg / 4) * 100}%` }} title={avg.toFixed(1)} />;
                })}
            </span>
          </div>
        )}
      </section>

      <section className="mock-card">
        <h3>1 · Choose the round</h3>
        <div className="mock-modes three">
          <button className={`mock-mode ${mode === "coding" ? "on" : ""}`} onClick={() => switchMode("coding")}>
            <Code2 size={22} />
            <b>Coding</b>
            <span>Data structures & algorithms, 1 problem</span>
          </button>
          <button className={`mock-mode ${mode === "sd" ? "on" : ""}`} onClick={() => switchMode("sd")}>
            <Network size={22} />
            <b>System design</b>
            <span>Design a real system end to end</span>
          </button>
          <button className={`mock-mode ${mode === "behavioral" ? "on" : ""}`} onClick={() => switchMode("behavioral")}>
            <MessagesSquare size={22} />
            <b>Behavioral</b>
            <span>Real stories, STAR answers, follow-ups</span>
          </button>
        </div>
        <div className="mock-fields">
          <label className="mfield">
            <span>{mode === "behavioral" ? "Opening question" : "Problem"}</span>
            <select className="field" value={problemKey} onChange={(e) => setProblemKey(e.target.value)}>
              <option value="random">Surprise me</option>
              {problems.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mfield">
            <span>Company style</span>
            <select className="field" value={company} onChange={(e) => setCompany(e.target.value as Setup["company"])}>
              <option value="general">General</option>
              {COMPANY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {COMPANIES[c].name}
                </option>
              ))}
            </select>
          </label>
          <label className="mfield">
            <span>Level</span>
            <select className="field" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {(Object.keys(LEVELS) as Level[]).map((l) => (
                <option key={l} value={l}>
                  {LEVELS[l]}
                </option>
              ))}
            </select>
          </label>
          {mode === "coding" && (
            <label className="mfield">
              <span>Language</span>
              <select className="field" value={language} onChange={(e) => pickLanguage(e.target.value as Language)}>
                {(Object.keys(LANGUAGE_LABEL) as Language[]).map((l) => (
                  <option key={l} value={l}>
                    {LANGUAGE_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="mfield">
            <span>Length</span>
            <select className="field" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {[30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mock-card">
        <h3>2 · Choose the interviewer's brain</h3>
        <div className="mock-modes">
          <button className={`mock-mode ${settings.kind === "free" ? "on" : ""}`} onClick={() => setSettings({ ...settings, kind: "free" })}>
            <Bot size={22} />
            <b>Free model</b>
            <span>Open model on Cloudflare. Good for practice; a few messages per minute.</span>
          </button>
          <button className={`mock-mode ${settings.kind === "claude" ? "on" : ""}`} onClick={() => setSettings({ ...settings, kind: "claude" })}>
            <KeyRound size={22} />
            <b>Your Claude API key</b>
            <span>A much sharper interviewer and more precise feedback. You pay Anthropic per use.</span>
          </button>
        </div>
        {settings.kind === "claude" && (
          <div className="mock-key">
            <label className="mfield">
              <span>Anthropic API key</span>
              <input
                className="field"
                type="password"
                autoComplete="off"
                placeholder="sk-ant-…"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyState({ kind: "idle" });
                }}
              />
            </label>
            <label className="mfield">
              <span>Model</span>
              <select className="field" value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })}>
                {CLAUDE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mock-key-row">
              <label className="solved-toggle">
                <input
                  type="checkbox"
                  checked={settings.remember}
                  onChange={(e) => {
                    setSettings({ ...settings, remember: e.target.checked });
                    saveKey(apiKey, e.target.checked);
                  }}
                />{" "}
                Remember on this device
              </label>
              <button className="btn" onClick={check} disabled={!apiKey.trim() || keyState.kind === "checking"}>
                {keyState.kind === "checking" ? "Checking…" : "Check key"}
              </button>
            </div>
            {keyState.text && <p className={keyState.kind === "ok" ? "ok" : "gap"}>{keyState.text}</p>}
            <p className="mock-fine">
              No API key? <button className="linky" onClick={() => openUpgrade("mock_key")}>Pro includes Claude</button>.
              Your key goes straight from this browser to Anthropic — this site never sees it. It's kept for this tab only
              unless you tick “Remember”.
            </p>
          </div>
        )}
      </section>

      <button className="mock-pro" onClick={() => openUpgrade("mock_setup")}>
        <Sparkles size={16} />
        <span>
          <b>Pro:</b> Veeru on Claude with no API key, unlimited interviews and deeper scorecards.
        </span>
        <span className="mock-pro-cta">See Pro</span>
      </button>

      <div className="mock-start">
        <button
          className="btn-primary mock-go"
          disabled={!canStart}
          onClick={() =>
            onStart({
              mode,
              problemKey: problemKey === "random" ? randomProblem(mode) : problemKey,
              company,
              level,
              minutes,
              ...(mode === "coding" ? { language } : {}),
            })
          }
        >
          Start interview
        </button>
        {!canStart && <span className="gap">Add your API key, or switch to the free model.</span>}
      </div>

      {history.length > 0 && (
        <section className="mock-card">
          <h3>Past interviews</h3>
          <ul className="mock-history">
            {history.map((h) => (
              <li key={h.id}>
                <button onClick={() => onOpen(h.id)}>
                  <span className="mock-history-title">{problemTitle(h.setup.mode, h.setup.problemKey)}</span>
                  <span className="mock-history-meta">
                    {new Date(h.startedAt).toLocaleDateString()} · {MODE_LABEL[h.setup.mode]}
                  </span>
                  {h.scorecard ? (
                    <span className={`verdict verdict-${verdictClass(h.scorecard.verdict)}`}>
                      {h.scorecard.verdict} · {average(h.scorecard).toFixed(1)}/4
                    </span>
                  ) : (
                    <span className="verdict">Not scored</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const verdictClass = (v: string) => (/strong hire|^hire/i.test(v) ? "good" : /lean/i.test(v) ? "mid" : "bad");

/* ---------------------------------------------------------------- room */

function Room({
  session,
  cfg,
  update,
  onFinish,
  onDiscard,
}: {
  session: Session;
  cfg: ProviderConfig;
  update: (fn: (s: Session) => Session) => void;
  onFinish: (s: Session) => void;
  onDiscard: () => void;
}) {
  const { setup } = session;
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "turn" | "report">("");
  const [testing, setTesting] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => {
    try {
      return localStorage.getItem("prep-mock-voice") === "1";
    } catch {
      return false;
    }
  });
  const voiceRef = useRef(voiceOn);
  voiceRef.current = voiceOn;
  const dictation = useDictation((t) => setInput((v) => (v ? v.replace(/\s*$/, " ") : "") + t));
  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) stopSpeaking();
    try {
      localStorage.setItem("prep-mock-voice", next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };
  useEffect(() => () => stopSpeaking(), []);
  const isCoding = setup.mode === "coding";
  const language: Language = setup.language ?? "javascript";
  const isPython = isCoding && language === "python";
  const indent = isPython ? "    " : "  ";
  // Start downloading Python as soon as a Python interview opens, so the first test run is quick.
  useEffect(() => {
    if (isPython) warmPython();
  }, [isPython]);
  const note = (run: RunSummary | undefined, code: string) => (isCoding ? testNote(run, code) : "");
  const [error, setError] = useState<LlmError | null>(null);
  const [now, setNow] = useState(Date.now());
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const budget = BUDGET[cfg.kind];

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [session.turns.length, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const elapsed = now - session.startedAt;
  const total = setup.minutes * 60_000;
  const left = total - elapsed;
  const candidateTurns = session.turns.filter((t) => t.role === "user").length;

  const runTurn = async (turns: Turn[]) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy("turn");
    setError(null);
    setStreaming("");
    let acc = "";
    try {
      const msgs = buildRequest(setup, turns, session.scratchpad, elapsed / 60_000, budget.turn, note(session.lastRun, session.scratchpad));
      await chatStream(cfg, msgs, (d) => {
        acc += d;
        setStreaming(acc);
      }, { signal: ctrl.signal });
    } catch (e) {
      setError(e instanceof LlmError ? e : new LlmError(String(e)));
    } finally {
      const text = acc.trim();
      if (text) update((s) => ({ ...s, turns: [...turns, { role: "assistant", content: text, at: Date.now() - s.startedAt }] }));
      if (text && voiceRef.current) speak(text);
      setStreaming(null);
      setBusy("");
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    if (dictation.listening) dictation.stop();
    const turns: Turn[] = [...session.turns, { role: "user", content: text, at: Date.now() - session.startedAt }];
    update((s) => ({ ...s, turns }));
    setInput("");
    runTurn(turns);
  };

  const lastIsUser = session.turns[session.turns.length - 1]?.role === "user";

  const runTestsNow = async (): Promise<RunSummary> => {
    setTesting(true);
    try {
      const run = await runInterviewTests(setup.problemKey, session.scratchpad, language);
      update((s) => ({ ...s, lastRun: run }));
      track("tests_run", setup.problemKey, run.total ? run.passed / run.total : 0);
      return run;
    } finally {
      setTesting(false);
    }
  };

  const end = async () => {
    if (candidateTurns === 0) {
      if (confirm("You haven't answered yet — discard this interview?")) onDiscard();
      return;
    }
    if (!confirm("End the interview and get your scorecard?")) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy("report");
    setError(null);
    setStreaming("");
    let acc = "";
    try {
      // Grade the final code, not whatever was last run.
      const finalRun = isCoding && session.scratchpad.trim() ? await runInterviewTests(setup.problemKey, session.scratchpad, language) : session.lastRun;
      const finalNote = isCoding ? `Final hidden tests: ${testNote(finalRun, session.scratchpad).replace(/^Latest test run: /, "")}` : "";
      await chatStream(cfg, reportRequest(setup, session.turns, session.scratchpad, budget.report, finalNote), (d) => {
        acc += d;
        setStreaming(acc);
      }, { signal: ctrl.signal, purpose: "report" });
      const sc = parseScorecard(acc, setup.mode);
      onFinish({ ...session, lastRun: finalRun, endedAt: Date.now(), scorecard: sc ?? undefined, rawReport: sc ? undefined : acc });
    } catch (e) {
      setError(e instanceof LlmError ? e : new LlmError(String(e)));
    } finally {
      setStreaming(null);
      setBusy("");
    }
  };

  return (
    <div className="room">
      <header className="room-head">
        <div>
          <span className="kicker-sm">{MODE_LABEL[setup.mode]} interview</span>
          <h2>{problemTitle(setup.mode, setup.problemKey)}</h2>
        </div>
        <div className={`room-clock ${left < 0 ? "over" : left < 5 * 60_000 ? "warn" : ""}`} title="Time remaining">
          <Clock size={16} /> {left >= 0 ? fmtClock(left) : `+${fmtClock(-left)}`}
        </div>
        <div className="room-actions">
          {canSpeak() && (
            <button className={`btn ${voiceOn ? "on" : ""}`} onClick={toggleVoice} title="Read the interviewer's replies aloud" aria-pressed={voiceOn}>
              {voiceOn ? <Volume2 size={15} /> : <VolumeX size={15} />} Voice {voiceOn ? "on" : "off"}
            </button>
          )}
          <button className="btn" onClick={() => confirm("Discard this interview without a score?") && onDiscard()} disabled={!!busy}>
            <Trash2 size={15} /> Discard
          </button>
          <button className="btn-primary" onClick={end} disabled={!!busy}>
            <Trophy size={15} /> End & get feedback
          </button>
        </div>
      </header>

      <div className="room-body">
        <section className="room-chat">
          <div className="room-log" ref={logRef} aria-live="polite">
            {session.turns.map((t, i) => (
              <Bubble key={i} role={t.role} text={t.content} />
            ))}
            {streaming !== null && busy === "turn" && <Bubble role="assistant" text={streaming || "…"} live />}
            {busy === "report" && (
              <div className="room-grading">
                <span className="spinner" /> Writing your scorecard…
              </div>
            )}
            {error && (
              <div className="callout warn">
                <strong>{error.message}</strong> {error.hint}
                {lastIsUser && busy === "" && (
                  <button className="linky" onClick={() => runTurn(session.turns)}>
                    <RotateCcw size={14} /> Retry
                  </button>
                )}
              </div>
            )}
          </div>
          {(dictation.listening || dictation.error) && (
            <div className={`dictation ${dictation.error ? "err" : ""}`}>
              {dictation.error || (
                <>
                  <span className="rec-dot" /> Listening… {dictation.interim && <i>{dictation.interim}</i>}
                </>
              )}
            </div>
          )}
          <div className="room-input">
            {canDictate() && (
              <button
                className={`btn mic ${dictation.listening ? "on" : ""}`}
                onClick={dictation.listening ? dictation.stop : dictation.start}
                aria-label={dictation.listening ? "Stop dictation" : "Speak your answer"}
                title={dictation.listening ? "Stop dictation" : "Speak your answer"}
              >
                {dictation.listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <textarea
              value={input}
              placeholder={busy ? "Interviewer is replying…" : "Talk to your interviewer — Enter to send, Shift+Enter for a new line"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={3}
            />
            {busy === "turn" ? (
              <button className="btn" onClick={() => abortRef.current?.abort()} aria-label="Stop">
                <Square size={15} /> Stop
              </button>
            ) : (
              <button className="btn-primary" onClick={send} disabled={!input.trim() || !!busy} aria-label="Send">
                <Send size={15} /> Send
              </button>
            )}
          </div>
        </section>

        <section className="room-pad">
          <div className="room-pad-head">
            <div>
              <b>{isCoding ? `Your code (${LANGUAGE_LABEL[language]})` : setup.mode === "sd" ? "Your design notes" : "Your notes"}</b>
              <span>{setup.mode === "behavioral" ? "Private — the interviewer only hears your answers." : "The interviewer sees this with every message."}</span>
            </div>
            {isCoding && (
              <button className="btn" onClick={runTestsNow} disabled={testing || !session.scratchpad.trim()}>
                <FlaskConical size={15} /> {testing ? (isPython && !pythonReady() ? "Loading Python…" : "Running…") : "Run tests"}
              </button>
            )}
          </div>
          <textarea
            className={setup.mode === "coding" ? "mono" : ""}
            spellCheck={setup.mode !== "coding"}
            value={session.scratchpad}
            placeholder={
              setup.mode === "coding"
                ? "function solve(input) {\n  // write your solution here\n}"
                : setup.mode === "sd"
                  ? "Requirements:\n- \n\nEstimates:\n- \n\nAPI:\n- \n\nComponents:\n- client → LB → service → DB"
                  : "Jot down the story you'll tell."
            }
            onChange={(e) => {
              const v = e.target.value;
              update((s) => ({ ...s, scratchpad: v }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const el = e.currentTarget;
                const { selectionStart: a, selectionEnd: b, value } = el;
                const v = value.slice(0, a) + indent + value.slice(b);
                update((s) => ({ ...s, scratchpad: v }));
                requestAnimationFrame(() => el.setSelectionRange(a + indent.length, a + indent.length));
              }
            }}
          />
          {isCoding && session.lastRun && <TestPanel run={session.lastRun} stale={session.lastRun.code.trim() !== session.scratchpad.trim()} />}
        </section>
      </div>
    </div>
  );
}

function Bubble({ role, text, live }: { role: "user" | "assistant"; text: string; live?: boolean }) {
  return (
    <div className={`bubble ${role === "user" ? "me" : "them"} ${live ? "live" : ""}`}>
      <span className="bubble-who">{role === "user" ? "You" : "Interviewer"}</span>
      <div className="bubble-text">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- report */

function Report({
  session,
  onBack,
  onRetry,
  onStudyTopic,
  onOpenDesign,
  onDelete,
}: {
  session: Session;
  onBack: () => void;
  onRetry: () => void;
  onStudyTopic: (k: string) => void;
  onOpenDesign: (k: string) => void;
  onDelete: () => void;
}) {
  const { setup, scorecard: sc } = session;
  const avg = useMemo(() => (sc ? average(sc) : 0), [sc]);
  const minutes = session.endedAt ? Math.round((session.endedAt - session.startedAt) / 60_000) : null;
  const topic = setup.mode === "coding" ? CODING_PROBLEMS.find((p) => p.key === setup.problemKey)?.topic : undefined;
  const [shareMsg, setShareMsg] = useState("");
  const share = async () => {
    if (!sc) return;
    try {
      const r = await shareScorecard(setup, sc);
      if (r !== "cancelled") track("scorecard_shared", `${setup.mode}:${r}`);
      setShareMsg(r === "downloaded" ? "Image saved — attach it to your LinkedIn post." : r === "shared" ? "Shared!" : "");
    } catch (e) {
      setShareMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="report">
      <button className="linky sd-back" onClick={onBack}>
        ← All interviews
      </button>
      <header className="report-head">
        <div>
          <span className="kicker-sm">Scorecard</span>
          <h2>{problemTitle(setup.mode, setup.problemKey)}</h2>
          <p className="hero-sub">
            {new Date(session.startedAt).toLocaleString()}
            {minutes !== null && ` · ${minutes} min`} · {LEVELS[setup.level]}
            {setup.company !== "general" && ` · ${COMPANIES[setup.company].name} style`} ·{" "}
            {session.provider === "claude" ? "Claude" : "free model"}
          </p>
        </div>
        {sc && (
          <div className={`report-verdict verdict-${verdictClass(sc.verdict)}`}>
            <b>{sc.verdict}</b>
            <span>{avg.toFixed(1)} / 4 average</span>
          </div>
        )}
      </header>

      {session.lastRun && setup.mode === "coding" && <TestPanel run={session.lastRun} stale={false} final />}
      {sc ? (
        <>
          {sc.summary && <p className="report-summary">{sc.summary}</p>}
          <section className="report-scores">
            {sc.scores.map((s) => (
              <div key={s.dimension} className="report-score">
                <div className="report-score-head">
                  <b>{s.dimension}</b>
                  <span>{s.score}/4</span>
                </div>
                <div className="pillar-track">
                  <span className={`pillar-fill score-${s.score}`} style={{ width: `${(s.score / 4) * 100}%` }} />
                </div>
                {s.note && <p>{s.note}</p>}
              </div>
            ))}
          </section>
          <div className="report-lists">
            <ListBox title="What went well" items={sc.strengths} cls="use-yes" />
            <ListBox title="What to improve" items={sc.improvements} cls="use-no" />
            <ListBox title="Practise next" items={sc.practice} cls="report-next" />
          </div>
        </>
      ) : (
        <div className="callout">
          <strong>The model didn't return a structured scorecard.</strong> Here's its feedback as written:
          <div className="bubble-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.rawReport || "(empty)"}</ReactMarkdown>
          </div>
        </div>
      )}

      <div className="report-actions">
        <button className="btn-primary" onClick={onRetry}>
          <RotateCcw size={15} /> Try this problem again
        </button>
        {sc && (
          <button className="btn" onClick={share}>
            <Share2 size={15} /> Share scorecard
          </button>
        )}
        {topic && (
          <button className="btn" onClick={() => onStudyTopic(topic)}>
            <BookOpen size={15} /> Study the topic
          </button>
        )}
        {setup.mode === "sd" && (
          <button className="btn" onClick={() => onOpenDesign(setup.problemKey)}>
            <BookOpen size={15} /> Read the walkthrough
          </button>
        )}
        <button className="btn danger" onClick={() => confirm("Delete this interview?") && onDelete()}>
          <Trash2 size={15} /> Delete
        </button>
      </div>

      {shareMsg && <p className="ok">{shareMsg}</p>}

      <details className="report-transcript">
        <summary>Transcript ({session.turns.length} messages)</summary>
        {session.turns.map((t, i) => (
          <Bubble key={i} role={t.role} text={t.content} />
        ))}
        {session.scratchpad.trim() && (
          <>
            <h4>Final scratchpad</h4>
            <pre className="report-pad">{session.scratchpad}</pre>
          </>
        )}
      </details>
    </div>
  );
}

function ListBox({ title, items, cls }: { title: string; items: string[]; cls: string }) {
  if (!items.length) return null;
  return (
    <div className={`sd-box ${cls}`}>
      <h4>{title}</h4>
      <ul>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function TestPanel({ run, stale, final }: { run: RunSummary; stale: boolean; final?: boolean }) {
  const allPass = !run.fatal && run.passed === run.total;
  return (
    <div className={`test-panel ${allPass ? "pass" : "fail"}`} aria-live="polite">
      <div className="test-panel-head">
        {allPass ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        <b>
          {run.fatal ? "Code didn't run" : `${run.passed}/${run.total} hidden tests passed`}
          {final && " with the final code"}
        </b>
        {stale && <span className="test-stale">code changed since this run</span>}
      </div>
      {run.fatal && <p className="test-line">{run.fatal}</p>}
      {run.failing.map((f) => (
        <p key={f} className="test-line">
          {f}
        </p>
      ))}
    </div>
  );
}
