import { createSupabaseServerClient } from "./createSupabaseServerClient";

// This must only be called from a Server Action, on an explicit player
// intent, so that the resulting session cookie can actually be written
// (Server Components can't set cookies — see createSupabaseServerClient.ts).
// It must never be called from the proxy or a Server Component.
export async function signInAsGuest(): Promise<string> {
  const supabaseClient = await createSupabaseServerClient();
  const { data, error } = await supabaseClient.auth.signInAnonymously();

  if (error || !data.user) {
    throw new Error("Guest sign-in failed.", { cause: error });
  }

  return data.user.id;
}
