// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import { ExpandedCharacterCard } from "./ExpandedCharacterCard";

function q(selector: string) {
  return document.querySelector(selector);
}

describe("ExpandedCharacterCard", () => {
  it("E1: shows the name, tier, translated classes, level, attack and toned hp", () => {
    renderWithMessages(
      <ExpandedCharacterCard
        character={buildTestCharacter({
          id: "e1",
          name: "Borin",
          tier: 2,
          characterClassIds: ["warrior", "miner"],
          attack: 5,
          hp: 4,
          maxHp: 7,
          armour: 0,
          experience: 3,
        })}
      />,
    );

    expect({
      name: q("[data-expanded-card-name]")?.textContent,
      tier: q("[data-expanded-card-tier]")?.textContent,
      classes: [...document.querySelectorAll("[data-expanded-card-class]")].map(
        (classElement) => classElement.textContent,
      ),
      level: q("[data-expanded-card-level]")?.textContent,
      attack: q('[data-expanded-card-stat="attack"]')?.textContent,
      hp: q('[data-expanded-card-stat="hp"]')?.textContent,
      hpTone: q('[data-expanded-card-stat="hp"]')?.getAttribute(
        "data-hp-display-tone",
      ),
    }).toEqual({
      name: "Borin",
      tier: "II",
      classes: ["Warrior", "Miner"],
      level: "Lv 2",
      attack: "5",
      hp: "4",
      hpTone: "damaged",
    });
  });

  it("E2: shows the armour shield only above 0, with an accessible name", () => {
    renderWithMessages(
      <>
        <ExpandedCharacterCard
          character={buildTestCharacter({ id: "e2a", name: "Fixture Dwarf", armour: 0 })}
        />
        <ExpandedCharacterCard
          character={buildTestCharacter({ id: "e2b", name: "Fixture Dwarf", armour: 2 })}
        />
      </>,
    );

    expect(
      [...document.querySelectorAll("[data-expanded-character-card]")].map(
        (expandedCard) => {
          const armourShield = expandedCard.querySelector(
            "[data-expanded-card-armour]",
          );
          return [
            armourShield?.textContent ?? null,
            armourShield?.getAttribute("aria-label") ?? null,
          ];
        },
      ),
    ).toEqual([
      [null, null],
      ["2", "2 armour"],
    ]);
  });

  it("E3: renders its ability content inside the ability box", () => {
    renderWithMessages(
      <ExpandedCharacterCard
        character={buildTestCharacter({ id: "e3", name: "Fixture Dwarf" })}
        abilityContent={<span>Ability text</span>}
      />,
    );

    expect(q("[data-expanded-card-ability-box]")?.textContent).toBe(
      "Ability text",
    );
  });

  it("E4: shows the experience label, segments and caption", () => {
    renderWithMessages(
      <ExpandedCharacterCard
        character={buildTestCharacter({ id: "e4", name: "Borin", experience: 4 })}
      />,
    );

    expect({
      label: q("[data-expanded-card-experience-label]")?.textContent,
      segments: [
        ...document.querySelectorAll("[data-expanded-card-experience-segment]"),
      ].map((segment) => segment.getAttribute("data-expanded-card-experience-segment")),
      caption: q("[data-expanded-card-experience-caption]")?.textContent,
    }).toEqual({
      label: "Experience",
      segments: ["filled", "empty", "empty"],
      caption: "2 XP to level 3",
    });
  });

  it("E5: shows the Ability tab only when there is ability content", () => {
    renderWithMessages(
      <>
        <ExpandedCharacterCard
          character={buildTestCharacter({ id: "e5a", name: "Fixture Dwarf" })}
          abilityContent={<span>Ability text</span>}
        />
        <ExpandedCharacterCard
          character={buildTestCharacter({ id: "e5b", name: "Fixture Dwarf" })}
        />
      </>,
    );

    expect(
      [...document.querySelectorAll("[data-expanded-character-card]")].map(
        (expandedCard) =>
          expandedCard.querySelector("[data-expanded-card-ability-label]")
            ?.textContent ?? null,
      ),
    ).toEqual(["Ability", null]);
  });

  it("E6: the expanded card shows the '?' fallback for a template without a portrait", () => {
    renderWithMessages(
      <ExpandedCharacterCard
        character={buildTestCharacter({ id: "e6", name: "Grukk" })}
      />,
    );

    expect([
      document.querySelector("[data-expanded-character-card] img") !== null,
      document.querySelector("[data-character-portrait-fallback]") !== null,
    ]).toEqual([false, true]);
  });

  it("EF1: the type label reads the faction then the classes, joined by a slash", () => {
    renderWithMessages(
      <ExpandedCharacterCard
        character={buildTestCharacter({
          characterClassIds: ["warrior", "miner"],
        })}
      />,
    );

    expect({
      label: q("[data-expanded-card-type-label]")?.textContent,
      factionId: q("[data-expanded-card-faction]")?.getAttribute(
        "data-expanded-card-faction",
      ),
    }).toEqual({ label: "Dwarf Warrior/Miner", factionId: "dwarf" });
  });
});
