import Image from "next/image";
import type { Character } from "@/lib/game/character";
import { characterPortraitSrc } from "@/lib/game/characterPortraits";
import { useCharacterDisplayName } from "./characterDisplayName";

interface CharacterPortraitProps {
  character: Character;
  facing?: "left" | "right";
  sizes: string;
  imageClassName?: string;
  fallbackTextClassName: string;
}

export function CharacterPortrait({
  character,
  facing,
  sizes,
  imageClassName,
  fallbackTextClassName,
}: CharacterPortraitProps) {
  const portraitSrc = characterPortraitSrc(character);
  const displayCharacterName = useCharacterDisplayName();

  if (portraitSrc !== null) {
    return (
      <div
        className="absolute inset-0"
        style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
      >
        <Image
          src={portraitSrc}
          alt={displayCharacterName(character)}
          fill
          className={`object-cover ${imageClassName ?? ""}`}
          sizes={sizes}
          quality={90}
        />
      </div>
    );
  }

  // Never mirrored — a backwards "?" would read wrong; the face is what
  // mirrors, not the placeholder.
  return (
    <div
      data-character-portrait-fallback
      role="img"
      aria-label={displayCharacterName(character)}
      className={`absolute inset-0 flex items-center justify-center bg-(--color-portrait-brown) ${imageClassName ?? ""}`}
    >
      <span
        aria-hidden="true"
        className={`font-bold leading-none text-(--color-parchment-50)/70 ${fallbackTextClassName}`}
      >
        ?
      </span>
    </div>
  );
}
