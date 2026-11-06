"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { GameScreenShell } from "@/components/game/GameScreenShell";
import { PendingSubmitButton } from "@/components/game/PendingSubmitButton";
import { ShopPanel } from "@/components/game/ShopPanel";
import type { CampRoster } from "@/lib/game/campRoster";
import type { CampState } from "@/lib/game/campState";
import type { ShopListing } from "@/lib/game/shop";
import {
  isCampClickEffective,
  resolveCampClick,
  type CampClickTarget,
  type CampIntent,
  type CampSelection,
} from "@/components/game/campSelection";

interface CampScreenProps {
  playerCampRoster: CampRoster;
  day: number;
  gold: number;
  purchasedShopListingIds: string[];
  shopCatalogue: ShopListing[];
  revision: number;
  advanceGameAction: (formData: FormData) => Promise<void>;
  buyCharacterAction: (formData: FormData) => Promise<void>;
  repositionCharacterAction: (formData: FormData) => Promise<void>;
}

export function CampScreen({
  playerCampRoster,
  day,
  gold,
  purchasedShopListingIds,
  shopCatalogue,
  revision,
  advanceGameAction,
  buyCharacterAction,
  repositionCharacterAction,
}: CampScreenProps) {
  const t = useTranslations("common");

  // The selection and pending-ness below are UI state only, for click
  // feedback and disabling tiles mid-submit. The server re-validates every
  // intent; the page's reloaded props (from the next load) are the truth.
  const [campSelection, setCampSelection] = useState<CampSelection>({
    selectionKind: "none",
  });
  const [isSubmittingCampIntent, startCampIntentTransition] = useTransition();

  const campState: CampState = {
    campRoster: playerCampRoster,
    gold,
    purchasedShopListingIds,
  };

  function submitCampIntent(campIntent: CampIntent): void {
    const formData = new FormData();

    if (campIntent.intentKind === "buy") {
      formData.set("shopListingId", campIntent.shopListingId);
      formData.set("targetSlotIndex", String(campIntent.targetSlotIndex));
      formData.set("expectedRevision", String(revision));
      startCampIntentTransition(async () => {
        await buyCharacterAction(formData);
      });
    } else {
      formData.set("fromSlotIndex", String(campIntent.fromSlotIndex));
      formData.set("toSlotIndex", String(campIntent.toSlotIndex));
      formData.set("expectedRevision", String(revision));
      startCampIntentTransition(async () => {
        await repositionCharacterAction(formData);
      });
    }
  }

  function handleCampClick(campClickTarget: CampClickTarget): void {
    const resolution = resolveCampClick(
      campSelection,
      campClickTarget,
      campState,
      shopCatalogue,
    );

    setCampSelection(resolution.nextCampSelection);

    if (resolution.campIntentToSubmit !== null) {
      submitCampIntent(resolution.campIntentToSubmit);
    }
  }

  function isClickEnabled(campClickTarget: CampClickTarget): boolean {
    return (
      !isSubmittingCampIntent &&
      isCampClickEffective(
        campSelection,
        campClickTarget,
        campState,
        shopCatalogue,
      )
    );
  }

  return (
    <GameScreenShell
      playerBenchCharacters={playerCampRoster}
      playerSlotInteraction={{
        selectedSlotIndex:
          campSelection.selectionKind === "rosterSlot"
            ? campSelection.slotIndex
            : null,
        isSlotEnabled: (slotIndex) =>
          isClickEnabled({ targetKind: "rosterSlot", slotIndex }),
        onSlotClick: (slotIndex) =>
          handleCampClick({ targetKind: "rosterSlot", slotIndex }),
        slotButtonLabel: (slotIndex) => {
          const character = playerCampRoster[slotIndex];
          return character
            ? t("rosterSlotOccupiedLabel", {
                slotNumber: slotIndex + 1,
                characterName: character.name,
              })
            : t("rosterSlotEmptyLabel", { slotNumber: slotIndex + 1 });
        },
      }}
    >
      <section className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <h1 className="text-2xl font-bold">{t("phaseCamp")}</h1>
        <ShopPanel
          shopCatalogue={shopCatalogue}
          purchasedShopListingIds={purchasedShopListingIds}
          selectedShopListingId={
            campSelection.selectionKind === "shopListing"
              ? campSelection.shopListingId
              : null
          }
          isListingEnabled={(shopListingId) =>
            isClickEnabled({ targetKind: "shopListing", shopListingId })
          }
          onListingClick={(shopListingId) =>
            handleCampClick({ targetKind: "shopListing", shopListingId })
          }
        />
        <p className="text-muted-foreground">
          {t("dayLabel", { day })} — {t("goldLabel", { gold })}
        </p>
        <form action={advanceGameAction}>
          <input type="hidden" name="expectedCurrentPhase" value="campPhase" />
          <PendingSubmitButton size="lg">{t("toBattle")}</PendingSubmitButton>
        </form>
      </section>
    </GameScreenShell>
  );
}
