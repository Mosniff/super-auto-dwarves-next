"use client";

import { useTranslations } from "next-intl";
import type { ShopListing } from "@/lib/game/shop";
import { CharacterCard } from "./CharacterCard";

interface ShopPanelProps {
  shopCatalogue: ShopListing[];
  purchasedShopListingIds: string[];
  selectedShopListingId: string | null;
  isListingEnabled: (shopListingId: string) => boolean;
  onListingClick: (shopListingId: string) => void;
}

export function ShopPanel({
  shopCatalogue,
  purchasedShopListingIds,
  selectedShopListingId,
  isListingEnabled,
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

          const isSelected =
            selectedShopListingId === shopListing.shopListingId;
          const isEnabled = isListingEnabled(shopListing.shopListingId);

          return (
            <button
              key={shopListing.shopListingId}
              type="button"
              aria-label={t("shopListingButtonLabel", {
                characterName: shopListing.characterTemplate.name,
              })}
              aria-pressed={isSelected}
              disabled={!isEnabled}
              onClick={() => onListingClick(shopListing.shopListingId)}
              className={`block aspect-3/4 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                isSelected ? "ring-2 ring-ring" : ""
              }`}
            >
              <CharacterCard
                character={{
                  id: shopListing.shopListingId,
                  ...shopListing.characterTemplate,
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
