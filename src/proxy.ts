import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createComposedProxy } from "./lib/proxy/createComposedProxy";
import { refreshSupabaseSession } from "./lib/supabase/refreshSupabaseSession";

const handleI18nRouting = createMiddleware(routing);

export default createComposedProxy({
  refreshSession: refreshSupabaseSession,
  handleI18nRouting,
});

export const config = {
  // Match all pathnames except /api, /_next, and files with an extension
  // (static assets like favicon.ico). Server Action POSTs go to page paths,
  // so they are matched; /api is excluded deliberately because there are
  // no route handlers.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
