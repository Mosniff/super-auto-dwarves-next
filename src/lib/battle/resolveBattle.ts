import type {
  BattleState,
  BattleEvent,
  BattleEventPayload,
  BeatType,
  ResolvedBattle,
} from "./types";
import type { Character } from "@/lib/game/character";
import type { ChooseRandomIndex } from "@/lib/game/chooseRandomIndex";
import { createSeededChooseRandomIndex } from "@/lib/game/seededRandomSource";
import {
  PLAYER_FACTION_ID,
  type CharacterFactionId,
} from "@/lib/game/characterFactions";
import { findCharacterAbilityForCharacter } from "@/lib/game/characterAbilityLookup";
import { applyEvent } from "./applyEvent";
import { resolveHit } from "./resolveHit";
import {
  BATTLE_START_SUB_PHASES,
  planBattleStartAbility,
  type BattleStartAbilityPlanner,
} from "./battleStartAbilities";

export interface BattleSideFactionIds {
  playerFactionId: CharacterFactionId;
  enemyFactionId: CharacterFactionId;
}

// A fixture convenience only: the camp seam (resolveCampBattle) always
// passes both sides' factions explicitly (Phase 13).
const DEFAULT_BATTLE_SIDE_FACTION_IDS: BattleSideFactionIds = {
  playerFactionId: PLAYER_FACTION_ID,
  enemyFactionId: PLAYER_FACTION_ID,
};

export function resolveBattle(
  playerCharacters: Character[],
  enemyCharacters: Character[],
  maxTurns: number = 20,
  planAbility: BattleStartAbilityPlanner = planBattleStartAbility,
  battleSideFactionIds: BattleSideFactionIds = DEFAULT_BATTLE_SIDE_FACTION_IDS,
  // The battle's seeded random source (Phase 13). The default (seed 0) is
  // a fixture convenience; resolveCampBattle always seeds it from the
  // stored battleSeed, so a re-resolve replays the same battle.
  chooseRandomIndex: ChooseRandomIndex = createSeededChooseRandomIndex(0),
): ResolvedBattle {
  const initialState: BattleState = {
    player: { activeCharacters: playerCharacters, downedCharacters: [] },
    enemy: { activeCharacters: enemyCharacters, downedCharacters: [] },
  };

  const events: BattleEvent[] = [];
  let workingState = initialState;

  let currentBeat = 0;
  let currentBeatType: BeatType = "BATTLE_START";
  const startNewBeat = (beatType: BeatType) => {
    currentBeat += 1;
    currentBeatType = beatType;
  };

  const emitEvent = (eventPayload: BattleEventPayload) => {
    const event: BattleEvent = {
      ...eventPayload,
      beatIndex: currentBeat,
      beatType: currentBeatType,
    };
    events.push(event);
    workingState = applyEvent(workingState, event);
  };

  emitEvent({
    type: "BATTLE_START",
    playerFactionId: battleSideFactionIds.playerFactionId,
    enemyFactionId: battleSideFactionIds.enemyFactionId,
  });

  // Battle-start sub-phases (Phase 12). Simultaneity within a sub-phase:
  // every ability firing in it chooses its targets and amounts from a
  // SNAPSHOT taken at the start of that sub-phase — so two pre-battle
  // archers both fire and both hit, even if one would otherwise have
  // dropped the other first. Actors come from that snapshot (not the
  // current working state) for the same reason: an actor knocked to 0 hp
  // earlier in the same phase still fires. Each acting character gets its
  // own ABILITY beat, and the resulting values in its outcome events are
  // read from the CURRENT working state, so effects stack. Drops are held
  // until every actor in the sub-phase has gone, then all happen together
  // in one DROP beat, player front to back then enemy front to back.
  for (const subPhase of BATTLE_START_SUB_PHASES) {
    const snapshot = workingState;

    const actors = [
      ...snapshot.player.activeCharacters.map((actor, actorIndex) => ({
        actor,
        actorIndex,
        allies: snapshot.player.activeCharacters,
        opponents: snapshot.enemy.activeCharacters,
      })),
      ...snapshot.enemy.activeCharacters.map((actor, actorIndex) => ({
        actor,
        actorIndex,
        allies: snapshot.enemy.activeCharacters,
        opponents: snapshot.player.activeCharacters,
      })),
    ];

    for (const { actor, actorIndex, allies, opponents } of actors) {
      const plan = planAbility({
        subPhase,
        actor,
        actorIndex,
        allies,
        opponents,
        chooseRandomIndex,
      });

      if (plan === null) {
        continue;
      }

      startNewBeat("ABILITY");
      emitEvent({
        type: "ABILITY_ACTIVATE",
        characterId: actor.id,
        abilityId: plan.abilityId,
      });

      for (const effect of plan.effects) {
        const target =
          workingState.player.activeCharacters.find(
            (character) => character.id === effect.targetId,
          ) ??
          workingState.enemy.activeCharacters.find(
            (character) => character.id === effect.targetId,
          );

        // Drops are held until the end of the sub-phase, so targets are
        // present in practice; this guard is defensive.
        if (target === undefined) {
          continue;
        }

        if (effect.effectKind === "statChange") {
          const currentStatValue = ((): number => {
            switch (effect.stat) {
              case "armour":
                return target.armour;
              default: {
                const exhaustiveStatCheck: never = effect.stat;
                return exhaustiveStatCheck;
              }
            }
          })();

          emitEvent({
            type: "STAT_CHANGE",
            targetId: effect.targetId,
            stat: effect.stat,
            amount: effect.amount,
            resultingValue: currentStatValue + effect.amount,
            source: actor.id,
            sourceAbilityId: plan.abilityId,
          });
        } else {
          const hit = resolveHit(target, Math.max(0, effect.amount), actor.id);
          // Damage from an ability carries its id, so the log can use the
          // ability's own line (Phase 13); an armour hit keeps the generic
          // armour line.
          emitEvent(
            hit.type === "DAMAGE"
              ? { ...hit, sourceAbilityId: plan.abilityId }
              : hit,
          );
        }
      }
    }

    const droppedCharacters = [
      ...workingState.player.activeCharacters.filter(
        (character) => character.hp <= 0,
      ),
      ...workingState.enemy.activeCharacters.filter(
        (character) => character.hp <= 0,
      ),
    ];

    if (droppedCharacters.length > 0) {
      startNewBeat("DROP");
      for (const droppedCharacter of droppedCharacters) {
        emitEvent({ type: "DROP", characterId: droppedCharacter.id });
      }
    }
  }

  // The fronts engage (Phase 12): its own beat after every battle-start
  // ability and before turn 1, so the opening reads prepare → abilities →
  // clash. No state change. Skipped when a side has no fighters, as the
  // turn loop would be.
  if (
    workingState.player.activeCharacters.length > 0 &&
    workingState.enemy.activeCharacters.length > 0
  ) {
    startNewBeat("ENGAGE");
    emitEvent({ type: "FRONTS_ENGAGE" });
  }

  let currentTurn = 1;

  while (
    workingState.player.activeCharacters.length > 0 &&
    workingState.enemy.activeCharacters.length > 0 &&
    currentTurn <= maxTurns
  ) {
    startNewBeat("TURN_START");
    emitEvent({ type: "TURN_START", turn: currentTurn });
    currentTurn += 1;

    // Turn-start abilities (Phase 13, Yip!): every active character with an
    // onTurnStart ability gets its own short beat, bench included, player
    // front to back then enemy front to back (the human's calls). Yip! is
    // only its log line and caster pulse, so nothing here changes state
    // yet; the first onTurnStart ability with an effect will need the
    // battle-start sub-phases' snapshot and held drops.
    const turnStartActors = [
      ...workingState.player.activeCharacters,
      ...workingState.enemy.activeCharacters,
    ];
    for (const turnStartActor of turnStartActors) {
      const turnStartAbility = findCharacterAbilityForCharacter(turnStartActor);
      if (turnStartAbility?.trigger !== "onTurnStart") {
        continue;
      }

      startNewBeat("TURN_START_ABILITY");
      emitEvent({
        type: "ABILITY_ACTIVATE",
        characterId: turnStartActor.id,
        abilityId: turnStartAbility.abilityId,
      });
    }

    const playerFrontCharacter = workingState.player.activeCharacters[0];
    const enemyFrontCharacter = workingState.enemy.activeCharacters[0];

    const playerDamageValue = Math.max(0, playerFrontCharacter.attack);
    const enemyDamageValue = Math.max(0, enemyFrontCharacter.attack);

    startNewBeat("CLASH");
    emitEvent({
      type: "ATTACK",
      attackerId: playerFrontCharacter.id,
      targetId: enemyFrontCharacter.id,
      value: playerDamageValue,
    });
    emitEvent({
      type: "ATTACK",
      attackerId: enemyFrontCharacter.id,
      targetId: playerFrontCharacter.id,
      value: enemyDamageValue,
    });

    const hitOnEnemy = resolveHit(
      enemyFrontCharacter,
      playerDamageValue,
      playerFrontCharacter.id,
    );
    const hitOnPlayer = resolveHit(
      playerFrontCharacter,
      enemyDamageValue,
      enemyFrontCharacter.id,
    );

    emitEvent(hitOnEnemy);
    emitEvent(hitOnPlayer);

    const enemyDrops =
      hitOnEnemy.type === "DAMAGE" && hitOnEnemy.resultingHp <= 0;
    const playerDrops =
      hitOnPlayer.type === "DAMAGE" && hitOnPlayer.resultingHp <= 0;

    if (enemyDrops || playerDrops) {
      startNewBeat("DROP");
    }
    if (enemyDrops) {
      emitEvent({ type: "DROP", characterId: enemyFrontCharacter.id });
    }
    if (playerDrops) {
      emitEvent({ type: "DROP", characterId: playerFrontCharacter.id });
    }
  }

  const playerWipedOut = workingState.player.activeCharacters.length === 0;
  const enemyWipedOut = workingState.enemy.activeCharacters.length === 0;

  const outcome =
    playerWipedOut && enemyWipedOut
      ? "draw"
      : enemyWipedOut
        ? "playerWin"
        : playerWipedOut
          ? "enemyWin"
          : "draw";

  const cappedInStalemate =
    currentTurn > maxTurns && !playerWipedOut && !enemyWipedOut;

  if (cappedInStalemate) {
    startNewBeat("TIMEOUT");
    emitEvent({ type: "TIMEOUT" });
  }

  startNewBeat("BATTLE_END");
  emitEvent({ type: "BATTLE_END", outcome });

  return { initialState, events };
}
