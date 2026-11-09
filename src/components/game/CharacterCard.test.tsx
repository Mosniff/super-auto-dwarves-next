// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import type { Character } from "@/lib/game/character";
import { CharacterCard } from "./CharacterCard";

describe("CharacterCard", () => {
  it("C1: shows the tier's Roman numeral and a data-character-tier attribute", () => {
    const fixtureCharacter: Character = {
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 2,
      characterClassIds: ["warrior"],
    };

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(screen.queryByText("II")).not.toBeNull();
    expect(document.querySelectorAll('[data-character-tier="2"]')).toHaveLength(
      1,
    );
  });

  it("C2: shows each class's translated name and a data-character-class-id per class", () => {
    const fixtureCharacter: Character = {
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["smith", "miner"],
    };

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(screen.queryByText("Smith")).not.toBeNull();
    expect(screen.queryByText("Miner")).not.toBeNull();
    expect(
      Array.from(
        document.querySelectorAll("[data-character-class-id]"),
      ).map((classElement) => classElement.getAttribute("data-character-class-id")),
    ).toEqual(["smith", "miner"]);
  });
});
