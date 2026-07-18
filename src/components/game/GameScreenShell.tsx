import type { Character } from "@/lib/battle/types";
import { RosterSlab } from "./RosterSlab";

interface GameScreenShellProps {
  playerBenchCharacters: Character[];
  children: React.ReactNode;
}

export function GameScreenShell({
  playerBenchCharacters,
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
        <RosterSlab characters={playerBenchCharacters} variant="player" />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
