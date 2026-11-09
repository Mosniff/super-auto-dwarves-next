import type { Character } from "@/lib/game/character";
import type { CampTargetPresentation } from "./campSelection";
import { InteractiveRosterSlotButton } from "./InteractiveRosterSlotButton";
import { RosterSlot } from "./RosterSlot";

const SLOT_COUNT = 7;

// Optional click-select (and, in camp, drag-and-drop) wiring for the
// player's roster slots. Absent entirely in battle, where slots are
// display-only.
export interface RosterSlotInteraction {
  selectedSlotIndex: number | null;
  isSlotEnabled: (slotIndex: number) => boolean;
  onSlotClick: (slotIndex: number) => void;
  slotButtonLabel: (slotIndex: number) => string;
  isSlotDraggable: (slotIndex: number) => boolean;
  slotPresentation: (slotIndex: number) => CampTargetPresentation;
}

interface RosterSlabProps {
  characters: (Character | null)[];
  variant?: "player" | "enemy";
  slotInteraction?: RosterSlotInteraction;
}

export function RosterSlab({
  characters,
  variant = "player",
  slotInteraction,
}: RosterSlabProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => characters[i]);
  const facing = variant === "enemy" ? "left" : "right";

  return (
    <div className="w-full bg-linear-to-b from-slate-100 via-slate-200 to-slate-300 px-5 py-4">
      <div
        className={`mx-auto flex max-w-5xl gap-3 ${
          variant === "player" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {slots.map((character, i) => (
          // Keyed by POSITION, not by the occupant's id: the slot is fixed
          // furniture and must PERSIST as the same component instance while
          // its occupant changes, so that RosterSlot's internal
          // AnimatePresence can observe the swap and play exit+entrance.
          // Keying by character id here would remount the whole RosterSlot
          // (including AnimatePresence) on every occupant change, which is
          // exactly the bug this fixes.
          <div key={i} className="flex-1">
            {slotInteraction ? (
              <InteractiveRosterSlotButton
                slotIndex={i}
                character={character ?? undefined}
                facing={facing}
                isNext={i === 0 && Boolean(character)}
                buttonLabel={slotInteraction.slotButtonLabel(i)}
                isSelected={slotInteraction.selectedSlotIndex === i}
                isEnabled={slotInteraction.isSlotEnabled(i)}
                onClick={() => slotInteraction.onSlotClick(i)}
                isDraggable={slotInteraction.isSlotDraggable(i)}
                presentation={slotInteraction.slotPresentation(i)}
              />
            ) : (
              <RosterSlot
                character={character ?? undefined}
                facing={facing}
                isNext={i === 0 && Boolean(character)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
