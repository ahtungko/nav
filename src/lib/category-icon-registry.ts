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
export type IconifyIconId = string & { readonly __iconifyIconId: unique symbol };
export type CategoryIconValue = BuiltInCategoryIconKey | IconifyIconId;

export type BuiltInCategoryIconOption = {
  kind: "built-in";
  key: BuiltInCategoryIconKey;
  label: string;
};

export type CustomCategoryIconOption = {
  kind: "custom";
  key: IconifyIconId;
  label: string;
};

export type CategoryIconOption = BuiltInCategoryIconOption | CustomCategoryIconOption;

export const CATEGORY_ICON_OPTIONS: BuiltInCategoryIconOption[] = [
  { kind: "built-in", key: "ai", label: "AI" },
  { kind: "built-in", key: "website", label: "Website" },
  { kind: "built-in", key: "design", label: "Design" },
  { kind: "built-in", key: "resources", label: "Resources" },
  { kind: "built-in", key: "dev", label: "Dev Tools" },
  { kind: "built-in", key: "productivity", label: "Productivity" },
  { kind: "built-in", key: "entertainment", label: "Entertainment" },
];

export const DEFAULT_CATEGORY_ICON_KEY: BuiltInCategoryIconKey = BUILT_IN_CATEGORY_ICON_KEYS[0];

const BUILT_IN_CATEGORY_ICON_KEY_SET = new Set<string>(BUILT_IN_CATEGORY_ICON_KEYS);
const ICONIFY_ICON_ID_PATTERN = /^(?:@[a-z0-9]+(?:-[a-z0-9]+)*:)?[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isBuiltInCategoryIconKey(value: string | null | undefined): value is BuiltInCategoryIconKey {
  return typeof value === "string" && BUILT_IN_CATEGORY_ICON_KEY_SET.has(value);
}

export function normalizeBuiltInCategoryIconKey(value: string | null | undefined): BuiltInCategoryIconKey {
  return isBuiltInCategoryIconKey(value) ? value : DEFAULT_CATEGORY_ICON_KEY;
}

export function isValidIconifyIconId(value: string | null | undefined): value is IconifyIconId {
  return typeof value === "string" && ICONIFY_ICON_ID_PATTERN.test(value);
}

export function isValidCategoryIconValue(value: string | null | undefined): value is CategoryIconValue {
  return isBuiltInCategoryIconKey(value) || isValidIconifyIconId(value);
}

export function splitCategoryIconValue(value: string | null | undefined): {
  builtInIconKey: BuiltInCategoryIconKey;
  customIconifyIconId: IconifyIconId | "";
} {
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
): CategoryIconValue {
  if (isValidIconifyIconId(customIconifyIconId)) {
    return customIconifyIconId;
  }

  return normalizeBuiltInCategoryIconKey(builtInIconKey);
}
