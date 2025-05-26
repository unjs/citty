import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: { enabled: true },
    coverage: {
      reporter: ["text", "clover", "json"],
      include: ["src/**/*.ts"],
    },
  },
});
