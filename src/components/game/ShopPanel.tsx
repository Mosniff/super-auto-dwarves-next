"use client";

import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/react";
import type { ShopListing } from "@/lib/game/shop";
import { spawnCharacterFromTemplate } from "@/lib/game/ownedCharacter";
import type { CampClickTarget, CampTargetPresentation } from "./campSelection";
import { CharacterCard } from "./CharacterCard";

// Visual classes come from the presentation state only (plus dimming the
// drag source), never from the native disabled attribute or isSelected
// alone — this keeps click-select and drag from ever presenting a tile
// differently. A shop listing is never itself a drop target, so unlike a
// roster slot there is no stronger "under the pointer" variant here.
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

interface DraggableShopListingTileProps {
  shopListing: ShopListing;
  isSelected: boolean;
  isEnabled: boolean;
  isDraggable: boolean;
  presentation: CampTargetPresentation;
  onClick: () => void;
  buttonLabel: string;
}

function DraggableShopListingTile({
  shopListing,
  isSelected,
  isEnabled,
  isDraggable,
  presentation,
  onClick,
  buttonLabel,
}: DraggableShopListingTileProps) {
  const campClickTarget: CampClickTarget = {
    targetKind: "shopListing",
    shopListingId: shopListing.shopListingId,
  };

  const displayCharacter = spawnCharacterFromTemplate(
    shopListing.characterTemplate,
    shopListing.shopListingId,
  );

  const { ref, isDragSource } = useDraggable({
    id: `shop-listing-${shopListing.shopListingId}`,
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
  shopCatalogue: ShopListing[];
  purchasedShopListingIds: string[];
  selectedShopListingId: string | null;
  isListingEnabled: (shopListingId: string) => boolean;
  isListingDraggable: (shopListingId: string) => boolean;
  listingPresentation: (shopListingId: string) => CampTargetPresentation;
  onListingClick: (shopListingId: string) => void;
}

export function ShopPanel({
  shopCatalogue,
  purchasedShopListingIds,
  selectedShopListingId,
  isListingEnabled,
  isListingDraggable,
  listingPresentation,
  onListingClick,
}: ShopPanelProps) {
  const t = useTranslations("common");

  return (
    <section className="w-full max-w-5xl">
      <h2 className="mb-2 text-lg font-bold">{t("shopHeading")}</h2>
      <div className="flex gap-3">
        {shopCatalogue.map((shopListing) => {
          const isSold = purchasedShopListingIds.includes(
            shopListing.shopListingId,
          );

          if (isSold) {
            return (
              <div
                key={shopListing.shopListingId}
                className="flex aspect-3/4 flex-1 flex-col items-center justify-center gap-1 rounded-md bg-slate-200 p-1.5"
                style={{ boxShadow: "var(--shadow-recess)" }}
              >
                <span className="select-none text-[10px] font-medium uppercase tracking-wide text-slate-50/30">
                  {t("shopListingSoldLabel")}
                </span>
              </div>
            );
          }

          return (
            <DraggableShopListingTile
              key={shopListing.shopListingId}
              shopListing={shopListing}
              isSelected={selectedShopListingId === shopListing.shopListingId}
              isEnabled={isListingEnabled(shopListing.shopListingId)}
              isDraggable={isListingDraggable(shopListing.shopListingId)}
              presentation={listingPresentation(shopListing.shopListingId)}
              onClick={() => onListingClick(shopListing.shopListingId)}
              buttonLabel={t("shopListingButtonLabel", {
                characterName: shopListing.characterTemplate.name,
              })}
            />
          );
        })}
      </div>
    </section>
  );
}
