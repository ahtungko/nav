import { useEffect, type ReactNode } from "react";
import { applyTheme } from "../../features/theme/apply-theme";
import { useThemeStore } from "../../features/theme/theme-store";
import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

type AppShellProps = {
  children: ReactNode;
  topBarTools?: ReactNode;
};

function getColorSchemeMediaQuery() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-color-scheme: dark)");
}

export function AppShell({ children, topBarTools }: AppShellProps) {
  const preference = useThemeStore((state) => state.preference);

  useEffect(() => {
    const mediaQuery = getColorSchemeMediaQuery();
    const updateTheme = () => {
      applyTheme(preference, mediaQuery?.matches ?? false);
    };

    updateTheme();

    if (!mediaQuery) return;

    const listener = () => updateTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, [preference]);

  return (
    <div className="app-shell">
      <div className="app-shell__scene" aria-hidden="true">
        <span className="app-shell__halo app-shell__halo--a" />
        <span className="app-shell__halo app-shell__halo--b" />
        <span className="app-shell__glow app-shell__glow--a" />
        <span className="app-shell__glow app-shell__glow--b" />
      </div>
      <div className="app-shell__frame">
        <TopBar tools={topBarTools} />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
