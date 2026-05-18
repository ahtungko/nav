import type { Website } from "../../src/types/website";
import { createWebsitesRepository } from "../lib/repositories/websites";
import { jsonError, noContent } from "../lib/response";
import { readJson, websiteInputSchema } from "../lib/validation";
import type { Env, WebsiteRow } from "../types";

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "website";
}

function toWebsite(row: WebsiteRow): Website {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    faviconUrl: row.favicon_url,
    categoryId: row.category_id,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function handleAdminWebsitesRequest(
  request: Request,
  env: Env,
  websiteId?: string,
): Promise<Response> {
  const repository = createWebsitesRepository(env);

  if (request.method === "GET") {
    if (websiteId) {
      const website = await repository.getById(websiteId);
      return website ? Response.json(toWebsite(website)) : jsonError("not_found", 404);
    }

    const websites = await repository.list();
    return Response.json(websites.map(toWebsite));
  }

  if (request.method === "POST") {
    if (websiteId) {
      return jsonError("method_not_allowed", 405);
    }

    const body = await readJson(request);
    const parsed = websiteInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("invalid_request", 400);
    }

    const now = new Date().toISOString();
    const id = `site_${slugify(parsed.data.title)}_${crypto.randomUUID().slice(0, 8)}`;

    try {
      await repository.create({
        id,
        title: parsed.data.title,
        url: parsed.data.url,
        favicon_url: parsed.data.faviconUrl ?? null,
        category_id: parsed.data.categoryId,
        sort_order: parsed.data.sortOrder,
        is_visible: parsed.data.isVisible ? 1 : 0,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
        return jsonError("duplicate_website", 409);
      }

      if (error instanceof Error && error.message.toLowerCase().includes("foreign key")) {
        return jsonError("invalid_category", 400);
      }

      throw error;
    }

    const created = await repository.getById(id);
    return Response.json(created ? toWebsite(created) : { id }, { status: 201 });
  }

  if (!websiteId) {
    return jsonError("method_not_allowed", 405);
  }

  if (request.method === "PUT") {
    const current = await repository.getById(websiteId);
    if (!current) {
      return jsonError("not_found", 404);
    }

    const body = await readJson(request);
    const parsed = websiteInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("invalid_request", 400);
    }

    try {
      await repository.update(websiteId, {
        title: parsed.data.title,
        url: parsed.data.url,
        favicon_url: parsed.data.faviconUrl ?? null,
        category_id: parsed.data.categoryId,
        sort_order: parsed.data.sortOrder,
        is_visible: parsed.data.isVisible ? 1 : 0,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("foreign key")) {
        return jsonError("invalid_category", 400);
      }

      throw error;
    }

    const updated = await repository.getById(websiteId);
    return Response.json(updated ? toWebsite(updated) : toWebsite(current));
  }

  if (request.method === "DELETE") {
    const current = await repository.getById(websiteId);
    if (!current) {
      return jsonError("not_found", 404);
    }

    await repository.remove(websiteId);
    return noContent();
  }

  return jsonError("method_not_allowed", 405);
}
