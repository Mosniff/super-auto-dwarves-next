// @vitest-environment jsdom
//
// Integration base for BattleScreen. As the screen grows new behaviours
// (animations, discard pile, etc.), add tests here — always querying by
// user-facing semantics (role/name/text), never by markup.
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  renderWithMessages,
  screen,
  fireEvent,
  act,
} from "@/test/renderWithMessages";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { Character } from "@/lib/game/character";
import { createEmptyCampRoster, type CampRoster } from "@/lib/game/campRoster";
import { BattleScreen } from "./BattleScreen";

const AUTOPLAY_INTERVAL_MS = 1100;
// Comfortably more ticks than the fixture battle has beats.
const AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE = 40;

const fixtureGrukk: Character = {
  id: "fixture-enemy-1",
  name: "Grukk",
  attack: 5,
  hp: 6,
  maxHp: 6,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
};

const fixtureBorin: Character = {
  id: "fixture-player-1",
  name: "Borin",
  attack: 6,
  hp: 10,
  maxHp: 10,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
};

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

describe("BattleScreen", () => {
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
    expect(
      screen.getByRole("button", { name: /autoplay/i }),
    ).toBeInTheDocument();
  });

  describe("clicking Advance", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

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
      expect(screen.getByText("Battle start!")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      fireEvent.click(advanceButton);
      expect(screen.getByText("Turn 1")).toBeInTheDocument();
      expect(screen.queryByText("Battle start!")).not.toBeInTheDocument();
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

      const autoplayToggle = screen.getByRole("button", {
        name: /autoplay/i,
      });

      fireEvent.click(autoplayToggle);

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
      expect(
        screen.getByRole("button", { name: /autoplay/i }),
      ).toHaveTextContent(/off/i);
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

    it("(d) does not show a Return to camp button before the battle finishes", () => {
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
          returnToCampAction={async () => {}}
        />,
      );

      expect(
        screen.queryByRole("button", { name: "Return to camp" }),
      ).not.toBeInTheDocument();
    });

    it("(e) shows a Return to camp button after the battle finishes, whose form submits expectedCurrentPhase as battlePhase", () => {
      vi.useFakeTimers();
      renderWithMessages(
        <BattleScreen
          resolvedBattle={playerWinResolvedBattle}
          playerCampRoster={playerWinCampRoster}
          returnToCampAction={async () => {}}
        />,
      );

      const autoplayToggle = screen.getByRole("button", {
        name: /autoplay/i,
      });

      fireEvent.click(autoplayToggle);

      for (
        let tick = 0;
        tick < AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE;
        tick += 1
      ) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      const returnToCampButton = screen.getByRole("button", {
        name: "Return to camp",
      });
      const form = returnToCampButton.closest("form");

      expect(form).not.toBeNull();
      expect(
        new FormData(form as HTMLFormElement).get("expectedCurrentPhase"),
      ).toBe("battlePhase");
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

      const autoplayToggle = screen.getByRole("button", {
        name: /autoplay/i,
      });

      fireEvent.click(autoplayToggle);

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
});
