"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/react";
import { Lock } from "lucide-react";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import { spawnCharacterFromTemplate } from "@/lib/game/spawnCharacterFromTemplate";
import {
  LOCKED_SHOP_SECTION_IDS,
  LOCKED_SHOP_SECTION_SLOT_COUNTS,
  type LockedShopSectionId,
} from "@/lib/game/lockedShopSections";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { CharacterCard } from "./CharacterCard";

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
      return "ring-2 ring-ring";
    case "eligible":
      return "ring-2 ring-dashed ring-emerald-400";
    case "ineligible":
      return "opacity-50 cursor-not-allowed";
    case "neutral":
      return isEnabled ? "cursor-pointer" : "cursor-default";
  }
}

interface DraggableCharacterShopSlotTileProps {
  shopSlotIndex: number;
  characterTemplate: CharacterTemplate;
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
    <button
      ref={ref}
      type="button"
      aria-label={buttonLabel}
      aria-pressed={isSelected}
      disabled={!isEnabled}
      onClick={onClick}
      data-character-shop-slot-state="offering"
      data-camp-target-presentation={presentation}
      className={`block aspect-3/4 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${presentationClassName(
        presentation,
        isEnabled,
      )} ${isDragSource ? "opacity-40" : ""}`}
    >
      <CharacterCard character={displayCharacter} />
    </button>
  );
}

// Shared padlock + label markup for any permanently locked recessed slot —
// character shop slots not yet open, and every slot in the placeholder
// equipment/magic/food sections.
function LockedSlotContents({ label }: { label: string }) {
  return (
    <>
      <Lock aria-hidden="true" className="h-4 w-4 text-slate-50/30" />
      <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
        {label}
      </span>
    </>
  );
}

interface RecessedShopSlotProps {
  dataAttributes: Record<string, string>;
  children?: ReactNode;
}

// Shared recessed-tile shell for every non-offering shop slot (sold,
// unavailable or locked character slots; locked placeholder-section
// slots) so their markup can't drift apart. The caller supplies whichever
// data-* attribute identifies its own slot kind and state.
function RecessedShopSlot({ dataAttributes, children }: RecessedShopSlotProps) {
  return (
    <div
      {...dataAttributes}
      className="flex aspect-3/4 flex-1 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5"
      style={{ boxShadow: "var(--shadow-recess)" }}
    >
      {children}
    </div>
  );
}

interface ShopSectionProps {
  headingId: string;
  heading: string;
  gridClassName: string;
  flexClassName: string;
  children: ReactNode;
}

// One named band in the shop (characters, equipment, magic, food). The
// section element gets its accessible name from the heading it points to
// via aria-labelledby, giving it the implicit "region" role tests query by
// name.
function ShopSection({
  headingId,
  heading,
  gridClassName,
  flexClassName,
  children,
}: ShopSectionProps) {
  return (
    <section
      className={`flex flex-col gap-2 ${flexClassName}`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-sm font-semibold">
        {heading}
      </h3>
      <div className={gridClassName}>{children}</div>
    </section>
  );
}

const LOCKED_SHOP_SECTION_GRID_CLASS_NAMES: Readonly<
  Record<LockedShopSectionId, string>
> = {
  equipment: "grid grid-cols-2 grid-rows-2 gap-3",
  magic: "grid grid-cols-2 grid-rows-2 gap-3",
  food: "grid grid-cols-1 grid-rows-2 gap-3",
};

const LOCKED_SHOP_SECTION_FLEX_CLASS_NAMES: Readonly<
  Record<LockedShopSectionId, string>
> = {
  equipment: "flex-[2]",
  magic: "flex-[2]",
  food: "flex-[1]",
};

interface ShopPanelProps {
  characterShopSlots: CharacterShopSlots;
  characterTemplates: readonly CharacterTemplate[];
  selectedShopSlotIndex: number | null;
  isShopSlotEnabled: (shopSlotIndex: number) => boolean;
  isShopSlotDraggable: (shopSlotIndex: number) => boolean;
  shopSlotPresentation: (shopSlotIndex: number) => CampTargetPresentation;
  onShopSlotClick: (shopSlotIndex: number) => void;
}

export function ShopPanel({
  characterShopSlots,
  characterTemplates,
  selectedShopSlotIndex,
  isShopSlotEnabled,
  isShopSlotDraggable,
  shopSlotPresentation,
  onShopSlotClick,
}: ShopPanelProps) {
  const t = useTranslations("common");
  const shopSectionTranslations = useTranslations("shopSection");

  const charactersHeadingId = useId();
  const equipmentHeadingId = useId();
  const magicHeadingId = useId();
  const foodHeadingId = useId();

  const lockedShopSectionHeadingIds: Readonly<
    Record<LockedShopSectionId, string>
  > = {
    equipment: equipmentHeadingId,
    magic: magicHeadingId,
    food: foodHeadingId,
  };

  return (
    <section className="w-full max-w-5xl">
      <h2 className="mb-2 text-lg font-bold">{t("shopHeading")}</h2>
      <div className="flex gap-6">
        <ShopSection
          headingId={charactersHeadingId}
          heading={shopSectionTranslations("characters")}
          gridClassName="grid grid-cols-4 grid-rows-2 gap-3"
          flexClassName="flex-[4]"
        >
          {characterShopSlots.map((characterShopSlot, shopSlotIndex) => {
            if (characterShopSlot.slotState === "sold") {
              return (
                <RecessedShopSlot
                  key={shopSlotIndex}
                  dataAttributes={{ "data-character-shop-slot-state": "sold" }}
                >
                  <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
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
                    isSelected={selectedShopSlotIndex === shopSlotIndex}
                    isEnabled={isShopSlotEnabled(shopSlotIndex)}
                    isDraggable={isShopSlotDraggable(shopSlotIndex)}
                    presentation={shopSlotPresentation(shopSlotIndex)}
                    onClick={() => onShopSlotClick(shopSlotIndex)}
                    buttonLabel={t("shopListingButtonLabel", {
                      characterName: matchedCharacterTemplate.name,
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
                />
              );
            }

            return (
              <RecessedShopSlot
                key={shopSlotIndex}
                dataAttributes={{ "data-character-shop-slot-state": "locked" }}
              >
                <LockedSlotContents label={t("shopSlotLockedLabel")} />
              </RecessedShopSlot>
            );
          })}
        </ShopSection>

        {LOCKED_SHOP_SECTION_IDS.map((lockedShopSectionId) => (
          <ShopSection
            key={lockedShopSectionId}
            headingId={lockedShopSectionHeadingIds[lockedShopSectionId]}
            heading={shopSectionTranslations(lockedShopSectionId)}
            gridClassName={LOCKED_SHOP_SECTION_GRID_CLASS_NAMES[lockedShopSectionId]}
            flexClassName={LOCKED_SHOP_SECTION_FLEX_CLASS_NAMES[lockedShopSectionId]}
          >
            {Array.from({
              length: LOCKED_SHOP_SECTION_SLOT_COUNTS[lockedShopSectionId],
            }).map((_, lockedSlotIndex) => (
              <RecessedShopSlot
                key={lockedSlotIndex}
                dataAttributes={{ "data-shop-section-slot-state": "locked" }}
              >
                <LockedSlotContents label={t("shopSlotLockedLabel")} />
              </RecessedShopSlot>
            ))}
          </ShopSection>
        ))}
      </div>
    </section>
  );
}
