// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PhaseArrivalProvider, useArrivedFromPhase } from "./phaseArrival";

function Consumer() {
  return <span data-arrived-from>{useArrivedFromPhase() ?? "none"}</span>;
}

describe("PhaseArrivalProvider / useArrivedFromPhase", () => {
  it("PA1: reports the previous phase after a phase change, and null on first load", () => {
    const { rerender } = render(
      <PhaseArrivalProvider phase="battlePhase">
        <Consumer />
      </PhaseArrivalProvider>,
    );

    const firstText = document.querySelector("[data-arrived-from]")
      ?.textContent;

    rerender(
      <PhaseArrivalProvider phase="campPhase">
        <Consumer />
      </PhaseArrivalProvider>,
    );

    const secondText = document.querySelector("[data-arrived-from]")
      ?.textContent;

    expect([firstText, secondText]).toEqual(["none", "battlePhase"]);
  });
});
