import type { Category } from "../../src/types/category";
import { d1First } from "../lib/d1";
import { createCategoriesRepository } from "../lib/repositories/categories";
import { jsonError, noContent } from "../lib/response";
import { categoryInputSchema, readJson } from "../lib/validation";
import type { CategoryRow, Env } from "../types";

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconKey: row.icon_key,
    sortOrder: row.sort_order,
    isVisible: row.is_visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function countWebsitesForCategory(env: Env, categoryId: string): Promise<number> {
  const row = await d1First<{ count: number }>(
    env.DB.prepare("SELECT COUNT(*) AS count FROM websites WHERE category_id = ?1").bind(categoryId),
  );

  return Number(row?.count ?? 0);
}

export async function handleAdminCategoriesRequest(
  request: Request,
  env: Env,
  categoryId?: string,
): Promise<Response> {
  const repository = createCategoriesRepository(env);

  if (request.method === "GET") {
    if (categoryId) {
      const category = await repository.getById(categoryId);
      return category ? Response.json(toCategory(category)) : jsonError("not_found", 404);
    }

    const categories = await repository.list();
    return Response.json(categories.map(toCategory));
  }

  if (request.method === "POST") {
    if (categoryId) {
      return jsonError("method_not_allowed", 405);
    }

    const body = await readJson(request);
    const parsed = categoryInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("invalid_request", 400);
    }

    const now = new Date().toISOString();
    const id = `cat_${crypto.randomUUID()}`;

    try {
      await repository.create({
        id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        icon_key: parsed.data.iconKey,
        sort_order: parsed.data.sortOrder,
        is_visible: parsed.data.isVisible ? 1 : 0,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
        return jsonError("duplicate_category", 409);
      }

      throw error;
    }

    const created = await repository.getById(id);
    return Response.json(created ? toCategory(created) : { id }, { status: 201 });
  }

  if (!categoryId) {
    return jsonError("method_not_allowed", 405);
  }

  if (request.method === "PUT") {
    const current = await repository.getById(categoryId);
    if (!current) {
      return jsonError("not_found", 404);
    }

    const body = await readJson(request);
    const parsed = categoryInputSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("invalid_request", 400);
    }

    try {
      await repository.update(categoryId, {
        name: parsed.data.name,
        slug: parsed.data.slug,
        icon_key: parsed.data.iconKey,
        sort_order: parsed.data.sortOrder,
        is_visible: parsed.data.isVisible ? 1 : 0,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("unique")) {
        return jsonError("duplicate_category", 409);
      }

      throw error;
    }

    const updated = await repository.getById(categoryId);
    return Response.json(updated ? toCategory(updated) : toCategory(current));
  }

  if (request.method === "DELETE") {
    const current = await repository.getById(categoryId);
    if (!current) {
      return jsonError("not_found", 404);
    }

    if ((await countWebsitesForCategory(env, categoryId)) > 0) {
      return jsonError("category_has_websites", 409);
    }

    await repository.remove(categoryId);
    return noContent();
  }

  return jsonError("method_not_allowed", 405);
}
