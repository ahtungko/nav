import { z } from "zod";

const publishedCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  iconKey: z.string().min(1),
  sortOrder: z.number(),
});

const publishedWebsiteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  faviconUrl: z.string().min(1).nullable().optional(),
  categoryId: z.string().min(1),
  sortOrder: z.number(),
  createdAt: z.string().min(1),
});

export const publishedSnapshotSchema = z.object({
  version: z.literal(1),
  publishedAt: z.string().min(1),
  categories: z.array(publishedCategorySchema),
  websites: z.array(publishedWebsiteSchema),
});

export type PublishedSnapshot = z.infer<typeof publishedSnapshotSchema>;

export function parsePublishedSnapshot(input: unknown): PublishedSnapshot {
  return publishedSnapshotSchema.parse(input);
}
