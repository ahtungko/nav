import { describe, expect, it } from "vitest";
import { SELF, env } from "cloudflare:test";
import { buildAdminSessionToken, verifyAdminSessionToken } from "../../worker/lib/auth";

function readSessionToken(setCookie: string): string {
  const [cookie] = setCookie.split(";", 1);
  return cookie.split("=", 2)[1] ?? "";
}

describe("admin session helpers", () => {
  it("builds a token that can be verified and rejects tampering", async () => {
    const token = await buildAdminSessionToken(env, { now: 1_700_000_000, nonce: "nonce-a" });

    await expect(verifyAdminSessionToken(token, env, { now: 1_700_000_100 })).resolves.toBe(true);
    await expect(verifyAdminSessionToken(`${token}tampered`, env, { now: 1_700_000_100 })).resolves.toBe(false);
  });

  it("rejects tokens with extra segments", async () => {
    const token = await buildAdminSessionToken(env, { now: 1_700_000_000, nonce: "nonce-extra" });

    await expect(verifyAdminSessionToken(`${token}.extra`, env, { now: 1_700_000_100 })).resolves.toBe(false);
  });

  it("rejects expired tokens", async () => {
    const token = await buildAdminSessionToken(env, {
      now: 1_700_000_000,
      ttlSeconds: 60,
      nonce: "nonce-b",
    });

    await expect(verifyAdminSessionToken(token, env, { now: 1_700_000_061 })).resolves.toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 204 and sets a verifiable cookie for the correct password", async () => {
    const response = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });

    expect(response.status).toBe(204);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("vyxolabs_admin_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");

    const token = readSessionToken(setCookie!);
    await expect(verifyAdminSessionToken(token, env)).resolves.toBe(true);
  });

  it("emits a fresh token on each successful login", async () => {
    const first = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });

    const second = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });

    const firstToken = readSessionToken(first.headers.get("set-cookie")!);
    const secondToken = readSessionToken(second.headers.get("set-cookie")!);

    expect(firstToken).not.toBe(secondToken);
    await expect(verifyAdminSessionToken(firstToken, env)).resolves.toBe(true);
    await expect(verifyAdminSessionToken(secondToken, env)).resolves.toBe(true);
  });

  it("returns 401 for an invalid password", async () => {
    const response = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_credentials" });
  });

  it("returns 400 for a missing password", async () => {
    const response = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("returns 400 for malformed json", async () => {
    const response = await SELF.fetch("https://example.com/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});
