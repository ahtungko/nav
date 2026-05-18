import { describe, expect, it } from "vitest";
import { buildPublishedSnapshot } from "../../worker/lib/snapshot";

describe("buildPublishedSnapshot", () => {
  it("publishes only visible categories and websites with correct field mapping and published category ordering", () => {
    const snapshot = buildPublishedSnapshot({
      categories: [
        { id: "m-category", name: "Design", slug: "design", icon_key: "palette", sort_order: 3, is_visible: 1, created_at: "", updated_at: "" },
        { id: "a-hidden", name: "Hidden", slug: "hidden", icon_key: "eye-off", sort_order: 2, is_visible: 0, created_at: "", updated_at: "" },
        { id: "z-category", name: "AI", slug: "ai", icon_key: "sparkles", sort_order: 1, is_visible: 1, created_at: "", updated_at: "" },
      ],
      websites: [
        { id: "w6", title: "Orphan", url: "https://orphan.example", category_id: "missing-category", sort_order: 1, is_visible: 1, created_at: "2026-05-12T00:00:00.000Z", updated_at: "" },
        { id: "w5", title: "Hidden Category Site", url: "https://hidden.example", category_id: "a-hidden", sort_order: 1, is_visible: 1, created_at: "2026-05-13T00:00:00.000Z", updated_at: "" },
        { id: "w4", title: "Figma", url: "https://figma.com", category_id: "m-category", sort_order: 1, is_visible: 1, created_at: "2026-05-14T00:00:00.000Z", updated_at: "" },
        { id: "w3", title: "Hidden Website", url: "https://hidden-site.example", category_id: "z-category", sort_order: 3, is_visible: 0, created_at: "2026-05-15T00:00:00.000Z", updated_at: "" },
        { id: "w2", title: "Claude", url: "https://claude.ai", category_id: "z-category", sort_order: 1, is_visible: 1, created_at: "2026-05-16T00:00:00.000Z", updated_at: "" },
        { id: "w1", title: "ChatGPT", url: "https://chatgpt.com", category_id: "z-category", sort_order: 2, is_visible: 1, created_at: "2026-05-17T00:00:00.000Z", updated_at: "" },
      ],
      publishedAt: "2026-05-18T01:00:00.000Z",
    });

    expect(snapshot.version).toBe(1);
    expect(snapshot.publishedAt).toBe("2026-05-18T01:00:00.000Z");

    expect(snapshot.categories).toEqual([
      { id: "z-category", name: "AI", slug: "ai", iconKey: "sparkles", sortOrder: 1 },
      { id: "m-category", name: "Design", slug: "design", iconKey: "palette", sortOrder: 3 },
    ]);

    expect(snapshot.websites).toEqual([
      {
        id: "w2",
        title: "Claude",
        url: "https://claude.ai",
        categoryId: "z-category",
        sortOrder: 1,
        createdAt: "2026-05-16T00:00:00.000Z",
      },
      {
        id: "w1",
        title: "ChatGPT",
        url: "https://chatgpt.com",
        categoryId: "z-category",
        sortOrder: 2,
        createdAt: "2026-05-17T00:00:00.000Z",
      },
      {
        id: "w4",
        title: "Figma",
        url: "https://figma.com",
        categoryId: "m-category",
        sortOrder: 1,
        createdAt: "2026-05-14T00:00:00.000Z",
      },
    ]);
  });
});
