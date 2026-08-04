import { createContext, useContext, type ReactNode } from "react";

import { useV2Store } from "@/hooks/useV2Store";

type V2StoreContextValue = ReturnType<typeof useV2Store>;

const V2StoreContext = createContext<V2StoreContextValue | null>(null);

export const V2StoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useV2Store();
  return <V2StoreContext.Provider value={store}>{children}</V2StoreContext.Provider>;
};

export const useV2StoreContext = (): V2StoreContextValue => {
  const context = useContext(V2StoreContext);
  if (!context) {
    throw new Error("useV2StoreContext must be used inside <V2StoreProvider>");
  }
  return context;
};
