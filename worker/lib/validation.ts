import { z } from "zod";
import { isValidCategoryIconValue } from "../../src/lib/category-icon-registry";

const nonBlankString = z.string().trim().min(1);
const LEGACY_CATEGORY_ICON_KEYS = new Set(["sparkles", "palette", "eye-off", "brain"]);

function isAcceptedCategoryIconValue(value: string): boolean {
  return isValidCategoryIconValue(value) || LEGACY_CATEGORY_ICON_KEYS.has(value);
}

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

export const categoryInputSchema = z.object({
  name: nonBlankString,
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  iconKey: nonBlankString.refine(isAcceptedCategoryIconValue),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
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
