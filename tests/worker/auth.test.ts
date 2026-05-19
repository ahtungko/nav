import { describe, expect, it } from "vitest";
import { SELF, env } from "cloudflare:test";
import { buildAdminSessionToken, verifyAdminSessionToken, verifyPassword } from "../../worker/lib/auth";
import type { Env } from "../../worker/types";

function readSessionToken(setCookie: string): string {
  const [cookie] = setCookie.split(";", 1);
  return cookie.split("=", 2)[1] ?? "";
}

describe("admin session helpers", () => {
  it("signs and verifies with ADMIN_SESSION_SECRET rather than ADMIN_PASSWORD", async () => {
    const token = await buildAdminSessionToken(env, { now: 1_700_000_000, nonce: "nonce-a" });

    const differentPasswordEnv = {
      ...env,
      ADMIN_PASSWORD: "different-password",
    } satisfies Env;
    const differentSecretEnv = {
      ...env,
      ADMIN_SESSION_SECRET: "different-session-secret",
    } satisfies Env;

    await expect(verifyPassword("secret", env)).resolves.toBe(true);
    await expect(verifyPassword("session-secret", env)).resolves.toBe(false);
    await expect(verifyAdminSessionToken(token, differentPasswordEnv, { now: 1_700_000_100 })).resolves.toBe(true);
    await expect(verifyAdminSessionToken(token, differentSecretEnv, { now: 1_700_000_100 })).resolves.toBe(false);
  });

  it("rejects tampering", async () => {
    const token = await buildAdminSessionToken(env, { now: 1_700_000_000, nonce: "nonce-tamper" });

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

  it("throws when ADMIN_SESSION_SECRET is missing during build", async () => {
    const missingSecretEnv = {
      ...env,
      ADMIN_SESSION_SECRET: undefined,
    } satisfies Env;

    await expect(buildAdminSessionToken(missingSecretEnv)).rejects.toThrow(
      "ADMIN_SESSION_SECRET is required to build an admin session token",
    );
  });

  it("returns false when ADMIN_SESSION_SECRET is missing during verify", async () => {
    const token = await buildAdminSessionToken(env, { now: 1_700_000_000, nonce: "nonce-missing-secret" });
    const missingSecretEnv = {
      ...env,
      ADMIN_SESSION_SECRET: undefined,
    } satisfies Env;

    await expect(verifyAdminSessionToken(token, missingSecretEnv, { now: 1_700_000_100 })).resolves.toBe(false);
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
