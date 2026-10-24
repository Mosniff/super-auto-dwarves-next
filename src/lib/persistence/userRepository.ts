// This is the seam for creating our mirrored User row (see CLAUDE.md,
// "Identity spans two schemas"). ensureUserExists must be idempotent — safe
// to call on every "start playing", not just the first time a given user
// shows up — since there is no event that reliably fires only once.
// Tests supply a fake implementation; prismaUserRepository.ts supplies the
// real one.
export interface UserRepository {
  ensureUserExists(userId: string): Promise<void>;
}
