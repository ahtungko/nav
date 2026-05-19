import { useThemeStore, type ThemePreference } from "../../features/theme/theme-store";

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  auto: "day",
  day: "night",
  night: "auto",
};

const ICONS: Record<ThemePreference, string> = {
  auto: "🌸",
  day: "☀️",
  night: "🌙",
};

const LABELS: Record<ThemePreference, string> = {
  auto: "Auto",
  day: "Day",
  night: "Night",
};

export function PublicThemeButton() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <button
      type="button"
      className="btn-icon"
      aria-label={`Theme: ${LABELS[preference]}`}
      title={`Theme: ${LABELS[preference]}`}
      onClick={() => setPreference(NEXT_THEME[preference])}
    >
      <span style={{ fontSize: "1rem", lineHeight: 1 }}>{ICONS[preference]}</span>
    </button>
  );
}
