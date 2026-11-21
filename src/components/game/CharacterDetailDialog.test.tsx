// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import { CharacterDetailDialog } from "./CharacterDetailDialog";

// Deliberately uses the real Borin template, the real Growing Lad ability
// and the real English messages (via renderWithMessages), so this test also
// proves the whole path from data to text, not just a fixture round-trip.
const fixtureCharacter = buildTestCharacter({
  id: "borin-1",
  name: "Borin",
  characterTemplateId: "borin",
  experience: 0,
});

function readOpenDialog() {
  const dialog = screen.queryByRole("dialog", { name: "Borin" });
  if (dialog === null) {
    return null;
  }
  return {
    abilityName: dialog.querySelector("[data-ability-name]")?.textContent,
    abilitySummary: dialog.querySelector("[data-ability-summary]")?.textContent,
    levelRows: [...dialog.querySelectorAll("[data-ability-level]")].map(
      (levelRow) => [
        levelRow.querySelector("[data-ability-level-label]")?.textContent,
        levelRow.querySelector("[data-ability-level-text]")?.textContent,
      ],
    ),
    hasCard: dialog.querySelector("[data-expanded-character-card]") !== null,
  };
}

describe("CharacterDetailDialog", () => {
  it("CD1: when open, shows the character's card with its ability name, summary and five labelled level texts", () => {
    renderWithMessages(
      <CharacterDetailDialog
        character={fixtureCharacter}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(readOpenDialog()).toEqual({
      abilityName: "Growing Lad",
      abilitySummary: "Gain more HP per promotion",
      levelRows: [
        ["Lv 1", "Gain an extra +1 HP on promotion"],
        ["Lv 2", "Gain an extra +2 HP on promotion"],
        ["Lv 3", "Gain an extra +3 HP on promotion"],
        ["Lv 4", "Gain an extra +4 HP on promotion"],
        ["Lv 5", "Gain an extra +5 HP on promotion"],
      ],
      hasCard: true,
    });
  });

  it("CD2: when closed, renders no dialog", () => {
    renderWithMessages(
      <CharacterDetailDialog
        character={fixtureCharacter}
        open={false}
        onOpenChange={() => {}}
      />,
    );

    expect(readOpenDialog()).toBeNull();
  });

  it("CD3: the close button asks to close", async () => {
    const user = userEvent.setup();
    const recordedOpenChanges: boolean[] = [];

    renderWithMessages(
      <CharacterDetailDialog
        character={fixtureCharacter}
        open
        onOpenChange={(open) => recordedOpenChanges.push(open)}
      />,
    );

    const closeButton = screen.queryByRole("button", { name: "Close" });
    if (closeButton !== null) {
      await user.click(closeButton);
    }

    expect(recordedOpenChanges).toEqual([false]);
  });

  it("CD4: the dialog is described by the ability summary", () => {
    renderWithMessages(
      <CharacterDetailDialog
        character={fixtureCharacter}
        open
        onOpenChange={() => {}}
      />,
    );

    const dialog = screen.queryByRole("dialog", { name: "Borin" });
    const describedById = dialog?.getAttribute("aria-describedby");

    expect(
      describedById ? document.getElementById(describedById)?.textContent : undefined,
    ).toBe("Gain more HP per promotion");
  });

  it("CD-H1: each level text highlights its number", () => {
    renderWithMessages(
      <CharacterDetailDialog
        character={fixtureCharacter}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(
      [
        ...document.querySelectorAll(
          "[data-ability-level-text] [data-highlight]",
        ),
      ].map((highlightElement) => [
        highlightElement.getAttribute("data-highlight"),
        highlightElement.textContent,
      ]),
    ).toEqual([
      ["number", "+1"],
      ["number", "+2"],
      ["number", "+3"],
      ["number", "+4"],
      ["number", "+5"],
    ]);
  });
});
