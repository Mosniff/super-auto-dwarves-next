import { SHOP_SLOT_COUNT, type ShopSlots } from "@/lib/game/shopSlots";

// Template existence is deliberately not checked here, same reasoning as
// parsePersistedCampRoster: a stored offering is self-contained and this
// parser's job is shape validation, not a template-module lookup.
function isValidPersistedShopSlot(candidateSlot: unknown): boolean {
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

export function parsePersistedShopSlots(persistedValue: unknown): ShopSlots {
  if (!Array.isArray(persistedValue)) {
    throw new Error("Persisted shop slots must be an array.");
  }

  if (persistedValue.length !== SHOP_SLOT_COUNT) {
    throw new Error(
      `Persisted shop slots must have exactly ${SHOP_SLOT_COUNT} slots.`,
    );
  }

  let hasSeenLockedSlot = false;

  persistedValue.forEach((candidateSlot, slotIndex) => {
    if (!isValidPersistedShopSlot(candidateSlot)) {
      throw new Error(
        `Persisted shop slots has an invalid slot at index ${slotIndex}.`,
      );
    }

    const { slotState } = candidateSlot as { slotState: string };

    if (slotState === "locked") {
      hasSeenLockedSlot = true;
    } else if (hasSeenLockedSlot) {
      throw new Error(
        `Persisted shop slots has a non-locked slot after a locked one, at index ${slotIndex}.`,
      );
    }
  });

  return persistedValue as ShopSlots;
}
