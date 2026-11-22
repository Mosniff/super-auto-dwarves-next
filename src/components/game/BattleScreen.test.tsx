// @vitest-environment jsdom
//
// Integration base for BattleScreen. As the screen grows new behaviours
// (animations, discard pile, etc.), add tests here — always querying by
// user-facing semantics (role/name/text), never by markup.
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  renderWithMessages,
  screen,
  fireEvent,
  act,
} from "@/test/renderWithMessages";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { ResolvedBattle } from "@/lib/battle/types";
import type { Character } from "@/lib/game/character";
import { createEmptyCampRoster, type CampRoster } from "@/lib/game/campRoster";
import { buildTestCharacter } from "@/test/characterFixtures";
import englishMessages from "../../../messages/en.json";
import { BattleScreen } from "./BattleScreen";
import { GameScreen } from "./GameScreen";
import { PhaseAdvanceButton } from "./PhaseAdvanceButton";

const englishPhaseBattleLabel = englishMessages.common.phaseBattle;

const AUTOPLAY_INTERVAL_MS = 1100;
// Comfortably more ticks than the fixture battle has beats.
const AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE = 40;

// mechanical refactor: replaced with buildTestCharacter
const fixtureGrukk: Character = buildTestCharacter({
  id: "fixture-enemy-1",
  name: "Grukk",
  attack: 5,
  hp: 6,
  maxHp: 6,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 0,
});

// mechanical refactor: replaced with buildTestCharacter
const fixtureBorin: Character = buildTestCharacter({
  id: "fixture-player-1",
  name: "Borin",
  attack: 6,
  hp: 10,
  maxHp: 10,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 0,
});

const playerWinResolvedBattle = resolveBattle([fixtureBorin], [fixtureGrukk]);

const playerWinCampRoster: CampRoster = [
  fixtureBorin,
  null,
  null,
  null,
  null,
  null,
  null,
];

const emptyCampRoster = createEmptyCampRoster();

const emptyRosterResolvedBattle = resolveBattle([], [fixtureGrukk]);

// Starts autoplay through the roster-side control (Phase 14). Asserts the
// button exists first, so a missing control fails on value, not on a throw.
function startAutoplayAtFast() {
  const fastAutoplayButton = screen.queryByRole("button", { name: "Fast" });
  expect(fastAutoplayButton).not.toBeNull();
  if (fastAutoplayButton !== null) {
    fireEvent.click(fastAutoplayButton);
  }
}

describe("BattleScreen", () => {
  // The autoplay speed is remembered in browser storage (Phase 14), so one
  // test's choice can't be allowed to start autoplay in the next.
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the battle screen with the advance and autoplay controls", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    expect(
      screen.getByRole("button", { name: /advance/i }),
    ).toBeInTheDocument();
    // deliberate assertion rewrite: the autoplay toggle button became the labelled Battle Autoplay group (Phase 14)
    expect(
      screen.queryByRole("group", { name: "Battle Autoplay" }),
    ).not.toBeNull();
  });

  describe("clicking Advance", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // deliberate assertion rewrite: "The dwarves and the monsters prepare for battle" before; "The dwarves and the dwarves prepare for battle" after (the resolver's dwarf/dwarf default) — Phase 13
    it("progresses the battle log", () => {
      // fireEvent (not userEvent) so we don't need to configure userEvent
      // for fake timers; the post-advance lock still needs releasing
      // between clicks via vi.advanceTimersByTime.
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
      );

      const advanceButton = screen.getByRole("button", { name: /advance/i });

      fireEvent.click(advanceButton);
      expect(
        screen.getByText("The dwarves and the dwarves prepare for battle"),
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      fireEvent.click(advanceButton);
      expect(screen.getByText("The parties clash!")).toBeInTheDocument();
      expect(
        screen.queryByText("The dwarves and the dwarves prepare for battle"),
      ).not.toBeInTheDocument();
    });
  });

  describe("autoplay", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("autoplay progresses and then stops at the end", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
      );

      // deliberate assertion rewrite: start autoplay through the roster-side Fast button instead of the scroll's toggle (Phase 14)
      startAutoplayAtFast();

      for (
        let tick = 0;
        tick < AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE;
        tick += 1
      ) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(screen.getByText("Victory!")).toBeInTheDocument();
      // deliberate assertion rewrite: Off pressed at the end became the chosen Fast still pressed and usable (Phase 14)
      expect([
        screen.getByRole("button", { name: "Fast" }).getAttribute("aria-pressed"),
        screen.getByRole("button", { name: "Fast" }).hasAttribute("disabled"),
      ]).toEqual(["true", false]);
    });
  });

  it("(c) does not show a DUMMY BATTLE label", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    expect(screen.queryByText("DUMMY BATTLE")).not.toBeInTheDocument();
  });

  describe("returning to camp", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("(d) renders no Return to camp button itself, even after the battle finishes (that's the header's job now)", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
      );

      // deliberate assertion rewrite: start autoplay through the roster-side Fast button instead of the scroll's toggle (Phase 14)
      startAutoplayAtFast();

      for (
        let tick = 0;
        tick < AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE;
        tick += 1
      ) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(
        screen.queryByRole("button", { name: "Return to camp" }),
      ).toBeNull();
    });

    // (e) ("shows a Return to camp button after the battle finishes, whose
    // form submits expectedCurrentPhase as battlePhase") moved to
    // PhaseAdvanceButton.test.tsx (q): the button now lives in the header,
    // not here.

    it("(u) the header's advance button is disabled until the battle finishes, then enabled", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
        {
          wrapper: ({ children }) => (
            <GameScreen
              phase="battlePhase"
              header={
                <PhaseAdvanceButton
                  gamePhase="battlePhase"
                  advanceGameAction={async () => {}}
                />
              }
            >
              {children}
            </GameScreen>
          ),
        },
      );

      const headerAdvanceForm = document.querySelector(
        "[data-phase-advance]",
      );
      expect(headerAdvanceForm).not.toBeNull();

      const headerAdvanceButton = screen.getByRole("button", {
        name: "Return to camp",
      });
      expect(headerAdvanceButton).toBeDisabled();

      // deliberate assertion rewrite: start autoplay through the roster-side Fast button instead of the scroll's toggle (Phase 14)
      startAutoplayAtFast();

      for (
        let tick = 0;
        tick < AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE;
        tick += 1
      ) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(headerAdvanceButton).toBeEnabled();
    });
  });

  describe("playing back whatever battle it is given", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("(f) plays back the battle it is given: an empty roster's instant defeat", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={emptyRosterResolvedBattle}
          playerCampRoster={emptyCampRoster}
        />,
      );

      // deliberate assertion rewrite: start autoplay through the roster-side Fast button instead of the scroll's toggle (Phase 14)
      startAutoplayAtFast();

      for (
        let tick = 0;
        tick < AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE;
        tick += 1
      ) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(screen.getByText(/defeat/i)).toBeInTheDocument();
    });
  });

  it("(h) shows the battle phase as the page heading", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    expect(
      screen.queryByRole("heading", { level: 1, name: englishPhaseBattleLabel }),
    ).not.toBeNull();
  });

  it("(l) the front bench card shows the on-deck marker in battle", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    // deliberate assertion rewrite: the on-deck ring became a side marker (BR3)
    expect(
      document.querySelector("[data-roster-slot-on-deck-marker]"),
    ).not.toBeNull();
  });

  it("BL1: both battle slabs align toward the front, and the autoplay control sits left of the player's slots", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    const advanceButton = screen.queryByRole("button", { name: "Advance" });

    expect({
      frontAlignedSlabCount: document.querySelectorAll(
        '[data-roster-slot-alignment="front"]',
      ).length,
      isOffSpeedInLeadingArea:
        document.querySelector(
          '[data-roster-slab-leading-area] [data-autoplay-speed="off"]',
        ) !== null,
      isAdvanceInLeadingArea:
        advanceButton?.closest("[data-roster-slab-leading-area]") != null,
    }).toEqual({
      frontAlignedSlabCount: 2,
      isOffSpeedInLeadingArea: true,
      isAdvanceInLeadingArea: true,
    });
  });

  describe("beat navigation", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("BL2: the battle screen has no beat-navigation buttons, even after stepping back is possible", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
      );

      const offAutoplayButton = screen.queryByRole("button", { name: "Off" });
      expect(offAutoplayButton).not.toBeNull();
      if (offAutoplayButton !== null) {
        fireEvent.click(offAutoplayButton);
      }

      const advanceButton = screen.getByRole("button", { name: "Advance" });
      fireEvent.click(advanceButton);
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });
      fireEvent.click(advanceButton);
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect({
        previousBeatButton: screen.queryByRole("button", {
          name: "Previous beat",
        }),
        nextBeatButton: screen.queryByRole("button", { name: "Next beat" }),
      }).toEqual({ previousBeatButton: null, nextBeatButton: null });
    });
  });

  it("battle roster cards show no level pill or XP bar", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    expect(document.querySelectorAll("[data-character-level]")).toHaveLength(
      0,
    );
    expect(
      document.querySelectorAll("[data-character-experience-bar]"),
    ).toHaveLength(0);
  });

  it("BI1: before the first beat, every occupied bench slot on both sides has an info control, never inside a button", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    expect(
      [...document.querySelectorAll("[data-character-info-control]")]
        .map((infoControl) => [
          infoControl.getAttribute("aria-label"),
          infoControl.parentElement?.closest("button") !== null,
        ])
        .sort(),
    ).toEqual([
      ["Details: Borin", false],
      ["Details: Grukk", false],
    ]);
  });

  it("BI2: after the engage beat, both action-zone cards have info controls", () => {
    // deliberate assertion rewrite: the fronts reach the action zone on the engage beat (Phase 12 step 11b)
    vi.useFakeTimers();
    try {
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
        />,
      );

      const advanceButton = screen.getByRole("button", { name: /advance/i });
      fireEvent.click(advanceButton);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      fireEvent.click(advanceButton);

      expect(
        [
          ...document.querySelectorAll(
            "[data-active-card-host] [data-character-info-control]",
          ),
        ]
          .map((infoControl) => infoControl.getAttribute("aria-label"))
          .sort(),
      ).toEqual(["Details: Grukk", "Details: Borin"].sort());
    } finally {
      vi.useRealTimers();
    }
  });

  it("BI4: after the prepare beat, both fronts are still on their benches and the action zone is empty", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    const advanceButton = screen.getByRole("button", { name: /advance/i });
    fireEvent.click(advanceButton);

    expect({
      actionZoneLabels: [
        ...document.querySelectorAll(
          "[data-active-card-host] [data-character-info-control]",
        ),
      ].map((infoControl) => infoControl.getAttribute("aria-label")),
      allLabels: [
        ...document.querySelectorAll("[data-character-info-control]"),
      ]
        .map((infoControl) => infoControl.getAttribute("aria-label"))
        .sort(),
    }).toEqual({
      actionZoneLabels: [],
      allLabels: ["Details: Borin", "Details: Grukk"],
    });
  });

  it("BI3: opening a battle info control during autoplay pauses the battle", () => {
    renderWithMessages(
      <BattleScreen
        resolvedBattle={playerWinResolvedBattle}
        playerCampRoster={playerWinCampRoster}
      />,
    );

    // deliberate assertion rewrite: start autoplay through the roster-side Fast button instead of the scroll's toggle (Phase 14)
    startAutoplayAtFast();

    // Immediately, before any beat timer fires: Grukk is on the enemy
    // bench before the first beat.
    // test fix: query the click target so a missing control fails on
    // value, not by throwing
    const enemyInfoControl = screen.queryByRole("button", {
      name: "Details: Grukk",
    });
    if (enemyInfoControl !== null) {
      fireEvent.click(enemyInfoControl);
    }

    // A modal dialog is open, so the background (including the autoplay
    // control) is hidden from the accessibility tree; query past that.
    // Paused means the Off speed button is pressed.
    // deliberate assertion rewrite: "Autoplay: Off" toggle name became the Off speed button's aria-pressed (Phase 14)
    expect(
      screen
        .queryByRole("button", { name: "Off", hidden: true })
        ?.getAttribute("aria-pressed") ?? null,
    ).toBe("true");
  });

  describe("battle beat animations", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // Advances from the unstarted state to beat 0 (BATTLE_START), then to
    // beat 1, following the same click + fake-timer pattern as "clicking
    // Advance" above (the post-advance lock needs releasing between
    // clicks via vi.advanceTimersByTime).
    function advanceToBeatOne() {
      const advanceButton = screen.getByRole("button", { name: /advance/i });

      fireEvent.click(advanceButton);
      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });
      fireEvent.click(advanceButton);
    }

    it("BX1: an ability beat marks the caster as acting, pops the receiver's shield and shows a '+1 armour' floater", () => {
      vi.useFakeTimers();

      const abilityResolvedBattle: ResolvedBattle = {
        initialState: {
          player: {
            activeCharacters: [
              buildTestCharacter({ id: "p1", name: "Borin", hp: 7, maxHp: 7, armour: 0 }),
              buildTestCharacter({ id: "p2", name: "Ogden", hp: 8, maxHp: 8, armour: 0 }),
            ],
            downedCharacters: [],
          },
          enemy: {
            activeCharacters: [
              buildTestCharacter({ id: "e1", name: "Grukk", hp: 20, maxHp: 20, armour: 0 }),
            ],
            downedCharacters: [],
          },
        },
        events: [
          { type: "BATTLE_START", playerFactionId: "dwarf", enemyFactionId: "dwarf", beatIndex: 0, beatType: "BATTLE_START" },
          {
            type: "ABILITY_ACTIVATE",
            characterId: "p2",
            abilityId: "tighten-those-straps-son",
            beatIndex: 1,
            beatType: "ABILITY",
          },
          {
            type: "STAT_CHANGE",
            targetId: "p1",
            stat: "armour",
            amount: 1,
            resultingValue: 1,
            source: "p2",
            sourceAbilityId: "tighten-those-straps-son",
            beatIndex: 1,
            beatType: "ABILITY",
          },
          {
            type: "BATTLE_END",
            outcome: "playerWin",
            beatIndex: 2,
            beatType: "BATTLE_END",
          },
        ],
      };

      renderWithMessages(
        <BattleScreen
          resolvedBattle={abilityResolvedBattle}
          playerCampRoster={emptyCampRoster}
        />,
      );

      advanceToBeatOne();

      expect({
        actingCount: document.querySelectorAll('[data-ability-acting="true"]')
          .length,
        gainedShieldArmour:
          document
            .querySelector('[data-armour-beat="gained"]')
            ?.getAttribute("data-character-armour") ?? null,
        gainFloater: screen.queryByText("+1 armour") !== null,
      }).toEqual({
        actingCount: 1,
        gainedShieldArmour: "1",
        gainFloater: true,
      });
    });

    it("BX2: an armour break keeps the old armour on a breaking shield and shows 'BREAK!'", () => {
      vi.useFakeTimers();

      const armourBreakResolvedBattle: ResolvedBattle = {
        initialState: {
          player: {
            activeCharacters: [
              buildTestCharacter({
                id: "p1",
                name: "Borin",
                attack: 5,
                hp: 7,
                maxHp: 7,
                armour: 0,
              }),
            ],
            downedCharacters: [],
          },
          enemy: {
            activeCharacters: [
              buildTestCharacter({
                id: "e1",
                name: "Grukk",
                attack: 1,
                hp: 5,
                maxHp: 5,
                armour: 2,
              }),
            ],
            downedCharacters: [],
          },
        },
        events: [
          { type: "BATTLE_START", playerFactionId: "dwarf", enemyFactionId: "dwarf", beatIndex: 0, beatType: "BATTLE_START" },
          {
            type: "ATTACK",
            attackerId: "p1",
            targetId: "e1",
            value: 5,
            beatIndex: 1,
            beatType: "CLASH",
          },
          {
            type: "ATTACK",
            attackerId: "e1",
            targetId: "p1",
            value: 1,
            beatIndex: 1,
            beatType: "CLASH",
          },
          {
            type: "ARMOUR_DAMAGE",
            targetId: "e1",
            amount: 2,
            resultingArmour: 0,
            source: "p1",
            beatIndex: 1,
            beatType: "CLASH",
          },
          {
            type: "DAMAGE",
            targetId: "p1",
            amount: 1,
            resultingHp: 6,
            source: "e1",
            beatIndex: 1,
            beatType: "CLASH",
          },
          { type: "TIMEOUT", beatIndex: 2, beatType: "TIMEOUT" },
          {
            type: "BATTLE_END",
            outcome: "draw",
            beatIndex: 3,
            beatType: "BATTLE_END",
          },
        ],
      };

      renderWithMessages(
        <BattleScreen
          resolvedBattle={armourBreakResolvedBattle}
          playerCampRoster={emptyCampRoster}
        />,
      );

      advanceToBeatOne();

      expect({
        brokenShieldArmour:
          document
            .querySelector('[data-armour-beat="broken"]')
            ?.getAttribute("data-character-armour") ?? null,
        breakFloater: screen.queryByText("BREAK!") !== null,
      }).toEqual({ brokenShieldArmour: "2", breakFloater: true });
    });
  });
});
