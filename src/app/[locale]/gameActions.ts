"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { readCurrentUserId } from "@/lib/supabase/readCurrentUserId";
import { prismaUserRepository } from "@/lib/persistence/prismaUserRepository";
import { prismaGameRepository } from "@/lib/persistence/prismaGameRepository";
import { createGameForUser } from "@/lib/persistence/createGameForUser";
import { advanceGameForUser } from "@/lib/persistence/advanceGameForUser";
import { buyCharacterForUser } from "@/lib/persistence/buyCharacterForUser";
import { repositionCharacterForUser } from "@/lib/persistence/repositionCharacterForUser";
import { GameAlreadyExistsError } from "@/lib/persistence/gameAlreadyExistsError";
import { isGamePhase } from "@/lib/game/isGamePhase";
import { DUMMY_SHOP_CATALOGUE } from "@/lib/game/dummyShopCatalogue";
import { parseIntegerFormValue } from "@/lib/forms/parseIntegerFormValue";

// These actions take no game state from the client — intents, not state
// (CLAUDE.md, "Security / anti-cheat model"). Advance accepts only the
// expected phase as an intent qualifier; buy and reposition accept only a
// listing id, slot indices and the expected revision, likewise validated
// qualifiers, never prices, gold or a roster. Each scopes everything to
// the signed-in session's own user id, so a player can only ever touch
// their own save. None of them creates a session: with no session, they
// redirect to the home page, and guest sign-in lives only in
// startPlayingAction.ts. Error UX beyond the duplicate-save case below is
// deliberately deferred.

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

// Accepted, rejected and stale outcomes all end with refresh(), so the
// player sees the authoritative state. Player-facing rejection messages
// are deferred, like the rest of error UX.
//
// It is refresh() rather than a redirect deliberately: a redirect to the
// current page is a navigation and remounts the camp, replaying every
// card's entrance animation, whereas refresh() re-renders in place, so
// only changed slots animate.
export async function buyCharacterAction(formData: FormData): Promise<void> {
  const userId = await requireSignedInUserId();

  const submittedShopListingId = formData.get("shopListingId");
  const submittedTargetSlotIndex = parseIntegerFormValue(
    formData.get("targetSlotIndex"),
  );
  const submittedExpectedRevision = parseIntegerFormValue(
    formData.get("expectedRevision"),
  );

  if (
    typeof submittedShopListingId !== "string" ||
    submittedShopListingId === "" ||
    submittedTargetSlotIndex === null ||
    submittedExpectedRevision === null
  ) {
    throw new Error("Invalid buy intent.");
  }

  await buyCharacterForUser(
    userId,
    {
      shopListingId: submittedShopListingId,
      targetSlotIndex: submittedTargetSlotIndex,
      expectedRevision: submittedExpectedRevision,
    },
    {
      gameRepository: prismaGameRepository,
      shopCatalogue: DUMMY_SHOP_CATALOGUE,
      generateCharacterId: () => randomUUID(),
    },
  );

  refresh();
}

export async function repositionCharacterAction(
  formData: FormData,
): Promise<void> {
  const userId = await requireSignedInUserId();

  const submittedFromSlotIndex = parseIntegerFormValue(
    formData.get("fromSlotIndex"),
  );
  const submittedToSlotIndex = parseIntegerFormValue(
    formData.get("toSlotIndex"),
  );
  const submittedExpectedRevision = parseIntegerFormValue(
    formData.get("expectedRevision"),
  );

  if (
    submittedFromSlotIndex === null ||
    submittedToSlotIndex === null ||
    submittedExpectedRevision === null
  ) {
    throw new Error("Invalid reposition intent.");
  }

  await repositionCharacterForUser(
    userId,
    {
      fromSlotIndex: submittedFromSlotIndex,
      toSlotIndex: submittedToSlotIndex,
      expectedRevision: submittedExpectedRevision,
    },
    prismaGameRepository,
  );

  refresh();
}

export async function deleteGameAction(): Promise<void> {
  const userId = await requireSignedInUserId();

  await prismaGameRepository.deleteGameForUser(userId);

  await redirectToLocalePath("/saves");
}
