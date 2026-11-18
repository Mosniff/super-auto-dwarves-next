// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBattlePlayback } from "./useBattlePlayback";
import { resolveBattle } from "@/lib/battle/resolveBattle";
import type { Character } from "@/lib/game/character";
import { buildTestCharacter } from "@/test/characterFixtures";

const AUTOPLAY_INTERVAL_MS = 1100;

function buildResolvedBattle() {
  // mechanical refactor: replaced with buildTestCharacter
  const playerCharacters: Character[] = [
    buildTestCharacter({ id: "p1", name: "Borin", attack: 5, hp: 10, maxHp: 10, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
  ];
  const enemyCharacters: Character[] = [
    buildTestCharacter({ id: "e1", name: "Grukk", attack: 2, hp: 3, maxHp: 3, characterTemplateId: "fixture-dwarf", tier: 1, characterClassIds: ["warrior"], experience: 0 }),
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

  // deliberate assertion rewrite: { kind: "battleStart" } before; { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" } after — Phase 13
  it("advance() steps forward one beat", () => {
    const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

    act(() => {
      result.current.advance();
    });

    expect(result.current.currentBeatDescriptors).toEqual([
      { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
    ]);
    expect(result.current.isFinished).toBe(false);
  });

  it("(e) reports that the battle has not started before any beat", () => {
    const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

    expect(result.current.hasBattleStarted).toBe(false);
  });

  it("(f) reports that the battle has started after the first advance()", () => {
    const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

    act(() => {
      result.current.advance();
    });

    expect(result.current.hasBattleStarted).toBe(true);
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
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleEnd", outcome: "playerWin" },
      ]);

      // advancing again past the end must not error or change anything
      act(() => {
        result.current.advance();
      });

      expect(result.current.isFinished).toBe(true);
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleEnd", outcome: "playerWin" },
      ]);
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
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "drop", character: "Grukk" },
      ]);
      expect(result.current.canViewNext).toBe(true);

      act(() => {
        result.current.viewNextBeat();
      });

      expect(result.current.currentState).toEqual(finalState);
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleEnd", outcome: "playerWin" },
      ]);
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

    // deliberate assertion rewrite: { kind: "battleStart" } before; { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" } after — Phase 13
    it("play() auto-advances one beat per interval", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
      ]);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      // deliberate assertion rewrite: the engage beat (Phase 12 step 11) shifts this.
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "frontsEngage" },
      ]);
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

    // deliberate assertion rewrite: { kind: "battleStart" } before; { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" } after — Phase 13
    it("pause() stops auto-advancing", () => {
      const { result } = renderHook(() => useBattlePlayback(resolvedBattle));

      act(() => {
        result.current.play();
      });

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
      ]);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        vi.advanceTimersByTime(AUTOPLAY_INTERVAL_MS);
      });

      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "dwarf" },
      ]);
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

      const beatDescriptorsAfterFirstAdvance =
        result.current.currentBeatDescriptors;

      act(() => {
        result.current.advance();
      });

      expect(result.current.currentBeatDescriptors).toEqual(
        beatDescriptorsAfterFirstAdvance,
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

      // deliberate assertion rewrite: the engage beat (Phase 12 step 11) shifts this.
      expect(result.current.currentBeatDescriptors).toEqual([
        { kind: "frontsEngage" },
      ]);
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
