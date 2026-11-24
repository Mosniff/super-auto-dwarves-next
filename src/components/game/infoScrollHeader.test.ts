import { describe, it, expect } from "vitest";
import { infoScrollHeader } from "./infoScrollHeader";

const borin = { name: "Borin", side: "player" } as const;
const grukk = { name: "Grukk", side: "enemy" } as const;

describe("infoScrollHeader", () => {
  // deliberate assertion rewrite: before the first beat and on the battle-start beat the header hides (before: both read pre-battle; after: hidden, so "Battle!" and the faction matchup fill the scroll); a later pre-battle beat still reads pre-battle — Phase 15, the human's call
  it("HD1: before turn 1 the header reads pre-battle, except before the first beat and on the battle-start beat, where it hides", () => {
    expect([
      infoScrollHeader(0, []),
      infoScrollHeader(0, [
        { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" },
      ]),
      infoScrollHeader(0, [{ kind: "frontsEngage" }]),
    ]).toEqual([
      { kind: "hidden" },
      { kind: "hidden" },
      { kind: "preBattle" },
    ]);
  });

  it("HD2: during a turn the header shows that turn", () => {
    expect([
      infoScrollHeader(2, [{ kind: "attack", attacker: borin, target: grukk }]),
      // deliberate assertion rewrite: the outcome beat now hides the header, so this case uses a drop beat (battleEnd playerWin → drop grukk) (Phase 14)
      infoScrollHeader(3, [{ kind: "drop", character: grukk }]),
    ]).toEqual([
      { kind: "turn", turn: 2 },
      { kind: "turn", turn: 3 },
    ]);
  });

  it("HD3: on a turn-start beat the header hides, so the turn-begins line can fill the scroll", () => {
    expect(infoScrollHeader(3, [{ kind: "turnStart", turn: 3 }])).toEqual({
      kind: "hidden",
    });
  });

  it("HD4: on the outcome beat the header hides, so the result fills the scroll", () => {
    expect(
      infoScrollHeader(3, [{ kind: "battleEnd", outcome: "enemyWin" }]),
    ).toEqual({ kind: "hidden" });
  });
});
