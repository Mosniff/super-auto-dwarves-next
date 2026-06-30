import type { DummyCharacter } from "@/lib/dummy-battle";

interface RosterSlotProps {
  character?: DummyCharacter;
  facing?: "left" | "right";
}

export function RosterSlot({ character, facing = "right" }: RosterSlotProps) {
  return (
    <div
      className="relative flex aspect-3/4 flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-marble-200 p-1.5"
      style={{ boxShadow: "var(--shadow-recess)" }}
    >
      {character ? (
        <>
          <div
            className="w-full flex-1 rounded-sm bg-marble-300"
            style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
          />
          <span className="w-full truncate text-center text-[10px] font-medium text-marble-50">
            {character.name}
          </span>
          <div className="flex w-full items-center justify-between px-0.5 text-[10px] font-semibold text-marble-50">
            <span>⚔ {character.attack}</span>
            <span>♥ {character.health}</span>
          </div>
        </>
      ) : (
        <span className="select-none text-xs font-medium text-stone-500/60" />
      )}
    </div>
  );
}
