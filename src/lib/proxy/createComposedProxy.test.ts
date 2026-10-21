import { describe, it, expect } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createComposedProxy } from "./createComposedProxy";
import type {
  I18nRoutingHandler,
  SessionRefresher,
} from "./createComposedProxy";

const SESSION_COOKIE_NAME = "sb-test-auth-token";
const REFRESHED_SESSION_COOKIE_VALUE = "refreshed-token-value";

function buildFakeSessionRefresher(options: {
  includeCacheHeaders: boolean;
}): SessionRefresher {
  return async (request) => {
    // Simulates the async work a real Supabase session refresh does — an
    // implementation that doesn't await this will fail tests (f) and (b).
    await Promise.resolve();

    request.cookies.set(SESSION_COOKIE_NAME, REFRESHED_SESSION_COOKIE_VALUE);

    const response = NextResponse.next({ request });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      REFRESHED_SESSION_COOKIE_VALUE,
      {
        httpOnly: true,
        path: "/",
        maxAge: 3600,
      },
    );

    if (options.includeCacheHeaders) {
      response.headers.set(
        "cache-control",
        "private, no-cache, no-store, must-revalidate, max-age=0",
      );
      response.headers.set("expires", "0");
      response.headers.set("pragma", "no-cache");
    }

    return response;
  };
}

function buildFakeI18nRoutingHandler(): {
  handleI18nRouting: I18nRoutingHandler;
  getSessionCookieValueSeenByRoutingHandler: () => string | undefined;
  getRawCookieHeaderSeenByRoutingHandler: () => string | null;
} {
  let sessionCookieValueSeenByRoutingHandler: string | undefined;
  let rawCookieHeaderSeenByRoutingHandler: string | null = null;

  const handleI18nRouting: I18nRoutingHandler = (request) => {
    sessionCookieValueSeenByRoutingHandler =
      request.cookies.get(SESSION_COOKIE_NAME)?.value;
    rawCookieHeaderSeenByRoutingHandler = request.headers.get("cookie");

    const response = NextResponse.redirect("http://localhost:3000/en");
    response.cookies.set("NEXT_LOCALE", "en");
    return response;
  };

  return {
    handleI18nRouting,
    getSessionCookieValueSeenByRoutingHandler: () =>
      sessionCookieValueSeenByRoutingHandler,
    getRawCookieHeaderSeenByRoutingHandler: () =>
      rawCookieHeaderSeenByRoutingHandler,
  };
}

describe("createComposedProxy", () => {
  it("(a) returns the routing response: redirect status and location", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/en");
  });

  it("(b) copies the session cookie's value onto the returned response", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe(
      REFRESHED_SESSION_COOKIE_VALUE,
    );
  });

  it("(c) preserves the session cookie's options on the returned response", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    const setCookieHeaders = response.headers.getSetCookie();
    const sessionSetCookieHeader = setCookieHeaders.find((header) =>
      header.startsWith(`${SESSION_COOKIE_NAME}=`),
    );

    expect(sessionSetCookieHeader).toBeDefined();
    expect(sessionSetCookieHeader).toContain("HttpOnly");
    expect(sessionSetCookieHeader).toContain("Path=/");
    expect(sessionSetCookieHeader).toContain("Max-Age=3600");
  });

  it("(d) copies cache-control, expires and pragma when the refresher sets them", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: true,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    expect(response.headers.get("cache-control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });

  it("(e) carries no cache-control, expires or pragma header when the refresher sets none", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    expect(response.headers.get("cache-control")).toBeNull();
    expect(response.headers.get("expires")).toBeNull();
    expect(response.headers.get("pragma")).toBeNull();
  });

  it("(f) lets the routing handler see the refreshed session cookie", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting, getSessionCookieValueSeenByRoutingHandler } =
      buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    await composedProxy(new NextRequest("http://localhost:3000/"));

    expect(getSessionCookieValueSeenByRoutingHandler()).toBe(
      REFRESHED_SESSION_COOKIE_VALUE,
    );
  });

  it("(g) preserves the routing response's own NEXT_LOCALE cookie", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting } = buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    const response = await composedProxy(
      new NextRequest("http://localhost:3000/"),
    );

    expect(response.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("(h) forwards the refreshed cookie in the request's raw cookie header", async () => {
    const refreshSession = buildFakeSessionRefresher({
      includeCacheHeaders: false,
    });
    const { handleI18nRouting, getRawCookieHeaderSeenByRoutingHandler } =
      buildFakeI18nRoutingHandler();
    const composedProxy = createComposedProxy({
      refreshSession,
      handleI18nRouting,
    });

    await composedProxy(new NextRequest("http://localhost:3000/"));

    expect(getRawCookieHeaderSeenByRoutingHandler()).toEqual(
      expect.stringContaining(
        `${SESSION_COOKIE_NAME}=${REFRESHED_SESSION_COOKIE_VALUE}`,
      ),
    );
  });
});
