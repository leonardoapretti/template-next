import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ quiet: true });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // O primeiro `await import()` de módulos pesados é lento no build da VPS (CPU limitada).
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
