import type { Character } from "@/lib/game/character";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import type { CampTargetPresentation } from "./campSelection";
import type { RosterSlotExitKind } from "./rosterSlotAnimation";
import type { CampStartSlotBeat } from "./campStartSequence";
import { CharacterInfoControl } from "./CharacterInfoControl";
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
  // Display-only (rosterSlotAnimation.ts's own comment): how that slot's
  // departing card should exit, derived from the last submitted intent.
  slotExitKind: (slotIndex: number) => RosterSlotExitKind;
  // "Matching" comes from the buy rule's preview via campSelection
  // (isRosterSlotMatchingHeldItem), never a client-side template
  // comparison.
  isSlotMatchingHeldItem: (slotIndex: number) => boolean;
  // Phase 12 start-of-camp sequence; display-only.
  slotCampStartBeat?: (slotIndex: number) => CampStartSlotBeat | undefined;
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
  // When true, every non-interactive slot's card gets an info control
  // ("i"). The screen decides; the slab never learns the phase. Battle
  // turns it on for both slabs; camp's interactive slots render their
  // own.
  showsInfoControls?: boolean;
  onInfoControlOpen?: () => void;
  // Phase 12 battle beat animations; display-only, and only read by the
  // non-interactive slot branches (camp's interactive slots never get it).
  currentBeat?: CurrentBeatEffects;
}

export function RosterSlab({
  characters,
  variant = "player",
  slotInteraction,
  presentsFrontSlotAsOnDeck = false,
  showsCharacterProgression = false,
  trailingControls,
  showsInfoControls = false,
  onInfoControlOpen,
  currentBeat,
}: RosterSlabProps) {
  const facing = variant === "enemy" ? "left" : "right";
  // Phase 13: who dropped in this battle beat, so their bench cards leave
  // with the drop (see RosterSlot).
  const droppedCharacterIds = new Set(
    Object.entries(currentBeat?.characterEffects ?? {})
      .filter(([, beatEffect]) => beatEffect.isDropped)
      .map(([characterId]) => characterId),
  );
  // Document order matches visual order (left to right) so Tab and screen
  // readers walk the roster the way it reads: the player's backline first
  // and front (slot 1) last on the right; the enemy's front first on the
  // left. Keys stay the slot index so each slot's RosterSlot persists.
  const slotIndexesInDisplayOrder =
    variant === "player"
      ? Array.from({ length: SLOT_COUNT }, (_, slotIndex) => slotIndex).reverse()
      : Array.from({ length: SLOT_COUNT }, (_, slotIndex) => slotIndex);

  return (
    // The leading and trailing boxes are flex-1 basis-0, so they start at
    // zero and split the leftover width equally, which keeps the slot row
    // dead centre. min-w-0 stops the trailing box's content width from
    // growing it and shifting the slots; controls wider than the box
    // overflow symmetrically rather than moving the roster. The screen
    // decides whether to provide controls; the slab never learns the phase.
    <div className="flex w-full h-72 bg-linear-to-b from-slate-100 via-slate-200 to-slate-300 px-5 py-4">
      <div data-roster-slab-leading-area className="min-w-0 flex-1 basis-0" />
      <div className="flex h-full shrink-0 flex-row justify-center gap-12">
        {slotIndexesInDisplayOrder.map((slotIndex) => {
          const character = characters[slotIndex];

          return (
            // Keyed by POSITION, not by the occupant's id: the slot is fixed
            // furniture and must PERSIST as the same component instance while
            // its occupant changes, so that RosterSlot's internal
            // AnimatePresence can observe the swap and play exit+entrance.
            // Keying by character id here would remount the whole RosterSlot
            // (including AnimatePresence) on every occupant change, which is
            // exactly the bug this fixes.
            <div key={slotIndex} className="h-full aspect-3/4">
              {slotInteraction ? (
                <InteractiveRosterSlotButton
                  slotIndex={slotIndex}
                  character={character ?? undefined}
                  facing={facing}
                  isNext={
                    presentsFrontSlotAsOnDeck &&
                    slotIndex === 0 &&
                    Boolean(character)
                  }
                  buttonLabel={slotInteraction.slotButtonLabel(slotIndex)}
                  isSelected={slotInteraction.selectedSlotIndex === slotIndex}
                  isEnabled={slotInteraction.isSlotEnabled(slotIndex)}
                  onClick={() => slotInteraction.onSlotClick(slotIndex)}
                  isDraggable={slotInteraction.isSlotDraggable(slotIndex)}
                  presentation={slotInteraction.slotPresentation(slotIndex)}
                  exitKind={slotInteraction.slotExitKind(slotIndex)}
                  showsCharacterProgression={showsCharacterProgression}
                  isMatchingHeldItem={slotInteraction.isSlotMatchingHeldItem(
                    slotIndex,
                  )}
                  campStartBeat={slotInteraction.slotCampStartBeat?.(slotIndex)}
                />
              ) : showsInfoControls ? (
                <div
                  data-info-control-host
                  data-info-control-revealed="false"
                  className="relative h-full w-full"
                >
                  <RosterSlot
                    slotIndex={slotIndex}
                    character={character ?? undefined}
                    facing={facing}
                    isNext={
                      presentsFrontSlotAsOnDeck &&
                      slotIndex === 0 &&
                      Boolean(character)
                    }
                    showsCharacterProgression={showsCharacterProgression}
                    beatEffect={
                      character
                        ? currentBeat?.characterEffects[character.id]
                        : undefined
                    }
                    beatKey={currentBeat?.beatKey}
                    droppedCharacterIds={droppedCharacterIds}
                  />
                  {character && (
                    <CharacterInfoControl
                      key={character.id}
                      character={character}
                      onOpen={onInfoControlOpen}
                    />
                  )}
                </div>
              ) : (
                <RosterSlot
                  slotIndex={slotIndex}
                  character={character ?? undefined}
                  facing={facing}
                  isNext={
                    presentsFrontSlotAsOnDeck &&
                    slotIndex === 0 &&
                    Boolean(character)
                  }
                  showsCharacterProgression={showsCharacterProgression}
                  beatEffect={
                    character
                      ? currentBeat?.characterEffects[character.id]
                      : undefined
                  }
                  beatKey={currentBeat?.beatKey}
                  droppedCharacterIds={droppedCharacterIds}
                />
              )}
            </div>
          );
        })}
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
