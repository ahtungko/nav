import { putPublishedSnapshot } from "../lib/kv";
import { createCategoriesRepository } from "../lib/repositories/categories";
import { createWebsitesRepository } from "../lib/repositories/websites";
import { jsonError } from "../lib/response";
import { buildPublishedSnapshot } from "../lib/snapshot";
import type { Env } from "../types";

export async function handleAdminPublishRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError("method_not_allowed", 405);
  }

  const categoriesRepository = createCategoriesRepository(env);
  const websitesRepository = createWebsitesRepository(env);
  const publishedAt = new Date().toISOString();
  const snapshot = buildPublishedSnapshot({
    categories: await categoriesRepository.listVisible(),
    websites: await websitesRepository.listVisible(),
    publishedAt,
  });

  await putPublishedSnapshot(env.PUBLIC_SNAPSHOT, snapshot);

  return Response.json({
    publishedAt,
    categoryCount: snapshot.categories.length,
    websiteCount: snapshot.websites.length,
  });
}
