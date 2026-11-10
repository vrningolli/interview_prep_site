/* The visitor's answers from the first-visit setup (stored in this browser only). */
import { useLocalStorage } from "./state";
import type { Level } from "./interview/prompts";

export interface Profile {
  onboarded: boolean;
  level: Level;
}

export const PROFILE_KEY = "prep-profile";
export const useProfile = () => useLocalStorage<Profile>(PROFILE_KEY, { onboarded: false, level: "mid" });
