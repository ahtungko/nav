import type { PublishedSnapshot } from "../../src/types/snapshot";
import type { CategoryRow, WebsiteRow } from "../types";

export function buildPublishedSnapshot(input: {
  categories: CategoryRow[];
  websites: WebsiteRow[];
  publishedAt: string;
}): PublishedSnapshot {
  const publishedCategories = input.categories
    .filter((category) => category.is_visible === 1)
    .sort((a, b) => a.sort_order - b.sort_order);

  const publishedCategoryIds = new Set(publishedCategories.map((category) => category.id));
  const publishedCategoryOrder = new Map(
    publishedCategories.map((category, index) => [category.id, index] as const),
  );

  return {
    version: 1,
    publishedAt: input.publishedAt,
    categories: publishedCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      iconKey: category.icon_key,
      sortOrder: category.sort_order,
    })),
    websites: input.websites
      .filter((website) => website.is_visible === 1 && publishedCategoryIds.has(website.category_id))
      .sort(
        (a, b) =>
          (publishedCategoryOrder.get(a.category_id) ?? Number.MAX_SAFE_INTEGER) -
            (publishedCategoryOrder.get(b.category_id) ?? Number.MAX_SAFE_INTEGER) ||
          a.sort_order - b.sort_order,
      )
      .map((website) => ({
        id: website.id,
        title: website.title,
        url: website.url,
        categoryId: website.category_id,
        sortOrder: website.sort_order,
        createdAt: website.created_at,
      })),
  };
}
