import {
  CHARACTER_SHOP_SLOT_COUNT,
  type CharacterShopSlots,
} from "@/lib/game/characterShopSlots";

// Template existence is deliberately not checked here, same reasoning as
// parsePersistedCampRoster: a stored offering is self-contained and this
// parser's job is shape validation, not a template-module lookup.
function isValidPersistedCharacterShopSlot(candidateSlot: unknown): boolean {
  if (
    typeof candidateSlot !== "object" ||
    candidateSlot === null ||
    Array.isArray(candidateSlot)
  ) {
    return false;
  }

  const { slotState, characterTemplateId } = candidateSlot as Record<
    string,
    unknown
  >;

  if (slotState === "locked" || slotState === "sold") {
    return true;
  }

  if (slotState === "offering") {
    return (
      typeof characterTemplateId === "string" && characterTemplateId.length > 0
    );
  }

  return false;
}

export function parsePersistedCharacterShopSlots(
  persistedValue: unknown,
): CharacterShopSlots {
  if (!Array.isArray(persistedValue)) {
    throw new Error("Persisted character shop slots must be an array.");
  }

  if (persistedValue.length !== CHARACTER_SHOP_SLOT_COUNT) {
    throw new Error(
      `Persisted character shop slots must have exactly ${CHARACTER_SHOP_SLOT_COUNT} slots.`,
    );
  }

  let hasSeenLockedSlot = false;

  persistedValue.forEach((candidateSlot, slotIndex) => {
    if (!isValidPersistedCharacterShopSlot(candidateSlot)) {
      throw new Error(
        `Persisted character shop slots has an invalid slot at index ${slotIndex}.`,
      );
    }

    const { slotState } = candidateSlot as { slotState: string };

    if (slotState === "locked") {
      hasSeenLockedSlot = true;
    } else if (hasSeenLockedSlot) {
      throw new Error(
        `Persisted character shop slots has a non-locked slot after a locked one, at index ${slotIndex}.`,
      );
    }
  });

  return persistedValue as CharacterShopSlots;
}
