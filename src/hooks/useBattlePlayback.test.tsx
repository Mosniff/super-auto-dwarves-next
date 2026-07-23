// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBattlePlayback } from "./useBattlePlayback";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { Character } from "@/lib/battle/types";

const AUTOPLAY_INTERVAL_MS = 1100;

function buildResolvedBattle() {
  const playerCharacters: Character[] = [
    { id: "p1", name: "Borin", attack: 5, hp: 10, maxHp: 10 },
  ];
  const enemyCharacters: Character[] = [
    { id: "e1", name: "Grukk", attack: 2, hp: 3, maxHp: 3 },
  ];

  return resolveBattle(playerCharacters, enemyCharacters);
}

describe("useBattlePlayback", () => {
  const resolvedBattle = buildResolvedBattle();
  const highestBeat = Math.max(
    ...resolvedBattle.events.map((event) => event.beatIndex),
  );

  it("starts before the battle: currentState equals initialState, not finished", () => {
    const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

    expect(result.current.currentState).toEqual(resolvedBattle.initialState);
    expect(result.current.isFinished).toBe(false);
  });

  it("advance() steps forward one beat", () => {
    const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

    act(() => {
      result.current.advance();
    });

    expect(result.current.currentBeatLines).toEqual(["Battle start!"]);
    expect(result.current.isFinished).toBe(false);
  });

  describe("advancing repeatedly through fake time", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("advance() does not go past the final beat", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      for (let step = 0; step < highestBeat + 3; step += 1) {
        act(() => {
          result.current.advance();
        });
        // release the post-advance lock so the next advance() isn't a no-op
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(result.current.isFinished).toBe(true);
      expect(result.current.currentBeatLines).toEqual(["Victory!"]);

      // advancing again past the end must not error or change anything
      act(() => {
        result.current.advance();
      });

      expect(result.current.isFinished).toBe(true);
      expect(result.current.currentBeatLines).toEqual(["Victory!"]);
    });

    it("viewPreviousBeat / viewNextBeat move the view without changing battle state", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      for (let step = 0; step < highestBeat + 1; step += 1) {
        act(() => {
          result.current.advance();
        });
        // release the post-advance lock so the next advance() isn't a no-op
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      const finalState = result.current.currentState;
      expect(result.current.canViewPrevious).toBe(true);
      expect(result.current.canViewNext).toBe(false);

      act(() => {
        result.current.viewPreviousBeat();
      });

      expect(result.current.currentState).toEqual(finalState);
      expect(result.current.currentBeatLines).toEqual(["Grukk drops"]);
      expect(result.current.canViewNext).toBe(true);

      act(() => {
        result.current.viewNextBeat();
      });

      expect(result.current.currentState).toEqual(finalState);
      expect(result.current.currentBeatLines).toEqual(["Victory!"]);
      expect(result.current.canViewNext).toBe(false);
    });
  });

  describe("autoplay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("play() auto-advances one beat per interval", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatLines).toEqual(["Battle start!"]);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatLines).toEqual(["Turn 1"]);
    });

    it("autoplay stops at the final beat", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      for (let step = 0; step < highestBeat + 2; step += 1) {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(result.current.isFinished).toBe(true);
      expect(result.current.isPlaying).toBe(false);
    });

    it("pause() stops auto-advancing", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatLines).toEqual(["Battle start!"]);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatLines).toEqual(["Battle start!"]);
    });

    it("the interval is cleaned up on unmount", () => {
      const { result, unmount } = renderHook(() =>
        useBattlePlayback(resolvedBattle),
      );

      act(() => {
        result.current.play();
      });

      unmount();

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }).not.toThrow();
    });
  });

  describe("advance lock", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("locks canAdvance immediately after a manual advance()", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.advance();
      });

      expect(result.current.canAdvance).toBe(false);
    });

    it("ignores a second advance() call while locked", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.advance();
      });

      const beatLinesAfterFirstAdvance = result.current.currentBeatLines;

      act(() => {
        result.current.advance();
      });

      expect(result.current.currentBeatLines).toEqual(
        beatLinesAfterFirstAdvance,
      );
    });

    it("unlocks after the beat's duration and allows advancing again", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.advance();
      });

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.canAdvance).toBe(true);

      act(() => {
        result.current.advance();
      });

      expect(result.current.currentBeatLines).toEqual(["Turn 1"]);
    });

    it("canAdvance is false while autoplay is playing", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      expect(result.current.canAdvance).toBe(false);
    });

    it("canAdvance is false once the battle is finished", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      for (let step = 0; step < highestBeat + 1; step += 1) {
        act(() => {
          result.current.advance();
        });
        act(() => {
          vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
        });
      }

      expect(result.current.isFinished).toBe(true);
      expect(result.current.canAdvance).toBe(false);
    });
  });
});
