// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithMessages, screen, waitFor } from "@/test/renderWithMessages";
import type { OwnedCharacter } from "@/lib/game/ownedCharacter";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import {
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import { CampScreen } from "./CampScreen";

const fixtureBorin: OwnedCharacter = {
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
};

function buildFixtureCampRoster(): CampRoster {
  return [fixtureBorin, null, null, null, null, null, null];
}

const fixtureThrudiTemplate: CharacterTemplate = {
  characterTemplateId: "fixture-thrudi",
  name: "Thrudi",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 6,
  maxHp: 5,
};

const fixtureGimlokTemplate: CharacterTemplate = {
  characterTemplateId: "fixture-gimlok",
  name: "Gimlok",
  tier: 1,
  characterClassIds: ["miner"],
  attack: 3,
  maxHp: 9,
};

const fixtureCharacterTemplates: CharacterTemplate[] = [
  fixtureThrudiTemplate,
  fixtureGimlokTemplate,
];

const fixtureCharacterShopSlots: CharacterShopSlots = [
  buildOfferingCharacterShopSlot("fixture-thrudi"),
  buildOfferingCharacterShopSlot("fixture-gimlok"),
  SOLD_CHARACTER_SHOP_SLOT,
  LOCKED_CHARACTER_SHOP_SLOT,
  LOCKED_CHARACTER_SHOP_SLOT,
  LOCKED_CHARACTER_SHOP_SLOT,
  LOCKED_CHARACTER_SHOP_SLOT,
  LOCKED_CHARACTER_SHOP_SLOT,
];

interface RenderCampScreenOverrides {
  playerCampRoster?: CampRoster;
  characterShopSlots?: CharacterShopSlots;
  characterTemplates?: CharacterTemplate[];
  day?: number;
  gold?: number;
  revision?: number;
  advanceGameAction?: (formData: FormData) => Promise<void>;
  buyCharacterAction?: (formData: FormData) => Promise<void>;
  repositionCharacterAction?: (formData: FormData) => Promise<void>;
}

function renderCampScreen(overrides: RenderCampScreenOverrides = {}) {
  return renderWithMessages(
    <CampScreen
      playerCampRoster={overrides.playerCampRoster ?? buildFixtureCampRoster()}
      characterShopSlots={
        overrides.characterShopSlots ?? fixtureCharacterShopSlots
      }
      characterTemplates={
        overrides.characterTemplates ?? fixtureCharacterTemplates
      }
      day={overrides.day ?? 3}
      gold={overrides.gold ?? 10}
      revision={overrides.revision ?? 5}
      advanceGameAction={overrides.advanceGameAction ?? (async () => {})}
      buyCharacterAction={overrides.buyCharacterAction ?? (async () => {})}
      repositionCharacterAction={
        overrides.repositionCharacterAction ?? (async () => {})
      }
    />,
  );
}

describe("CampScreen", () => {
  it("(a) shows the camp heading, day, gold and a To battle button", () => {
    renderCampScreen();

    expect(screen.getByText("Camp")).toBeInTheDocument();
    expect(screen.getByText(/Day 3/)).toBeInTheDocument();
    expect(screen.getByText(/10 gold/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "To battle" }),
    ).toBeInTheDocument();
  });

  it("(b) the To battle button's form submits expectedCurrentPhase as campPhase", () => {
    renderCampScreen();

    const toBattleButton = screen.getByRole("button", { name: "To battle" });
    const form = toBattleButton.closest("form");

    expect(form).not.toBeNull();
    expect(
      new FormData(form as HTMLFormElement).get("expectedCurrentPhase"),
    ).toBe("campPhase");
  });

  it("(c) shows a tile for each offering slot, a sold slot for each sold one, and a locked slot for each locked one", () => {
    renderCampScreen();

    expect(
      document.querySelectorAll('[data-character-shop-slot-state="offering"]'),
    ).toHaveLength(2);
    expect(
      document.querySelectorAll('[data-character-shop-slot-state="sold"]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll('[data-character-shop-slot-state="locked"]'),
    ).toHaveLength(5);
    expect(screen.getByText("Sold")).toBeInTheDocument();
  });

  it("(d) buying: clicking an offering then an empty slot submits the buy intent with the expected revision", async () => {
    const recordedBuyFormValues: Record<string, FormDataEntryValue>[] = [];
    const buyCharacterAction = async (formData: FormData) => {
      recordedBuyFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({ buyCharacterAction });

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));
    await user.click(screen.getByRole("button", { name: "Slot 4: empty" }));

    expect(recordedBuyFormValues).toEqual([
      {
        shopSlotIndex: "0",
        targetRosterSlotIndex: "3",
        expectedRevision: "5",
      },
    ]);
  });

  it("(e) moving: clicking a dwarf then another slot submits the reposition intent", async () => {
    const recordedRepositionFormValues: Record<
      string,
      FormDataEntryValue
    >[] = [];
    const repositionCharacterAction = async (formData: FormData) => {
      recordedRepositionFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({ repositionCharacterAction });

    await user.click(screen.getByRole("button", { name: "Slot 1: Borin" }));
    await user.click(screen.getByRole("button", { name: "Slot 6: empty" }));

    expect(recordedRepositionFormValues).toEqual([
      { fromSlotIndex: "0", toSlotIndex: "5", expectedRevision: "5" },
    ]);
  });

  it("(f) with an offering selected, occupied slots are disabled", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    expect(screen.getByRole("button", { name: "Slot 1: Borin" })).toBeDisabled();
  });

  it("(g) with nothing selected, empty slots are disabled", () => {
    renderCampScreen();

    expect(screen.getByRole("button", { name: "Slot 2: empty" })).toBeDisabled();
  });

  it("(h) locks the camp while an intent is pending", async () => {
    const buyCharacterAction = () => new Promise<void>(() => {});
    const user = userEvent.setup();
    renderCampScreen({ buyCharacterAction });

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));
    await user.click(screen.getByRole("button", { name: "Slot 4: empty" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Shop: Gimlok" }),
      ).toBeDisabled();
    });
  });

  it("(i) a selected tile keeps aria-pressed true", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Shop: Thrudi" }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("(j) no tile is given dnd-kit's draggable role description", () => {
    renderCampScreen();

    expect(
      document.querySelectorAll('[aria-roledescription="draggable"]'),
    ).toHaveLength(0);
  });

  it("(k) with an offering selected, empty slots present as eligible and occupied ones as ineligible", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    expect(
      screen.getByRole("button", { name: "Slot 4: empty" }),
    ).toHaveAttribute("data-camp-target-presentation", "eligible");
    expect(
      screen.getByRole("button", { name: "Slot 1: Borin" }),
    ).toHaveAttribute("data-camp-target-presentation", "ineligible");
  });

  it("(l) with nothing selected, an empty slot presents as neutral", () => {
    renderCampScreen();

    expect(
      screen.getByRole("button", { name: "Slot 2: empty" }),
    ).toHaveAttribute("data-camp-target-presentation", "neutral");
  });

  it("(m) with nothing in hand, an offering the player can't afford presents as ineligible", () => {
    renderCampScreen({ gold: 2 });

    expect(
      screen.getByRole("button", { name: "Shop: Thrudi" }),
    ).toHaveAttribute("data-camp-target-presentation", "ineligible");
  });

  it("(n) marks the camp busy while an intent is pending", async () => {
    const buyCharacterAction = () => new Promise<void>(() => {});
    const user = userEvent.setup();
    renderCampScreen({ buyCharacterAction });

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));
    await user.click(screen.getByRole("button", { name: "Slot 4: empty" }));

    await waitFor(() => {
      expect(
        document.querySelector('[aria-busy="true"]'),
      ).not.toBeNull();
    });
  });

  it("(o) locked and sold slots are not buttons", () => {
    renderCampScreen();

    const lockedAndSoldSlotElements = [
      ...document.querySelectorAll('[data-character-shop-slot-state="locked"]'),
      ...document.querySelectorAll('[data-character-shop-slot-state="sold"]'),
    ];

    expect(lockedAndSoldSlotElements.length).toBe(6);
    lockedAndSoldSlotElements.forEach((slotElement) => {
      expect(slotElement.tagName).not.toBe("BUTTON");
      expect(slotElement.querySelector("button")).toBeNull();
    });
  });
});
