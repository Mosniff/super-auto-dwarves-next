// @vitest-environment jsdom
//
// Integration base for BattleScreen. As the screen grows new behaviours
// (animations, discard pile, etc.), add tests here — always querying by
// user-facing semantics (role/name/text), never by markup.
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BattleScreen } from "./BattleScreen";

const AUTOPLAY_INTERVAL_MS = 1100;
// Comfortably more ticks than the dummy rosters' battle has beats.
const AUTOPLAY_TICKS_TO_RUN_OUT_THE_BATTLE = 40;

describe("BattleScreen", () => {
  it("renders the battle screen with the advance and autoplay controls", () => {
    render(<BattleScreen />);

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
      render(<BattleScreen />);

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
      render(<BattleScreen />);

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
});
