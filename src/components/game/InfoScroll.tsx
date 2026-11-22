"use client";

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Swords,
  HeartCrack,
  Shield,
  ShieldOff,
  Skull,
  Hourglass,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { battleLogMessage } from "@/components/game/battleLogMessage";
import {
  battleLogLinePresentation,
  type BattleLogLineIcon,
} from "@/components/game/battleLogLinePresentation";
import { textHighlightTags } from "@/components/game/textHighlightTags";
import { infoScrollHeader } from "@/components/game/infoScrollHeader";
import type { BattleEventDescriptor } from "@/lib/battle/types";

const BATTLE_LOG_LINE_ICONS: Record<BattleLogLineIcon, LucideIcon> = {
  flag: Flag,
  swords: Swords,
  damage: HeartCrack,
  armour: Shield,
  armourBreak: ShieldOff,
  drop: Skull,
  timeout: Hourglass,
  ability: Sparkles,
};

const ROD_GRADIENT =
  "linear-gradient(to bottom, var(--color-parchment-200), var(--color-parchment-50) 45%, var(--color-parchment-400))";
const ROD_SHADOW = "0 2px 4px rgba(0,0,0,0.35)";

const NAVIGATION_BUTTON_CLASS_NAME =
  "border-ink-700/40 bg-parchment-50 text-ink-700 hover:bg-parchment-200 hover:text-ink-900";

// Lines slide in one after another; the stagger stops growing here so a
// long beat still finishes inside its beat. globals.css → "Battle log
// lines" holds the timing.
const MAX_LOG_LINE_STAGGER_INDEX = 4;

interface InfoScrollProps {
  currentBeatDescriptors: BattleEventDescriptor[];
  onViewPreviousBeat: () => void;
  onViewNextBeat: () => void;
  canViewPrevious: boolean;
  canViewNext: boolean;
  isPlaying: boolean;
  // the turn in effect at the viewed beat, and the viewed beat (Phase 14)
  viewedTurn?: number;
  viewedBeat?: number;
}

export function InfoScroll({
  currentBeatDescriptors,
  onViewPreviousBeat,
  onViewNextBeat,
  canViewPrevious,
  canViewNext,
  isPlaying,
  viewedTurn = 0,
  viewedBeat = 0,
}: InfoScrollProps) {
  const t = useTranslations("battle");
  const translateAbility = useTranslations("ability");
  const translateFaction = useTranslations("faction");
  const header = infoScrollHeader(viewedTurn, currentBeatDescriptors);
  // Beat navigation (Phase 14): pinned to the scroll's bottom corners, out of
  // the content's flow, so the header or a big centred line can't move them.
  // Not rendered at all (not merely transparent) while autoplay runs, and
  // each one only when there is a beat to step to in its direction.
  const isPreviousBeatButtonShown = !isPlaying && canViewPrevious;
  const isNextBeatButtonShown = !isPlaying && canViewNext;
  const isAnyNavigationButtonShown =
    isPreviousBeatButtonShown || isNextBeatButtonShown;

  return (
    <div className="flex h-full flex-col">
      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col bg-parchment-100 p-4"
        data-beat-navigation-shown={isAnyNavigationButtonShown}
        style={{ boxShadow: "inset 0 0 24px rgba(120,90,40,0.35)" }}
      >
        {header.kind !== "hidden" && (
          <div
            data-info-scroll-turn-header={header.kind}
            className="mb-2 border-b border-ink-700/20 pb-2 text-center text-sm font-bold uppercase tracking-wide text-ink-700"
          >
            {header.kind === "turn"
              ? t("turnHeader", { turn: header.turn })
              : t("preBattleHeader")}
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-stretch">
          {currentBeatDescriptors.length > 0 ? (
            <ul
              key={viewedBeat}
              className="min-h-0 flex-1 space-y-1 overflow-y-auto"
            >
              {currentBeatDescriptors.map((currentBeatDescriptor, index) => {
                const message = battleLogMessage(currentBeatDescriptor);
                // Faction words are translated here, at the leaf (Phase 13).
                const messageParams = {
                  ...message.params,
                  ...Object.fromEntries(
                    Object.entries(message.factionParams ?? {}).map(
                      ([paramName, characterFactionId]) => [
                        paramName,
                        translateFaction(`${characterFactionId}.pluralName`),
                      ],
                    ),
                  ),
                };

                const presentation = battleLogLinePresentation(
                  currentBeatDescriptor,
                );
                const LineIcon =
                  presentation.icon === null
                    ? null
                    : BATTLE_LOG_LINE_ICONS[presentation.icon];

                return (
                  <li
                    key={index}
                    data-log-line-icon={presentation.icon ?? undefined}
                    data-log-line-emphasis={presentation.emphasis}
                    data-log-line-side={presentation.markerSide ?? undefined}
                    data-log-line-index={Math.min(
                      index,
                      MAX_LOG_LINE_STAGGER_INDEX,
                    )}
                    style={
                      {
                        "--log-line-index": Math.min(
                          index,
                          MAX_LOG_LINE_STAGGER_INDEX,
                        ),
                      } as React.CSSProperties
                    }
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    {LineIcon !== null && (
                      <LineIcon
                        aria-hidden="true"
                        data-log-line-icon-glyph
                        className="mt-0.5 size-[1em] shrink-0"
                      />
                    )}
                    <span>
                      {message.namespace === "ability"
                        ? translateAbility.rich(message.key, {
                            ...messageParams,
                            ...textHighlightTags(message.characterSides),
                          })
                        : t.rich(message.key, {
                            ...messageParams,
                            ...textHighlightTags(message.characterSides),
                          })}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-700/30">
              —
            </div>
          )}
        </div>

        {isPreviousBeatButtonShown && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onViewPreviousBeat}
            aria-label={t("viewPreviousBeat")}
            data-beat-navigation="previous"
            className={`absolute bottom-2 left-2 ${NAVIGATION_BUTTON_CLASS_NAME}`}
          >
            <ChevronLeft />
          </Button>
        )}
        {isNextBeatButtonShown && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onViewNextBeat}
            aria-label={t("viewNextBeat")}
            data-beat-navigation="next"
            className={`absolute right-2 bottom-2 ${NAVIGATION_BUTTON_CLASS_NAME}`}
          >
            <ChevronRight />
          </Button>
        )}
      </div>

      <div
        className="-mx-1 h-4 rounded-full"
        style={{ background: ROD_GRADIENT, boxShadow: ROD_SHADOW }}
      />
    </div>
  );
}
