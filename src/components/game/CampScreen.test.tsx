// @vitest-environment jsdom
import { StrictMode, type ReactElement } from "react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  act,
  fireEvent,
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
import {
  buildTestCharacter,
  buildTestCharacterTemplate,
} from "@/test/characterFixtures";
import { CampScreen } from "./CampScreen";

// mechanical refactor: replaced with buildTestCharacter
const fixtureBorin: Character = buildTestCharacter({
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 0,
});

function buildFixtureCampRoster(): CampRoster {
  return [fixtureBorin, null, null, null, null, null, null];
}

// A second Borin, matching fixtureBorin's characterTemplateId, used by the
// merge/sell mode tests below.
const fixtureMatchingBorin: Character = {
  ...fixtureBorin,
  id: "dwarf-2",
  experience: 0,
};

const fixtureTwoBorinCampRoster: CampRoster = [
  fixtureBorin,
  fixtureMatchingBorin,
  null,
  null,
  null,
  null,
  null,
];

// mechanical refactor: replaced with buildTestCharacterTemplate
const fixtureThrudiTemplate: CharacterTemplate = buildTestCharacterTemplate({
  characterTemplateId: "fixture-thrudi",
  name: "Thrudi",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 6,
  maxHp: 5,
});

// mechanical refactor: replaced with buildTestCharacterTemplate
const fixtureGimlokTemplate: CharacterTemplate = buildTestCharacterTemplate({
  characterTemplateId: "fixture-gimlok",
  name: "Gimlok",
  tier: 1,
  characterClassIds: ["miner"],
  attack: 3,
  maxHp: 9,
});

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

// Matches fixtureBorin's characterTemplateId.
// mechanical refactor: replaced with buildTestCharacterTemplate
const fixtureBorinTemplate: CharacterTemplate = buildTestCharacterTemplate({
  characterTemplateId: "fixture-dwarf",
  name: "Borin",
  tier: 1,
  characterClassIds: ["warrior"],
  attack: 3,
  maxHp: 5,
});

const matchingShopRenderOverrides: RenderCampScreenOverrides = {
  characterTemplates: [fixtureBorinTemplate, fixtureThrudiTemplate],
  characterShopSlots: [
    buildOfferingCharacterShopSlot("fixture-dwarf"),
    buildOfferingCharacterShopSlot("fixture-thrudi"),
    SOLD_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
    LOCKED_CHARACTER_SHOP_SLOT,
  ],
};

interface RenderCampScreenOverrides {
  playerCampRoster?: CampRoster;
  characterShopSlots?: CharacterShopSlots;
  characterTemplates?: CharacterTemplate[];
  gold?: number;
  revision?: number;
  buyCharacterAction?: (formData: FormData) => Promise<void>;
  repositionCharacterAction?: (formData: FormData) => Promise<void>;
  mergeCharacterAction?: (formData: FormData) => Promise<void>;
  sellCharacterAction?: (formData: FormData) => Promise<void>;
}

function buildCampScreenElement(overrides: RenderCampScreenOverrides) {
  return (
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
      mergeCharacterAction={
        overrides.mergeCharacterAction ?? (async () => {})
      }
      sellCharacterAction={
        overrides.sellCharacterAction ?? (async () => {})
      }
    />
  );
}

// Mechanical helper change: renderCampScreen now also returns
// rerenderCampScreen, which re-renders the same CampScreen (reusing the
// render result's own wrapper) with a fresh set of overrides — used to
// simulate the refreshed props a server action's refresh() would deliver.
// Mechanical helper change: renderCampScreen also takes an optional
// strictMode option, wrapping both the initial render and every
// rerenderCampScreen call in <React.StrictMode> when set — used to check
// that a merge's XP beat survives Strict Mode's double-invoke behaviour.
function renderCampScreen(
  overrides: RenderCampScreenOverrides = {},
  options: { strictMode?: boolean } = {},
) {
  function wrap(element: ReactElement): ReactElement {
    return options.strictMode ? <StrictMode>{element}</StrictMode> : element;
  }

  const renderResult = renderWithMessages(wrap(buildCampScreenElement(overrides)));

  function rerenderCampScreen(
    rerenderOverrides: RenderCampScreenOverrides = {},
  ) {
    renderResult.rerender(wrap(buildCampScreenElement(rerenderOverrides)));
  }

  return { ...renderResult, rerenderCampScreen };
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

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Slot 6: empty" }));

    expect(recordedRepositionFormValues).toEqual([
      { fromSlotIndex: "0", toSlotIndex: "5", expectedRevision: "5" },
    ]);
  });

  it("(f) with an offering selected, occupied slots are disabled", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    expect(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    ).toBeDisabled();
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
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
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

  it("(q) shows the character, equipment, magic and food sections, with every placeholder slot coming soon", () => {
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

    const placeholderRegionsBySlotCount: [Element, number][] = [
      [equipmentRegion, 4],
      [magicRegion, 4],
      [foodRegion, 2],
    ];

    placeholderRegionsBySlotCount.forEach(
      ([placeholderRegion, expectedSlotCount]) => {
        const comingSoonSlots = placeholderRegion.querySelectorAll(
          '[data-shop-section-slot-state="comingSoon"]',
        );

        expect(comingSoonSlots).toHaveLength(expectedSlotCount);
        comingSoonSlots.forEach((slotElement) => {
          expect(slotElement.tagName).not.toBe("BUTTON");
          expect(slotElement.querySelector("button")).toBeNull();
          expect(slotElement.querySelector("svg")).toBeNull();
          expect(slotElement.textContent).toBe("");
        });

        expect(
          placeholderRegion.querySelectorAll(
            "[data-shop-section-coming-soon]",
          ),
        ).toHaveLength(1);
        expect(
          placeholderRegion.querySelector("[data-shop-section-coming-soon]")
            ?.textContent,
        ).toContain("Coming soon");
      },
    );
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
        mergeCharacterAction={async () => {}}
        sellCharacterAction={async () => {}}
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

  it("(u) camp roster cards show the level pill and XP bar; shop tiles don't", () => {
    renderCampScreen();

    expect(document.querySelectorAll("[data-character-level]")).toHaveLength(
      1,
    );
    expect(
      document.querySelectorAll("[data-character-experience-bar]"),
    ).toHaveLength(1);
  });

  it("(w) with a matching shop character selected, the matching dwarf is a merge target with its XP bar revealed and a merge marker", async () => {
    const user = userEvent.setup();
    renderCampScreen(matchingShopRenderOverrides);

    await user.click(screen.getByRole("button", { name: "Shop: Borin" }));

    const matchingDwarfButton = screen.getByRole("button", {
      name: "Slot 1: Borin, level 1",
    });

    expect(matchingDwarfButton).toHaveAttribute(
      "data-camp-target-presentation",
      "mergeTarget",
    );
    expect(matchingDwarfButton).toHaveAttribute(
      "data-experience-bar-revealed",
      "true",
    );
    expect(
      matchingDwarfButton.querySelectorAll("[data-camp-merge-marker]"),
    ).toHaveLength(1);
  });

  it("(x) with nothing selected, a dwarf's XP bar is not revealed and there is no merge marker", () => {
    renderCampScreen();

    expect(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    ).toHaveAttribute("data-experience-bar-revealed", "false");
    expect(
      document.querySelectorAll("[data-camp-merge-marker]"),
    ).toHaveLength(0);
  });

  it("(y) the selected dwarf's XP bar is revealed", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    expect(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    ).toHaveAttribute("data-experience-bar-revealed", "true");
  });

  it("(z) with a non-matching shop character selected, a dwarf's XP bar is not revealed", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    expect(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    ).toHaveAttribute("data-experience-bar-revealed", "false");
    expect(
      document.querySelectorAll("[data-camp-merge-marker]"),
    ).toHaveLength(0);
  });

  it("(aa) a roster slot's label includes its dwarf's level", () => {
    renderCampScreen({
      playerCampRoster: [
        { ...fixtureBorin, experience: 3 },
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    });

    expect(
      screen.getByRole("button", { name: "Slot 1: Borin, level 2" }),
    ).toBeInTheDocument();
  });

  it("(bb) with a dwarf selected, another dwarf is a swap target with a swap marker", async () => {
    const user = userEvent.setup();
    renderCampScreen({
      playerCampRoster: [
        fixtureBorin,
        { ...fixtureBorin, id: "dwarf-2", name: "Thrain" },
        null,
        null,
        null,
        null,
        null,
      ],
    });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    const swapTargetButton = screen.getByRole("button", {
      name: "Slot 2: Thrain, level 1",
    });

    expect(swapTargetButton).toHaveAttribute(
      "data-camp-target-presentation",
      "swapTarget",
    );
    expect(
      swapTargetButton.querySelectorAll("[data-camp-swap-marker]"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("[data-camp-swap-marker]"),
    ).toHaveLength(1);
  });

  it("(cc) shows an unpressed Merge / Sell toggle", () => {
    renderCampScreen();

    expect(
      screen.getByRole("button", { name: "Merge / Sell" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("(dd) clicking the toggle latches merge/sell mode, and a dwarf clicked onto a matching dwarf submits a merge", async () => {
    const recordedMergeFormValues: Record<string, FormDataEntryValue>[] = [];
    const mergeCharacterAction = async (formData: FormData) => {
      recordedMergeFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      mergeCharacterAction,
    });

    const mergeSellToggle = screen.getByRole("button", {
      name: "Merge / Sell",
    });
    await user.click(mergeSellToggle);

    expect(mergeSellToggle).toHaveAttribute("aria-pressed", "true");
    expect(
      mergeSellToggle.querySelectorAll("[data-merge-sell-lock]"),
    ).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    expect(recordedMergeFormValues).toEqual([
      { fromSlotIndex: "0", intoSlotIndex: "1", expectedRevision: "5" },
    ]);
  });

  it("(ee) holding Shift moves the toggle into merge/sell mode without latching it; releasing Shift moves it back", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    const mergeSellToggle = screen.getByRole("button", {
      name: "Merge / Sell",
    });

    await user.keyboard("{Shift>}");
    const whileHeld = {
      active: mergeSellToggle.getAttribute("data-merge-sell-mode-active"),
      pressed: mergeSellToggle.getAttribute("aria-pressed"),
    };

    await user.keyboard("{/Shift}");
    const afterRelease = {
      active: mergeSellToggle.getAttribute("data-merge-sell-mode-active"),
      pressed: mergeSellToggle.getAttribute("aria-pressed"),
    };

    expect({ whileHeld, afterRelease }).toEqual({
      whileHeld: { active: "true", pressed: "false" },
      afterRelease: { active: "false", pressed: "false" },
    });
  });

  it("(ff) Shift+Tab does not leave merge/sell mode on", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.keyboard("{Shift>}{Tab}");

    expect(
      screen.getByRole("button", { name: "Merge / Sell" }),
    ).toHaveAttribute("data-merge-sell-mode-active", "false");
  });

  it("(gg) losing window focus clears a held Shift", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.keyboard("{Shift>}");
    act(() => {
      fireEvent.blur(window);
    });

    expect(
      screen.getByRole("button", { name: "Merge / Sell" }),
    ).toHaveAttribute("data-merge-sell-mode-active", "false");
  });

  function readSellArea() {
    const sellArea = document.querySelector("[data-sell-area]");
    return {
      shown: sellArea?.getAttribute("data-sell-area-shown"),
      presentation: sellArea?.getAttribute("data-camp-target-presentation"),
    };
  }

  it("(sa1) the sell box reserves its space but is hidden and unreachable with nothing held", () => {
    renderCampScreen();

    expect({
      ...readSellArea(),
      sellButtonFound:
        screen.queryByRole("button", { name: "Sell" }) !== null,
    }).toEqual({
      shown: "false",
      presentation: "ineligible",
      sellButtonFound: false,
    });
  });

  it("(sa2) holding a roster dwarf in merge/sell mode shows an eligible sell box", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    expect({
      ...readSellArea(),
      sellButtonFound:
        screen.queryByRole("button", { name: "Sell" }) !== null,
    }).toEqual({
      shown: "true",
      presentation: "eligible",
      sellButtonFound: true,
    });
  });

  it("(sa3) clicking the sell box sells the held dwarf", async () => {
    const recordedSellFormValues: Record<string, FormDataEntryValue>[] = [];
    const sellCharacterAction = async (formData: FormData) => {
      recordedSellFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({ sellCharacterAction });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Sell" }));

    expect(recordedSellFormValues).toEqual([
      { slotIndex: "0", expectedRevision: "5" },
    ]);
  });

  it("(sa4) in reposition mode, holding a roster dwarf keeps the sell box hidden", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    expect(readSellArea().shown).toBe("false");
  });

  it("(sh1) holding a shop card disables the toggle and Shift does nothing", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));
    await user.keyboard("{Shift>}");

    const toggle = screen.getByRole("button", { name: "Merge / Sell" });

    expect({
      disabled: toggle.hasAttribute("disabled"),
      active: toggle.getAttribute("data-merge-sell-mode-active"),
    }).toEqual({ disabled: true, active: "false" });
  });

  it("(sh2) a latched toggle stays latched, but disabled, while a shop card is held", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    const toggle = screen.getByRole("button", { name: "Merge / Sell" });

    expect({
      disabled: toggle.hasAttribute("disabled"),
      pressed: toggle.getAttribute("aria-pressed"),
      active: toggle.getAttribute("data-merge-sell-mode-active"),
    }).toEqual({ disabled: true, pressed: "true", active: "true" });
  });

  // DOM order matches slot index (flex-row-reverse only reverses the
  // visual layout, never the DOM tree order RosterSlab maps the slots in).
  function playerSlotRoot(slotIndex: number): Element | null {
    return document.querySelectorAll("[data-roster-slot]")[slotIndex] ?? null;
  }

  it("(an1) after a merge, the source slot exits as merged-away and other slots shuffle", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    const mergedRoster: CampRoster = [
      null,
      {
        ...fixtureMatchingBorin,
        experience: 1,
        attack: fixtureMatchingBorin.attack + 1,
        hp: fixtureMatchingBorin.hp + 1,
        maxHp: fixtureMatchingBorin.maxHp + 1,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    expect(
      [0, 1, 2].map((slotIndex) =>
        playerSlotRoot(slotIndex)?.getAttribute("data-roster-slot-exit-kind"),
      ),
    ).toEqual(["mergedAway", "shuffle", "shuffle"]);
  });

  it("(an2) after a merge, the target shows a '+1 XP' floater", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    const mergedRoster: CampRoster = [
      null,
      {
        ...fixtureMatchingBorin,
        experience: 1,
        attack: fixtureMatchingBorin.attack + 1,
        hp: fixtureMatchingBorin.hp + 1,
        maxHp: fixtureMatchingBorin.maxHp + 1,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    // The target's new level is still 1 (1 XP isn't enough to level up).
    const targetSlotButton = screen.getByRole("button", {
      name: "Slot 2: Borin, level 1",
    });

    expect(
      await within(targetSlotButton).findByText("+1 XP"),
    ).toBeInTheDocument();
  });

  it("(an3) after a sell, the sold slot shows a '+1 gold' floater", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({ revision: 5 });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Sell" }));

    rerenderCampScreen({
      playerCampRoster: [null, null, null, null, null, null, null],
      gold: 11,
      revision: 6,
    });

    expect(await screen.findByText("+1 gold")).toBeInTheDocument();
  });

  it("(an4) after a merge, the target slot plays an XP-gain beat", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    const mergedRoster: CampRoster = [
      null,
      {
        ...fixtureMatchingBorin,
        experience: 1,
        attack: fixtureMatchingBorin.attack + 1,
        hp: fixtureMatchingBorin.hp + 1,
        maxHp: fixtureMatchingBorin.maxHp + 1,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    expect(playerSlotRoot(1)?.getAttribute("data-experience-beat")).toBe(
      "experienceGained",
    );
  });

  it("(an5) a merge that crosses a level threshold plays a level-up beat", async () => {
    const user = userEvent.setup();
    // The target starts at 2 XP — still level 1 (3 XP is needed for level 2).
    const targetAtExperienceTwo: Character = {
      ...fixtureMatchingBorin,
      experience: 2,
    };
    const rosterBeforeMerge: CampRoster = [
      fixtureBorin,
      targetAtExperienceTwo,
      null,
      null,
      null,
      null,
      null,
    ];

    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: rosterBeforeMerge,
      revision: 5,
    });

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    // The target gains the consumed character's XP (0) + 1, reaching 3 —
    // level 2.
    const mergedRoster: CampRoster = [
      null,
      {
        ...targetAtExperienceTwo,
        experience: 3,
        attack: targetAtExperienceTwo.attack + 1,
        hp: targetAtExperienceTwo.hp + 1,
        maxHp: targetAtExperienceTwo.maxHp + 1,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    expect(playerSlotRoot(1)?.getAttribute("data-experience-beat")).toBe(
      "levelledUp",
    );
  });

  it("(an2-strict) under React.StrictMode, a merge still shows the '+1 XP' floater without throwing", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen(
      { playerCampRoster: fixtureTwoBorinCampRoster, revision: 5 },
      { strictMode: true },
    );

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: Borin, level 1" }),
    );

    const mergedRoster: CampRoster = [
      null,
      {
        ...fixtureMatchingBorin,
        experience: 1,
        attack: fixtureMatchingBorin.attack + 1,
        hp: fixtureMatchingBorin.hp + 1,
        maxHp: fixtureMatchingBorin.maxHp + 1,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    const targetSlotButton = screen.getByRole("button", {
      name: "Slot 2: Borin, level 1",
    });

    expect(
      await within(targetSlotButton).findByText("+1 XP"),
    ).toBeInTheDocument();
  });

  it("(ii) a settled mode change is announced politely", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Merge / Sell" }));

    const announcementText = await screen.findByText("Merge / sell mode on");

    expect(
      announcementText.closest("[data-merge-sell-announcement]"),
    ).toHaveAttribute("aria-live", "polite");
  });

  it("(kk) a quick Shift+Tab announces nothing", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(
      document.querySelector("[data-merge-sell-announcement]")?.textContent,
    ).toBe("");
  });

  it("CS1: every occupied roster slot and every shop offering has an info control beside, never inside, its button", () => {
    renderCampScreen();

    expect(
      [...document.querySelectorAll("[data-character-info-control]")]
        .map((infoControl) => [
          infoControl.getAttribute("aria-label"),
          infoControl.parentElement?.closest("button") !== null,
        ])
        .sort(),
    ).toEqual([
      ["Details: Borin", false],
      ["Details: Gimlok", false],
      ["Details: Thrudi", false],
    ]);
  });

  it("CS2: clicking a roster dwarf's info control opens its dialog without selecting the slot or submitting an intent", async () => {
    const recordedBuyFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedRepositionFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedMergeFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedSellFormValues: Record<string, FormDataEntryValue>[] = [];
    const user = userEvent.setup();
    renderCampScreen({
      buyCharacterAction: async (formData) => {
        recordedBuyFormValues.push(Object.fromEntries(formData));
      },
      repositionCharacterAction: async (formData) => {
        recordedRepositionFormValues.push(Object.fromEntries(formData));
      },
      mergeCharacterAction: async (formData) => {
        recordedMergeFormValues.push(Object.fromEntries(formData));
      },
      sellCharacterAction: async (formData) => {
        recordedSellFormValues.push(Object.fromEntries(formData));
      },
    });

    const infoControl = screen.queryByRole("button", {
      name: "Details: Borin",
    });
    if (infoControl !== null) {
      await user.click(infoControl);
    }

    // hidden: true — the open modal dialog (Radix) correctly hides the
    // background from the accessibility tree; we only read the slot's
    // state behind it.
    expect({
      isDialogOpen: screen.queryByRole("dialog", { name: "Borin" }) !== null,
      slotPressed: screen
        .getByRole("button", { name: "Slot 1: Borin, level 1", hidden: true })
        .getAttribute("aria-pressed"),
      submittedIntentCount:
        recordedBuyFormValues.length +
        recordedRepositionFormValues.length +
        recordedMergeFormValues.length +
        recordedSellFormValues.length,
    }).toEqual({
      isDialogOpen: true,
      slotPressed: "false",
      submittedIntentCount: 0,
    });
  });

  it("CS3: clicking a shop offering's info control opens the dialog for the character it offers", async () => {
    const recordedBuyFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedRepositionFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedMergeFormValues: Record<string, FormDataEntryValue>[] = [];
    const recordedSellFormValues: Record<string, FormDataEntryValue>[] = [];
    const user = userEvent.setup();
    renderCampScreen({
      buyCharacterAction: async (formData) => {
        recordedBuyFormValues.push(Object.fromEntries(formData));
      },
      repositionCharacterAction: async (formData) => {
        recordedRepositionFormValues.push(Object.fromEntries(formData));
      },
      mergeCharacterAction: async (formData) => {
        recordedMergeFormValues.push(Object.fromEntries(formData));
      },
      sellCharacterAction: async (formData) => {
        recordedSellFormValues.push(Object.fromEntries(formData));
      },
    });

    const infoControl = screen.queryByRole("button", {
      name: "Details: Thrudi",
    });
    if (infoControl !== null) {
      await user.click(infoControl);
    }

    expect({
      isDialogOpen: screen.queryByRole("dialog", { name: "Thrudi" }) !== null,
      submittedIntentCount:
        recordedBuyFormValues.length +
        recordedRepositionFormValues.length +
        recordedMergeFormValues.length +
        recordedSellFormValues.length,
    }).toEqual({ isDialogOpen: true, submittedIntentCount: 0 });
  });

  it("CS4: a selected roster slot reveals its info control", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    const slotButton = screen.getByRole("button", {
      name: "Slot 1: Borin, level 1",
    });
    const revealedBefore = slotButton
      .closest("[data-info-control-host]")
      ?.getAttribute("data-info-control-revealed");

    await user.click(slotButton);

    const revealedAfter = screen
      .getByRole("button", { name: "Slot 1: Borin, level 1" })
      .closest("[data-info-control-host]")
      ?.getAttribute("data-info-control-revealed");

    expect([revealedBefore, revealedAfter]).toEqual(["false", "true"]);
  });

  it("CS5: shop offering tiles carry the wash reveal state, and their cards render the wash", () => {
    renderCampScreen();

    expect(
      [
        ...document.querySelectorAll(
          '[data-character-shop-slot-state="offering"]',
        ),
      ].map((shopTile) => [
        shopTile.getAttribute("data-card-wash-revealed"),
        shopTile.querySelector("[data-character-experience-mask]") !== null,
      ]),
    ).toEqual([
      ["false", true],
      ["false", true],
    ]);
  });

  it("CS6: the camp exposes whether a drag is in progress", () => {
    renderCampScreen();

    expect(
      document.querySelector("[data-camp-dragging]")?.getAttribute(
        "data-camp-dragging",
      ),
    ).toBe("false");
  });
});
