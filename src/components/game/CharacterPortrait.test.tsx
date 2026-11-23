// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import { CharacterPortrait } from "./CharacterPortrait";

describe("CharacterPortrait", () => {
  it("P1: mirrors the portrait image when facing left", () => {
    renderWithMessages(
      <CharacterPortrait
        character={buildTestCharacter({ id: "p1", characterTemplateId: "borin" })}
        facing="left"
        sizes="100px"
        fallbackTextClassName=""
      />,
    );
    expect(
      document
        .querySelector("[data-character-portrait-mirrored]")
        ?.getAttribute("data-character-portrait-mirrored") ?? null,
    ).toBe("true");
  });

  it("P2: does not mirror the portrait image when no facing is given", () => {
    renderWithMessages(
      <CharacterPortrait
        character={buildTestCharacter({ id: "p2", characterTemplateId: "borin" })}
        sizes="100px"
        fallbackTextClassName=""
      />,
    );
    expect(
      document
        .querySelector("[data-character-portrait-mirrored]")
        ?.getAttribute("data-character-portrait-mirrored") ?? null,
    ).toBe("false");
  });

  // deliberate assertion rewrite: moved from CharacterCard.test.tsx C24 — CharacterCard no longer takes facing (Phase 15), so the fallback's never-mirrored guarantee is tested on CharacterPortrait directly
  it("P3: the fallback keeps the character's name as its accessible label and isn't mirrored when facing left", () => {
    renderWithMessages(
      <CharacterPortrait
        character={buildTestCharacter({ id: "p3", name: "Grukk" })}
        facing="left"
        sizes="100px"
        fallbackTextClassName=""
      />,
    );
    const fallback = document.querySelector("[data-character-portrait-fallback]");
    expect([
      fallback?.getAttribute("aria-label") ?? null,
      fallback?.getAttribute("role") ?? null,
      fallback !== null &&
        fallback.closest('[data-character-portrait-mirrored="true"]') === null,
      fallback !== null && fallback.closest('[style*="scaleX(-1)"]') === null,
    ]).toEqual(["Grukk", "img", true, true]);
  });
});
