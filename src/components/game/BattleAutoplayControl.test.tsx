// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderWithMessages, screen, fireEvent } from "@/test/renderWithMessages";
import type { AutoplaySpeed } from "@/lib/battle/autoplaySpeed";
import { BattleAutoplayControl } from "./BattleAutoplayControl";

const SPEED_BUTTON_NAMES = ["Off", "Slow", "Fast"];

interface BattleAutoplayControlTestProps {
  autoplaySpeed: AutoplaySpeed;
  onAutoplaySpeedChange: (autoplaySpeed: AutoplaySpeed) => void;
  onAdvance: () => void;
  canAdvance: boolean;
  isFinished: boolean;
}

function renderBattleAutoplayControl(
  overrides: Partial<BattleAutoplayControlTestProps> = {},
) {
  const props: BattleAutoplayControlTestProps = {
    autoplaySpeed: "off",
    onAutoplaySpeedChange: () => {},
    onAdvance: () => {},
    canAdvance: true,
    isFinished: false,
    ...overrides,
  };

  return renderWithMessages(<BattleAutoplayControl {...props} />);
}

describe("BattleAutoplayControl", () => {
  it("BC1: a labelled group of Off / Slow / Fast, with the current speed pressed", () => {
    renderBattleAutoplayControl({ autoplaySpeed: "slow" });

    expect({
      hasLabelledGroup:
        screen.queryByRole("group", { name: "Battle Autoplay" }) !== null,
      pressedStates: SPEED_BUTTON_NAMES.map(
        (buttonName) =>
          screen
            .queryByRole("button", { name: buttonName })
            ?.getAttribute("aria-pressed") ?? null,
      ),
    }).toEqual({
      hasLabelledGroup: true,
      pressedStates: ["false", "true", "false"],
    });
  });

  it("BC2: choosing a speed reports it", () => {
    const reportedAutoplaySpeeds: AutoplaySpeed[] = [];
    renderBattleAutoplayControl({
      onAutoplaySpeedChange: (autoplaySpeed) => {
        reportedAutoplaySpeeds.push(autoplaySpeed);
      },
    });

    for (const buttonName of ["Fast", "Slow", "Off"]) {
      const speedButton = screen.queryByRole("button", { name: buttonName });
      if (speedButton !== null) {
        fireEvent.click(speedButton);
      }
    }

    expect(reportedAutoplaySpeeds).toEqual(["fast", "slow", "off"]);
  });

  it("BC3: Advance steps one beat when it can", () => {
    let advanceCallCount = 0;
    renderBattleAutoplayControl({
      onAdvance: () => {
        advanceCallCount += 1;
      },
    });

    const advanceButton = screen.queryByRole("button", { name: "Advance" });
    if (advanceButton !== null) {
      fireEvent.click(advanceButton);
    }

    expect([
      advanceButton?.hasAttribute("disabled") ?? null,
      advanceCallCount,
    ]).toEqual([false, 1]);
  });

  it("BC4: once the battle is finished, every button is disabled", () => {
    renderBattleAutoplayControl({ isFinished: true, canAdvance: false });

    expect(
      [...SPEED_BUTTON_NAMES, "Advance"].map(
        (buttonName) =>
          screen
            .queryByRole("button", { name: buttonName })
            ?.hasAttribute("disabled") ?? null,
      ),
    ).toEqual([true, true, true, true]);
  });
});
