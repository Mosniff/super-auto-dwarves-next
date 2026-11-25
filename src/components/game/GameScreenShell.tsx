"use client";

import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { Character } from "@/lib/game/character";
import type { GamePhase } from "@/lib/game/types";
import type { CurrentBeatEffects } from "@/lib/battle/beatCharacterEffects";
import { RosterSlab, type RosterSlotInteraction } from "./RosterSlab";
import { animationTempoSeconds } from "@/lib/animationTempo";

const PHASE_SWIPE_DURATION_S = animationTempoSeconds(0.35);

// The page heading names the phase, for screen readers only: there is no
// visible phase banner (removed in Phase 16; battle had hidden it since
// Phase 14).
const GAME_PHASE_HEADING_KEYS: Record<GamePhase, "phaseCamp" | "phaseBattle"> =
  {
    campPhase: "phaseCamp",
    battlePhase: "phaseBattle",
  };

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
  showsPlayerInfoControls = false,
  onPlayerInfoControlOpen,
  playerCurrentBeat,
  children,
}: GameScreenShellProps) {
  const t = useTranslations("common");
  const prefersReducedMotion = useReducedMotion();
  const isPresent = useIsPresent();

  // The phase swipe, always forward (see GameScreen): during a swipe both
  // screens share one grid cell, and each whole screen — the roster slab
  // and the content below it — slides as one: the outgoing screen leaves to
  // the left while the incoming one arrives from the right (Phase 16; the
  // roster used to stand fixed while only the content slid, but the slab's
  // contents now differ a lot between phases). The slab's stone only
  // varies top to bottom, so two slabs edge to edge read as one surface
  // with the contents sliding across it. The header sits outside the swipe
  // and never moves. inert stops clicks and focus on the departing screen.
  return (
    <motion.main
      className="flex min-h-0 flex-1 flex-col"
      data-game-screen-presence={isPresent ? "present" : "exiting"}
      data-game-phase={gamePhase}
      data-game-screen-swipe
      initial={prefersReducedMotion ? false : { x: "100%" }}
      animate={{ x: "0%" }}
      exit={
        prefersReducedMotion
          ? { x: "0%", transition: { duration: 0 } }
          : { x: "-100%" }
      }
      transition={{ duration: PHASE_SWIPE_DURATION_S, ease: "easeInOut" }}
    >
      <div data-game-screen-region="roster" inert={!isPresent}>
        <div style={{ boxShadow: "var(--shadow-slab)" }}>
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
        <h1 className="sr-only">{t(GAME_PHASE_HEADING_KEYS[gamePhase])}</h1>
      </div>
      <div
        data-game-screen-region="content"
        className="flex min-h-0 flex-1 flex-col"
        inert={!isPresent}
      >
        {children}
      </div>
    </motion.main>
  );
}
