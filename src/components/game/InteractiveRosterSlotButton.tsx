"use client";

import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import type { Character } from "@/lib/battle/types";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { RosterSlot } from "./RosterSlot";

interface InteractiveRosterSlotButtonProps {
  slotIndex: number;
  character: Character | undefined;
  facing: "left" | "right";
  isNext: boolean;
  buttonLabel: string;
  isSelected: boolean;
  isEnabled: boolean;
  onClick: () => void;
  isDraggable: boolean;
  presentation: CampTargetPresentation;
}

// Visual classes come from the presentation state only (plus dimming the
// drag source), never from the native disabled attribute, isSelected or a
// standalone valid-drop-target flag — this keeps click-select and drag
// from ever presenting a tile differently.
function presentationClassName(
  presentation: CampTargetPresentation,
  isEnabled: boolean,
  isDropTarget: boolean,
): string {
  switch (presentation) {
    case "held":
      return "ring-2 ring-ring";
    case "eligible":
      return isDropTarget
        ? "ring-4 ring-emerald-500"
        : "ring-2 ring-dashed ring-emerald-400";
    case "ineligible":
      return "opacity-50 cursor-not-allowed";
    case "neutral":
      return isEnabled ? "cursor-pointer" : "cursor-default";
  }
}

export function InteractiveRosterSlotButton({
  slotIndex,
  character,
  facing,
  isNext,
  buttonLabel,
  isSelected,
  isEnabled,
  onClick,
  isDraggable,
  presentation,
}: InteractiveRosterSlotButtonProps) {
  const campClickTarget: CampClickTarget = {
    targetKind: "rosterSlot",
    slotIndex,
  };

  const { ref: draggableRef, isDragSource } = useDraggable({
    id: `roster-slot-${slotIndex}`,
    data: { campClickTarget, character },
    disabled: !isDraggable,
  });
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: `roster-drop-${slotIndex}`,
    data: { campClickTarget },
  });

  const combinedRef = useCallback(
    (element: Element | null) => {
      draggableRef(element);
      droppableRef(element);
    },
    [draggableRef, droppableRef],
  );

  return (
    <button
      ref={combinedRef}
      type="button"
      aria-label={buttonLabel}
      aria-pressed={isSelected}
      disabled={!isEnabled}
      onClick={onClick}
      data-camp-target-presentation={presentation}
      className={`block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${presentationClassName(
        presentation,
        isEnabled,
        isDropTarget,
      )} ${isDragSource ? "opacity-40" : ""}`}
    >
      <RosterSlot character={character} facing={facing} isNext={isNext} />
    </button>
  );
}
