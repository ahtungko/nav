import { describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";

type CreatedCategory = { id: string };
type CreatedWebsite = { id: string; title: string; faviconUrl?: string | null };

async function loginAsAdmin(): Promise<string> {
  const response = await SELF.fetch("https://example.com/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "secret" }),
  });

  expect(response.status).toBe(204);
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();

  return setCookie!.split(";", 1)[0]!;
}

async function createCategory(cookie: string): Promise<CreatedCategory> {
  const response = await SELF.fetch("https://example.com/api/admin/categories", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({ name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1, isVisible: true }),
  });

  expect(response.status).toBe(201);
  return (await response.json()) as CreatedCategory;
}

async function listWebsites(cookie: string): Promise<CreatedWebsite[]> {
  const response = await SELF.fetch("https://example.com/api/admin/websites", {
    headers: { cookie },
  });

  expect(response.status).toBe(200);
  return (await response.json()) as CreatedWebsite[];
}

describe("POST /api/admin/websites", () => {
  it("creates a website for an authenticated admin", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "ChatGPT", url: "https://chatgpt.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });
    expect(response.status).toBe(201);
  });

  it("lists websites in category sort-order, not raw category id order", async () => {
    const cookie = await loginAsAdmin();
    const now = "2026-05-18T00:00:00.000Z";

    await env.DB.prepare(
      `INSERT INTO categories (id, name, slug, icon_key, sort_order, is_visible, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6), (?7, ?8, ?9, ?10, ?11, 1, ?6, ?6)`,
    )
      .bind(
        "cat_zeta",
        "Alpha Category",
        "alpha",
        "alpha",
        1,
        now,
        "cat_alpha",
        "Beta Category",
        "beta",
        "beta",
        2,
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO websites (id, title, url, category_id, sort_order, is_visible, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6), (?7, ?8, ?9, ?10, ?11, 1, ?6, ?6)`,
    )
      .bind(
        "site_beta",
        "Beta Site",
        "https://beta.example.com",
        "cat_alpha",
        1,
        now,
        "site_alpha",
        "Alpha Site",
        "https://alpha.example.com",
        "cat_zeta",
        1,
      )
      .run();

    const payload = await listWebsites(cookie);
    expect(payload.map((website) => website.title)).toEqual(["Alpha Site", "Beta Site"]);
  });

  it("rejects a whitespace-only website title", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "   ", url: "https://chatgpt.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects unsafe javascript urls", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "Evil", url: "javascript:alert(1)", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects unsafe data urls on update", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const createResponse = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "ChatGPT", url: "https://chatgpt.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as CreatedWebsite;

    const updateResponse = await SELF.fetch(`https://example.com/api/admin/websites/${created.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "ChatGPT", url: "data:text/html,boom", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });

    expect(updateResponse.status).toBe(400);
    expect(await updateResponse.json()).toEqual({ error: "invalid_request" });
  });

  it("persists a custom favicon url when creating a website", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "https://static.example.com/gemini.png",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(response.status).toBe(201);
    const websites = await listWebsites(cookie);
    expect(websites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Gemini",
          faviconUrl: "https://static.example.com/gemini.png",
        }),
      ]),
    );
  });

  it("rejects unsafe favicon override urls", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const response = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "javascript:alert(1)",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("persists a custom favicon url when updating a website", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const createResponse = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "Gemini", url: "https://gemini.google.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as CreatedWebsite;

    const updateResponse = await SELF.fetch(`https://example.com/api/admin/websites/${created.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "https://static.example.com/gemini.png",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toEqual(
      expect.objectContaining({
        faviconUrl: "https://static.example.com/gemini.png",
      }),
    );

    const websites = await listWebsites(cookie);
    expect(websites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          faviconUrl: "https://static.example.com/gemini.png",
        }),
      ]),
    );
  });

  it("rejects unsafe favicon override urls on update", async () => {
    const cookie = await loginAsAdmin();
    const category = await createCategory(cookie);

    const createResponse = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "Gemini", url: "https://gemini.google.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as CreatedWebsite;

    const updateResponse = await SELF.fetch(`https://example.com/api/admin/websites/${created.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "Gemini",
        url: "https://gemini.google.com",
        faviconUrl: "javascript:alert(1)",
        categoryId: category.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });

    expect(updateResponse.status).toBe(400);
    expect(await updateResponse.json()).toEqual({ error: "invalid_request" });
  });
});
