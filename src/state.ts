import { useEffect, useState } from "react";

/** useState persisted to localStorage under the given key. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [key, value]);
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
