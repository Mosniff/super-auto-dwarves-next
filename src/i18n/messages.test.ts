import { describe, it, expect } from "vitest";
import englishMessages from "../../messages/en.json";
import japaneseMessages from "../../messages/ja.json";
import { CHARACTER_CLASS_IDS } from "@/lib/game/characterClasses";
import { PLACEHOLDER_SHOP_SECTION_IDS } from "@/lib/game/placeholderShopSections";
import { CHARACTER_ABILITY_IDS } from "@/lib/game/characterAbilities";
import { CHARACTER_FACTION_IDS } from "@/lib/game/characterFactions";
import { listCharacterTemplates } from "@/lib/game/characterTemplates";

describe("locale message parity", () => {
  // Extended when the battle-log control buttons (Advance, Autoplay: On/Off)
  // and the menu page / game header (tagline, play, settings, menu, language)
  // were internationalized, again for the CharacterCard downed overlay and
  // the localized metadata title (downed, appTitle), again for the
  // DiscardPile footprint label and the RosterSlot empty-slot/on-deck
  // labels (empty, next), and again for the saves page's SaveSlab (noSavedGame,
  // newGame, resume, delete, cancel, startedOn, dayLabel, phaseCamp,
  // phaseBattle, deleteSaveTitle, deleteSaveDescription), and again for the
  // (menu) route group's Back button on the saves page (back), and again
  // for the /play camp screen (toBattle, returnToCamp, goldLabel), and
  // again for the Phase 8 camp shop and clickable roster slots
  // (shopListingSoldLabel, shopListingButtonLabel,
  // rosterSlotOccupiedLabel, rosterSlotEmptyLabel), and dummyBattleLabel
  // was removed when Phase 8 connected the battle to the saved roster, and
  // again for Phase 9's locked shop slot label (shopSlotLockedLabel), and
  // again for the shopSection namespace naming the character/equipment/
  // magic/food shop sections, and again for the "Coming soon" label shown
  // across the equipment/magic/food placeholder sections, and again for
  // the header's placeholder gem counter (gemsLabel), and again for
  // Phase 11's level pill and XP bar MAX label (levelPill,
  // experienceBarMax), and again for the XP bar's label and caption
  // (experienceBarLabel, experienceToNextLevel, experienceBarMaxLevel), and
  // again for Phase 11's merge/sell toggle, hint and mode announcements
  // (mergeSellToggle, mergeSellHint, mergeSellModeOnAnnouncement,
  // mergeSellModeOffAnnouncement), and repositionLabel for the toggle's
  // left side, and sellLabel for the sell box; mergeSellHint was replaced
  // by mergeSellShiftHint, a sub-label on the toggle, and again for the
  // roster animation floaters, and again for Phase 12's armour
  // (armourLabel for the card's shield, armourDamage and armourBreak for
  // the battle log), and again for Phase 12's ability namespace (ability
  // name, summary and level texts, keyed by ability id), and close for the
  // expanded-card dialog's close button, and characterInfoLabel for the
  // info control, and abilityLabel for the expanded card's Ability tab,
  // and abilityHpFloater for the ability-hp promotion floater, and
  // battleCry/targetEffect for an ability's battle-log lines, and
  // armourGainFloater/armourBreakFloater for battle beat floaters, and
  // Phase 12 step 10b-2: abilityGoldFloater (the start-of-camp "+X gold"
  // floater), and Phase 12 step 11a: frontsEngage, the engage beat's log
  // line, and Phase 13's card label (characterTypeLabel,
  // characterClassSeparator), Phase 13's header depth (depthLabel), and
  // Phase 13's game over (continue, gameOverTitle, gameOverSummary,
  // returnToMenu) — deliberate test-data updates, not a weakening.
  const expectedCommonKeys = [
    "appName",
    "advance",
    // deliberate test-data update: the autoplay toggle became a labelled Off / Slow / Fast control (Phase 14)
    "battleAutoplayLabel",
    "autoplaySpeedOff",
    "autoplaySpeedSlow",
    "autoplaySpeedFast",
    "tagline",
    "play",
    // deliberate test-data update: the menu's Settings button became How to Play, with a "Coming soon" dialog (Phase 15)
    // deliberate test-data update: the dialog's "Coming soon" became the guide, in its own howToPlay namespace (before: howToPlay, howToPlayComingSoon; after: howToPlay) — Phase 15
    "howToPlay",
    // deliberate test-data update: the error and not-found pages (Phase 15)
    "errorPageTitle",
    "errorPageDescription",
    "errorPageTryAgain",
    "notFoundPageTitle",
    "notFoundPageDescription",
    "statusPageBackToMenu",
    "menu",
    "language",
    "downed",
    "appTitle",
    "empty",
    "next",
    "noSavedGame",
    "newGame",
    "resume",
    "delete",
    "cancel",
    "startedOn",
    "dayLabel",
    // deliberate test-data update: the header shows only the day, so the depth and the placeholder gem count went with their keys (Phase 16; before: depthLabel here and gemsLabel below)
    "phaseCamp",
    "phaseBattle",
    "deleteSaveTitle",
    "deleteSaveDescription",
    "back",
    "toBattle",
    "returnToCamp",
    "continue",
    "gameOverTitle",
    "gameOverSummary",
    "returnToMenu",
    "goldLabel",
    "shopListingSoldLabel",
    "shopListingButtonLabel",
    "rosterSlotOccupiedLabel",
    "rosterSlotEmptyLabel",
    // deliberate test-data update: the split drop zones' labels (Phase 16)
    "rosterSlotSwapZoneLabel",
    "rosterSlotMergeZoneLabel",
    "swapPositionZoneText",
    "shopSlotLockedLabel",
    "shopSectionComingSoonLabel",
    "levelPill",
    "experienceBarMax",
    "experienceBarLabel",
    "experienceToNextLevel",
    "experienceBarMaxLevel",
    // deliberate test-data update: the merge/sell toggle, its Shift hint, its announcements, its Reposition side and the sell box were replaced by split drop zones and the money pile (before: mergeSellToggle, mergeSellShiftHint, mergeSellModeOnAnnouncement, mergeSellModeOffAnnouncement, repositionLabel, sellLabel) — Phase 16
    "moneyPileSellPrompt",
    "moneyPileSellLabel",
    "experienceGainFloater",
    "levelUpFloater",
    "sellGoldFloater",
    "abilityGoldFloater",
    "armourLabel",
    "close",
    "characterInfoLabel",
    "abilityLabel",
    "abilityHpFloater",
    "characterTypeLabel",
    "characterClassSeparator",
  ];
  const expectedBattleKeys = [
    "battleStart",
    "frontsEngage",
    "turnStart",
    // deliberate test-data update: the info-scroll turn header (Phase 14)
    "turnHeader",
    "preBattleHeader",
    // deliberate test-data update: accessible names for the scroll's beat-navigation buttons (Phase 14)
    "viewPreviousBeat",
    "viewNextBeat",
    "attack",
    "damage",
    "drop",
    "timeout",
    "victory",
    "defeat",
    "draw",
    "armourDamage",
    "armourBreak",
    "armourGainFloater",
    "armourBreakFloater",
    "abilityHpLossFloater",
    // deliberate test-data update: the info scroll's "Battle!" opening and the matchup's "vs" (Phase 15)
    "battleTitle",
    "matchupVersus",
  ];

  it("english has exactly the expected common keys", () => {
    expect(Object.keys(englishMessages.common).sort()).toEqual(
      [...expectedCommonKeys].sort(),
    );
  });

  it("japanese has exactly the expected common keys", () => {
    expect(Object.keys(japaneseMessages.common).sort()).toEqual(
      [...expectedCommonKeys].sort(),
    );
  });

  it("english has exactly the expected battle keys", () => {
    expect(Object.keys(englishMessages.battle).sort()).toEqual(
      [...expectedBattleKeys].sort(),
    );
  });

  it("japanese has exactly the expected battle keys", () => {
    expect(Object.keys(japaneseMessages.battle).sort()).toEqual(
      [...expectedBattleKeys].sort(),
    );
  });

  it("english and japanese have identical top-level namespace keys", () => {
    expect(Object.keys(englishMessages).sort()).toEqual(
      Object.keys(japaneseMessages).sort(),
    );
  });

  it("english and japanese have identical common keys", () => {
    expect(Object.keys(englishMessages.common).sort()).toEqual(
      Object.keys(japaneseMessages.common).sort(),
    );
  });

  it("HP1: english and japanese have identical howToPlay keys", () => {
    expect(Object.keys(englishMessages.howToPlay).sort()).toEqual(
      Object.keys(japaneseMessages.howToPlay).sort(),
    );
  });

  it("english and japanese have identical battle keys", () => {
    expect(Object.keys(englishMessages.battle).sort()).toEqual(
      Object.keys(japaneseMessages.battle).sort(),
    );
  });

  // Checked against the real class list, so adding a class without
  // translating it fails here rather than silently falling back.
  it("english has exactly the character class keys", () => {
    expect(
      Object.keys(
        (
          englishMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).characterClass ?? {},
      ).sort(),
    ).toEqual([...CHARACTER_CLASS_IDS].sort());
  });

  it("japanese has exactly the character class keys", () => {
    expect(
      Object.keys(
        (
          japaneseMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).characterClass ?? {},
      ).sort(),
    ).toEqual([...CHARACTER_CLASS_IDS].sort());
  });

  // Checked against "characters" plus the real locked-section list, so
  // adding a section without translating it fails here rather than
  // silently falling back.
  it("english has exactly the shopSection keys", () => {
    expect(
      Object.keys(
        (
          englishMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).shopSection ?? {},
      ).sort(),
    ).toEqual(["characters", ...PLACEHOLDER_SHOP_SECTION_IDS].sort());
  });

  it("japanese has exactly the shopSection keys", () => {
    expect(
      Object.keys(
        (
          japaneseMessages as unknown as Record<
            string,
            Record<string, string> | undefined
          >
        ).shopSection ?? {},
      ).sort(),
    ).toEqual(["characters", ...PLACEHOLDER_SHOP_SECTION_IDS].sort());
  });

  // Following the characterClass tests' cast pattern for reading a
  // namespace.
  it("M1: both locales have an ability entry for exactly the ability ids", () => {
    expect({
      english: Object.keys(
        (
          englishMessages as unknown as Record<
            string,
            Record<string, unknown> | undefined
          >
        ).ability ?? {},
      ).sort(),
      japanese: Object.keys(
        (
          japaneseMessages as unknown as Record<
            string,
            Record<string, unknown> | undefined
          >
        ).ability ?? {},
      ).sort(),
    }).toEqual({
      english: [...CHARACTER_ABILITY_IDS].sort(),
      japanese: [...CHARACTER_ABILITY_IDS].sort(),
    });
  });

  // deliberate assertion rewrite: the two kobold abilities join both locales' expected keys (before: growing-lad, tighten-those-straps-son, penny-pincher; after: those plus yip, yip-strike) — Phase 13
  it("M2: each ability has exactly its expected keys in both locales", () => {
    function abilityKeysByLocale(
      messages: unknown,
    ): [string, string[]][] {
      const abilityNamespace = (
        messages as Record<string, Record<string, Record<string, string>> | undefined>
      ).ability;

      return CHARACTER_ABILITY_IDS.map((abilityId) => [
        abilityId,
        Object.keys(abilityNamespace?.[abilityId] ?? {}).sort(),
      ]);
    }

    expect({
      english: abilityKeysByLocale(englishMessages),
      japanese: abilityKeysByLocale(japaneseMessages),
    }).toEqual({
      english: [
        ["growing-lad", ["levelText", "name", "summary"]],
        [
          "tighten-those-straps-son",
          [
            "battleCry",
            "levelTextAlliesAhead",
            "levelTextWholeParty",
            "name",
            "summary",
            "targetEffect",
          ],
        ],
        ["penny-pincher", ["levelText", "name", "summary"]],
        ["yip", ["battleCry", "levelText", "name", "summary"]],
        [
          "yip-strike",
          ["battleCry", "levelText", "name", "summary", "targetEffect"],
        ],
      ],
      japanese: [
        ["growing-lad", ["levelText", "name", "summary"]],
        [
          "tighten-those-straps-son",
          [
            "battleCry",
            "levelTextAlliesAhead",
            "levelTextWholeParty",
            "name",
            "summary",
            "targetEffect",
          ],
        ],
        ["penny-pincher", ["levelText", "name", "summary"]],
        ["yip", ["battleCry", "levelText", "name", "summary"]],
        [
          "yip-strike",
          ["battleCry", "levelText", "name", "summary", "targetEffect"],
        ],
      ],
    });
  });

  // Checked against the real faction list, so adding a faction without
  // translating it fails here (Phase 13).
  it("FA1: both locales have a faction entry for exactly the faction ids", () => {
    function factionIds(messages: unknown): string[] {
      return Object.keys(
        (messages as Record<string, Record<string, unknown> | undefined>)
          .faction ?? {},
      ).sort();
    }

    expect({
      english: factionIds(englishMessages),
      japanese: factionIds(japaneseMessages),
    }).toEqual({
      english: [...CHARACTER_FACTION_IDS].sort(),
      japanese: [...CHARACTER_FACTION_IDS].sort(),
    });
  });

  it("FA2: each faction has exactly a name and a pluralName in both locales", () => {
    function factionKeysByLocale(messages: unknown): [string, string[]][] {
      const factionNamespace = (
        messages as Record<
          string,
          Record<string, Record<string, string>> | undefined
        >
      ).faction;

      return CHARACTER_FACTION_IDS.map((characterFactionId) => [
        characterFactionId,
        Object.keys(factionNamespace?.[characterFactionId] ?? {}).sort(),
      ]);
    }

    expect({
      english: factionKeysByLocale(englishMessages),
      japanese: factionKeysByLocale(japaneseMessages),
    }).toEqual({
      english: [
        ["dwarf", ["name", "pluralName"]],
        ["kobold", ["name", "pluralName"]],
      ],
      japanese: [
        ["dwarf", ["name", "pluralName"]],
        ["kobold", ["name", "pluralName"]],
      ],
    });
  });

  // Every real template must have a display name in both locales, so a new
  // character can't ship without one (Phase 13).
  it("CN1: both locales name exactly every template, each with a non-empty name", () => {
    function namedTemplateIds(messages: unknown): [string, boolean][] {
      const characterNameNamespace =
        (messages as Record<string, Record<string, unknown> | undefined>)
          .characterName ?? {};

      return Object.keys(characterNameNamespace)
        .sort()
        .map((characterTemplateId) => {
          const characterName = characterNameNamespace[characterTemplateId];
          return [
            characterTemplateId,
            typeof characterName === "string" && characterName.length > 0,
          ];
        });
    }

    const expectedNamedTemplateIds = listCharacterTemplates()
      .map((characterTemplate) => characterTemplate.characterTemplateId)
      .sort()
      .map((characterTemplateId): [string, boolean] => [
        characterTemplateId,
        true,
      ]);

    expect({
      english: namedTemplateIds(englishMessages),
      japanese: namedTemplateIds(japaneseMessages),
    }).toEqual({
      english: expectedNamedTemplateIds,
      japanese: expectedNamedTemplateIds,
    });
  });

  // deliberate assertion rewrite: the kobolds' names join both locales (before: borin, ogden, norbin; after: those plus kobold-runt, kobold-thief; renamed from "the dwarves' names … katakana in Japanese") — Phase 13
  it("CN2: the characters' names are the human's (English, and Japanese)", () => {
    expect({
      english: (englishMessages as unknown as Record<string, unknown>)
        .characterName,
      japanese: (japaneseMessages as unknown as Record<string, unknown>)
        .characterName,
    }).toEqual({
      english: {
        borin: "Borin",
        ogden: "Ogden",
        norbin: "Norbin",
        "kobold-runt": "Kobold Runt",
        "kobold-thief": "Kobold Thief",
      },
      japanese: {
        borin: "ボリン",
        ogden: "オグデン",
        norbin: "ノービン",
        "kobold-runt": "コボルドの小僧",
        "kobold-thief": "コボルドの盗賊",
      },
    });
  });
});

describe("rich-text highlight tags", () => {
  const HIGHLIGHT_TAG_NAMES = [
    "attackerName",
    "targetName",
    "characterName",
    "number",
  ];
  // characterTypeLabel's slot tags (Phase 13), and strong for the How to
  // Play guide's bold lead-ins (Phase 15), the only other tags in use.
  // deliberate test-data update: strong joins the known tags for the How to Play guide (before: highlight tags, faction, classes; after: those plus strong) — Phase 15
  const KNOWN_TAG_NAMES = [
    ...HIGHLIGHT_TAG_NAMES,
    "faction",
    "classes",
    "strong",
  ];
  const CHARACTER_NAME_PLACEHOLDER_NAMES = ["attacker", "target", "character"];
  const VALUE_PLACEHOLDER_NAMES = [
    "amount",
    "resultingHp",
    "extraHp",
    "armour",
    "gold",
    "damage",
    "count",
  ];
  // Rendered as plain text (t(), not t.rich), so they must carry no tags.
  const PLAIN_TEXT_BATTLE_KEYS = [
    "armourGainFloater",
    "armourBreakFloater",
    "abilityHpLossFloater",
  ];
  const messagesByLocale: Record<string, Record<string, unknown>> = {
    en: englishMessages,
    ja: japaneseMessages,
  };

  function flattenMessages(
    messages: unknown,
    pathPrefix = "",
  ): [string, string][] {
    if (typeof messages === "string") return [[pathPrefix, messages]];
    return Object.entries(messages as Record<string, unknown>).flatMap(
      ([key, value]) =>
        flattenMessages(value, pathPrefix === "" ? key : `${pathPrefix}.${key}`),
    );
  }

  // Battle-log and ability-description messages: battle minus the floaters,
  // ability minus the names.
  function richTextMessages(locale: string): [string, string][] {
    const messages = messagesByLocale[locale];
    return [
      ...flattenMessages(messages.battle, "battle").filter(
        ([path]) =>
          !PLAIN_TEXT_BATTLE_KEYS.some(
            (plainTextKey) => path === `battle.${plainTextKey}`,
          ),
      ),
      ...flattenMessages(messages.ability, "ability").filter(
        ([path]) => !path.endsWith(".name"),
      ),
    ];
  }

  function tagNamesIn(message: string): string[] {
    return [
      ...new Set(
        [...message.matchAll(/<\/?([A-Za-z][\w-]*)>/g)].map(
          (match) => match[1],
        ),
      ),
    ].sort();
  }

  it("HT1: every tag in either locale is a known tag", () => {
    const unknownTags = Object.keys(messagesByLocale).flatMap((locale) =>
      flattenMessages(messagesByLocale[locale]).flatMap(([path, message]) =>
        tagNamesIn(message)
          .filter((tagName) => !KNOWN_TAG_NAMES.includes(tagName))
          .map((tagName) => `${locale}:${path}:${tagName}`),
      ),
    );

    expect(unknownTags).toEqual([]);
  });

  it("HT2: each message uses the same tags in both locales", () => {
    const japaneseMessagesByPath = new Map(flattenMessages(japaneseMessages));
    const mismatchingPaths = flattenMessages(englishMessages)
      .filter(
        ([path, englishMessage]) =>
          JSON.stringify(tagNamesIn(englishMessage)) !==
          JSON.stringify(tagNamesIn(japaneseMessagesByPath.get(path) ?? "")),
      )
      .map(([path]) => path);

    expect(mismatchingPaths).toEqual([]);
  });

  it("HT3: every character-name placeholder is wrapped in its own tag", () => {
    const unwrappedPlaceholders = Object.keys(messagesByLocale).flatMap(
      (locale) =>
        richTextMessages(locale).flatMap(([path, message]) =>
          CHARACTER_NAME_PLACEHOLDER_NAMES.filter(
            (placeholderName) =>
              message.split(`{${placeholderName}}`).length !==
              message.split(
                `<${placeholderName}Name>{${placeholderName}}</${placeholderName}Name>`,
              ).length,
          ).map((placeholderName) => `${locale}:${path}:${placeholderName}`),
        ),
    );

    expect(unwrappedPlaceholders).toEqual([]);
  });

  it("HT4: every game-value placeholder sits inside a number tag", () => {
    const untaggedValuePlaceholders = Object.keys(messagesByLocale).flatMap(
      (locale) =>
        richTextMessages(locale).flatMap(([path, message]) => {
          const messageOutsideNumberTags = message.replace(
            /<number>[\s\S]*?<\/number>/g,
            "",
          );
          return VALUE_PLACEHOLDER_NAMES.filter((placeholderName) =>
            messageOutsideNumberTags.includes(`{${placeholderName}}`),
          ).map((placeholderName) => `${locale}:${path}:${placeholderName}`);
        }),
    );

    expect(untaggedValuePlaceholders).toEqual([]);
  });

  it("HT5: plain-text messages (floaters, ability names) carry no tags", () => {
    const taggedPlainTextMessages = Object.keys(messagesByLocale).flatMap(
      (locale) => {
        const messages = messagesByLocale[locale];
        return [
          ...flattenMessages(messages.battle, "battle").filter(([path]) =>
            PLAIN_TEXT_BATTLE_KEYS.some(
              (plainTextKey) => path === `battle.${plainTextKey}`,
            ),
          ),
          ...flattenMessages(messages.ability, "ability").filter(([path]) =>
            path.endsWith(".name"),
          ),
        ]
          .filter(([, message]) => tagNamesIn(message).length > 0)
          .map(([path]) => `${locale}:${path}`);
      },
    );

    expect(taggedPlainTextMessages).toEqual([]);
  });
});
