import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// For server-side code only (Server Components and Server Actions). Create
// a new client per call — never cache it at module level, since it's bound
// to this request's cookies.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't set cookies — safe to ignore here
            // because the proxy (refreshSupabaseSession.ts) already
            // refreshes the session on every request. In Server Actions
            // this doesn't throw, and setting cookies there works — that's
            // how signInAnonymously persists the new session cookie.
          }
        },
      },
    },
  );
}
