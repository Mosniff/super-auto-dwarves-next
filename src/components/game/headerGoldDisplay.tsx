"use client";

import {
  createContext,
  useContext,
  useEffect,
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

  useEffect(() => {
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
