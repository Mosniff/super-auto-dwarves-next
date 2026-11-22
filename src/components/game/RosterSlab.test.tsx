// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen } from "@/test/renderWithMessages";
import type { Character } from "@/lib/game/character";
import { buildTestCharacter } from "@/test/characterFixtures";
import { RosterSlab } from "./RosterSlab";

const emptySlabCharacters: (Character | null)[] = [
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

const frontCharacterSlabCharacters: (Character | null)[] = [
  buildTestCharacter({ id: "fixture-front-character" }),
  null,
  null,
  null,
  null,
  null,
  null,
];

function slotAlignment() {
  return document
    .querySelector("[data-roster-slot-alignment]")
    ?.getAttribute("data-roster-slot-alignment");
}

describe("RosterSlab", () => {
  it("RA1: by default the slot row is centred, with an area on each side", () => {
    renderWithMessages(<RosterSlab characters={emptySlabCharacters} />);

    expect({
      alignment: slotAlignment(),
      hasLeadingArea:
        document.querySelector("[data-roster-slab-leading-area]") !== null,
      hasTrailingArea:
        document.querySelector("[data-roster-slab-trailing-area]") !== null,
    }).toEqual({
      alignment: "centre",
      hasLeadingArea: true,
      hasTrailingArea: true,
    });
  });

  it("RA2: the player's slab aligned toward the front puts its controls on the left and has no right-hand area", () => {
    renderWithMessages(
      <RosterSlab
        characters={emptySlabCharacters}
        variant="player"
        alignsSlotsTowardFront
        leadingControls={<button>Probe control</button>}
      />,
    );

    const probeControl = screen.queryByRole("button", { name: "Probe control" });

    expect({
      alignment: slotAlignment(),
      isProbeControlInLeadingArea:
        probeControl?.closest("[data-roster-slab-leading-area]") != null,
      hasTrailingArea:
        document.querySelector("[data-roster-slab-trailing-area]") !== null,
    }).toEqual({
      alignment: "front",
      isProbeControlInLeadingArea: true,
      hasTrailingArea: false,
    });
  });

  it("RA3: the enemy's slab aligned toward the front has its right-hand area and no left-hand area", () => {
    renderWithMessages(
      <RosterSlab
        characters={emptySlabCharacters}
        variant="enemy"
        alignsSlotsTowardFront
        trailingControls={<button>Probe control</button>}
      />,
    );

    const probeControl = screen.queryByRole("button", { name: "Probe control" });

    expect({
      alignment: slotAlignment(),
      isProbeControlInTrailingArea:
        probeControl?.closest("[data-roster-slab-trailing-area]") != null,
      hasLeadingArea:
        document.querySelector("[data-roster-slab-leading-area]") !== null,
    }).toEqual({
      alignment: "front",
      isProbeControlInTrailingArea: true,
      hasLeadingArea: false,
    });
  });

  it("RA4: the NEXT marker points right on the player's slab and left on the enemy's", () => {
    function observeOnDeckMarker() {
      const onDeckMarker = document.querySelector(
        "[data-roster-slot-on-deck-marker]",
      );
      return {
        direction: onDeckMarker?.getAttribute("data-on-deck-direction") ?? null,
        hasChevron: onDeckMarker?.querySelector("[data-on-deck-chevron]") != null,
        text: onDeckMarker?.textContent ?? null,
        hasHalo:
          document.querySelector("[data-roster-slot-on-deck-halo]") !== null,
      };
    }

    const playerSlabRender = renderWithMessages(
      <RosterSlab
        characters={frontCharacterSlabCharacters}
        variant="player"
        presentsFrontSlotAsOnDeck
      />,
    );
    const playerOnDeckMarker = observeOnDeckMarker();
    playerSlabRender.unmount();

    const enemySlabRender = renderWithMessages(
      <RosterSlab
        characters={frontCharacterSlabCharacters}
        variant="enemy"
        presentsFrontSlotAsOnDeck
      />,
    );
    const enemyOnDeckMarker = observeOnDeckMarker();
    enemySlabRender.unmount();

    // deliberate assertion rewrite: the on-deck ring became a side marker (BR3)
    expect({ playerOnDeckMarker, enemyOnDeckMarker }).toEqual({
      playerOnDeckMarker: {
        direction: "right",
        hasChevron: true,
        text: "next",
        hasHalo: false,
      },
      enemyOnDeckMarker: {
        direction: "left",
        hasChevron: true,
        text: "next",
        hasHalo: false,
      },
    });
  });
});
