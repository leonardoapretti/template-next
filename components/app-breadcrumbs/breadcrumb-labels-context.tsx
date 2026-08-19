"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

export type BreadcrumbLabel =
  | string
  | {
      label: string;
      clickable?: boolean;
    };

export type BreadcrumbLabels = Record<string, BreadcrumbLabel>;

interface BreadcrumbLabelsContextValue {
  labels: BreadcrumbLabels;
  setLabels: (labels: BreadcrumbLabels) => void;
  clearLabels: () => void;
}

const BreadcrumbLabelsContext = createContext<BreadcrumbLabelsContextValue | null>(null);

export function BreadcrumbLabelsProvider({ children }: { children: ReactNode }) {
  const [labels, setLabelsState] = useState<BreadcrumbLabels>({});

  const value = useMemo<BreadcrumbLabelsContextValue>(
    () => ({
      labels,
      setLabels: setLabelsState,
      clearLabels: () => setLabelsState({}),
    }),
    [labels],
  );

  return (
    <BreadcrumbLabelsContext.Provider value={value}>{children}</BreadcrumbLabelsContext.Provider>
  );
}

export function useBreadcrumbLabels() {
  const context = useContext(BreadcrumbLabelsContext);

  if (!context) {
    throw new Error("useBreadcrumbLabels deve ser usado dentro de BreadcrumbLabelsProvider");
  }

  return context;
}
