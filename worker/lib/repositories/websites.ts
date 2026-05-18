import { d1All, d1First, d1Run } from "../d1";
import type { Env, WebsiteInput, WebsiteRow } from "../../types";

export function createWebsitesRepository(env: Env) {
  return {
    list(): Promise<WebsiteRow[]> {
      return d1All<WebsiteRow>(
        env.DB.prepare(`
          SELECT websites.id, websites.title, websites.url, websites.category_id, websites.sort_order, websites.is_visible, websites.created_at, websites.updated_at
          FROM websites
          INNER JOIN categories ON categories.id = websites.category_id
          ORDER BY categories.sort_order ASC, categories.name ASC, websites.sort_order ASC, websites.title ASC
        `),
      );
    },

    listVisible(): Promise<WebsiteRow[]> {
      return d1All<WebsiteRow>(
        env.DB.prepare(`
          SELECT websites.id, websites.title, websites.url, websites.category_id, websites.sort_order, websites.is_visible, websites.created_at, websites.updated_at
          FROM websites
          INNER JOIN categories ON categories.id = websites.category_id
          WHERE websites.is_visible = 1
          ORDER BY categories.sort_order ASC, categories.name ASC, websites.sort_order ASC, websites.title ASC
        `),
      );
    },

    getById(id: string): Promise<WebsiteRow | null> {
      return d1First<WebsiteRow>(
        env.DB.prepare(`
          SELECT id, title, url, category_id, sort_order, is_visible, created_at, updated_at
          FROM websites
          WHERE id = ?1
        `).bind(id),
      );
    },

    create(input: WebsiteInput): Promise<D1Result> {
      return d1Run(
        env.DB.prepare(`
          INSERT INTO websites (id, title, url, category_id, sort_order, is_visible, created_at, updated_at)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        `).bind(
          input.id,
          input.title,
          input.url,
          input.category_id,
          input.sort_order,
          input.is_visible,
          input.created_at,
          input.updated_at,
        ),
      );
    },

    update(id: string, input: Omit<WebsiteInput, "id" | "created_at">): Promise<D1Result> {
      return d1Run(
        env.DB.prepare(`
          UPDATE websites
          SET title = ?2,
              url = ?3,
              category_id = ?4,
              sort_order = ?5,
              is_visible = ?6,
              updated_at = ?7
          WHERE id = ?1
        `).bind(id, input.title, input.url, input.category_id, input.sort_order, input.is_visible, input.updated_at),
      );
    },

    remove(id: string): Promise<D1Result> {
      return d1Run(env.DB.prepare("DELETE FROM websites WHERE id = ?1").bind(id));
    },
  };
}
