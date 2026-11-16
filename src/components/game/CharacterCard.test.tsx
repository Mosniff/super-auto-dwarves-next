// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import type { Character } from "@/lib/game/character";
import { buildTestCharacter } from "@/test/characterFixtures";
import { CharacterCard } from "./CharacterCard";

describe("CharacterCard", () => {
  it("C1: shows the tier's Roman numeral and a data-character-tier attribute", () => {
    // mechanical refactor: replaced with buildTestCharacter
    const fixtureCharacter: Character = buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 2,
      characterClassIds: ["warrior"],
      experience: 0,
    });

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(screen.queryByText("II")).not.toBeNull();
    expect(document.querySelectorAll('[data-character-tier="2"]')).toHaveLength(
      1,
    );
  });

  it("C2: shows each class's translated name and a data-character-class-id per class", () => {
    // mechanical refactor: replaced with buildTestCharacter
    const fixtureCharacter: Character = buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["smith", "miner"],
      experience: 0,
    });

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(screen.queryByText("Smith")).not.toBeNull();
    expect(screen.queryByText("Miner")).not.toBeNull();
    expect(
      Array.from(
        document.querySelectorAll("[data-character-class-id]"),
      ).map((classElement) => classElement.getAttribute("data-character-class-id")),
    ).toEqual(["smith", "miner"]);
  });

  it("C3: the stats pill shows attack and current hp, toned by hp against max", () => {
    // mechanical refactor: replaced with buildTestCharacter
    const fixtureCharacter: Character = buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 4,
      hp: 3,
      maxHp: 7,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
      experience: 0,
    });

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(
      document
        .querySelector('[data-character-stat="attack"]')
        ?.getAttribute("data-character-stat-value") ?? null,
    ).toBe("4");
    expect(
      document
        .querySelector('[data-character-stat="hp"]')
        ?.getAttribute("data-character-stat-value") ?? null,
    ).toBe("3");
    expect(
      document
        .querySelector('[data-character-stat="hp"]')
        ?.getAttribute("data-hp-display-tone") ?? null,
    ).toBe("damaged");
  });

  it("C4: has no HP bar by default", () => {
    // mechanical refactor: replaced with buildTestCharacter
    const fixtureCharacter: Character = buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
      experience: 0,
    });

    renderWithMessages(<CharacterCard character={fixtureCharacter} />);

    expect(document.querySelector("[data-character-hp-bar]")).toBeNull();
  });

  it("C5: shows the HP bar when showHpBar is set", () => {
    // mechanical refactor: replaced with buildTestCharacter
    const fixtureCharacter: Character = buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
      experience: 0,
    });

    renderWithMessages(
      <CharacterCard character={fixtureCharacter} showHpBar />,
    );

    expect(document.querySelector("[data-character-hp-bar]")).not.toBeNull();
  });

  // mechanical refactor: replaced with a single buildTestCharacter call
  function buildCardFixtureCharacter(experience: number): Character {
    return buildTestCharacter({
      id: "fixture-dwarf-1",
      name: "Fixture Dwarf",
      attack: 3,
      hp: 5,
      maxHp: 5,
      characterTemplateId: "fixture-dwarf",
      tier: 1,
      characterClassIds: ["warrior"],
      experience,
    });
  }

  it("C6: has no text box by default", () => {
    renderWithMessages(
      <CharacterCard character={buildCardFixtureCharacter(0)} />,
    );

    expect(
      document.querySelectorAll("[data-character-text-box]"),
    ).toHaveLength(0);
  });

  it("C7: shows the text box when showTextBox is set", () => {
    renderWithMessages(
      <CharacterCard character={buildCardFixtureCharacter(0)} showTextBox />,
    );

    expect(
      document.querySelectorAll("[data-character-text-box]"),
    ).toHaveLength(1);
  });

  it("C8: the stats pill still shows attack and hp without the text box", () => {
    renderWithMessages(
      <CharacterCard character={buildCardFixtureCharacter(0)} />,
    );

    expect(
      document.querySelectorAll('[data-character-stat="attack"]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll('[data-character-stat="hp"]'),
    ).toHaveLength(1);
  });

  it("C9: has no level pill or XP bar by default", () => {
    renderWithMessages(
      <CharacterCard character={buildCardFixtureCharacter(0)} />,
    );

    expect(document.querySelectorAll("[data-character-level]")).toHaveLength(
      0,
    );
    expect(
      document.querySelectorAll("[data-character-experience-bar]"),
    ).toHaveLength(0);
  });

  it("C10: shows the level pill when showLevel is set", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(6)}
        showLevel
      />,
    );

    expect(
      document
        .querySelector("[data-character-level]")
        ?.getAttribute("data-character-level"),
    ).toBe("3");
    expect(screen.queryByText("Lv 3")).not.toBeNull();
  });

  it("C11: shows a segmented XP bar when showExperienceBar is set", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(9)}
        showExperienceBar
      />,
    );

    expect(
      document
        .querySelector("[data-character-experience-bar]")
        ?.getAttribute("data-experience-max-level"),
    ).toBe("false");
    expect(document.querySelectorAll("[data-experience-segment]")).toHaveLength(
      4,
    );
    expect(
      document.querySelectorAll('[data-experience-segment="filled"]'),
    ).toHaveLength(3);
    expect(screen.queryByText("MAX")).toBeNull();
  });

  it("C12: the XP bar is full with MAX at max level", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(15)}
        showExperienceBar
      />,
    );

    expect(
      document
        .querySelector("[data-character-experience-bar]")
        ?.getAttribute("data-experience-max-level"),
    ).toBe("true");
    expect(document.querySelectorAll("[data-experience-segment]")).toHaveLength(
      5,
    );
    expect(
      document.querySelectorAll('[data-experience-segment="filled"]'),
    ).toHaveLength(5);
    expect(screen.queryByText("MAX")).not.toBeNull();
  });

  it("C13: renders no XP reveal wash by default", () => {
    renderWithMessages(
      <CharacterCard character={buildCardFixtureCharacter(0)} />,
    );

    expect(
      document.querySelectorAll("[data-character-experience-mask]"),
    ).toHaveLength(0);
  });

  it("C14: renders the XP reveal wash with showExperienceBar", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(0)}
        showExperienceBar
      />,
    );

    expect(
      document.querySelectorAll("[data-character-experience-mask]"),
    ).toHaveLength(1);
  });

  it("C15: the revealed XP bar has an Experience label and an XP-to-next-level caption", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(4)}
        showExperienceBar
      />,
    );

    expect(screen.queryByText("Experience")).not.toBeNull();
    expect(screen.queryByText("2 XP to level 3")).not.toBeNull();
    expect(screen.queryByText("Max level")).toBeNull();
  });

  it("C16: at max level the caption reads Max level", () => {
    renderWithMessages(
      <CharacterCard
        character={buildCardFixtureCharacter(15)}
        showExperienceBar
      />,
    );

    expect(screen.queryByText("Max level")).not.toBeNull();
    expect(screen.queryByText(/to level/)).toBeNull();
  });

  it("C17: renders no armour shield at armour 0", () => {
    renderWithMessages(
      <CharacterCard
        character={buildTestCharacter({
          id: "c17",
          name: "Fixture Dwarf",
          armour: 0,
        })}
      />,
    );

    expect(document.querySelector("[data-character-armour]")).toBeNull();
  });

  it("C18: shows an armour shield with the number and an accessible name", () => {
    renderWithMessages(
      <CharacterCard
        character={buildTestCharacter({
          id: "c18",
          name: "Fixture Dwarf",
          armour: 2,
        })}
      />,
    );

    const armourShield = document.querySelector("[data-character-armour]");

    expect([
      armourShield?.getAttribute("data-character-armour"),
      armourShield?.textContent,
      armourShield?.getAttribute("aria-label"),
    ]).toEqual(["2", "2", "2 armour"]);
  });
});
