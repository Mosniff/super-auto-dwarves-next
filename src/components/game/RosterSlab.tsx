import type { Character } from "@/lib/battle/types";
import { RosterSlot } from "./RosterSlot";

const SLOT_COUNT = 7;

// Optional click-select wiring for the player's roster slots in camp.
// Absent entirely in battle, where slots are display-only.
export interface RosterSlotInteraction {
  selectedSlotIndex: number | null;
  isSlotEnabled: (slotIndex: number) => boolean;
  onSlotClick: (slotIndex: number) => void;
  slotButtonLabel: (slotIndex: number) => string;
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
              <button
                type="button"
                aria-label={slotInteraction.slotButtonLabel(i)}
                aria-pressed={slotInteraction.selectedSlotIndex === i}
                disabled={!slotInteraction.isSlotEnabled(i)}
                onClick={() => slotInteraction.onSlotClick(i)}
                className={`block w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  slotInteraction.selectedSlotIndex === i
                    ? "ring-2 ring-ring"
                    : ""
                }`}
              >
                <RosterSlot
                  character={character ?? undefined}
                  facing={facing}
                  isNext={i === 0 && Boolean(character)}
                />
              </button>
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
