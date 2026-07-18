import type { Character } from "@/lib/battle/types";
import { CharacterCard } from "./CharacterCard";

interface DiscardPileProps {
  downedCharacters: Character[];
  variant: "player" | "enemy";
}

const CARD_WIDTH_PX = 192; // w-48
const CARD_HEIGHT_PX = 256; // h-64

// A few px right+down per card so earlier deaths peek out behind the most
// recent one, which sits frontmost (highest z-index).
const PEEK_OFFSET_PX = 6;
const MAX_VISIBLE_DOWNED_CARDS = 3;

// The furthest-back visible card is offset this many times over — the
// container and ring must be at least this much larger than one base card.
const MAX_STACK_OFFSET_PX = PEEK_OFFSET_PX * (MAX_VISIBLE_DOWNED_CARDS - 1);
const CONTAINER_WIDTH_PX = CARD_WIDTH_PX + MAX_STACK_OFFSET_PX;
const CONTAINER_HEIGHT_PX = CARD_HEIGHT_PX + MAX_STACK_OFFSET_PX;
const RING_INSET_PX = 12; // breathing room outside the full stack

export function DiscardPile({ downedCharacters, variant }: DiscardPileProps) {
  const facing = variant === "enemy" ? "left" : "right";
  // Oldest-first; the newest deaths are the last elements, so slicing from
  // the end keeps the most recent ones and preserves their oldest->newest
  // order within the slice — the last element of the slice stays the
  // frontmost, most-recent card.
  const mostRecentDownedCharacters = downedCharacters.slice(
    -MAX_VISIBLE_DOWNED_CARDS,
  );

  return (
    <div
      className="relative shrink-0"
      style={{ width: CONTAINER_WIDTH_PX, height: CONTAINER_HEIGHT_PX }}
    >
      {mostRecentDownedCharacters.map((character, index) => (
        <div
          key={character.id}
          className="absolute flex flex-col items-center justify-center gap-1 overflow-hidden rounded-md bg-slate-200 p-1.5"
          style={{
            width: CARD_WIDTH_PX,
            height: CARD_HEIGHT_PX,
            top: index * PEEK_OFFSET_PX,
            left: index * PEEK_OFFSET_PX,
            zIndex: index + 1,
            boxShadow: "var(--shadow-recess), 0 4px 8px rgba(0,0,0,0.4)",
          }}
        >
          {/* Future divergence point: this is the one place that chooses the
              inner card for a pile slot. If downed cards later get a
              stripped-down variant, swap it in only here. */}
          <CharacterCard character={character} facing={facing} />
        </div>
      ))}

      {/* Always-visible footprint — the pile's location, even when empty.
          Sized to clear the full 3-card offset stack with a small margin. */}
      <div
        className="pointer-events-none absolute rounded-lg border-2"
        style={{
          inset: -RING_INSET_PX,
          borderColor: "var(--color-iron-300)",
        }}
      >
        <span
          className="absolute left-1/2 -bottom-1.75 -translate-x-1/2 rounded-full px-1.5 py-0 text-[8px] font-bold tracking-wide uppercase"
          style={{
            backgroundColor: "var(--color-slate-300)",
            color: "var(--color-iron-300)",
          }}
        >
          downed
        </span>
      </div>
    </div>
  );
}
