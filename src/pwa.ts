/// <reference types="vite/client" />
/* Installable app support: service worker registration and the install prompt.
   Chrome/Edge/Android fire `beforeinstallprompt`; iOS Safari has no prompt, so we
   show "Share → Add to Home Screen" instructions there instead. */
import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

export function initPwa() {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support is a bonus; never break the app over it */
    });
  });
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((f) => f());
  });
}

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** "prompt": a native install dialog is available · "ios": show Add-to-Home-Screen steps · null: nothing to offer. */
export function useInstall(): { kind: "prompt" | "ios" | null; install: () => Promise<void> } {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  if (isStandalone()) return { kind: null, install: async () => {} };
  if (deferred) {
    return {
      kind: "prompt",
      install: async () => {
        const ev = deferred;
        deferred = null;
        await ev?.prompt();
        force((n) => n + 1);
      },
    };
  }
  return { kind: isIos() ? "ios" : null, install: async () => {} };
}
