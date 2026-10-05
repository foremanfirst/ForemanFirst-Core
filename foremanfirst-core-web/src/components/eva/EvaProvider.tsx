"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type EvaContextValue = {
  isOpen: boolean;
  openEva: () => void;
  closeEva: () => void;
  toggleEva: () => void;
};

const EvaContext =
  createContext<EvaContextValue | null>(null);

export function EvaProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] =
    useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openEva: () => setIsOpen(true),
      closeEva: () => setIsOpen(false),
      toggleEva: () =>
        setIsOpen((current) => !current),
    }),
    [isOpen],
  );

  return (
    <EvaContext.Provider value={value}>
      {children}
    </EvaContext.Provider>
  );
}

export function useEva() {
  const context =
    useContext(EvaContext);

  if (!context) {
    throw new Error(
      "useEva must be used within EvaProvider",
    );
  }

  return context;
}
