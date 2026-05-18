import { d1All, d1First, d1Run } from "../d1";
import type { CategoryInput, CategoryRow, Env } from "../../types";

export function createCategoriesRepository(env: Env) {
  return {
    list(): Promise<CategoryRow[]> {
      return d1All<CategoryRow>(
        env.DB.prepare(`
          SELECT id, name, slug, icon_key, sort_order, is_visible, created_at, updated_at
          FROM categories
          ORDER BY sort_order ASC, name ASC
        `),
      );
    },

    listVisible(): Promise<CategoryRow[]> {
      return d1All<CategoryRow>(
        env.DB.prepare(`
          SELECT id, name, slug, icon_key, sort_order, is_visible, created_at, updated_at
          FROM categories
          WHERE is_visible = 1
          ORDER BY sort_order ASC, name ASC
        `),
      );
    },

    getById(id: string): Promise<CategoryRow | null> {
      return d1First<CategoryRow>(
        env.DB.prepare(`
          SELECT id, name, slug, icon_key, sort_order, is_visible, created_at, updated_at
          FROM categories
          WHERE id = ?1
        `).bind(id),
      );
    },

    create(input: CategoryInput): Promise<D1Result> {
      return d1Run(
        env.DB.prepare(`
          INSERT INTO categories (id, name, slug, icon_key, sort_order, is_visible, created_at, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        `).bind(
          input.id,
          input.name,
          input.slug,
          input.icon_key,
          input.sort_order,
          input.is_visible,
          input.created_at,
          input.updated_at,
        ),
      );
    },

    update(id: string, input: Omit<CategoryInput, "id" | "created_at">): Promise<D1Result> {
      return d1Run(
        env.DB.prepare(`
          UPDATE categories
          SET name = ?2,
              slug = ?3,
              icon_key = ?4,
              sort_order = ?5,
              is_visible = ?6,
              updated_at = ?7
          WHERE id = ?1
        `).bind(id, input.name, input.slug, input.icon_key, input.sort_order, input.is_visible, input.updated_at),
      );
    },

    remove(id: string): Promise<D1Result> {
      return d1Run(env.DB.prepare("DELETE FROM categories WHERE id = ?1").bind(id));
    },
  };
}
