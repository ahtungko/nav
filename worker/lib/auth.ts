import type { Env } from "../types";

const ADMIN_SESSION_COOKIE_NAME = "vyxolabs_admin_session";
const ADMIN_SESSION_TOKEN_VERSION = "v1";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24;

type AdminSessionClaims = {
  iat: number;
  exp: number;
  nonce: string;
};

type BuildAdminSessionTokenOptions = {
  now?: number;
  ttlSeconds?: number;
  nonce?: string;
};

type VerifyAdminSessionTokenOptions = {
  now?: number;
};

export async function verifyPassword(password: string, env: Env): Promise<boolean> {
  return password === env.ADMIN_PASSWORD;
}

function encodeBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return atob(`${normalized}${padding}`);
  } catch {
    return null;
  }
}

async function importAdminSessionKey(env: Env): Promise<CryptoKey | null> {
  if (!env.ADMIN_SESSION_SECRET) {
    return null;
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signAdminSession(input: string, env: Env): Promise<string | null> {
  const key = await importAdminSessionKey(env);
  if (!key) {
    return null;
  }

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseClaims(token: string): { signingInput: string; claims: AdminSessionClaims; signature: string } | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }

  const [version, encodedClaims, signature] = segments;
  if (version !== ADMIN_SESSION_TOKEN_VERSION || !encodedClaims || !signature) {
    return null;
  }

  const decodedClaims = decodeBase64Url(encodedClaims);
  if (!decodedClaims) {
    return null;
  }

  try {
    const claims = JSON.parse(decodedClaims) as Partial<AdminSessionClaims>;
    if (
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number" ||
      typeof claims.nonce !== "string"
    ) {
      return null;
    }

    return {
      signingInput: `${version}.${encodedClaims}`,
      claims: {
        iat: claims.iat,
        exp: claims.exp,
        nonce: claims.nonce,
      },
      signature,
    };
  } catch {
    return null;
  }
}

export async function buildAdminSessionToken(env: Env, options: BuildAdminSessionTokenOptions = {}): Promise<string> {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const ttlSeconds = options.ttlSeconds ?? ADMIN_SESSION_TTL_SECONDS;
  const claims: AdminSessionClaims = {
    iat: now,
    exp: now + ttlSeconds,
    nonce: options.nonce ?? crypto.randomUUID(),
  };

  const signingInput = `${ADMIN_SESSION_TOKEN_VERSION}.${encodeBase64Url(JSON.stringify(claims))}`;
  const signature = await signAdminSession(signingInput, env);

  if (!signature) {
    throw new Error("ADMIN_SESSION_SECRET is required to build an admin session token");
  }

  return `${signingInput}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string,
  env: Env,
  options: VerifyAdminSessionTokenOptions = {},
): Promise<boolean> {
  const parsed = parseClaims(token);
  if (!parsed) {
    return false;
  }

  const expectedSignature = await signAdminSession(parsed.signingInput, env);
  if (!expectedSignature || parsed.signature !== expectedSignature) {
    return false;
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (parsed.claims.exp <= parsed.claims.iat) {
    return false;
  }

  if (parsed.claims.iat > now) {
    return false;
  }

  if (now >= parsed.claims.exp) {
    return false;
  }

  return true;
}

export async function buildAdminSessionCookie(env: Env): Promise<string> {
  const token = await buildAdminSessionToken(env);
  return `${ADMIN_SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`;
}
