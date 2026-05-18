import { describe, expect, it } from "vitest";
import { SELF } from "cloudflare:test";

type CreatedCategory = {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  isVisible: boolean;
};

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

async function createCategory(cookie: string, payload?: Partial<{ name: string; slug: string; iconKey: string; sortOrder: number; isVisible: boolean }>) {
  const response = await SELF.fetch("https://example.com/api/admin/categories", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      name: "AI",
      slug: "ai",
      iconKey: "ai",
      sortOrder: 1,
      isVisible: true,
      ...payload,
    }),
  });

  return response;
}

describe("POST /api/admin/categories", () => {
  it("rejects forged cookie values", async () => {
    const response = await SELF.fetch("https://example.com/api/admin/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "vyxolabs_admin_session=valid",
      },
      body: JSON.stringify({ name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1, isVisible: true }),
    });

    expect(response.status).toBe(401);
  });

  it("creates a category for an authenticated admin with an id independent of slug", async () => {
    const cookie = await loginAsAdmin();

    const response = await createCategory(cookie);
    expect(response.status).toBe(201);

    const created = (await response.json()) as CreatedCategory;
    expect(created.id).not.toBe("cat_ai");
    expect(created.slug).toBe("ai");
  });

  it("allows slug reuse after a category slug is edited", async () => {
    const cookie = await loginAsAdmin();

    const createResponse = await createCategory(cookie);
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as CreatedCategory;

    const updateResponse = await SELF.fetch(`https://example.com/api/admin/categories/${created.id}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        name: "Machine Learning",
        slug: "ml",
        iconKey: "sparkles",
        sortOrder: 2,
        isVisible: true,
      }),
    });
    expect(updateResponse.status).toBe(200);

    const reuseResponse = await createCategory(cookie, {
      name: "AI Again",
      slug: "ai",
      iconKey: "brain",
      sortOrder: 3,
    });
    expect(reuseResponse.status).toBe(201);
  });

  it("blocks deleting a category that still has websites", async () => {
    const cookie = await loginAsAdmin();

    const createResponse = await createCategory(cookie);
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as CreatedCategory;

    const websiteResponse = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        title: "ChatGPT",
        url: "https://chatgpt.com",
        categoryId: created.id,
        sortOrder: 1,
        isVisible: true,
      }),
    });
    expect(websiteResponse.status).toBe(201);

    const deleteResponse = await SELF.fetch(`https://example.com/api/admin/categories/${created.id}`, {
      method: "DELETE",
      headers: { cookie },
    });

    expect(deleteResponse.status).toBe(409);
    expect(await deleteResponse.json()).toEqual({ error: "category_has_websites" });
  });

  it("rejects an invalid category payload", async () => {
    const cookie = await loginAsAdmin();

    const response = await createCategory(cookie, { slug: "AI" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects a whitespace-only category name", async () => {
    const cookie = await loginAsAdmin();

    const response = await createCategory(cookie, { name: "   " });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("rejects a whitespace-only category icon key", async () => {
    const cookie = await loginAsAdmin();

    const response = await createCategory(cookie, { iconKey: "   " });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});
