"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaUserRepository } from "@/lib/persistence/prismaUserRepository";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { createGameForUser } from "@/lib/persistence/createGameForUser";
import { advanceGameForUser } from "@/lib/persistence/advanceGameForUser";
import { GameAlreadyExistsError } from "@/lib/persistence/gameAlreadyExistsError";
import { isGamePhase } from "@/lib/game/isGamePhase";

// These actions take no game state from the client — intents, not state
// (CLAUDE.md, "Security / anti-cheat model"). Advance accepts only the
// expected phase as an intent qualifier. Each scopes everything to the
// signed-in session's own user id, so a player can only ever touch their
// own save. None of them creates a session: with no session, they redirect
// to the home page, and guest sign-in lives only in startPlayingAction.ts.
// Error UX beyond the duplicate-save case below is deliberately deferred.

async function redirectToLocalePath(href: string): Promise<never> {
  const locale = await getLocale();

  return redirect({ href, locale });
}

// Never signs in — readCurrentUserId only ever reads an existing session.
async function requireSignedInUserId(): Promise<string> {
  const userId = await readCurrentUserId();

  if (userId !== null) {
    return userId;
  }

  return redirectToLocalePath("/");
}

export async function createGameAction(): Promise<void> {
  const userId = await requireSignedInUserId();

  await prismaUserRepository.ensureUserExists(userId);

  try {
    await createGameForUser(userId, prismaGameRepository);
  } catch (error) {
    // The save slab only ever offers "New game" when the player has no
    // save, so a duplicate here can only come from a double-submit or a
    // second tab — taking the player to their existing save is the
    // correct outcome, not an error to surface.
    if (!(error instanceof GameAlreadyExistsError)) {
      throw error;
    }
  }

  await redirectToLocalePath("/play");
}

export async function advanceGameAction(formData: FormData): Promise<void> {
  const userId = await requireSignedInUserId();

  // The phase here is an intent qualifier, not game state: it's validated
  // below, and the worst a tampered value can do is have the request
  // ignored (a mismatched phase) or rejected (not a phase at all).
  const submittedExpectedPhase = formData.get("expectedCurrentPhase");

  if (!isGamePhase(submittedExpectedPhase)) {
    throw new Error("Invalid advance intent.");
  }

  await advanceGameForUser(
    userId,
    submittedExpectedPhase,
    prismaGameRepository,
  );

  await redirectToLocalePath("/play");
}

export async function deleteGameAction(): Promise<void> {
  const userId = await requireSignedInUserId();

  await prismaGameRepository.deleteGameForUser(userId);

  await redirectToLocalePath("/saves");
}
