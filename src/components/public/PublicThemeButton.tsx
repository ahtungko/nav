import { useThemeStore, type ThemePreference } from "../../features/theme/theme-store";

const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  auto: "day",
  day: "night",
  night: "auto",
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
      className="public-theme-button"
      aria-label={`Theme settings (${LABELS[preference]})`}
      title={`Theme: ${LABELS[preference]}`}
      onClick={() => setPreference(NEXT_THEME[preference])}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.5v2.3M12 19.2v2.3M21.5 12h-2.3M4.8 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2L5.6 5.6" />
      </svg>
    </button>
  );
}
