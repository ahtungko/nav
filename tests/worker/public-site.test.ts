import { beforeEach, describe, expect, it } from "vitest";
import { SELF, env } from "cloudflare:test";
import { PUBLIC_SNAPSHOT_KEY } from "../../worker/lib/kv";
import type { PublishedSnapshot } from "../../src/types/snapshot";

const snapshot: PublishedSnapshot = {
  version: 1,
  publishedAt: "2026-05-18T01:00:00.000Z",
  categories: [
    { id: "cat-1", name: "AI", slug: "ai", iconKey: "sparkles", sortOrder: 1 },
  ],
  websites: [
    {
      id: "site-1",
      title: "ChatGPT",
      url: "https://chatgpt.com",
      categoryId: "cat-1",
      sortOrder: 1,
      createdAt: "2026-05-18T00:00:00.000Z",
    },
  ],
};

beforeEach(async () => {
  await env.PUBLIC_SNAPSHOT.delete(PUBLIC_SNAPSHOT_KEY);
});

describe("GET /api/public/site", () => {
  it("returns 503 before any snapshot exists", async () => {
    const response = await SELF.fetch("https://example.com/api/public/site");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "snapshot_not_published" });
  });

  it("returns the published snapshot with cache headers when present", async () => {
    await env.PUBLIC_SNAPSHOT.put(PUBLIC_SNAPSHOT_KEY, JSON.stringify(snapshot));

    const response = await SELF.fetch("https://example.com/api/public/site");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=300");
    expect(await response.json()).toEqual(snapshot);
  });

  it("rejects non-GET requests with 405", async () => {
    const response = await SELF.fetch("https://example.com/api/public/site", {
      method: "POST",
    });

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
  });
});
