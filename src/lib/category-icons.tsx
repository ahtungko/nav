import type { JSX } from "react";

type CategoryIconOption = {
  key: string;
  label: string;
  icon: JSX.Element;
};

function createIcon(iconKey: string): JSX.Element {
  switch (iconKey) {
    case "ai":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="12" r="2.5" />
          <circle cx="15" cy="12" r="2.5" />
          <path d="M3.5 12h3M17.5 12h3M9 5.5v2M15 5.5v2M9 16.5v2M15 16.5v2" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2.5 2.2 3.7 4.9 3.7 8S14.5 17.8 12 20M12 4c-2.5 2.2-3.7 4.9-3.7 8S9.5 17.8 12 20" />
        </svg>
      );
    case "design":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4a8 8 0 1 1 0 16h-1.2a2.4 2.4 0 0 1 0-4.8h1.7A2.5 2.5 0 0 0 15 12.7A2.5 2.5 0 0 0 12.5 10h-.3a2.8 2.8 0 0 1 0-5.6H12Z" />
          <circle cx="8" cy="11" r="1" />
          <circle cx="10.5" cy="7.5" r="1" />
          <circle cx="14.5" cy="7.5" r="1" />
        </svg>
      );
    case "resources":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5.5h8a2.5 2.5 0 0 1 2.5 2.5v10.5L12 16l-4.5 2.5V8A2.5 2.5 0 0 0 5 5.5Z" />
          <path d="M7.5 8h7M7.5 11h7M7.5 14h4.5" />
        </svg>
      );
    case "dev":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8l-4 4l4 4M16 8l4 4l-4 4M13.5 5l-3 14" />
        </svg>
      );
    case "productivity":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.6 5.3l5.9.8l-4.2 4.1l1 5.8L12 16.2L6.7 19l1-5.8l-4.2-4.1l5.9-.8L12 3Z" />
        </svg>
      );
    case "entertainment":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 7.5h11a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14v-4a2.5 2.5 0 0 1 2.5-2.5Z" />
          <path d="M10 10l4 2l-4 2Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M12 5v14" />
        </svg>
      );
  }
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "ai", label: "AI", icon: createIcon("ai") },
  { key: "website", label: "Website", icon: createIcon("website") },
  { key: "design", label: "Design", icon: createIcon("design") },
  { key: "resources", label: "Resources", icon: createIcon("resources") },
  { key: "dev", label: "Dev Tools", icon: createIcon("dev") },
  { key: "productivity", label: "Productivity", icon: createIcon("productivity") },
  { key: "entertainment", label: "Entertainment", icon: createIcon("entertainment") },
];

const FALLBACK_CATEGORY_ICON_OPTION: CategoryIconOption = {
  key: "fallback",
  label: "Fallback",
  icon: createIcon("fallback"),
};

export function getCategoryIconOption(iconKey: string | null | undefined): CategoryIconOption {
  return CATEGORY_ICON_OPTIONS.find((option) => option.key === iconKey) ?? FALLBACK_CATEGORY_ICON_OPTION;
}

export function renderCategoryIcon(iconKey: string | null | undefined) {
  return getCategoryIconOption(iconKey).icon;
}

export function getCategoryIconClassName(iconKey: string | null | undefined) {
  return `category-card__icon--${getCategoryIconOption(iconKey).key}`;
}
