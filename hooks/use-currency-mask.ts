import { useCallback } from "react";

export const parseCurrency = (value: string): number => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
};

export const formatCurrencyInput = (value: string | number): string => {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";

  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const useCurrencyMask = (onChange: (value: number) => void) => {
  return useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseCurrency(e.target.value));
    },
    [onChange],
  );
};
