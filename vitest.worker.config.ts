import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        compatibilityDate: "2026-05-15",
        bindings: {
          ADMIN_PASSWORD: "secret",
          ADMIN_SESSION_SECRET: "session-secret",
        },
      },
    }),
  ],
  test: {
    name: "worker",
    include: ["tests/worker/**/*.test.ts"],
    setupFiles: ["./tests/worker/setup.ts"],
  },
});
