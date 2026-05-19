import { z } from "zod";
import { isValidCategoryIconValue } from "../../src/lib/category-icon-registry";

const nonBlankString = z.string().trim().min(1);
const LEGACY_CATEGORY_ICON_KEYS = new Set(["sparkles", "palette", "eye-off", "brain"]);

export function isLegacyCategoryIconKey(value: string | null | undefined): boolean {
  return typeof value === "string" && LEGACY_CATEGORY_ICON_KEYS.has(value);
}

const categoryInputShape = {
  name: nonBlankString,
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
} as const;

const safeWebsiteUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Expected an http or https url");

const optionalSafeWebsiteUrlSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, safeWebsiteUrlSchema.nullable().optional());

export const categoryCreateInputSchema = z.object({
  ...categoryInputShape,
  iconKey: nonBlankString.refine(isValidCategoryIconValue),
});

export const categoryUpdateInputSchema = z.object({
  ...categoryInputShape,
  iconKey: nonBlankString,
});

export const websiteInputSchema = z.object({
  title: nonBlankString,
  url: safeWebsiteUrlSchema,
  faviconUrl: optionalSafeWebsiteUrlSchema,
  categoryId: z.string().min(1),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
});

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function readString(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}
