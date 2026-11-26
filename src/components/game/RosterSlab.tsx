import type { Character } from "@/lib/game/character";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import { abilityCasterPulseKind } from "@/lib/battle/beatDurationMs";
import type {
  CampTargetPresentation,
  RosterSlotZoneKind,
  RosterSlotZonesPresentation,
} from "./campSelection";
import type {
  RosterSlotExitKind,
  RosterSlotShuffleSides,
} from "./rosterSlotAnimation";
import type { CampStartSlotBeat } from "./campStartSequence";
import { CharacterInfoControl } from "./CharacterInfoControl";
import { InteractiveRosterSlotButton } from "./InteractiveRosterSlotButton";
import { RosterSlot } from "./RosterSlot";

// globals.css's --roster-card-height assumes this count (7) and must change with it.
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
  // Phase 16, display-only: which way that slot's cards slide (a camp
  // reposition slides toward the other slot; rosterSlotShuffleSides).
  slotShuffleSides: (slotIndex: number) => RosterSlotShuffleSides;
  // "Matching" comes from the buy rule's preview via campSelection
  // (isRosterSlotMatchingHeldItem), never a client-side template
  // comparison.
  isSlotMatchingHeldItem: (slotIndex: number) => boolean;
  // Phase 12 start-of-camp sequence; display-only.
  slotCampStartBeat?: (slotIndex: number) => CampStartSlotBeat | undefined;
  // Phase 16 split drop zones: each slot's two halves while a roster dwarf
  // is held (campSelection's presentRosterSlotZones).
  slotZonesPresentation: (slotIndex: number) => RosterSlotZonesPresentation;
  slotZoneButtonLabel: (
    slotIndex: number,
    zoneKind: RosterSlotZoneKind,
  ) => string;
  isSlotZoneEnabled: (
    slotIndex: number,
    zoneKind: RosterSlotZoneKind,
  ) => boolean;
  onSlotZoneClick: (slotIndex: number, zoneKind: RosterSlotZoneKind) => void;
}

interface RosterSlabProps {
  characters: (Character | null)[];
  variant?: "player" | "enemy";
  // Phase 15: the side's faction name, shown in a notch cut into the slab's
  // top-right — the enemy slab only, for now; already translated.
  factionLabel?: string;
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
  // An optional screen-provided control, centred in the slab's trailing
  // box. No screen provides one today (camp's merge/sell toggle lived here
  // until Phase 16). The slab never learns what the controls are or why.
  trailingControls?: React.ReactNode;
  // The same for the slab's leading (left-hand) box (battle's autoplay
  // control, camp's money pile). The slab never learns what the controls
  // are or why.
  leadingControls?: React.ReactNode;
  // When true, the slot row sits against the slab's edge on its front's
  // side instead of centred (battle turns it on for both slabs). The screen
  // decides; the slab never learns the phase. The front is derived from
  // variant: the player's front is on the right, the enemy's on the left.
  // The box on the front's side isn't rendered then, so controls belong in
  // the box AWAY from the front (leadingControls for the player,
  // trailingControls for the enemy).
  alignsSlotsTowardFront?: boolean;
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
  factionLabel,
  slotInteraction,
  presentsFrontSlotAsOnDeck = false,
  showsCharacterProgression = false,
  trailingControls,
  leadingControls,
  alignsSlotsTowardFront = false,
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
      ? Array.from(
          { length: SLOT_COUNT },
          (_, slotIndex) => slotIndex,
        ).reverse()
      : Array.from({ length: SLOT_COUNT }, (_, slotIndex) => slotIndex);
  // Aligned toward the front, only the box away from the front renders.
  const rendersLeadingArea = !alignsSlotsTowardFront || variant === "player";
  const rendersTrailingArea = !alignsSlotsTowardFront || variant === "enemy";

  return (
    // Centred (the default): the leading and trailing boxes are flex-1
    // basis-0, so they start at zero and split the leftover width equally,
    // which keeps the slot row dead centre. min-w-0 stops a box's content
    // width from growing it and shifting the slots; controls wider than the
    // box overflow (under the slot row) rather than moving the roster, so a
    // control must be sized to fit its box. The boxes impose no alignment
    // (they stretch their content); each control positions itself.
    // Aligned toward the front: the box on the front's side isn't rendered,
    // so the remaining flex-1 box takes all the leftover width and pushes
    // the slot row against the front's edge (right for the player, left for
    // the enemy). The screen decides whether to provide controls and how to
    // align; the slab never learns the phase.
    <div
      data-roster-slab
      data-roster-slab-variant={variant}
      data-roster-slot-alignment={alignsSlotsTowardFront ? "front" : "centre"}
      className="relative flex w-full h-(--roster-slab-height) px-(--roster-slab-padding-x) py-(--roster-slab-padding-y)"
    >
      {/* The slab's stone surface lives on its own layer behind the cards,
          so the enemy slab's faction notch (globals.css → "Phase 15 slab
          faction notch") can be cut out of the surface with clip-path
          without clipping the cards, whose beat animations leave the slab.
          The content areas below are `relative`, so they stack above the
          surface by page order (no isolate / negative z-index, which would
          trap the cards' z-10 inside the slab). */}
      <div
        data-roster-slab-surface
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-slate-100 via-slate-200 to-slate-300"
      />
      {factionLabel !== undefined && (
        <span
          data-roster-slab-faction-label
          className="pointer-events-none absolute flex items-center uppercase"
        >
          {factionLabel}
        </span>
      )}
      {rendersLeadingArea && (
        <div
          data-roster-slab-leading-area
          className="relative flex min-w-0 flex-1 basis-0 flex-col"
        >
          {leadingControls}
        </div>
      )}
      <div className="relative flex h-full shrink-0 flex-row justify-center gap-(--roster-slot-gap)">
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
                  shuffleSides={slotInteraction.slotShuffleSides(slotIndex)}
                  showsCharacterProgression={showsCharacterProgression}
                  isMatchingHeldItem={slotInteraction.isSlotMatchingHeldItem(
                    slotIndex,
                  )}
                  campStartBeat={slotInteraction.slotCampStartBeat?.(slotIndex)}
                  zonesPresentation={slotInteraction.slotZonesPresentation(
                    slotIndex,
                  )}
                  zoneButtonLabel={(zoneKind) =>
                    slotInteraction.slotZoneButtonLabel(slotIndex, zoneKind)
                  }
                  isZoneEnabled={(zoneKind) =>
                    slotInteraction.isSlotZoneEnabled(slotIndex, zoneKind)
                  }
                  onZoneClick={(zoneKind) =>
                    slotInteraction.onSlotZoneClick(slotIndex, zoneKind)
                  }
                />
              ) : showsInfoControls ? (
                <div
                  data-info-control-host
                  data-card-badge-basis="roster"
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
                    abilityCasterPulse={abilityCasterPulseKind(
                      currentBeat?.beatType,
                    )}
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
                  abilityCasterPulse={abilityCasterPulseKind(
                    currentBeat?.beatType,
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {rendersTrailingArea && (
        <div
          data-roster-slab-trailing-area
          className="relative flex min-w-0 flex-1 basis-0 flex-col"
        >
          {trailingControls}
        </div>
      )}
    </div>
  );
}
