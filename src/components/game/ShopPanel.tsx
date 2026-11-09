"use client";

import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/react";
import type { CharacterShopSlots } from "@/lib/game/characterShopSlots";
import type { CharacterTemplate } from "@/lib/game/characterTemplates";
import { spawnCharacterFromTemplate } from "@/lib/game/ownedCharacter";
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

  return (
    <section className="w-full max-w-5xl">
      <h2 className="mb-2 text-lg font-bold">{t("shopHeading")}</h2>
      <div className="flex gap-3">
        {characterShopSlots.map((characterShopSlot, shopSlotIndex) => {
          if (characterShopSlot.slotState === "sold") {
            return (
              <div
                key={shopSlotIndex}
                data-character-shop-slot-state="sold"
                className="flex aspect-3/4 flex-1 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5"
                style={{ boxShadow: "var(--shadow-recess)" }}
              >
                <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
                  {t("shopListingSoldLabel")}
                </span>
              </div>
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
            // treated the same as locked here — there is nothing buyable to
            // show. Part 5 adds the padlock and label for locked/unavailable
            // slots.
            return (
              <div
                key={shopSlotIndex}
                data-character-shop-slot-state="unavailable"
                className="flex aspect-3/4 flex-1 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5"
                style={{ boxShadow: "var(--shadow-recess)" }}
              />
            );
          }

          // Locked. Part 5 adds the padlock and label.
          return (
            <div
              key={shopSlotIndex}
              data-character-shop-slot-state="locked"
              className="flex aspect-3/4 flex-1 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5"
              style={{ boxShadow: "var(--shadow-recess)" }}
            />
          );
        })}
      </div>
    </section>
  );
}
