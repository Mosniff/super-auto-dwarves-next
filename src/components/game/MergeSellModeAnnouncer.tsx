"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { CampInteractionMode } from "./campSelection";

const MERGE_SELL_ANNOUNCEMENT_DELAY_MS = 300;

interface MergeSellModeAnnouncerProps {
  campInteractionMode: CampInteractionMode;
}

// Only a settled change is announced: Shift+Tab (or any other quick
// in-and-out) reverts the mode before the delay fires, so the ref holding
// the last-announced mode never updates and nothing is read aloud.
export function MergeSellModeAnnouncer({
  campInteractionMode,
}: MergeSellModeAnnouncerProps) {
  const t = useTranslations("common");
  const [announcementText, setAnnouncementText] = useState("");
  const lastAnnouncedCampInteractionModeRef = useRef(campInteractionMode);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (campInteractionMode === lastAnnouncedCampInteractionModeRef.current) {
        return;
      }

      lastAnnouncedCampInteractionModeRef.current = campInteractionMode;
      setAnnouncementText(
        campInteractionMode === "mergeOrSell"
          ? t("mergeSellModeOnAnnouncement")
          : t("mergeSellModeOffAnnouncement"),
      );
    }, MERGE_SELL_ANNOUNCEMENT_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [campInteractionMode, t]);

  return (
    <div data-merge-sell-announcement aria-live="polite" className="sr-only">
      {announcementText}
    </div>
  );
}
