import { describe, it, expect } from "vitest";
import { buildTestCharacter } from "@/test/characterFixtures";
import { buildTestEnemyEncounter } from "@/test/enemyEncounterFixtures";
import { parsePersistedEnemyEncounter } from "./parsePersistedEnemyEncounter";

function doesParseThrow(persistedValue: unknown): boolean {
  try {
    parsePersistedEnemyEncounter(persistedValue);
    return false;
  } catch {
    return true;
  }
}

function buildEnemyCharacters(characterCount: number) {
  return Array.from({ length: characterCount }, (_unused, characterIndex) =>
    buildTestCharacter({ id: `enemy-${characterIndex + 1}` }),
  );
}

describe("parsePersistedEnemyEncounter", () => {
  it("EE1: returns null for null (no battle in progress)", () => {
    expect(parsePersistedEnemyEncounter(null)).toBeNull();
  });

  it("EE2: returns a valid encounter unchanged", () => {
    const persistedEncounter = buildTestEnemyEncounter({
      enemyFactionId: "kobold",
      enemyCharacters: buildEnemyCharacters(2),
      battleSeed: 123456,
    });

    expect(parsePersistedEnemyEncounter(persistedEncounter)).toEqual({
      enemyFactionId: "kobold",
      enemyCharacters: [
        buildTestCharacter({ id: "enemy-1" }),
        buildTestCharacter({ id: "enemy-2" }),
      ],
      battleSeed: 123456,
    });
  });

  it("EE3: throws when the value is not an object or null", () => {
    expect(
      [undefined, "encounter", 7, [], true].map(doesParseThrow),
    ).toEqual([true, true, true, true, true]);
  });

  it("EE4: throws when enemyFactionId is missing, unknown or the wrong type", () => {
    const { enemyFactionId: _removedEnemyFactionId, ...encounterWithoutFaction } =
      buildTestEnemyEncounter();

    expect(
      [
        encounterWithoutFaction,
        { ...buildTestEnemyEncounter(), enemyFactionId: "goblin" },
        { ...buildTestEnemyEncounter(), enemyFactionId: "Kobold" },
        { ...buildTestEnemyEncounter(), enemyFactionId: 1 },
      ].map(doesParseThrow),
    ).toEqual([true, true, true, true]);
  });

  it("EE5: throws when enemyCharacters is missing, empty, longer than seven, or holds an invalid character or a gap", () => {
    const {
      enemyCharacters: _removedEnemyCharacters,
      ...encounterWithoutCharacters
    } = buildTestEnemyEncounter();

    expect(
      [
        encounterWithoutCharacters,
        { ...buildTestEnemyEncounter(), enemyCharacters: [] },
        { ...buildTestEnemyEncounter(), enemyCharacters: buildEnemyCharacters(8) },
        {
          ...buildTestEnemyEncounter(),
          enemyCharacters: [{ ...buildTestCharacter(), armour: -1 }],
        },
        {
          ...buildTestEnemyEncounter(),
          enemyCharacters: [buildTestCharacter({ id: "enemy-1" }), null],
        },
        { ...buildTestEnemyEncounter(), enemyCharacters: "enemies" },
      ].map(doesParseThrow),
    ).toEqual([true, true, true, true, true, true]);
  });

  it("EE6: accepts one to seven enemy characters", () => {
    expect(
      [1, 7]
        .map((characterCount) =>
          buildTestEnemyEncounter({
            enemyCharacters: buildEnemyCharacters(characterCount),
          }),
        )
        .map(doesParseThrow),
    ).toEqual([false, false]);
  });

  it("EE7: throws when battleSeed is missing, negative, fractional, above 2^32 - 1 or the wrong type", () => {
    const { battleSeed: _removedBattleSeed, ...encounterWithoutSeed } =
      buildTestEnemyEncounter();

    expect(
      [
        encounterWithoutSeed,
        { ...buildTestEnemyEncounter(), battleSeed: -1 },
        { ...buildTestEnemyEncounter(), battleSeed: 1.5 },
        { ...buildTestEnemyEncounter(), battleSeed: 4294967296 },
        { ...buildTestEnemyEncounter(), battleSeed: Number.NaN },
        { ...buildTestEnemyEncounter(), battleSeed: "1" },
      ].map(doesParseThrow),
    ).toEqual([true, true, true, true, true, true]);
  });

  it("EE8: accepts battleSeed at 0 and at 2^32 - 1", () => {
    expect(
      [0, 4294967295]
        .map((battleSeed) => buildTestEnemyEncounter({ battleSeed }))
        .map(doesParseThrow),
    ).toEqual([false, false]);
  });
});
