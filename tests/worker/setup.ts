import migrationSql from "../../migrations/0001_init.sql?raw";
import { applyD1Migrations, env, reset } from "cloudflare:test";
import { beforeEach } from "vitest";

const migrations = [
  {
    name: "0001_init.sql",
    queries: migrationSql
      .split(/;\s*(?:\r?\n|$)/)
      .map((query) => query.trim())
      .filter(Boolean),
  },
];

beforeEach(async () => {
  await reset();
  await applyD1Migrations(env.DB, migrations);
});
