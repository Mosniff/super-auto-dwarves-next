// @vitest-environment jsdom
import { StrictMode, type ReactElement } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  act,
  renderWithMessages,
  screen,
  waitFor,
  within,
} from "@/test/renderWithMessages";
import { GameScreen } from "./GameScreen";
import { PhaseAdvanceButton } from "./PhaseAdvanceButton";
import { DisplayedGold } from "./headerGoldDisplay";
import type { Character } from "@/lib/game/character";
import type { GamePhase } from "@/lib/game/types";
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
import { SHOP_CHARACTER_PRICE } from "@/lib/game/shop";
import {
  CAMP_START_FLOATER_DURATION_MS,
  CAMP_START_LAND_DELAY_MS,
  CAMP_START_SEQUENCE_START_DELAY_MS,
} from "./campStartSequence";

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

    // deliberate assertion rewrite: the camp phase banner reads "Shop" (BR4)
    expect(screen.getByText("Shop")).toBeInTheDocument();
    expect(screen.queryByText(/Day 3/)).toBeNull();
    // deliberate assertion rewrite: the camp shows the gold on its money pile since Phase 16 (before: no gold in camp; the header shows it too)
    expect(
      document.querySelector("[data-money-pile-gold]")?.textContent ?? null,
    ).toBe("10 gold");
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

    // deliberate assertion rewrite: the camp phase banner reads "Shop" (BR4)
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((headingElement) => headingElement.textContent),
    ).toEqual(["Shop"]);
  });

  it("(k) the front roster card has no on-deck marker in camp", () => {
    renderCampScreen();

    // deliberate assertion rewrite: the on-deck ring became a side marker (BR3)
    expect(document.querySelector("[data-roster-slot-on-deck-marker]")).toBeNull();
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

  // deliberate assertion rewrite: shop cards now show level and an inline
  // XP bar (Phase 12, the human's call)
  it("(u) camp roster cards show the level pill and the overlay XP bar; shop offerings show the level pill and the inline XP bar instead", () => {
    renderCampScreen();

    expect({
      levelPills: document.querySelectorAll("[data-character-level]").length,
      overlayExperienceBars: document.querySelectorAll(
        "[data-character-experience-bar]",
      ).length,
      inlineExperienceBars: document.querySelectorAll(
        "[data-character-inline-experience-bar]",
      ).length,
    }).toEqual({ levelPills: 3, overlayExperienceBars: 1, inlineExperienceBars: 2 });
  });

  it("RT1: the player's roster slots are in left-to-right document order: the backline (slot 7) first, the front (slot 1) last", () => {
    renderCampScreen();

    expect(
      screen
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
        .filter((label) => label?.startsWith("Slot ")),
    ).toEqual([
      "Slot 7: empty",
      "Slot 6: empty",
      "Slot 5: empty",
      "Slot 4: empty",
      "Slot 3: empty",
      "Slot 2: empty",
      "Slot 1: Borin, level 1",
    ]);
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

  // deliberate assertion rewrite: the selected dwarf's neighbour now shows split zones, and the swap marker moved from its whole-slot button onto its swap zone (Phase 16)
  it("(bb) with a dwarf selected, another dwarf's swap zone is eligible and carries the swap marker", async () => {
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

    const swapZoneButton = screen.getByRole("button", {
      name: "Slot 2: swap position with Thrain",
    });

    expect(swapZoneButton).toHaveAttribute(
      "data-roster-slot-zone-presentation",
      "eligible",
    );
    expect(
      swapZoneButton.querySelectorAll("[data-camp-swap-marker]"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("[data-camp-swap-marker]"),
    ).toHaveLength(1);
  });

  // deliberate test-helper fix: select slots by their index attribute, not
  // document position (Phase 12 tab-order change)
  //
  // Selects by data-roster-slot-index, never by document position: the
  // player's slab renders slots in visual (left-to-right) order, so
  // document order is no longer slot order (Phase 12).
  function playerSlotRoot(slotIndex: number): Element | null {
    return document.querySelector(
      `[data-roster-slot][data-roster-slot-index="${slotIndex}"]`,
    );
  }

  it("(an1) after a merge, the source slot exits as merged-away and other slots shuffle", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

    // deliberate assertion rewrite: a sell is a click on the money pile, with no merge/sell mode (Phase 16)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Sell Borin" }));

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

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

  it("AN6: a merge whose ability added hp shows a '+N HP' floater after the XP floater", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
    );

    const mergedRoster: CampRoster = [
      null,
      {
        ...fixtureMatchingBorin,
        experience: 1,
        attack: fixtureMatchingBorin.attack + 1,
        hp: fixtureMatchingBorin.hp + 2,
        maxHp: fixtureMatchingBorin.maxHp + 2,
      },
      null,
      null,
      null,
      null,
      null,
    ];

    rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

    expect(screen.queryByText("+1 HP") !== null).toBe(true);
  });

  it("AN7: a merge with no ability hp shows no HP floater", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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
      document.querySelector('[data-roster-slot-floater="abilityHp"]'),
    ).toBeNull();
  });

  it("AN8: the XP beat ends on its own timer, even when the floater's animation callback never arrives", async () => {
    const user = userEvent.setup();
    const { rerenderCampScreen } = renderCampScreen({
      playerCampRoster: fixtureTwoBorinCampRoster,
      revision: 5,
    });

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

    // Only setTimeout/clearTimeout are faked: motion keeps running on the
    // real requestAnimationFrame, so the floater's onAnimationComplete
    // cannot arrive inside this test — standing in for the browser case
    // where it never arrived.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      rerenderCampScreen({ playerCampRoster: mergedRoster, revision: 6 });

      const beforeActive = playerSlotRoot(1)?.getAttribute(
        "data-experience-beat-active",
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect({
        beforeActive,
        afterActive: playerSlotRoot(1)?.getAttribute(
          "data-experience-beat-active",
        ),
        afterBeat: playerSlotRoot(1)?.getAttribute("data-experience-beat"),
      }).toEqual({
        beforeActive: "true",
        afterActive: "false",
        afterBeat: "none",
      });
    } finally {
      vi.useRealTimers();
    }
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

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

    // deliberate assertion rewrite: a merge is now a click on the matching dwarf's merge zone, with no merge/sell mode (Phase 16 split drop zones)
    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
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

  it("CS7: shop offerings show the level pill and the inline XP bar", () => {
    renderCampScreen();

    expect(
      [
        ...document.querySelectorAll(
          '[data-character-shop-slot-state="offering"]',
        ),
      ].map((shopTile) => [
        shopTile
          .querySelector("[data-character-level]")
          ?.getAttribute("data-character-level") ?? null,
        shopTile.querySelector("[data-character-inline-experience-bar]") !== null,
      ]),
    ).toEqual([
      ["1", true],
      ["1", true],
    ]);
  });

  function slotButton() {
    return screen.getByRole("button", { name: "Slot 1: Borin, level 1" });
  }

  it("SEL1: clicking empty space inside the camp clears the selection", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(slotButton());
    await user.click(screen.getByText("Characters"));

    expect(slotButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("SEL2: Escape clears the selection", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(slotButton());
    await user.keyboard("{Escape}");

    expect(slotButton().getAttribute("aria-pressed")).toBe("false");
  });

  it("SEL3: Escape with an info dialog open closes only the dialog; the selection stays", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(slotButton());
    await user.click(screen.getByRole("button", { name: "Details: Borin" }));
    await user.keyboard("{Escape}");

    expect({
      isDialogOpen: screen.queryByRole("dialog") !== null,
      slotPressed: slotButton().getAttribute("aria-pressed"),
    }).toEqual({ isDialogOpen: false, slotPressed: "true" });
  });

  it("SEL4: clicking an info control keeps the selection after the dialog closes", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(slotButton());
    await user.click(screen.getByRole("button", { name: "Details: Borin" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(slotButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("SEL5: the info control is its dialog's trigger, and focus returns to it on close", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    const infoControl = screen.getByRole("button", { name: "Details: Borin" });
    const hasPopupBefore = infoControl.getAttribute("aria-haspopup");

    await user.click(infoControl);
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect([
      hasPopupBefore,
      document.activeElement?.getAttribute("aria-label") ?? null,
    ]).toEqual(["dialog", "Details: Borin"]);
  });
});

const fixtureNorbin: Character = buildTestCharacter({
  id: "norbin-1",
  name: "Norbin",
  characterTemplateId: "norbin",
});

// The full /play frame (GameScreen + header), so the start-of-camp sequence
// (which reads arrival from GameScreen's PhaseArrivalProvider and reports
// pending gold up to the header) has somewhere real to run.
function harnessElement(phase: GamePhase, revision: number): ReactElement {
  return (
    <GameScreen
      phase={phase}
      header={
        <>
          <PhaseAdvanceButton
            gamePhase={phase}
            advanceGameAction={async () => {}}
          />
          <DisplayedGold gold={11} />
        </>
      }
    >
      {phase === "campPhase" ? (
        buildCampScreenElement({
          playerCampRoster: [fixtureNorbin, null, null, null, null, null, null],
          gold: 11,
          revision,
        })
      ) : (
        <div data-test-battle-placeholder />
      )}
    </GameScreen>
  );
}

function renderCampArrival({
  arrivesFromBattle,
}: {
  arrivesFromBattle: boolean;
}) {
  const renderResult = renderWithMessages(
    harnessElement(arrivesFromBattle ? "battlePhase" : "campPhase", 5),
  );

  if (arrivesFromBattle) {
    renderResult.rerender(harnessElement("campPhase", 5));
  }

  function rerenderCamp(revision: number) {
    renderResult.rerender(harnessElement("campPhase", revision));
  }

  return { ...renderResult, rerenderCamp };
}

function observeCampStart() {
  const advanceButton = document.querySelector(
    "[data-phase-advance] button",
  ) as HTMLButtonElement | null;
  const frontSlotButton = screen.getByRole("button", {
    name: "Slot 1: Norbin, level 1",
  }) as HTMLButtonElement;
  const frontSlotRoot = document.querySelector('[data-roster-slot-index="0"]');
  const goldFloater = frontSlotRoot?.querySelector(
    '[data-roster-slot-floater="abilityGold"]',
  );

  return {
    headerGold:
      document.querySelector("[data-displayed-gold]")?.textContent ?? null,
    isFrontSlotButtonDisabled: frontSlotButton.disabled,
    isAdvanceButtonEnabled: advanceButton !== null && !advanceButton.disabled,
    frontSlotAbilityActing:
      frontSlotRoot?.getAttribute("data-ability-acting") ?? null,
    goldFloaterText: goldFloater?.textContent ?? null,
  };
}

const idleObservation = {
  headerGold: "11 gold",
  isFrontSlotButtonDisabled: false,
  isAdvanceButtonEnabled: true,
  frontSlotAbilityActing: "false",
  goldFloaterText: null,
};

describe("camp-start sequence", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // deliberate test-data update: fake time advances by the camp-start constants (before: literal 550 / 300 / 1200 ms), so the animation tempo can be tuned without editing tests — Phase 15
  it("LK1: arriving from battle: the camp locks, Norbin pulses, '+1 gold' lands and the header counts up, then the camp unlocks", () => {
    vi.useFakeTimers();
    renderCampArrival({ arrivesFromBattle: true });

    const observations = [observeCampStart()];

    act(() => {
      vi.advanceTimersByTime(CAMP_START_SEQUENCE_START_DELAY_MS);
    });
    observations.push(observeCampStart());

    act(() => {
      vi.advanceTimersByTime(CAMP_START_LAND_DELAY_MS);
    });
    observations.push(observeCampStart());

    act(() => {
      vi.advanceTimersByTime(CAMP_START_FLOATER_DURATION_MS);
    });
    observations.push(observeCampStart());

    expect(observations).toEqual([
      {
        headerGold: "10 gold",
        isFrontSlotButtonDisabled: true,
        isAdvanceButtonEnabled: false,
        frontSlotAbilityActing: "false",
        goldFloaterText: null,
      },
      {
        headerGold: "10 gold",
        isFrontSlotButtonDisabled: true,
        isAdvanceButtonEnabled: false,
        frontSlotAbilityActing: "true",
        goldFloaterText: null,
      },
      {
        headerGold: "11 gold",
        isFrontSlotButtonDisabled: true,
        isAdvanceButtonEnabled: false,
        frontSlotAbilityActing: "true",
        goldFloaterText: "+1 gold",
      },
      idleObservation,
    ]);
  });

  // deliberate test-data update: fake time advances by the camp-start constants (before: literal 2050 and 550 ms), so the animation tempo can be tuned without editing tests — Phase 15
  it("LK2: a camp re-render after the sequence never replays it", () => {
    vi.useFakeTimers();
    const { rerenderCamp } = renderCampArrival({ arrivesFromBattle: true });

    act(() => {
      vi.advanceTimersByTime(
        CAMP_START_SEQUENCE_START_DELAY_MS +
          CAMP_START_LAND_DELAY_MS +
          CAMP_START_FLOATER_DURATION_MS,
      );
    });

    rerenderCamp(6);

    act(() => {
      vi.advanceTimersByTime(CAMP_START_SEQUENCE_START_DELAY_MS);
    });

    expect(observeCampStart()).toEqual(idleObservation);
  });

  it("LK3: entering camp on a reload plays nothing and never locks", () => {
    vi.useFakeTimers();
    renderCampArrival({ arrivesFromBattle: false });

    const observations = [observeCampStart()];

    act(() => {
      vi.advanceTimersByTime(550);
    });
    observations.push(observeCampStart());

    expect(observations).toEqual([idleObservation, idleObservation]);
  });
});

// Phase 16: while a roster dwarf is held, every other dwarf's card shows
// two zones — the top half swaps, the bottom half merges — each a real
// button (and drop target), so no merge/sell mode is needed.
describe("split drop zones (Phase 16)", () => {
  const fixtureGimlok: Character = buildTestCharacter({
    id: "dwarf-3",
    name: "Gimlok",
    attack: 3,
    hp: 9,
    maxHp: 9,
    characterTemplateId: "fixture-gimlok",
    tier: 1,
    characterClassIds: ["miner"],
    experience: 0,
  });

  const fixtureMaxLevelBorin: Character = {
    ...fixtureBorin,
    id: "dwarf-4",
    experience: 15,
  };

  // Slot 1 Borin; slot 2 a matching Borin; slot 3 a non-matching Gimlok;
  // slot 4 a matching Borin at level 5; slots 5–7 empty.
  const zonesCampRoster: CampRoster = [
    fixtureBorin,
    fixtureMatchingBorin,
    fixtureGimlok,
    fixtureMaxLevelBorin,
    null,
    null,
    null,
  ];

  const slotButtonLabels = [
    "Slot 1: Borin, level 1",
    "Slot 2: Borin, level 1",
    "Slot 3: Gimlok, level 1",
    "Slot 4: Borin, level 5",
    "Slot 5: empty",
  ];

  function slotHost(slotButtonLabel: string): Element | null {
    return screen
      .getByRole("button", { name: slotButtonLabel })
      .closest("[data-info-control-host]");
  }

  it("SZ1: with nothing in hand, no card shows zones and no zone button is reachable", () => {
    renderCampScreen({ playerCampRoster: zonesCampRoster });

    expect(
      slotButtonLabels.map((slotButtonLabel) =>
        slotHost(slotButtonLabel)?.getAttribute("data-roster-slot-zones-shown"),
      ),
    ).toEqual(["false", "false", "false", "false", "false"]);
    expect(
      screen.queryAllByRole("button", {
        name: /swap position with|merge into/,
      }),
    ).toHaveLength(0);
  });

  it("SZ2: selecting a dwarf shows zones on every other dwarf, never on itself or an empty slot", async () => {
    const user = userEvent.setup();
    renderCampScreen({ playerCampRoster: zonesCampRoster });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    expect(
      slotButtonLabels.map((slotButtonLabel) =>
        slotHost(slotButtonLabel)?.getAttribute("data-roster-slot-zones-shown"),
      ),
    ).toEqual(["false", "true", "true", "true", "false"]);
  });

  it("SZ3: each dwarf's swap zone is eligible; its merge zone is eligible, ineligible or at max level (with MAX), and only an eligible zone is enabled", async () => {
    const user = userEvent.setup();
    renderCampScreen({ playerCampRoster: zonesCampRoster });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    const zoneButtonNames = [
      ["Slot 2: swap position with Borin", "Slot 2: merge into Borin"],
      ["Slot 3: swap position with Gimlok", "Slot 3: merge into Gimlok"],
      ["Slot 4: swap position with Borin", "Slot 4: merge into Borin"],
    ];

    expect(
      zoneButtonNames.map((zoneButtonNamePair) =>
        zoneButtonNamePair.map((zoneButtonName) => {
          const zoneButton = screen.getByRole("button", {
            name: zoneButtonName,
          });
          return [
            zoneButton.getAttribute("data-roster-slot-zone-presentation"),
            (zoneButton as HTMLButtonElement).disabled,
          ];
        }),
      ),
    ).toEqual([
      [
        ["eligible", false],
        ["eligible", false],
      ],
      [
        ["eligible", false],
        ["ineligible", true],
      ],
      [
        ["eligible", false],
        ["atMaxLevel", true],
      ],
    ]);
    expect(
      within(
        screen.getByRole("button", { name: "Slot 4: merge into Borin" }),
      ).getByText("MAX"),
    ).toBeInTheDocument();
  });

  it("SZ4: clicking a matching dwarf's merge zone submits a merge, with no merge/sell mode", async () => {
    const recordedMergeFormValues: Record<string, FormDataEntryValue>[] = [];
    const mergeCharacterAction = async (formData: FormData) => {
      recordedMergeFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({
      playerCampRoster: zonesCampRoster,
      mergeCharacterAction,
    });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 2: merge into Borin" }),
    );

    expect(recordedMergeFormValues).toEqual([
      { fromSlotIndex: "0", intoSlotIndex: "1", expectedRevision: "5" },
    ]);
  });

  it("SZ5: clicking another dwarf's swap zone submits a reposition (a swap)", async () => {
    const recordedRepositionFormValues: Record<
      string,
      FormDataEntryValue
    >[] = [];
    const repositionCharacterAction = async (formData: FormData) => {
      recordedRepositionFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({
      playerCampRoster: zonesCampRoster,
      repositionCharacterAction,
    });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Slot 3: swap position with Gimlok" }),
    );

    expect(recordedRepositionFormValues).toEqual([
      { fromSlotIndex: "0", toSlotIndex: "2", expectedRevision: "5" },
    ]);
  });

  it("SZ6: while its zones show, a dwarf's whole-slot button is disabled and draws no markers", async () => {
    const user = userEvent.setup();
    renderCampScreen({ playerCampRoster: zonesCampRoster });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    const wholeSlotButton = screen.getByRole("button", {
      name: "Slot 2: Borin, level 1",
    });

    expect(wholeSlotButton).toBeDisabled();
    expect(
      wholeSlotButton.querySelectorAll(
        "[data-camp-swap-marker], [data-camp-merge-marker]",
      ),
    ).toHaveLength(0);
  });

  // deliberate assertion rewrite: the XP bar is drawn inside the mergeable dwarf's merge zone, and the cards' own bars stay hidden, because a bar inside the portrait can't be centred in the bottom zone (Phase 16 block 2b)
  it("SZ7: with a dwarf in hand, only a mergeable dwarf's merge zone shows the XP bar; the cards' own bars stay hidden", async () => {
    const user = userEvent.setup();
    renderCampScreen({ playerCampRoster: zonesCampRoster });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    const mergeZoneButtons = [
      "Slot 2: merge into Borin",
      "Slot 3: merge into Gimlok",
      "Slot 4: merge into Borin",
    ].map((mergeZoneName) =>
      screen.getByRole("button", { name: mergeZoneName }),
    );

    expect(
      mergeZoneButtons.map(
        (mergeZoneButton) =>
          mergeZoneButton.querySelectorAll("[data-roster-slot-zone-experience]")
            .length,
      ),
    ).toEqual([1, 0, 0]);
    expect(
      within(mergeZoneButtons[0]).getByText("3 XP to level 2"),
    ).toBeInTheDocument();
    expect(
      [
        "Slot 2: Borin, level 1",
        "Slot 3: Gimlok, level 1",
        "Slot 4: Borin, level 5",
      ].map((slotButtonLabel) =>
        screen
          .getByRole("button", { name: slotButtonLabel })
          .getAttribute("data-experience-bar-revealed"),
      ),
    ).toEqual(["false", "false", "false"]);
  });

  it("SZ8: with a shop character in hand, no card shows zones (a merge-buy keeps the whole card)", async () => {
    const user = userEvent.setup();
    renderCampScreen({
      ...matchingShopRenderOverrides,
      playerCampRoster: zonesCampRoster,
    });

    await user.click(screen.getByRole("button", { name: "Shop: Borin" }));

    expect(
      slotButtonLabels.map((slotButtonLabel) =>
        slotHost(slotButtonLabel)?.getAttribute("data-roster-slot-zones-shown"),
      ),
    ).toEqual(["false", "false", "false", "false", "false"]);
  });
});

// Phase 16: the merge/sell toggle, its Shift shortcut, its announcements
// and its sell box are gone. Selling is a drop (or a click) on the money
// pile in the roster slab's left-hand area, which also shows the gold.
describe("money pile (Phase 16)", () => {
  function moneyPileSellButton(): HTMLButtonElement {
    return document.querySelector(
      "[data-money-pile-sell]",
    ) as HTMLButtonElement;
  }

  it("MP1: the money pile shows the gold; with nothing in hand its sell button is hidden and unreachable", () => {
    renderCampScreen({ gold: 10 });

    expect({
      goldText:
        document.querySelector("[data-money-pile-gold]")?.textContent ?? null,
      isSellShown: moneyPileSellButton().getAttribute(
        "data-money-pile-sell-shown",
      ),
      isAriaHidden: moneyPileSellButton().getAttribute("aria-hidden"),
      isInert: moneyPileSellButton().hasAttribute("inert"),
      reachableSellButtonCount: screen.queryAllByRole("button", {
        name: /^Sell /,
      }).length,
    }).toEqual({
      goldText: "10 gold",
      isSellShown: "false",
      isAriaHidden: "true",
      isInert: true,
      reachableSellButtonCount: 0,
    });
  });

  it("MP2: holding a roster dwarf shows 'Sell?' and an eligible sell button named for that dwarf", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );

    const sellButton = screen.getByRole("button", { name: "Sell Borin" });

    expect(sellButton).toHaveAttribute(
      "data-camp-target-presentation",
      "eligible",
    );
    expect(sellButton).toBeEnabled();
    expect(within(sellButton).getByText("Sell?")).toBeInTheDocument();
  });

  it("MP3: clicking the money pile with a dwarf in hand sells it", async () => {
    const recordedSellFormValues: Record<string, FormDataEntryValue>[] = [];
    const sellCharacterAction = async (formData: FormData) => {
      recordedSellFormValues.push(Object.fromEntries(formData));
    };
    const user = userEvent.setup();
    renderCampScreen({ sellCharacterAction });

    await user.click(
      screen.getByRole("button", { name: "Slot 1: Borin, level 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Sell Borin" }));

    expect(recordedSellFormValues).toEqual([
      { slotIndex: "0", expectedRevision: "5" },
    ]);
  });

  it("MP4: with a shop character in hand, the money pile's sell button stays hidden", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.click(screen.getByRole("button", { name: "Shop: Thrudi" }));

    expect(
      moneyPileSellButton().getAttribute("data-money-pile-sell-shown"),
    ).toBe("false");
  });

  it("MP5: there is no merge/sell toggle, and holding Shift changes nothing", async () => {
    const user = userEvent.setup();
    renderCampScreen();

    await user.keyboard("{Shift>}");

    expect({
      toggleCount: screen.queryAllByRole("button", { name: "Merge / Sell" })
        .length,
      isSellShown: moneyPileSellButton().getAttribute(
        "data-money-pile-sell-shown",
      ),
    }).toEqual({ toggleCount: 0, isSellShown: "false" });

    await user.keyboard("{/Shift}");
  });
});

// Phase 16: the shop reads as a market stall. Every character on offer
// carries a price tag (SHOP_CHARACTER_PRICE), red when the player can't
// afford it (canAffordShopCharacter, the buy rule's own check), and the
// Characters section's sign states the price for everyone, screen readers
// included. Sold and locked slots have no tag.
describe("shop prices (Phase 16)", () => {
  function priceTags() {
    return Array.from(document.querySelectorAll("[data-shop-price-tag]"));
  }

  it("SH1: each character on offer carries a price tag with the price; sold and locked slots don't", () => {
    renderCampScreen({ gold: 10 });

    const offeringTiles = Array.from(
      document.querySelectorAll(
        '[data-character-shop-slot-state="offering"]',
      ),
    );

    expect({
      tagCount: priceTags().length,
      offeringCount: offeringTiles.length,
      tagTexts: priceTags().map((priceTag) => priceTag.textContent),
      soldOrLockedTagCount: document.querySelectorAll(
        '[data-character-shop-slot-state="sold"] [data-shop-price-tag], [data-character-shop-slot-state="locked"] [data-shop-price-tag]',
      ).length,
    }).toEqual({
      tagCount: offeringTiles.length,
      offeringCount: offeringTiles.length,
      tagTexts: offeringTiles.map(() => String(SHOP_CHARACTER_PRICE)),
      soldOrLockedTagCount: 0,
    });
  });

  it("SH2: the tags show whether the player can afford the price", () => {
    const { unmount } = renderCampScreen({ gold: SHOP_CHARACTER_PRICE });
    const affordableStates = priceTags().map((priceTag) =>
      priceTag.getAttribute("data-shop-price-affordable"),
    );
    unmount();

    renderCampScreen({ gold: SHOP_CHARACTER_PRICE - 1 });
    const unaffordableStates = priceTags().map((priceTag) =>
      priceTag.getAttribute("data-shop-price-affordable"),
    );

    expect({ affordableStates, unaffordableStates }).toEqual({
      affordableStates: affordableStates.map(() => "true"),
      unaffordableStates: affordableStates.map(() => "false"),
    });
    expect(affordableStates.length).toBeGreaterThan(0);
  });

  it("SH3: the Characters section's sign states the price; the coming-soon sections show none", () => {
    renderCampScreen();

    expect({
      charactersPrice:
        within(screen.getByRole("region", { name: "Characters" }))
          .queryByText(`${SHOP_CHARACTER_PRICE} gold each`) !== null,
      otherSectionPrices: ["Equipment", "Magic", "Food"].map(
        (sectionName) =>
          screen
            .getByRole("region", { name: sectionName })
            .querySelectorAll("[data-shop-section-price]").length,
      ),
    }).toEqual({ charactersPrice: true, otherSectionPrices: [0, 0, 0] });
  });
});
