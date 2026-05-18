import { create } from "zustand";
import { STORAGE_KEYS } from "../../lib/constants";
import { readJsonStorage, writeJsonStorage } from "../../lib/local-storage";

export type ThemePreference = "auto" | "day" | "night";
export type ResolvedTheme = "day" | "night";
type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const DEFAULT_THEME_PREFERENCE: ThemePreference = "auto";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "auto" || value === "day" || value === "night";
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;

  const value = readJsonStorage<unknown>(STORAGE_KEYS.theme, DEFAULT_THEME_PREFERENCE);
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "day") return "day";
  if (preference === "night") return "night";
  return systemPrefersDark ? "night" : "day";
}

export function createThemeStore(initialPreference: ThemePreference = readStoredThemePreference()) {
  return create<ThemeState>((set) => ({
    preference: initialPreference,
    setPreference: (preference) => {
      if (typeof window !== "undefined") {
        writeJsonStorage(STORAGE_KEYS.theme, preference);
      }

      set({ preference });
    },
  }));
}

export const useThemeStore = createThemeStore();
