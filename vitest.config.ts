import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@gaemiguard/shared": path.resolve(__dirname, "packages/shared/src/index.ts"),
      "@gaemiguard/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@gaemiguard/db": path.resolve(__dirname, "packages/db/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/api/**/*.test.ts"]
  }
});

