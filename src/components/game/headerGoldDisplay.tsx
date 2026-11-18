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

// Display-only: the header counts up while the camp-start sequence plays;
// the saved gold is already final.
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

export function DisplayedGold({ gold }: { gold: number }) {
  const { pendingGold } = useContext(HeaderGoldDisplayContext);
  const t = useTranslations("common");
  return (
    <span data-displayed-gold>
      {t("goldLabel", { gold: gold - pendingGold })}
    </span>
  );
}
