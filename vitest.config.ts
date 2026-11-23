import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    server: {
      // next-intl's client navigation bundle ships ESM .js files that
      // import bare `next/navigation` internally. When externalized (the
      // default for node_modules deps), Node's native ESM loader can't
      // resolve that extensionless specifier the way Vite's own resolver
      // does. Inlining forces Vite to process it instead.
      deps: {
        inline: ["next-intl"],
      },
    },
    coverage: {
      provider: "v8",
      // Count all source files, tested or not; tests, test helpers and the
      // Prisma-generated client are not source.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/generated/**"],
      reporter: ["text-summary", "json-summary", "html"],
    },
  },
});
