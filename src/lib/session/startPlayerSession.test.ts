import { describe, it, expect } from "vitest";
import { startPlayerSession } from "./startPlayerSession";
import type { PlayerSessionDependencies } from "./startPlayerSession";
import type { UserRepository } from "@/lib/persistence/userRepository";

const EXISTING_USER_ID = "fixture-existing-user-id";
const NEW_GUEST_USER_ID = "fixture-new-guest-user-id";

function buildFakePlayerSessionDependencies(options: {
  currentUserId: string | null;
  guestUserId?: string;
  signInAsGuestShouldReject?: boolean;
  ensureUserExistsShouldReject?: boolean;
}) {
  const ensureUserExistsCalls: string[] = [];
  let signInAsGuestCallCount = 0;

  const userRepository: UserRepository = {
    ensureUserExists: async (userId) => {
      ensureUserExistsCalls.push(userId);
      if (options.ensureUserExistsShouldReject) {
        throw new Error("Fixture ensureUserExists rejection.");
      }
    },
  };

  const dependencies: PlayerSessionDependencies = {
    readCurrentUserId: async () => options.currentUserId,
    signInAsGuest: async () => {
      signInAsGuestCallCount += 1;
      if (options.signInAsGuestShouldReject) {
        throw new Error("Fixture signInAsGuest rejection.");
      }
      return options.guestUserId ?? "";
    },
    userRepository,
  };

  return {
    dependencies,
    ensureUserExistsCalls,
    getSignInAsGuestCallCount: () => signInAsGuestCallCount,
  };
}

describe("startPlayerSession", () => {
  it("(a) with an existing session, resolves to the existing user id and never signs in as guest", async () => {
    const { dependencies, getSignInAsGuestCallCount } =
      buildFakePlayerSessionDependencies({ currentUserId: EXISTING_USER_ID });

    const resolvedUserId = await startPlayerSession(dependencies);

    expect(resolvedUserId).toBe(EXISTING_USER_ID);
    expect(getSignInAsGuestCallCount()).toBe(0);
  });

  it("(b) with an existing session, calls ensureUserExists exactly once with the existing user id", async () => {
    const { dependencies, ensureUserExistsCalls } =
      buildFakePlayerSessionDependencies({ currentUserId: EXISTING_USER_ID });

    await startPlayerSession(dependencies);

    expect(ensureUserExistsCalls).toEqual([EXISTING_USER_ID]);
  });

  it("(c) with no session, calls signInAsGuest exactly once and resolves to the new guest user id", async () => {
    const { dependencies, getSignInAsGuestCallCount } =
      buildFakePlayerSessionDependencies({
        currentUserId: null,
        guestUserId: NEW_GUEST_USER_ID,
      });

    const resolvedUserId = await startPlayerSession(dependencies);

    expect(getSignInAsGuestCallCount()).toBe(1);
    expect(resolvedUserId).toBe(NEW_GUEST_USER_ID);
  });

  it("(d) with no session, calls ensureUserExists exactly once with the new guest user id", async () => {
    const { dependencies, ensureUserExistsCalls } =
      buildFakePlayerSessionDependencies({
        currentUserId: null,
        guestUserId: NEW_GUEST_USER_ID,
      });

    await startPlayerSession(dependencies);

    expect(ensureUserExistsCalls).toEqual([NEW_GUEST_USER_ID]);
  });

  it("(e) with no session, rejects if signInAsGuest rejects, and never calls ensureUserExists", async () => {
    const { dependencies, ensureUserExistsCalls } =
      buildFakePlayerSessionDependencies({
        currentUserId: null,
        signInAsGuestShouldReject: true,
      });

    await expect(startPlayerSession(dependencies)).rejects.toThrow();

    expect(ensureUserExistsCalls).toHaveLength(0);
  });

  it("(f) with an existing session, rejects if ensureUserExists rejects", async () => {
    const { dependencies } = buildFakePlayerSessionDependencies({
      currentUserId: EXISTING_USER_ID,
      ensureUserExistsShouldReject: true,
    });

    await expect(startPlayerSession(dependencies)).rejects.toThrow();
  });
});
