import { describe, it, expect } from "vitest";
import { createTranslator, type AbstractIntlMessages } from "next-intl";
import englishMessages from "../../../messages/en.json";
import japaneseMessages from "../../../messages/ja.json";
import {
  CHARACTER_ABILITIES,
  CHARACTER_ABILITY_IDS,
  type CharacterAbility,
} from "@/lib/game/characterAbilities";
import { abilityDescriptionMessages } from "./abilityDescriptionMessages";

function renderAbilityTexts(
  locale: string,
  messages: unknown,
  ability: CharacterAbility,
): string[] {
  const translator = createTranslator({
    locale,
    messages: messages as AbstractIntlMessages,
    namespace: "ability",
    onError: () => {},
    getMessageFallback: ({ namespace, key }) => `MISSING:${namespace}.${key}`,
  });

  // deliberate test-helper rewrite: translate through markup with identity tags (Phase 14)
  // Ability texts carry rich-text highlight tags (Phase 14); markup renders
  // them to a plain string with each tag as an identity, so these tests keep
  // checking the words. Test-only cast for the looser production signature.
  const translateMarkup = translator.markup as (
    key: string,
    values?: Record<string, number | ((chunks: string) => string)>,
  ) => string;
  const translate = (key: string, values: Record<string, number> = {}) =>
    translateMarkup(key, { ...values, number: (chunks) => chunks });

  const { nameKey, summaryKey, levelTexts } = abilityDescriptionMessages(ability);

  return [
    translate(nameKey),
    translate(summaryKey),
    ...levelTexts.map((levelText) => translate(levelText.key, levelText.params)),
  ];
}

describe("abilityDescriptionMessages", () => {
  it("D1: Growing Lad's level params come from its data", () => {
    const fixtureAbility: CharacterAbility = {
      abilityId: "growing-lad",
      trigger: "onExperienceGain",
      extraHpPerExperiencePointByLevel: [2, 4, 6, 8, 10],
    };

    expect(abilityDescriptionMessages(fixtureAbility)).toEqual({
      nameKey: "growing-lad.name",
      summaryKey: "growing-lad.summary",
      levelTexts: [2, 4, 6, 8, 10].map((extraHp) => ({
        key: "growing-lad.levelText",
        params: { extraHp },
      })),
    });
  });

  it("D2: Tighten Those Straps Son's level keys and params come from its data", () => {
    const fixtureAbility: CharacterAbility = {
      abilityId: "tighten-those-straps-son",
      trigger: "onBattleStartBuffs",
      armourGrantedByLevel: [1, 2, 1, 2, 3],
      targetingByLevel: [
        { kind: "alliesAhead", count: 1 },
        { kind: "alliesAhead", count: 2 },
        { kind: "alliesAhead", count: 3 },
        { kind: "alliesAhead", count: 4 },
        { kind: "wholeParty" },
      ],
    };

    expect(abilityDescriptionMessages(fixtureAbility)).toEqual({
      nameKey: "tighten-those-straps-son.name",
      summaryKey: "tighten-those-straps-son.summary",
      levelTexts: [
        {
          key: "tighten-those-straps-son.levelTextAlliesAhead",
          params: { armour: 1, count: 1 },
        },
        {
          key: "tighten-those-straps-son.levelTextAlliesAhead",
          params: { armour: 2, count: 2 },
        },
        {
          key: "tighten-those-straps-son.levelTextAlliesAhead",
          params: { armour: 1, count: 3 },
        },
        {
          key: "tighten-those-straps-son.levelTextAlliesAhead",
          params: { armour: 2, count: 4 },
        },
        {
          key: "tighten-those-straps-son.levelTextWholeParty",
          params: { armour: 3 },
        },
      ],
    });
  });

  // deliberate assertion rewrite: the two kobold abilities join the expected texts (before: growing-lad, tighten-those-straps-son, penny-pincher; after: those plus yip, yip-strike) — Phase 13
  it("D3: renders the real abilities in English", () => {
    expect(
      Object.fromEntries(
        CHARACTER_ABILITY_IDS.map((abilityId) => [
          abilityId,
          renderAbilityTexts("en", englishMessages, CHARACTER_ABILITIES[abilityId]),
        ]),
      ),
    ).toEqual({
      "growing-lad": [
        "Growing Lad",
        "Gain more HP per promotion",
        "Gain an extra +1 HP on promotion",
        "Gain an extra +2 HP on promotion",
        "Gain an extra +3 HP on promotion",
        "Gain an extra +4 HP on promotion",
        "Gain an extra +5 HP on promotion",
      ],
      "tighten-those-straps-son": [
        "Tighten Those Straps Son",
        "Grant armour to allies ahead at the start of battle",
        "Grant +1 armour to the ally 1 ahead",
        "Grant +1 armour to allies up to 2 ahead",
        "Grant +1 armour to allies up to 3 ahead",
        "Grant +1 armour to allies up to 4 ahead",
        "Grant +1 armour to the entire party, including self",
      ],
      "penny-pincher": [
        "Penny Pincher",
        "Scrounge up a little extra gold every camp phase",
        "Gain +1 gold at the start of each camp",
        "Gain +2 gold at the start of each camp",
        "Gain +3 gold at the start of each camp",
        "Gain +4 gold at the start of each camp",
        "Gain +5 gold at the start of each camp",
      ],
      yip: ["Yip!", "Yip!", "Yip!", "Yip!", "Yip!", "Yip!", "Yip!"],
      "yip-strike": [
        "Yip Strike",
        "The silent blade yips best!",
        "Strike a random enemy for 1 damage",
        "Strike a random enemy for 1 damage, 2 times",
        "Strike a random enemy for 1 damage, 3 times",
        "Strike a random enemy for 1 damage, 4 times",
        "Strike a random enemy for 1 damage, 5 times",
      ],
    });
  });

  // deliberate assertion rewrite: the two kobold abilities join the expected texts (before: growing-lad, tighten-those-straps-son, penny-pincher; after: those plus yip, yip-strike) — Phase 13
  it("D4: renders the real abilities in Japanese", () => {
    expect(
      Object.fromEntries(
        CHARACTER_ABILITY_IDS.map((abilityId) => [
          abilityId,
          renderAbilityTexts(
            "ja",
            japaneseMessages,
            CHARACTER_ABILITIES[abilityId],
          ),
        ]),
      ),
    ).toEqual({
      "growing-lad": [
        "育ち盛り",
        "昇格ごとにHPがさらに増える",
        "昇格時、HPがさらに+1",
        "昇格時、HPがさらに+2",
        "昇格時、HPがさらに+3",
        "昇格時、HPがさらに+4",
        "昇格時、HPがさらに+5",
      ],
      "tighten-those-straps-son": [
        "ベルトを締めろ、坊主",
        "戦闘開始時、前方の仲間にアーマーを与える",
        "1つ前の仲間にアーマー+1",
        "2つ前までの仲間にアーマー+1",
        "3つ前までの仲間にアーマー+1",
        "4つ前までの仲間にアーマー+1",
        "自分を含む味方全員にアーマー+1",
      ],
      "penny-pincher": [
        "倹約家",
        "キャンプフェイズごとに少しゴールドをかき集める",
        "キャンプ開始時、ゴールド+1",
        "キャンプ開始時、ゴールド+2",
        "キャンプ開始時、ゴールド+3",
        "キャンプ開始時、ゴールド+4",
        "キャンプ開始時、ゴールド+5",
      ],
      yip: ["キャン！", "キャン！", "キャン！", "キャン！", "キャン！", "キャン！", "キャン！"],
      "yip-strike": [
        "キャン・ストライク",
        "静かな刃ほどよくキャンと鳴く！",
        "ランダムな敵に1ダメージ",
        "ランダムな敵に1ダメージ（2回）",
        "ランダムな敵に1ダメージ（3回）",
        "ランダムな敵に1ダメージ（4回）",
        "ランダムな敵に1ダメージ（5回）",
      ],
    });
  });
});
