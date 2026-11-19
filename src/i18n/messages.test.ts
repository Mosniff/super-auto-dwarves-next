import { describe, it, expect } from "vitest";
import englishMessages from "../../messages/en.json";
import japaneseMessages from "../../messages/ja.json";
import { CHARACTER_CLASS_IDS } from "@/lib/game/characterClasses";
import { PLACEHOLDER_SHOP_SECTION_IDS } from "@/lib/game/placeholderShopSections";
import { CHARACTER_ABILITY_IDS } from "@/lib/game/characterAbilities";
import { CHARACTER_FACTION_IDS } from "@/lib/game/characterFactions";

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
    "autoplayOn",
    "autoplayOff",
    "tagline",
    "play",
    "settings",
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
    "depthLabel",
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
    "shopSlotLockedLabel",
    "shopSectionComingSoonLabel",
    "gemsLabel",
    "levelPill",
    "experienceBarMax",
    "experienceBarLabel",
    "experienceToNextLevel",
    "experienceBarMaxLevel",
    "mergeSellToggle",
    "mergeSellShiftHint",
    "mergeSellModeOnAnnouncement",
    "mergeSellModeOffAnnouncement",
    "repositionLabel",
    "sellLabel",
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
});
