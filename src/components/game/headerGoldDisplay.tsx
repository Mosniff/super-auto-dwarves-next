"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useTranslations } from "next-intl";

// Display-only: the shown gold counts up while the camp-start sequence
// plays; the saved gold is already final. Since Phase 16 the header shows
// no gold; camp's money pile is the one display (the names here still say
// "header" from before).
interface HeaderGoldDisplayContextValue {
  pendingGold: number;
  setPendingGold: Dispatch<SetStateAction<number>>;
}

const HeaderGoldDisplayContext = createContext<HeaderGoldDisplayContextValue>({
  pendingGold: 0,
  setPendingGold: () => {},
});

export function HeaderGoldDisplayProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingGold, setPendingGold] = useState(0);

  return (
    <HeaderGoldDisplayContext.Provider value={{ pendingGold, setPendingGold }}>
      {children}
    </HeaderGoldDisplayContext.Provider>
  );
}

export function useReportPendingHeaderGold(pendingGold: number): void {
  const { setPendingGold } = useContext(HeaderGoldDisplayContext);

  // useLayoutEffect, not useEffect: the header receives the final gold on
  // the same render that camp arrives, so reporting after paint would
  // flash the full amount for a frame.
  useLayoutEffect(() => {
    setPendingGold(pendingGold);
    return () => setPendingGold(0);
  }, [pendingGold, setPendingGold]);
}

// The gold as shown: the saved gold, minus whatever the start-of-camp
// sequence is still holding back (it is released as each ability's gold
// floater plays).
export function useDisplayedGold(gold: number): number {
  const { pendingGold } = useContext(HeaderGoldDisplayContext);
  return gold - pendingGold;
}

export function DisplayedGold({ gold }: { gold: number }) {
  const displayedGold = useDisplayedGold(gold);
  const t = useTranslations("common");
  return (
    <span data-displayed-gold>{t("goldLabel", { gold: displayedGold })}</span>
  );
}
