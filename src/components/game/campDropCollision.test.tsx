// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { DragDropProvider, useDragDropManager } from "@dnd-kit/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import { buildTestCharacter } from "@/test/characterFixtures";
import { campDropCollisionDetector } from "./campDropCollision";
import { InteractiveRosterSlotButton } from "./InteractiveRosterSlotButton";
import { MoneyPile } from "./MoneyPile";

// Phase 16: with a shrunken drag overlay, a drop must land where the
// pointer is. dnd-kit's default detector falls back to the overlap of the
// dragged copy's full-size box when the pointer is over no target, which
// could drop onto a slot the small card doesn't seem to touch. Every camp
// drop target uses campDropCollisionDetector instead: the pointer only.

type CollisionDetectorInput = Parameters<typeof campDropCollisionDetector>[0];

function buildCollisionDetectorInput(
  pointerIsInsideDroppable: boolean,
): CollisionDetectorInput {
  return {
    dragOperation: { position: { current: { x: 10, y: 10 } } },
    droppable: {
      id: "fixture-droppable",
      shape: {
        center: { x: 0, y: 0 },
        containsPoint: () => pointerIsInsideDroppable,
      },
    },
  } as unknown as CollisionDetectorInput;
}

// Captures the manager of the surrounding DragDropProvider, so a test can
// read which collision detector each registered droppable uses.
const capturedManagers: NonNullable<ReturnType<typeof useDragDropManager>>[] =
  [];

function DragDropManagerProbe() {
  const manager = useDragDropManager();
  if (manager && !capturedManagers.includes(manager)) {
    capturedManagers.push(manager);
  }
  return null;
}

const fixtureCharacter = buildTestCharacter({
  id: "dwarf-1",
  name: "Borin",
  attack: 3,
  hp: 5,
  maxHp: 5,
  characterTemplateId: "fixture-dwarf",
  tier: 1,
  characterClassIds: ["warrior"],
  experience: 0,
});

describe("camp drop collision (Phase 16)", () => {
  it("CD1: the camp's collision detector collides only when the pointer is inside the drop target", () => {
    expect([
      campDropCollisionDetector(buildCollisionDetectorInput(true))?.id,
      campDropCollisionDetector(buildCollisionDetectorInput(false)),
    ]).toEqual(["fixture-droppable", null]);
  });

  // deliberate assertion rewrite: the money pile replaced the sell box as the camp's sell target (Phase 16)
  it("CD2: every camp drop target (the whole slot, both zones and the money pile) uses the camp's collision detector", () => {
    capturedManagers.length = 0;

    renderWithMessages(
      <DragDropProvider>
        <InteractiveRosterSlotButton
          slotIndex={0}
          character={fixtureCharacter}
          facing="right"
          isNext={false}
          buttonLabel="Slot 1: Borin, level 1"
          isSelected={false}
          isEnabled
          onClick={() => {}}
          isDraggable
          presentation="neutral"
          exitKind="shuffle"
          isMatchingHeldItem={false}
          zonesPresentation={{ zonesShown: false }}
          zoneButtonLabel={(zoneKind) => `zone ${zoneKind}`}
          isZoneEnabled={() => false}
          onZoneClick={() => {}}
        />
        <MoneyPile
          gold={10}
          isSellShown={false}
          sellButtonLabel="Sell?"
          presentation="ineligible"
          isEnabled={false}
          onClick={() => {}}
        />
        <DragDropManagerProbe />
      </DragDropProvider>,
    );

    const [manager] = capturedManagers;
    const registeredDroppables = [...manager.registry.droppables];

    // Sorted by id: the registry's order is dnd-kit's business.
    expect(
      registeredDroppables
        .map((droppable) => [
          String(droppable.id),
          droppable.collisionDetector === campDropCollisionDetector,
        ])
        .sort(([firstId], [secondId]) =>
          String(firstId).localeCompare(String(secondId)),
        ),
    ).toEqual([
      ["money-pile", true],
      ["roster-drop-0", true],
      ["roster-merge-zone-0", true],
      ["roster-swap-zone-0", true],
    ]);
  });
});
