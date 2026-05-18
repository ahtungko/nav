import type { Env } from "../types";
import { getPublishedSnapshot } from "../lib/kv";
import { jsonError } from "../lib/response";

export async function handlePublicSiteRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return jsonError("method_not_allowed", 405);
  }

  const snapshot = await getPublishedSnapshot(env.PUBLIC_SNAPSHOT);
  if (!snapshot) {
    return Response.json({ error: "snapshot_not_published" }, { status: 503 });
  }
  return Response.json(snapshot, {
    headers: { "cache-control": "public, max-age=300, s-maxage=300" },
  });
}
