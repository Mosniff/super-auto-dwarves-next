import type { BattleEvent, BeatType } from "./types";

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
  // armour lost to hits this beat, from any source (ability or clash),
  // including a breaking hit (Phase 15). Bench cards never clash, so for
  // them it is always ability damage; it drives their steel hit flash.
  armourLost: number;
  // it acted this beat and its ability hit someone (Phase 15): an
  // attacking caster, which hops toward the enemy; a supporting caster
  // (buffs only) and a clash attacker are false
  dealsAbilityHit: boolean;
  // it dropped this beat (Phase 13): a bench card leaving because of a
  // drop plays the drop, not the slide or the front's launch
  isDropped: boolean;
}

// What the battle screen hands down to its cards (Phase 12); beatKey is
// the playback beat, so per-beat animations replay.
export interface CurrentBeatEffects {
  beatKey: number;
  characterEffects: Readonly<Record<string, BeatCharacterEffect>>;
  // the beat's type, for its caster pulse speed (Phase 13)
  beatType: BeatType | undefined;
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
      armourLost: 0,
      dealsAbilityHit: false,
      isDropped: false,
    };
    effectsByCharacterId[characterId] = createdEffect;
    return createdEffect;
  }

  const hitCountsBySourceId: Record<string, number> = {};

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
        hitCountsBySourceId[event.source] =
          (hitCountsBySourceId[event.source] ?? 0) + 1;
        if (event.sourceAbilityId !== undefined) {
          effectFor(event.targetId).abilityHpLost += event.amount;
        }
        break;
      case "DROP":
        effectFor(event.characterId).isDropped = true;
        break;
      case "ARMOUR_DAMAGE":
        hitCountsBySourceId[event.source] =
          (hitCountsBySourceId[event.source] ?? 0) + 1;
        // Every hit on armour counts as armour lost, partial absorbs and
        // breaks alike (Phase 15).
        effectFor(event.targetId).armourLost += event.amount;
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

  // Decided after every event is read (order-independent); only
  // characters already in the summary are marked, so being a hit's source
  // alone adds no entry.
  for (const [characterId, effect] of Object.entries(effectsByCharacterId)) {
    effect.dealsAbilityHit =
      effect.isActing && (hitCountsBySourceId[characterId] ?? 0) > 0;
  }

  return effectsByCharacterId;
}
