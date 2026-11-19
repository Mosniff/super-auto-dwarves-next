import type { BattleEvent } from "./types";

// Display-only (Phase 12): what one beat did to each character, for the
// battle's beat animations — whether it fired an ability, how much armour
// it gained, and what its armour broke from. Only characters the beat
// affected appear.
export interface BeatCharacterEffect {
  isActing: boolean;
  armourGained: number;
  // the armour it had when a hit broke it (resultingArmour 0), else null
  brokenFromArmour: number | null;
  // hp lost to ability hits this beat, for the "−N HP" floater; clash hits
  // don't count (the human's call, Phase 13)
  abilityHpLost: number;
  // it dropped this beat (Phase 13): a bench card leaving because of a
  // drop plays the drop, not the slide or the front's launch
  isDropped: boolean;
}

// What the battle screen hands down to its cards (Phase 12); beatKey is
// the playback beat, so per-beat animations replay.
export interface CurrentBeatEffects {
  beatKey: number;
  characterEffects: Readonly<Record<string, BeatCharacterEffect>>;
}

export function beatCharacterEffects(
  beatEvents: readonly BattleEvent[],
): Record<string, BeatCharacterEffect> {
  const effectsByCharacterId: Record<string, BeatCharacterEffect> = {};

  function effectFor(characterId: string): BeatCharacterEffect {
    const existingEffect = effectsByCharacterId[characterId];
    if (existingEffect !== undefined) {
      return existingEffect;
    }

    const createdEffect: BeatCharacterEffect = {
      isActing: false,
      armourGained: 0,
      brokenFromArmour: null,
      abilityHpLost: 0,
      isDropped: false,
    };
    effectsByCharacterId[characterId] = createdEffect;
    return createdEffect;
  }

  for (const event of beatEvents) {
    switch (event.type) {
      case "ABILITY_ACTIVATE":
        effectFor(event.characterId).isActing = true;
        break;
      case "STAT_CHANGE": {
        const armourGainedThisEvent = ((): number => {
          switch (event.stat) {
            case "armour":
              return event.amount;
            default: {
              const exhaustiveStatCheck: never = event.stat;
              return exhaustiveStatCheck;
            }
          }
        })();
        effectFor(event.targetId).armourGained += armourGainedThisEvent;
        break;
      }
      case "DAMAGE":
        if (event.sourceAbilityId !== undefined) {
          effectFor(event.targetId).abilityHpLost += event.amount;
        }
        break;
      case "DROP":
        effectFor(event.characterId).isDropped = true;
        break;
      case "ARMOUR_DAMAGE":
        // A break removes all the armour, so amount is the armour it had.
        if (event.resultingArmour === 0) {
          effectFor(event.targetId).brokenFromArmour = event.amount;
        }
        break;
      default:
        // Most event types are deliberately irrelevant here (no
        // never-guard, unlike the stat switch above).
        break;
    }
  }

  return effectsByCharacterId;
}
