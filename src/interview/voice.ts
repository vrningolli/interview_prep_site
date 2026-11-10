/* Voice mode for the mock interview, using the browser's built-in Web Speech API
   (free, nothing leaves the browser except what the browser's own speech service
   does). Dictation: SpeechRecognition (Chrome, Edge, Safari incl. iOS). Read-aloud:
   speechSynthesis (all modern browsers). */
import { useCallback, useEffect, useRef, useState } from "react";

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

const RecognitionCtor = (): (new () => Recognition) | undefined => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const canDictate = () => typeof window !== "undefined" && !!RecognitionCtor();
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Dictation into a text box. `onFinal` receives each finished phrase. */
export function useDictation(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = RecognitionCtor();
    if (!Ctor) return;
    stopSpeaking(); // don't transcribe the interviewer's own voice
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current(r[0].transcript.trim());
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Microphone permission was denied.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setError(`Voice input error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    setError("");
    setListening(true);
    rec.start();
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);
  return { listening, interim, error, start, stop };
}

/** Markdown → something pleasant to hear. */
export function speakable(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " (see the code on screen) ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*|__|\*|_|#+\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/→/g, " gives ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(md: string) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(speakable(md));
  const lang = navigator.language || "en-US";
  const voices = synth.getVoices();
  u.voice = voices.find((v) => v.lang === lang && /natural|neural|google|samantha/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2))) ?? null;
  u.rate = 1.03;
  synth.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
