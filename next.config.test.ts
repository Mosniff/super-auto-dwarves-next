import { describe, it, expect } from "vitest";
import nextConfig from "./next.config";

describe("next.config security headers", () => {
  it("sends the five security headers on every route", async () => {
    const routeHeaderRules =
      nextConfig.headers === undefined ? undefined : await nextConfig.headers();

    expect(routeHeaderRules).toEqual([
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
    ]);
  });
});
