import { create } from "zustand";

export type ThemePreference = "auto" | "day" | "night";
export type ResolvedTheme = "day" | "night";

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "day") return "day";
  if (preference === "night") return "night";
  return systemPrefersDark ? "night" : "day";
}

export const useThemeStore = create<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}>((set) => ({
  preference: "auto",
  setPreference: (preference) => set({ preference }),
}));
