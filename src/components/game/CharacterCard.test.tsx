// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { render, renderWithMessages, screen } from "@/test/renderWithMessages";
import japaneseMessages from "../../../messages/ja.json";
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

  it("C22: armourBeat: a broken shield shows the old armour; a gained shield is marked; no beat, no marker", () => {
    renderWithMessages(
      <>
        <CharacterCard
          character={buildTestCharacter({ id: "c22a", name: "Fixture Dwarf", armour: 0 })}
          armourBeat={{ armourBeatKind: "broken", beatKey: 3, brokenFromArmour: 2 }}
        />
        <CharacterCard
          character={buildTestCharacter({ id: "c22b", name: "Fixture Dwarf", armour: 1 })}
          armourBeat={{ armourBeatKind: "gained", beatKey: 3 }}
        />
        <CharacterCard
          character={buildTestCharacter({ id: "c22c", name: "Fixture Dwarf", armour: 1 })}
        />
      </>,
    );

    expect(
      [...document.querySelectorAll("[data-character-armour]")].map(
        (armourShield) => [
          armourShield.getAttribute("data-character-armour"),
          armourShield.getAttribute("data-armour-beat"),
        ],
      ),
    ).toEqual([
      ["2", "broken"],
      ["1", "gained"],
      ["1", "none"],
    ]);
  });

  it("C23: a template with a portrait shows its image; one without shows the '?' fallback", () => {
    renderWithMessages(
      <>
        <CharacterCard
          character={buildTestCharacter({
            id: "c23a",
            name: "Borin",
            characterTemplateId: "borin",
          })}
        />
        <CharacterCard
          character={buildTestCharacter({ id: "c23b", name: "Grukk" })}
        />
      </>,
    );

    expect(
      [...document.querySelectorAll("[data-character-portrait]")].map(
        (portrait) => [
          portrait.querySelector("img") !== null,
          portrait.querySelector("[data-character-portrait-fallback]") !==
            null,
        ],
      ),
    ).toEqual([
      [true, false],
      [false, true],
    ]);
  });

  it("C20: renders the reveal wash without the XP bar when showRevealWash is set", () => {
    renderWithMessages(
      <CharacterCard
        character={buildTestCharacter({ id: "c20", name: "Fixture Dwarf" })}
        showRevealWash
      />,
    );

    expect([
      document.querySelector("[data-character-experience-mask]") !== null,
      document.querySelector("[data-character-experience-bar]") !== null,
    ]).toEqual([true, false]);
  });

  it("C21: showInlineExperienceBar shows segments only, below the portrait, with MAX at max level", () => {
    renderWithMessages(
      <>
        <CharacterCard
          character={buildTestCharacter({
            id: "c21a",
            name: "Fixture Dwarf",
            experience: 4,
          })}
          showInlineExperienceBar
        />
        <CharacterCard
          character={buildTestCharacter({
            id: "c21b",
            name: "Fixture Dwarf",
            experience: 15,
          })}
          showInlineExperienceBar
        />
      </>,
    );

    expect(
      [
        ...document.querySelectorAll("[data-character-inline-experience-bar]"),
      ].map((inlineBar) => ({
        segments: [
          ...inlineBar.querySelectorAll("[data-experience-segment]"),
        ].map((segment) => segment.getAttribute("data-experience-segment")),
        text: inlineBar.textContent,
        insidePortrait: inlineBar.closest("[data-character-portrait]") !== null,
      })),
    ).toEqual([
      { segments: ["filled", "empty", "empty"], text: "", insidePortrait: false },
      {
        segments: ["filled", "filled", "filled", "filled", "filled"],
        text: "MAX",
        insidePortrait: false,
      },
    ]);
  });

  it("CF1: the type label reads the faction then the classes, joined by a slash", () => {
    renderWithMessages(
      <CharacterCard
        character={buildTestCharacter({ characterClassIds: ["smith", "miner"] })}
      />,
    );

    expect({
      label: document.querySelector("[data-character-type-label]")?.textContent,
      factionId: document
        .querySelector("[data-character-faction-id]")
        ?.getAttribute("data-character-faction-id"),
    }).toEqual({ label: "Dwarf Smith/Miner", factionId: "dwarf" });
  });

  it("CF2: in Japanese the faction joins the first class with の, and classes are joined by a full-width slash", () => {
    render(
      <NextIntlClientProvider locale="ja" messages={japaneseMessages}>
        <CharacterCard
          character={buildTestCharacter({
            characterClassIds: ["warrior", "mage"],
          })}
        />
      </NextIntlClientProvider>,
    );

    expect(
      document.querySelector("[data-character-type-label]")?.textContent,
    ).toBe("ドワーフの戦士／魔法使い");
  });

  it("CF3: a kobold's label names its own faction", () => {
    renderWithMessages(
      <CharacterCard
        character={buildTestCharacter({ characterFactionId: "kobold" })}
      />,
    );

    expect({
      label: document.querySelector("[data-character-type-label]")?.textContent,
      factionId: document
        .querySelector("[data-character-faction-id]")
        ?.getAttribute("data-character-faction-id"),
    }).toEqual({ label: "Kobold Warrior", factionId: "kobold" });
  });

  it("CN3: in Japanese a real template's name is translated, and a template with no entry falls back to the stored name", () => {
    render(
      <NextIntlClientProvider locale="ja" messages={japaneseMessages}>
        <CharacterCard
          character={buildTestCharacter({
            id: "borin-1",
            characterTemplateId: "borin",
            name: "Borin",
          })}
        />
        <CharacterCard
          character={buildTestCharacter({ id: "fixture-1", name: "Fixture Dwarf" })}
        />
      </NextIntlClientProvider>,
    );

    expect({
      translatedName: screen.queryByText("ボリン") !== null,
      storedNameShown: screen.queryByText("Borin") !== null,
      fallbackName: screen.queryByText("Fixture Dwarf") !== null,
    }).toEqual({
      translatedName: true,
      storedNameShown: false,
      fallbackName: true,
    });
  });
});
