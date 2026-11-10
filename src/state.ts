import { useEffect, useRef, useState } from "react";

const SYNC_EVENT = "prep-storage-sync";

/** useState persisted to localStorage under the given key.

    Every hook instance using the same key stays in sync: a write broadcasts an event
    that other instances (on this page) pick up, and the browser's `storage` event does
    the same across tabs. Without this, two components reading the same key would each
    keep a private copy — e.g. a screen mounted mid-update would show stale data. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const latest = useRef(value);
  latest.current = value;

  // Persist, and tell other instances when the stored value actually changed.
  useEffect(() => {
    try {
      const raw = JSON.stringify(value);
      if (localStorage.getItem(key) !== raw) {
        localStorage.setItem(key, raw);
        window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }));
      }
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [key, value]);

  // Adopt values written by other instances (this page) or other tabs.
  useEffect(() => {
    const pull = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null && raw !== JSON.stringify(latest.current)) setValue(JSON.parse(raw) as T);
      } catch {
        /* unreadable — keep what we have */
      }
    };
    const onSync = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) pull();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) pull();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  return [value, setValue] as const;
}

/** A persisted Set<string> with a toggle helper (learned topics, solved problems). */
export function useStoredSet(key: string) {
  const [items, setItems] = useLocalStorage<string[]>(key, []);
  const set = new Set(items);
  const toggle = (id: string) =>
    setItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return [...next];
    });
  return { set, toggle };
}
