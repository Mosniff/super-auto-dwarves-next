import { describe, it, expect } from "vitest";
import {
  CHARACTER_FACTION_IDS,
  isCharacterFactionId,
  PLAYER_FACTION_ID,
} from "./characterFactions";

describe("characterFactions", () => {
  it("F1: CHARACTER_FACTION_IDS equals the full faction id list, in order", () => {
    expect(CHARACTER_FACTION_IDS).toEqual(["dwarf", "kobold"]);
  });

  it("F2: isCharacterFactionId accepts every known faction id", () => {
    expect(["dwarf", "kobold"].map(isCharacterFactionId)).toEqual([
      true,
      true,
    ]);
  });

  it("F3: isCharacterFactionId rejects non-faction-id values", () => {
    expect(
      ["Dwarf", "", "goblin", 1, null, undefined, {}].map(
        isCharacterFactionId,
      ),
    ).toEqual([false, false, false, false, false, false, false]);
  });

  it("F4: the player's faction is dwarf", () => {
    expect(PLAYER_FACTION_ID).toBe("dwarf");
  });
});
