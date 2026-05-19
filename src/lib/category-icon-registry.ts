export const BUILT_IN_CATEGORY_ICON_KEYS = [
  "ai",
  "website",
  "design",
  "resources",
  "dev",
  "productivity",
  "entertainment",
] as const;

export type BuiltInCategoryIconKey = (typeof BUILT_IN_CATEGORY_ICON_KEYS)[number];

export type CategoryIconOption = {
  key: BuiltInCategoryIconKey;
  label: string;
};

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { key: "ai", label: "AI" },
  { key: "website", label: "Website" },
  { key: "design", label: "Design" },
  { key: "resources", label: "Resources" },
  { key: "dev", label: "Dev Tools" },
  { key: "productivity", label: "Productivity" },
  { key: "entertainment", label: "Entertainment" },
];

export const DEFAULT_CATEGORY_ICON_KEY: BuiltInCategoryIconKey = BUILT_IN_CATEGORY_ICON_KEYS[0];

const BUILT_IN_CATEGORY_ICON_KEY_SET = new Set<string>(BUILT_IN_CATEGORY_ICON_KEYS);
const ICONIFY_ICON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:[-._a-z0-9]+)*$/i;

export function isBuiltInCategoryIconKey(value: string | null | undefined): value is BuiltInCategoryIconKey {
  return typeof value === "string" && BUILT_IN_CATEGORY_ICON_KEY_SET.has(value);
}

export function normalizeBuiltInCategoryIconKey(value: string | null | undefined): BuiltInCategoryIconKey {
  return isBuiltInCategoryIconKey(value) ? value : DEFAULT_CATEGORY_ICON_KEY;
}

export function isValidIconifyIconId(value: string | null | undefined) {
  return typeof value === "string" && ICONIFY_ICON_ID_PATTERN.test(value);
}

export function isValidCategoryIconValue(value: string | null | undefined) {
  return isBuiltInCategoryIconKey(value) || isValidIconifyIconId(value);
}

export function splitCategoryIconValue(value: string | null | undefined) {
  if (isBuiltInCategoryIconKey(value)) {
    return {
      builtInIconKey: value,
      customIconifyIconId: "",
    };
  }

  if (isValidIconifyIconId(value)) {
    return {
      builtInIconKey: DEFAULT_CATEGORY_ICON_KEY,
      customIconifyIconId: value,
    };
  }

  return {
    builtInIconKey: DEFAULT_CATEGORY_ICON_KEY,
    customIconifyIconId: "",
  };
}

export function resolveCategoryIconKey(
  builtInIconKey: string | null | undefined,
  customIconifyIconId: string | null | undefined,
) {
  if (isValidIconifyIconId(customIconifyIconId)) {
    return customIconifyIconId;
  }

  return normalizeBuiltInCategoryIconKey(builtInIconKey);
}
