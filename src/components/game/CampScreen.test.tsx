// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithMessages,
  screen,
  waitFor,
  within,
} from "@/test/renderWithMessages";
import { GameScreen } from "./GameScreen";
import { PhaseAdvanceButton } from "./PhaseAdvanceButton";
import type { Character } from "@/lib/game/character";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import {
  buildOfferingCharacterShopSlot,
  LOCKED_CHARACTER_SHOP_SLOT,
  SOLD_CHARACTER_SHOP_SLOT,
} from "@/test/characterShopFixtures";
import { CampScreen } from "./CampScreen";

const fixtureBorin: Character = {
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
  gold?: number;
  revision?: number;
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
      gold={overrides.gold ?? 10}
      revision={overrides.revision ?? 5}
      buyCharacterAction={overrides.buyCharacterAction ?? (async () => {})}
      repositionCharacterAction={
        overrides.repositionCharacterAction ?? (async () => {})
      }
    />,
  );
}

describe("CampScreen", () => {
  it("(a) shows the camp heading, and renders no To battle button itself (that's the header's job now)", () => {
    renderCampScreen();

    expect(screen.getByText("Camp")).toBeInTheDocument();
    expect(screen.queryByText(/Day 3/)).toBeNull();
    expect(screen.queryByText(/10 gold/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "To battle" }),
    ).toBeNull();
  });

  // (b) ("the To battle button's form submits expectedCurrentPhase as
  // campPhase") moved to PhaseAdvanceButton.test.tsx (o): the button now
  // lives in the header, not here.

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

  it("(p) locked shop slots show a padlock and the Locked label", () => {
    renderCampScreen();

    // Rescoped to character-shop-slot locked tiles specifically (rather
    // than a whole-document queryAllByText("Locked")), because the locked
    // placeholder sections (equipment/magic/food) also render a padlock
    // and "Locked" label, which would otherwise inflate the count.
    const lockedCharacterShopSlots = document.querySelectorAll(
      '[data-character-shop-slot-state="locked"]',
    );

    expect(lockedCharacterShopSlots).toHaveLength(5);
    lockedCharacterShopSlots.forEach((lockedSlotElement) => {
      expect(lockedSlotElement.querySelector("svg")).not.toBeNull();
      expect(lockedSlotElement.textContent).toContain("Locked");
    });
  });

  it("(q) shows the character, equipment, magic and food sections, with every new section slot locked", () => {
    renderCampScreen();

    ["Characters", "Equipment", "Magic", "Food"].forEach((sectionName) => {
      expect(
        screen.queryByRole("region", { name: sectionName }),
      ).not.toBeNull();
    });

    const charactersRegion = screen.getByRole("region", {
      name: "Characters",
    });
    const equipmentRegion = screen.getByRole("region", { name: "Equipment" });
    const magicRegion = screen.getByRole("region", { name: "Magic" });
    const foodRegion = screen.getByRole("region", { name: "Food" });

    expect(
      charactersRegion.querySelectorAll("[data-character-shop-slot-state]"),
    ).toHaveLength(8);

    const equipmentLockedSlots = equipmentRegion.querySelectorAll(
      '[data-shop-section-slot-state="locked"]',
    );
    const magicLockedSlots = magicRegion.querySelectorAll(
      '[data-shop-section-slot-state="locked"]',
    );
    const foodLockedSlots = foodRegion.querySelectorAll(
      '[data-shop-section-slot-state="locked"]',
    );

    expect(equipmentLockedSlots).toHaveLength(4);
    expect(magicLockedSlots).toHaveLength(4);
    expect(foodLockedSlots).toHaveLength(2);

    const allLockedSectionSlots = [
      ...equipmentLockedSlots,
      ...magicLockedSlots,
      ...foodLockedSlots,
    ];

    allLockedSectionSlots.forEach((slotElement) => {
      expect(slotElement.tagName).not.toBe("BUTTON");
      expect(slotElement.querySelector("button")).toBeNull();
      expect(slotElement.querySelector("svg")).not.toBeNull();
      expect(slotElement.textContent).toContain("Locked");
    });
  });

  it("(g) has exactly one page heading, the camp phase", () => {
    renderCampScreen();

    expect(
      screen.getAllByRole("heading", { level: 1 }).map((headingElement) => headingElement.textContent),
    ).toEqual(["Camp"]);
  });

  it("(k) the front roster card has no on-deck halo in camp", () => {
    renderCampScreen();

    expect(document.querySelector("[data-roster-slot-on-deck-halo]")).toBeNull();
  });

  it("(t) the header's advance button is enabled while the camp is idle", () => {
    renderWithMessages(
      <CampScreen
        playerCampRoster={buildFixtureCampRoster()}
        characterShopSlots={fixtureCharacterShopSlots}
        characterTemplates={fixtureCharacterTemplates}
        gold={10}
        revision={5}
        buyCharacterAction={async () => {}}
        repositionCharacterAction={async () => {}}
      />,
      {
        wrapper: ({ children }) => (
          <GameScreen
            phase="campPhase"
            header={
              <PhaseAdvanceButton
                gamePhase="campPhase"
                advanceGameAction={async () => {}}
              />
            }
          >
            {children}
          </GameScreen>
        ),
      },
    );

    // Scope to the header's own form, rather than finding by name, so this
    // test doesn't depend on whether CampScreen also renders a button with
    // the same name.
    const headerAdvanceForm = document.querySelector("[data-phase-advance]");
    expect(headerAdvanceForm).not.toBeNull();

    const headerAdvanceButton = within(
      headerAdvanceForm as HTMLElement,
    ).getByRole("button");
    expect(headerAdvanceButton).toBeEnabled();
  });
});
