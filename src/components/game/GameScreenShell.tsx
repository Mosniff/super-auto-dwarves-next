"use client";

import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { Character } from "@/lib/game/character";
import type { GamePhase } from "@/lib/game/types";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import { GamePhaseBanner } from "./GamePhaseBanner";
import { RosterSlab, type RosterSlotInteraction } from "./RosterSlab";
import { animationTempoSeconds } from "@/lib/animationTempo";

const PHASE_SWIPE_DURATION_S = animationTempoSeconds(0.35);

export type { RosterSlotInteraction };

interface GameScreenShellProps {
  gamePhase: GamePhase;
  playerBenchCharacters: (Character | null)[];
  playerSlotInteraction?: RosterSlotInteraction;
  presentsPlayerFrontSlotAsOnDeck?: boolean;
  showsPlayerCharacterProgression?: boolean;
  playerRosterTrailingControls?: React.ReactNode;
  // The controls left of the player's slots (battle's autoplay control,
  // camp's money pile since Phase 16), and battle's slot row aligned toward
  // the front (see RosterSlab). The screen decides.
  playerRosterLeadingControls?: React.ReactNode;
  alignsPlayerRosterSlotsTowardFront?: boolean;
  // Battle's player faction tab in the slab's bottom-left (Phase 15). The
  // screen decides; camp passes none.
  playerRosterFactionLabel?: string;
  // The screen decides whether the phase banner shows; battle turns it off
  // to save space (Phase 14). The phase stays the page heading, visually
  // hidden.
  showsPhaseBanner?: boolean;
  // The screen decides; the slab never learns the phase. Battle turns
  // this on for the player's bench; camp's interactive slots render their
  // own info controls.
  showsPlayerInfoControls?: boolean;
  onPlayerInfoControlOpen?: () => void;
  // Phase 12 battle beat animations, for the player's bench.
  playerCurrentBeat?: CurrentBeatEffects;
  children: React.ReactNode;
}

export function GameScreenShell({
  gamePhase,
  playerBenchCharacters,
  playerSlotInteraction,
  presentsPlayerFrontSlotAsOnDeck = false,
  showsPlayerCharacterProgression = false,
  playerRosterTrailingControls,
  playerRosterLeadingControls,
  alignsPlayerRosterSlotsTowardFront = false,
  playerRosterFactionLabel,
  showsPhaseBanner = true,
  showsPlayerInfoControls = false,
  onPlayerInfoControlOpen,
  playerCurrentBeat,
  children,
}: GameScreenShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const isPresent = useIsPresent();

  // During a swipe both screens share one grid cell (see GameScreen).
  // Hiding the outgoing roster (and the phase banner hanging from it)
  // keeps them visually fixed; inert stops clicks and focus on the
  // departing screen.
  return (
    <main
      className="flex min-h-0 flex-1 flex-col"
      data-game-screen-presence={isPresent ? "present" : "exiting"}
      data-game-phase={gamePhase}
    >
      <div
        data-game-screen-region="roster"
        inert={!isPresent}
        style={{ visibility: isPresent ? "visible" : "hidden" }}
      >
        {/* The iron edge is designed to sit against the phase banner;
            without the banner (battle) it reads as a stray line on the
            dark centre. */}
        <div
          data-slab-base-edge={showsPhaseBanner ? "shown" : "hidden"}
          style={{
            boxShadow: "var(--shadow-slab)",
            borderBottom: showsPhaseBanner
              ? "var(--slab-base-border)"
              : undefined,
          }}
        >
          <RosterSlab
            characters={playerBenchCharacters}
            variant="player"
            slotInteraction={playerSlotInteraction}
            presentsFrontSlotAsOnDeck={presentsPlayerFrontSlotAsOnDeck}
            showsCharacterProgression={showsPlayerCharacterProgression}
            trailingControls={playerRosterTrailingControls}
            leadingControls={playerRosterLeadingControls}
            alignsSlotsTowardFront={alignsPlayerRosterSlotsTowardFront}
            factionLabel={playerRosterFactionLabel}
            showsInfoControls={showsPlayerInfoControls}
            onInfoControlOpen={onPlayerInfoControlOpen}
            currentBeat={playerCurrentBeat}
          />
        </div>
        <GamePhaseBanner
          gamePhase={gamePhase}
          isVisuallyHidden={!showsPhaseBanner}
        />
      </div>
      {/* The phase swipe, always forward: the outgoing screen's content
          slides out to the left while the incoming screen's content slides
          in from the right (see GameScreen). */}
      <motion.div
        data-game-screen-region="content"
        className="flex min-h-0 flex-1 flex-col"
        inert={!isPresent}
        initial={prefersReducedMotion ? false : { x: "100%" }}
        animate={{ x: "0%" }}
        exit={
          prefersReducedMotion
            ? { x: "0%", transition: { duration: 0 } }
            : { x: "-100%" }
        }
        transition={{ duration: PHASE_SWIPE_DURATION_S, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </main>
  );
}
