import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// This only REFRESHES an existing session — it must never CREATE one. No
// anonymous sign-in happens here: every request, including crawlers, passes
// through the proxy, so signing in here would hand every visitor a session.
// Deliberately not unit-tested: this is library wiring with no logic of its
// own; the composition around it (createComposedProxy) is what's tested.
export async function refreshSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  let sessionResponse = NextResponse.next({ request });

  // Create a new client per call — never cache it in a module-level
  // variable, since it's bound to this request's cookies.
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          sessionResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            sessionResponse.cookies.set(name, value, options);
          });

          Object.entries(cacheHeaders).forEach(([headerName, headerValue]) => {
            sessionResponse.headers.set(headerName, headerValue);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and supabase.auth.getClaims().
  await supabaseClient.auth.getClaims();

  return sessionResponse;
}
