"use client";

import { forwardRef, useRef, useState } from "react";
import { formatCurrencyInput } from "@/hooks/use-currency-mask";
import { cn } from "@/lib/utils/tailwind";
import { Input } from "./ui/input";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [display, setDisplay] = useState(() => formatCurrencyInput(value));
    const prevValueRef = useRef(value);

    // Sincroniza APENAS quando value muda externamente (reset, setValue)
    // ignorando mudanças que vieram do próprio handleChange
    const isInternalChange = useRef(false);
    if (!isInternalChange.current && prevValueRef.current !== value) {
      prevValueRef.current = value;
      setDisplay(formatCurrencyInput(value));
    }
    isInternalChange.current = false;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      const numeric = digits !== "" ? Number(digits) / 100 : 0;

      isInternalChange.current = true;
      prevValueRef.current = numeric;
      setDisplay(digits !== "" ? formatCurrencyInput(digits) : "");
      onChange(numeric);
    };

    const handleCursorToEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      requestAnimationFrame(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      });
    };

    return (
      <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
        <span className="select-none border-r border-input px-3 py-2 text-sm text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          value={display}
          onChange={handleChange}
          onClick={handleCursorToEnd}
          onFocus={handleCursorToEnd}
          onKeyDown={handleCursorToEnd}
          className={cn("border-0 shadow-none focus-visible:ring-0", className)}
          inputMode="numeric"
          placeholder="0,01"
          {...props}
        />
      </div>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
