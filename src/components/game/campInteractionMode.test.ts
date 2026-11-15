import { describe, it, expect } from "vitest";
import type { CampInteractionMode } from "./campSelection";
import {
  campInteractionModeFromState,
  initialCampInteractionModeState,
  reduceCampInteractionModeState,
  type CampInteractionModeEvent,
  type CampInteractionModeState,
} from "./campInteractionMode";

const shiftPressed: CampInteractionModeEvent = { eventKind: "shiftPressed" };
const shiftReleased: CampInteractionModeEvent = {
  eventKind: "shiftReleased",
};
const tabPressed: CampInteractionModeEvent = { eventKind: "tabPressed" };
const toggleClicked: CampInteractionModeEvent = {
  eventKind: "mergeSellToggleClicked",
};
const focusLost: CampInteractionModeEvent = { eventKind: "focusLost" };

function stateAfterEvents(
  events: readonly CampInteractionModeEvent[],
): CampInteractionModeState {
  return events.reduce(
    (state, event) => reduceCampInteractionModeState(state, event),
    initialCampInteractionModeState,
  );
}

function modesAfterEachEvent(
  events: readonly CampInteractionModeEvent[],
): CampInteractionMode[] {
  const modes: CampInteractionMode[] = [];
  let state = initialCampInteractionModeState;

  for (const event of events) {
    state = reduceCampInteractionModeState(state, event);
    modes.push(campInteractionModeFromState(state));
  }

  return modes;
}

describe("campInteractionMode", () => {
  it("IM1: starts in reposition mode", () => {
    expect(campInteractionModeFromState(initialCampInteractionModeState)).toBe(
      "reposition",
    );
  });

  it("IM2: holding Shift enters merge/sell mode and releasing it leaves", () => {
    expect(modesAfterEachEvent([shiftPressed, shiftReleased])).toEqual([
      "mergeOrSell",
      "reposition",
    ]);
  });

  it("IM3: the latched toggle ignores Shift", () => {
    expect(
      modesAfterEachEvent([toggleClicked, shiftPressed, shiftReleased]),
    ).toEqual(["mergeOrSell", "mergeOrSell", "mergeOrSell"]);

    expect({
      modes: modesAfterEachEvent([
        toggleClicked,
        shiftPressed,
        shiftReleased,
      ]),
      isLatched: stateAfterEvents([toggleClicked]).isMergeSellToggleLatched,
    }).toEqual({
      modes: ["mergeOrSell", "mergeOrSell", "mergeOrSell"],
      isLatched: true,
    });
  });

  it("IM4: clicking the toggle again unlatches it", () => {
    expect(modesAfterEachEvent([toggleClicked, toggleClicked])).toEqual([
      "mergeOrSell",
      "reposition",
    ]);
  });

  it("IM5: Tab during a Shift hold reverts the mode until Shift is released", () => {
    expect(
      modesAfterEachEvent([
        shiftPressed,
        tabPressed,
        shiftReleased,
        shiftPressed,
      ]),
    ).toEqual(["mergeOrSell", "reposition", "reposition", "mergeOrSell"]);
  });

  it("IM6: a suppressed Shift press doesn't count again before release", () => {
    expect(
      modesAfterEachEvent([shiftPressed, tabPressed, shiftPressed]),
    ).toEqual(["mergeOrSell", "reposition", "reposition"]);
  });

  it("IM7: losing focus clears a held Shift but never the latch", () => {
    expect({
      shiftThenFocusLost: modesAfterEachEvent([shiftPressed, focusLost]),
      latchedThenFocusLost: modesAfterEachEvent([toggleClicked, focusLost]),
    }).toEqual({
      shiftThenFocusLost: ["mergeOrSell", "reposition"],
      latchedThenFocusLost: ["mergeOrSell", "mergeOrSell"],
    });
  });
});
