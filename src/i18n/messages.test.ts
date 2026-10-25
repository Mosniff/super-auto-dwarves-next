import { describe, it, expect } from "vitest";
import englishMessages from "../../messages/en.json";
import japaneseMessages from "../../messages/ja.json";

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
  // for the /play camp screen and dummy-battle label (toBattle,
  // returnToCamp, goldLabel, dummyBattleLabel) — deliberate test-data
  // updates, not a weakening.
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
    "dummyBattleLabel",
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
});
