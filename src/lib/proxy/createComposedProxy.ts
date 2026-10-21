import type { NextRequest, NextResponse } from "next/server";

export type SessionRefresher = (
  request: NextRequest,
) => Promise<NextResponse>;

export type I18nRoutingHandler = (request: NextRequest) => NextResponse;

export interface ComposedProxyDependencies {
  refreshSession: SessionRefresher;
  handleI18nRouting: I18nRoutingHandler;
}

const FORWARDED_CACHE_HEADER_NAMES = ["cache-control", "expires", "pragma"];

// Ordering requirement: refreshSession must finish, and its cookie writes
// onto `request` must land, BEFORE handleI18nRouting runs — next-intl's
// handler copies the request's headers (including the raw cookie header)
// onto whatever response it passes on, as they stand at that moment. If
// routing ran first, it would see the stale, pre-refresh session cookie.
//
// The routing response is the one returned (not the session response),
// because it's the one that carries next-intl's own redirects, rewrites,
// and cookies (e.g. NEXT_LOCALE) — the session refresh's cookies and cache
// headers are merged onto it rather than the other way around.
export function createComposedProxy(
  dependencies: ComposedProxyDependencies,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const sessionResponse = await dependencies.refreshSession(request);
    const routingResponse = dependencies.handleI18nRouting(request);

    for (const cookie of sessionResponse.cookies.getAll()) {
      routingResponse.cookies.set(cookie);
    }

    for (const cacheHeaderName of FORWARDED_CACHE_HEADER_NAMES) {
      const cacheHeaderValue = sessionResponse.headers.get(cacheHeaderName);
      if (cacheHeaderValue !== null) {
        routingResponse.headers.set(cacheHeaderName, cacheHeaderValue);
      }
    }

    return routingResponse;
  };
}
