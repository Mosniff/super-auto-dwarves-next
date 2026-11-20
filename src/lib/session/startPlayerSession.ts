import type { UserRepository } from "@/lib/persistence/userRepository";

export interface PlayerSessionDependencies {
  readCurrentUserId(): Promise<string | null>;
  signInAsGuest(captchaToken?: string): Promise<string>;
  userRepository: UserRepository;
}

// The "start playing" seam. The proxy only ever REFRESHES an existing
// session and never creates one (see refreshSupabaseSession.ts), so guest
// sign-in happens here instead, gated behind an explicit player intent —
// this is what keeps crawlers and other incidental requests from creating
// a user. ensureUserExists runs on every call (not just for new guests)
// because it's idempotent; this self-heals the case where a session exists
// but its mirrored User row doesn't. The CAPTCHA token is passed only when
// a guest is actually created; an existing session ignores it.
export async function startPlayerSession(
  dependencies: PlayerSessionDependencies,
  captchaToken?: string,
): Promise<string> {
  const currentUserId = await dependencies.readCurrentUserId();
  const userId =
    currentUserId ?? (await dependencies.signInAsGuest(captchaToken));

  await dependencies.userRepository.ensureUserExists(userId);

  return userId;
}
