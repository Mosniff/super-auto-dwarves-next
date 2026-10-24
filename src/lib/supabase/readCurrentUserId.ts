import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./createSupabaseServerClient";

// Non-session errors are thrown rather than returned as null, because
// treating an Auth hiccup (e.g. a JWKS fetch failure) as "signed out" would
// sign a returning player in as a brand-new guest, orphaning their existing
// save. Only a genuinely absent session resolves to null.
//
// Uses getClaims(), never getSession() — getSession() trusts the cookie's
// contents without verifying it; getClaims() verifies the JWT.
export async function readCurrentUserId(): Promise<string | null> {
  const supabaseClient = await createSupabaseServerClient();
  const { data, error } = await supabaseClient.auth.getClaims();

  if (!data) {
    if (error === null || isAuthSessionMissingError(error)) {
      return null;
    }

    // Deliberately no user id in this message — it is identifying data and
    // this message may reach logs.
    throw new Error("Could not verify the current session.", {
      cause: error,
    });
  }

  return data.claims.sub;
}
