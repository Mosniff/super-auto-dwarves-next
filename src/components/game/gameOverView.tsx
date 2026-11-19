"use client";

import { createContext, useContext } from "react";

// Whether the player has moved from a lost battle to the game-over screen,
// in this visit (Phase 13). Display-only, never sent anywhere: the save
// stays in battlePhase until the end-run intent, so a reload replays the
// final battle. GameScreen owns the state; the header's Continue button
// sets it.
export interface GameOverView {
  isShowingGameOver: boolean;
  showGameOver: () => void;
}

const NO_GAME_OVER_VIEW: GameOverView = {
  isShowingGameOver: false,
  showGameOver: () => {},
};

const GameOverViewContext = createContext<GameOverView>(NO_GAME_OVER_VIEW);

export const GameOverViewProvider = GameOverViewContext.Provider;

export function useGameOverView(): GameOverView {
  return useContext(GameOverViewContext);
}
