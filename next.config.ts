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
  // Baseline security headers for every route (see CLAUDE.md, to be
  // documented at the end of Phase 14). A full Content-Security-Policy is
  // deliberately deferred; only frame-ancestors is set for now.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
