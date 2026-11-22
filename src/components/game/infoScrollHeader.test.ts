import { describe, it, expect } from "vitest";
import { infoScrollHeader } from "./infoScrollHeader";

const borin = { name: "Borin", side: "player" } as const;
const grukk = { name: "Grukk", side: "enemy" } as const;

describe("infoScrollHeader", () => {
  it("HD1: before turn 1 the header reads pre-battle", () => {
    expect([
      infoScrollHeader(0, []),
      infoScrollHeader(0, [
        { kind: "battleStart", playerFactionId: "dwarf", enemyFactionId: "kobold" },
      ]),
      infoScrollHeader(0, [{ kind: "frontsEngage" }]),
    ]).toEqual([
      { kind: "preBattle" },
      { kind: "preBattle" },
      { kind: "preBattle" },
    ]);
  });

  it("HD2: during a turn the header shows that turn", () => {
    expect([
      infoScrollHeader(2, [{ kind: "attack", attacker: borin, target: grukk }]),
      infoScrollHeader(3, [{ kind: "battleEnd", outcome: "playerWin" }]),
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
});
