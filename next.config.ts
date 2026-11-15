import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disabled because the persisted dev cache served stale globals.css
    // theme changes across restarts; costs a slower first compile after a
    // restart.
    turbopackFileSystemCacheForDev: false,
  },
  images: { qualities: [75, 90] },
};

export default withNextIntl(nextConfig);
