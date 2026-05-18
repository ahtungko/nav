import type { ResolvedTheme, ThemePreference } from "./theme-store";

export const THEME_PREFERENCES: ThemePreference[] = ["auto", "day", "night"];
export const RESOLVED_THEMES: ResolvedTheme[] = ["day", "night"];
export const THEME_ATTRIBUTE_VALUES: Record<ResolvedTheme, string> = {
  day: "day",
  night: "night",
};
