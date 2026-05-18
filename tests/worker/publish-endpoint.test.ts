import { describe, expect, it } from "vitest";
import { env, SELF } from "cloudflare:test";

type CreatedCategory = { id: string };

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

describe("POST /api/admin/publish", () => {
  it("writes a snapshot to KV", async () => {
    const cookie = await loginAsAdmin();

    const categoryResponse = await SELF.fetch("https://example.com/api/admin/categories", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ name: "AI", slug: "ai", iconKey: "ai", sortOrder: 1, isVisible: true }),
    });
    expect(categoryResponse.status).toBe(201);
    const category = (await categoryResponse.json()) as CreatedCategory;

    const websiteResponse = await SELF.fetch("https://example.com/api/admin/websites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ title: "ChatGPT", url: "https://chatgpt.com", categoryId: category.id, sortOrder: 1, isVisible: true }),
    });
    expect(websiteResponse.status).toBe(201);

    const response = await SELF.fetch("https://example.com/api/admin/publish", {
      method: "POST",
      headers: { cookie },
    });
    expect(response.status).toBe(200);
    expect(await env.PUBLIC_SNAPSHOT.get("public-site:v1", "json")).toBeTruthy();
  });
});
