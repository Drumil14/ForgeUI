import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit + integration + e2e live next to the code they cover.
    include: ["packages/*/test/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    environment: "node",
    // The E2E CLI test spawns a child process and (optionally) drives Playwright;
    // give it room.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: "forks",
  },
});
