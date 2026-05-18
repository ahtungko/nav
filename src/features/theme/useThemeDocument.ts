import { useEffect } from "react";
import { APP_ROUTE_ATTRIBUTE } from "../../lib/constants";
import { applyTheme } from "./apply-theme";
import { useThemeStore } from "./theme-store";

type RouteMode = "admin" | "public";

function getColorSchemeMediaQuery() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-color-scheme: dark)");
}

export function useThemeDocument(routeMode: RouteMode) {
  const preference = useThemeStore((state) => state.preference);

  useEffect(() => {
    document.body.setAttribute(APP_ROUTE_ATTRIBUTE, routeMode);

    const mediaQuery = getColorSchemeMediaQuery();
    const updateTheme = () => {
      applyTheme(preference, mediaQuery?.matches ?? false);
    };

    updateTheme();

    if (!mediaQuery) {
      return () => document.body.removeAttribute(APP_ROUTE_ATTRIBUTE);
    }

    const listener = () => updateTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }

      document.body.removeAttribute(APP_ROUTE_ATTRIBUTE);
    };
  }, [preference, routeMode]);
}
