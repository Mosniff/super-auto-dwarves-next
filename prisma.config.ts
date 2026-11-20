import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  datasource: {
    // Read with process.env, not Prisma's env() helper, which throws when
    // the variable is unset. prisma generate (postinstall and build) must
    // run without DIRECT_URL on Vercel, where only the pooled DATABASE_URL
    // is configured. Only the human's migration commands need DIRECT_URL,
    // from .env.local.
    url: process.env.DIRECT_URL,
  },
});
