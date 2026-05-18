import { THEME_PREFERENCES } from "../../features/theme/theme-tokens";
import { useThemeStore, type ThemePreference } from "../../features/theme/theme-store";

const LABELS: Record<ThemePreference, string> = {
  auto: "Auto",
  day: "Day",
  night: "Night",
};

export function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div className="theme-toggle" role="group" aria-label="Theme mode">
      {THEME_PREFERENCES.map((option) => (
        <button
          key={option}
          type="button"
          className={`theme-toggle__option${preference === option ? " is-active" : ""}`}
          aria-pressed={preference === option}
          onClick={() => setPreference(option)}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
