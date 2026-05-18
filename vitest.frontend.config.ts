import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "frontend",
    include: ["tests/frontend/**/*.test.ts", "tests/frontend/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./tests/frontend/setup.ts"],
  },
});
