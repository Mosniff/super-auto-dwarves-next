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
  },
});
