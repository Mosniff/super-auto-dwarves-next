import { describe, it, expect } from "vitest";
import englishMessages from "../../messages/en.json";
import japaneseMessages from "../../messages/ja.json";
import { CHARACTER_CLASS_IDS } from "@/lib/game/characterClasses";
import { LOCKED_SHOP_SECTION_IDS } from "@/lib/game/lockedShopSections";

describe("locale message parity", () => {
  // Extended when the battle-log control buttons (Advance, Autoplay: On/Off)
  // and the menu page / game header (tagline, play, settings, menu, language)
  // were internationalized, again for the CharacterCard downed overlay and
  // the localized metadata title (downed, appTitle), again for the
  // DiscardPile footprint label and the RosterSlot empty-slot/on-deck
  // labels (empty, next), and again for the saves page's SaveSlab (noSavedGame,
  // newGame, resume, delete, cancel, startedOn, dayLabel, phaseCamp,
  // phaseBattle, deleteSaveTitle, deleteSaveDescription), and again for the
  // (menu) route group's Back button on the saves page (back), and again
  // for the /play camp screen (toBattle, returnToCamp, goldLabel), and
  // again for the Phase 8 camp shop and clickable roster slots
  // (shopListingSoldLabel, shopListingButtonLabel,
  // rosterSlotOccupiedLabel, rosterSlotEmptyLabel), and dummyBattleLabel
  // was removed when Phase 8 connected the battle to the saved roster, and
  // again for Phase 9's locked shop slot label (shopSlotLockedLabel), and
  // again for the shopSection namespace naming the character/equipment/
  // magic/food shop sections — deliberate test-data updates, not a
  // weakening.
  const expectedCommonKeys = [
    "appName",
    "advance",
    "autoplayOn",
    "autoplayOff",
    "tagline",
    "play",
    "settings",
    "menu",
    "language",
    "downed",
    "appTitle",
    "empty",
    "next",
    "noSavedGame",
    "newGame",
    "resume",
    "delete",
    "cancel",
    "startedOn",
    "dayLabel",
    "phaseCamp",
    "phaseBattle",
    "deleteSaveTitle",
    "deleteSaveDescription",
    "back",
    "toBattle",
    "returnToCamp",
    "goldLabel",
    "shopListingSoldLabel",
    "shopListingButtonLabel",
    "rosterSlotOccupiedLabel",
    "rosterSlotEmptyLabel",
    "shopSlotLockedLabel",
  ];
  const expectedBattleKeys = [
    "battleStart",
    "turnStart",
    "attack",
    "damage",
    "drop",
    "timeout",
    "victory",
    "defeat",
    "draw",
  ];

  it("english has exactly the expected common keys", () => {
    expect(Object.keys(englishMessages.common).sort()).toEqual(
      [...expectedCommonKeys].sort(),
    );
  });

  it("japanese has exactly the expected common keys", () => {
    expect(Object.keys(japaneseMessages.common).sort()).toEqual(
      [...expectedCommonKeys].sort(),
    );
  });

  it("english has exactly the expected battle keys", () => {
    expect(Object.keys(englishMessages.battle).sort()).toEqual(
      [...expectedBattleKeys].sort(),
    );
  });

  it("japanese has exactly the expected battle keys", () => {
    expect(Object.keys(japaneseMessages.battle).sort()).toEqual(
      [...expectedBattleKeys].sort(),
    );
  });

  it("english and japanese have identical top-level namespace keys", () => {
    expect(Object.keys(englishMessages).sort()).toEqual(
      Object.keys(japaneseMessages).sort(),
    );
  });

  it("english and japanese have identical common keys", () => {
    expect(Object.keys(englishMessages.common).sort()).toEqual(
      Object.keys(japaneseMessages.common).sort(),
    );
  });

  it("english and japanese have identical battle keys", () => {
    expect(Object.keys(englishMessages.battle).sort()).toEqual(
      Object.keys(japaneseMessages.battle).sort(),
    );
  });

  // Checked against the real class list, so adding a class without
  // translating it fails here rather than silently falling back.
  it("english has exactly the character class keys", () => {
    expect(
      Object.keys(
        (
          englishMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).characterClass ?? {},
      ).sort(),
    ).toEqual([...CHARACTER_CLASS_IDS].sort());
  });

  it("japanese has exactly the character class keys", () => {
    expect(
      Object.keys(
        (
          japaneseMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).characterClass ?? {},
      ).sort(),
    ).toEqual([...CHARACTER_CLASS_IDS].sort());
  });

  // Checked against "characters" plus the real locked-section list, so
  // adding a section without translating it fails here rather than
  // silently falling back.
  it("english has exactly the shopSection keys", () => {
    expect(
      Object.keys(
        (
          englishMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).shopSection ?? {},
      ).sort(),
    ).toEqual(["characters", ...LOCKED_SHOP_SECTION_IDS].sort());
  });

  it("japanese has exactly the shopSection keys", () => {
    expect(
      Object.keys(
        (
          japaneseMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).shopSection ?? {},
      ).sort(),
    ).toEqual(["characters", ...LOCKED_SHOP_SECTION_IDS].sort());
  });
});
