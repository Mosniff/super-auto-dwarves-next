import type { Character } from "@/lib/battle/types";
import { RosterSlab } from "./RosterSlab";

interface GameScreenShellProps {
  playerCharacters: Character[];
  children: React.ReactNode;
}

export function GameScreenShell({
  playerCharacters,
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
        <RosterSlab characters={playerCharacters} variant="player" />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
