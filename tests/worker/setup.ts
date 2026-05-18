import initMigrationSql from "../../migrations/0001_init.sql?raw";
import addWebsiteFaviconUrlMigrationSql from "../../migrations/0002_add_website_favicon_url.sql?raw";
import { applyD1Migrations, env, reset } from "cloudflare:test";
import { beforeEach } from "vitest";

const migrations = [
  {
    name: "0001_init.sql",
    queries: initMigrationSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((query) => query.trim())
      .filter(Boolean),
  },
  {
    name: "0002_add_website_favicon_url.sql",
    queries: addWebsiteFaviconUrlMigrationSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((query) => query.trim())
      .filter(Boolean),
  },
];

beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.DB, migrations);
});
