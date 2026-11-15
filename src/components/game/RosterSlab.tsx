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
  // "Matching" comes from the buy rule's preview via campSelection
  // (isRosterSlotMatchingHeldItem), never a client-side template
  // comparison.
  isSlotMatchingHeldItem: (slotIndex: number) => boolean;
}

interface RosterSlabProps {
  characters: (Character | null)[];
  variant?: "player" | "enemy";
  slotInteraction?: RosterSlotInteraction;
  // When true, slot 0's card is "on deck" (the NEXT halo, and the launch
  // exit when it leaves for the action zone); battle turns this on; camp
  // leaves it off, so its front card moves like any other. The screen
  // decides, and the slab doesn't know the game phase (same principle as
  // slotInteraction).
  presentsFrontSlotAsOnDeck?: boolean;
  // When true, every slot's card shows the level pill and XP bar. The
  // screen decides, and the slab never learns the game phase. Camp turns
  // it on for the player's roster.
  showsCharacterProgression?: boolean;
  // An optional screen-provided control (e.g. camp's merge/sell toggle),
  // centred in the slab's trailing box. Battle provides none. The slab
  // never learns what the controls are or why.
  trailingControls?: React.ReactNode;
}

export function RosterSlab({
  characters,
  variant = "player",
  slotInteraction,
  presentsFrontSlotAsOnDeck = false,
  showsCharacterProgression = false,
  trailingControls,
}: RosterSlabProps) {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => characters[i]);
  const facing = variant === "enemy" ? "left" : "right";

  return (
    // The leading and trailing boxes are flex-1 basis-0, so they start at
    // zero and split the leftover width equally, which keeps the slot row
    // dead centre. min-w-0 stops the trailing box's content width from
    // growing it and shifting the slots; controls wider than the box
    // overflow symmetrically rather than moving the roster. The screen
    // decides whether to provide controls; the slab never learns the phase.
    <div className="flex w-full h-72 bg-linear-to-b from-slate-100 via-slate-200 to-slate-300 px-5 py-4">
      <div data-roster-slab-leading-area className="min-w-0 flex-1 basis-0" />
      <div
        className={`flex h-full shrink-0 justify-center gap-12 ${
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
          <div key={i} className="h-full aspect-3/4">
            {slotInteraction ? (
              <InteractiveRosterSlotButton
                slotIndex={i}
                character={character ?? undefined}
                facing={facing}
                isNext={presentsFrontSlotAsOnDeck && i === 0 && Boolean(character)}
                buttonLabel={slotInteraction.slotButtonLabel(i)}
                isSelected={slotInteraction.selectedSlotIndex === i}
                isEnabled={slotInteraction.isSlotEnabled(i)}
                onClick={() => slotInteraction.onSlotClick(i)}
                isDraggable={slotInteraction.isSlotDraggable(i)}
                presentation={slotInteraction.slotPresentation(i)}
                showsCharacterProgression={showsCharacterProgression}
                isMatchingHeldItem={slotInteraction.isSlotMatchingHeldItem(i)}
              />
            ) : (
              <RosterSlot
                character={character ?? undefined}
                facing={facing}
                isNext={presentsFrontSlotAsOnDeck && i === 0 && Boolean(character)}
                showsCharacterProgression={showsCharacterProgression}
              />
            )}
          </div>
        ))}
      </div>
      <div
        data-roster-slab-trailing-area
        className="flex min-w-0 flex-1 basis-0 flex-col items-center justify-center"
      >
        {trailingControls}
      </div>
    </div>
  );
}
