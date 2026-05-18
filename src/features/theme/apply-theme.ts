import { THEME_ATTRIBUTE } from "../../lib/constants";
import { RESOLVED_THEMES, THEME_ATTRIBUTE_VALUES } from "./theme-tokens";
import { resolveTheme, type ThemePreference, type ResolvedTheme } from "./theme-store";

export function applyTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
  root: HTMLElement = document.documentElement,
): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference, systemPrefersDark);
  const attributeValue = RESOLVED_THEMES.includes(resolvedTheme)
    ? THEME_ATTRIBUTE_VALUES[resolvedTheme]
    : THEME_ATTRIBUTE_VALUES.day;

  root.setAttribute(THEME_ATTRIBUTE, attributeValue);
  return resolvedTheme;
}
