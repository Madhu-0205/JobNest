import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
    include: ["tests/runner.test.ts", "tests/unit/payment-gateway.test.ts", "tests/unit/ai-provider.test.ts"],
    passWithNoTests: true,
  },
});
