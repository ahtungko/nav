import type { Env } from "../types";
import { buildAdminSessionCookie, verifyPassword } from "../lib/auth";
import { jsonError, noContent } from "../lib/response";
import { readJson, readString } from "../lib/validation";

export async function handleAuthRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError("method_not_allowed", 405);
  }

  const body = await readJson(request);
  const password = readString(body, "password");

  if (password === null) {
    return jsonError("invalid_request", 400);
  }

  const isValid = await verifyPassword(password, env);

  if (!isValid) {
    return jsonError("invalid_credentials", 401);
  }

  return noContent({
    "set-cookie": await buildAdminSessionCookie(env),
  });
}
