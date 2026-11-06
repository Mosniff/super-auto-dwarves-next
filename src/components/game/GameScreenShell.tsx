import type { Character } from "@/lib/battle/types";
import { RosterSlab, type RosterSlotInteraction } from "./RosterSlab";

export type { RosterSlotInteraction };

interface GameScreenShellProps {
  playerBenchCharacters: (Character | null)[];
  playerSlotInteraction?: RosterSlotInteraction;
  children: React.ReactNode;
}

export function GameScreenShell({
  playerBenchCharacters,
  playerSlotInteraction,
  children,
}: GameScreenShellProps) {
  return (
    <main className="flex flex-1 flex-col">
      <div
        style={{
          boxShadow: "var(--shadow-slab)",
          borderBottom: "var(--slab-base-border)",
        }}
      >
        <RosterSlab
          characters={playerBenchCharacters}
          variant="player"
          slotInteraction={playerSlotInteraction}
        />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
