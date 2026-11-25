"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/react";
import { useCharacterDisplayName } from "@/components/game/characterDisplayName";
import { Hourglass, Lock } from "lucide-react";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import { spawnCharacterFromTemplate } from "@/lib/game/spawnCharacterFromTemplate";
import { SHOP_CHARACTER_PRICE } from "@/lib/game/shop";
import {
  PLACEHOLDER_SHOP_SECTION_IDS,
  PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS,
  type PlaceholderShopSectionId,
} from "@/lib/game/placeholderShopSections";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { CharacterCard } from "./CharacterCard";
import { CharacterInfoControl } from "./CharacterInfoControl";

// Visual classes come from the presentation state only (plus dimming the
// drag source), never from the native disabled attribute or isSelected
// alone — this keeps click-select and drag from ever presenting a tile
// differently. A character shop slot is never itself a drop target, so
// unlike a roster slot there is no stronger "under the pointer" variant
// here.
function presentationClassName(
  presentation: CampTargetPresentation,
  isEnabled: boolean,
): string {
  switch (presentation) {
    case "held":
      // Drawn by globals.css on [data-camp-target-presentation="held"] —
      // an animated gold ring, distinct from the grey keyboard-focus ring.
      return "";
    case "eligible":
      return "ring-2 ring-dashed ring-emerald-400";
    // A shop tile is never a merge target; this case only keeps the switch
    // exhaustive.
    case "mergeTarget":
      return "ring-2 ring-dashed ring-emerald-400";
    case "ineligible":
      return "opacity-50 cursor-not-allowed";
    case "neutral":
      return isEnabled ? "cursor-pointer" : "cursor-default";
  }
}

// A small gold coin (Phase 16 shop): the price tags' and the price sign's
// mark. Decorative; the price is in text beside it.
function ShopCoin() {
  return <span data-shop-coin aria-hidden="true" />;
}

interface DraggableCharacterShopSlotTileProps {
  shopSlotIndex: number;
  characterTemplate: CharacterTemplate;
  // Whether the player's gold covers the price (canAffordShopCharacter,
  // the buy rule's own check): the price tag turns red when it doesn't.
  isPriceAffordable: boolean;
  isSelected: boolean;
  isEnabled: boolean;
  isDraggable: boolean;
  presentation: CampTargetPresentation;
  onClick: () => void;
  buttonLabel: string;
}

function DraggableCharacterShopSlotTile({
  shopSlotIndex,
  characterTemplate,
  isPriceAffordable,
  isSelected,
  isEnabled,
  isDraggable,
  presentation,
  onClick,
  buttonLabel,
}: DraggableCharacterShopSlotTileProps) {
  const campClickTarget: CampClickTarget = {
    targetKind: "characterShopSlot",
    shopSlotIndex,
  };

  const displayCharacter = spawnCharacterFromTemplate(
    characterTemplate,
    `character-shop-slot-${shopSlotIndex}`,
  );

  const { ref, isDragSource } = useDraggable({
    id: `character-shop-slot-${shopSlotIndex}`,
    data: {
      campClickTarget,
      character: displayCharacter,
    },
    disabled: !isDraggable,
  });

  return (
    // The host wrapper is a sibling-holder, not an interactive element: the
    // info control must never nest inside the button (invalid HTML), so
    // it's rendered here, beside it.
    <div
      data-info-control-host
      data-card-badge-basis="shop"
      data-info-control-revealed={String(isSelected)}
      className="relative"
    >
      <button
        ref={ref}
        type="button"
        aria-label={buttonLabel}
        aria-pressed={isSelected}
        disabled={!isEnabled}
        onClick={onClick}
        data-character-shop-slot-state="offering"
        data-camp-target-presentation={presentation}
        data-card-wash-revealed={String(isSelected)}
        className={`relative block aspect-3/4 w-(--shop-tile-width) rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${presentationClassName(
          presentation,
          isEnabled,
        )} ${isDragSource ? "opacity-40" : ""}`}
        style={{ border: "1px solid var(--shop-slot-open-border)" }}
      >
        <CharacterCard
          character={displayCharacter}
          showLevel
          showInlineExperienceBar
          showRevealWash
        />
      </button>
      {/* The price tag hangs off the card's bottom edge, centred (Phase 16
          shop). Decorative for screen readers: the section's sign states
          the price in text. */}
      <span
        data-shop-price-tag
        data-shop-price-affordable={String(isPriceAffordable)}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 items-center"
      >
        <ShopCoin />
        {SHOP_CHARACTER_PRICE}
      </span>
      <CharacterInfoControl character={displayCharacter} />
    </div>
  );
}

// The padlock for a character shop slot that isn't open yet. Since Phase 16
// the slot shows only the padlock; the label stays for screen readers.
function LockedSlotContents({ label }: { label: string }) {
  return (
    <>
      <Lock aria-hidden="true" data-shop-locked-padlock />
      <span className="sr-only">{label}</span>
    </>
  );
}

type RecessedShopSlotLook = "open" | "locked" | "comingSoon";

// The single overlay label shown across an entire placeholder section
// (equipment, magic, food), rather than per tile.
function ComingSoonLabel() {
  const t = useTranslations("common");

  // One line, never wrapped. On the single-tile Food shelf the label may
  // extend past the tile into the shelf gap; the overlay ignores pointer
  // events, so it's harmless.
  return (
    <div
      data-shop-section-coming-soon
      className="flex items-center gap-2 rounded-md bg-slate-400/80 px-3 py-1.5 whitespace-nowrap text-(length:--shop-coming-soon-font-size) font-medium uppercase tracking-wide text-parchment-200"
    >
      <Hourglass aria-hidden="true" className="size-[1em] shrink-0" />
      {t("shopSectionComingSoonLabel")}
    </div>
  );
}

interface RecessedShopSlotProps {
  dataAttributes: Record<string, string>;
  // "open" (sold or unavailable character slots): reads as an empty socket
  // a card could sit in — lighter, bordered, recessed. "locked" (locked
  // character slots): reads as capped off — flatter, darker, faintly
  // hatched. "comingSoon" (every equipment/magic/food slot): plain and
  // dashed, reads as not built yet rather than locked.
  slotLook: RecessedShopSlotLook;
  children?: ReactNode;
}

const RECESSED_SHOP_SLOT_STYLE_BY_LOOK: Readonly<
  Record<RecessedShopSlotLook, React.CSSProperties>
> = {
  open: {
    background: "var(--shop-slot-open-background)",
    boxShadow: "var(--shadow-recess)",
    border: "1px solid var(--shop-slot-open-border)",
  },
  locked: {
    background: "var(--shop-slot-locked-background)",
    boxShadow: "var(--shop-slot-locked-shadow)",
  },
  comingSoon: {
    background: "var(--shop-slot-coming-soon-background)",
    border: "1px dashed var(--shop-slot-coming-soon-border)",
  },
};

// Shared recessed-tile shell for every non-offering shop slot (sold,
// unavailable or locked character slots; equipment/magic/food placeholder
// slots) so their markup can't drift apart. The caller supplies whichever
// data-* attribute identifies its own slot kind and state, plus its look.
function RecessedShopSlot({
  dataAttributes,
  slotLook,
  children,
}: RecessedShopSlotProps) {
  return (
    <div
      {...dataAttributes}
      className="flex aspect-3/4 w-(--shop-tile-width) flex-col items-center justify-center gap-1 rounded-md p-1.5"
      style={RECESSED_SHOP_SLOT_STYLE_BY_LOOK[slotLook]}
    >
      {children}
    </div>
  );
}

interface ShopSectionProps {
  headingId: string;
  heading: string;
  // Shown on the section's sign beside its name (Phase 16: the Characters
  // section's price).
  signAside?: ReactNode;
  gridClassName: string;
  // One overlay label across the whole section, centred over its tile
  // grid, rather than per tile — used for the "Coming soon" placeholder
  // sections.
  gridOverlay?: ReactNode;
  children: ReactNode;
}

// One named band in the shop (characters, equipment, magic, food). The
// section element gets its accessible name from the heading it points to
// via aria-labelledby, giving it the implicit "region" role tests query by
// name. Each section sizes itself to its own tiles — there is no flex
// share to divide between sections any more.
function ShopSection({
  headingId,
  heading,
  signAside,
  gridClassName,
  gridOverlay,
  children,
}: ShopSectionProps) {
  return (
    <section
      className="flex flex-col gap-(--shop-sign-gap)"
      aria-labelledby={headingId}
    >
      {/* The section's sign (Phase 16 shop): a wooden plank with a gold
          edge, centred over its tiles, in globals.css. */}
      <div data-shop-section-sign className="flex items-center self-center">
        <h3 id={headingId} data-shop-section-name>
          {heading}
        </h3>
        {signAside}
      </div>
      <div className="relative">
        <div className={gridClassName}>{children}</div>
        {gridOverlay && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {gridOverlay}
          </div>
        )}
      </div>
    </section>
  );
}

const PLACEHOLDER_SHOP_SECTION_GRID_CLASS_NAMES: Readonly<
  Record<PlaceholderShopSectionId, string>
> = {
  equipment:
    "grid grid-cols-[repeat(2,var(--shop-tile-width))] grid-rows-2 gap-x-(--shop-tile-gap) gap-y-(--shop-row-gap)",
  magic:
    "grid grid-cols-[repeat(2,var(--shop-tile-width))] grid-rows-2 gap-x-(--shop-tile-gap) gap-y-(--shop-row-gap)",
  food: "grid grid-cols-[repeat(1,var(--shop-tile-width))] grid-rows-2 gap-x-(--shop-tile-gap) gap-y-(--shop-row-gap)",
};

interface ShopPanelProps {
  characterShopSlots: CharacterShopSlots;
  characterTemplates: readonly CharacterTemplate[];
  // canAffordShopCharacter for the player's gold (one price for every
  // character, so one answer for every tag).
  isCharacterPriceAffordable: boolean;
  selectedShopSlotIndex: number | null;
  isShopSlotEnabled: (shopSlotIndex: number) => boolean;
  isShopSlotDraggable: (shopSlotIndex: number) => boolean;
  shopSlotPresentation: (shopSlotIndex: number) => CampTargetPresentation;
  onShopSlotClick: (shopSlotIndex: number) => void;
}

export function ShopPanel({
  characterShopSlots,
  characterTemplates,
  isCharacterPriceAffordable,
  selectedShopSlotIndex,
  isShopSlotEnabled,
  isShopSlotDraggable,
  shopSlotPresentation,
  onShopSlotClick,
}: ShopPanelProps) {
  const t = useTranslations("common");
  const displayCharacterName = useCharacterDisplayName();
  const shopSectionTranslations = useTranslations("shopSection");

  const charactersHeadingId = useId();
  const equipmentHeadingId = useId();
  const magicHeadingId = useId();
  const foodHeadingId = useId();

  const placeholderShopSectionHeadingIds: Readonly<
    Record<PlaceholderShopSectionId, string>
  > = {
    equipment: equipmentHeadingId,
    magic: magicHeadingId,
    food: foodHeadingId,
  };

  return (
    <section className="mx-auto w-fit">
      <div className="flex gap-(--shop-section-gap)">
        <ShopSection
          headingId={charactersHeadingId}
          heading={shopSectionTranslations("characters")}
          signAside={
            <span data-shop-section-price className="flex items-center">
              <ShopCoin />
              {t("shopCharacterPriceEach", { price: SHOP_CHARACTER_PRICE })}
            </span>
          }
          gridClassName="grid grid-cols-[repeat(4,var(--shop-tile-width))] grid-rows-2 gap-x-(--shop-tile-gap) gap-y-(--shop-row-gap)"
        >
          {characterShopSlots.map((characterShopSlot, shopSlotIndex) => {
            if (characterShopSlot.slotState === "sold") {
              return (
                <RecessedShopSlot
                  key={shopSlotIndex}
                  dataAttributes={{ "data-character-shop-slot-state": "sold" }}
                  slotLook="open"
                >
                  <span data-shop-sold-stamp className="select-none">
                    {t("shopListingSoldLabel")}
                  </span>
                </RecessedShopSlot>
              );
            }

            if (characterShopSlot.slotState === "offering") {
              const matchedCharacterTemplate = characterTemplates.find(
                (characterTemplate) =>
                  characterTemplate.characterTemplateId ===
                  characterShopSlot.characterTemplateId,
              );

              if (matchedCharacterTemplate !== undefined) {
                return (
                  <DraggableCharacterShopSlotTile
                    key={shopSlotIndex}
                    shopSlotIndex={shopSlotIndex}
                    characterTemplate={matchedCharacterTemplate}
                    isPriceAffordable={isCharacterPriceAffordable}
                    isSelected={selectedShopSlotIndex === shopSlotIndex}
                    isEnabled={isShopSlotEnabled(shopSlotIndex)}
                    isDraggable={isShopSlotDraggable(shopSlotIndex)}
                    presentation={shopSlotPresentation(shopSlotIndex)}
                    onClick={() => onShopSlotClick(shopSlotIndex)}
                    buttonLabel={t("shopListingButtonLabel", {
                      characterName: displayCharacterName(matchedCharacterTemplate),
                    })}
                  />
                );
              }

              // An offering whose template id matches nothing server-side is
              // treated the same as a recessed tile here — there is nothing
              // buyable to show, but it's deliberately not the "locked"
              // state (no padlock/label): that marker means the slot isn't
              // open yet.
              return (
                <RecessedShopSlot
                  key={shopSlotIndex}
                  dataAttributes={{
                    "data-character-shop-slot-state": "unavailable",
                  }}
                  slotLook="open"
                />
              );
            }

            return (
              <RecessedShopSlot
                key={shopSlotIndex}
                dataAttributes={{ "data-character-shop-slot-state": "locked" }}
                slotLook="locked"
              >
                <LockedSlotContents label={t("shopSlotLockedLabel")} />
              </RecessedShopSlot>
            );
          })}
        </ShopSection>

        {PLACEHOLDER_SHOP_SECTION_IDS.map((placeholderShopSectionId) => (
          <ShopSection
            key={placeholderShopSectionId}
            headingId={
              placeholderShopSectionHeadingIds[placeholderShopSectionId]
            }
            heading={shopSectionTranslations(placeholderShopSectionId)}
            gridClassName={
              PLACEHOLDER_SHOP_SECTION_GRID_CLASS_NAMES[
                placeholderShopSectionId
              ]
            }
            gridOverlay={<ComingSoonLabel />}
          >
            {Array.from({
              length:
                PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS[placeholderShopSectionId],
            }).map((_, placeholderSlotIndex) => (
              <RecessedShopSlot
                key={placeholderSlotIndex}
                dataAttributes={{
                  "data-shop-section-slot-state": "comingSoon",
                }}
                slotLook="comingSoon"
              />
            ))}
          </ShopSection>
        ))}
      </div>
    </section>
  );
}
