"use client";

import { Input } from "@/components/ui/input";
import { formatarTelefoneBR } from "@/lib/utils/telefone";

type PhoneInputProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

export function PhoneInput({
  value = "",
  onChange,
  onBlur,
  placeholder = "(61) 99999-9999",
}: PhoneInputProps) {
  return (
    <Input
      value={formatarTelefoneBR(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
        onChange(digits);
      }}
      onBlur={onBlur}
    />
  );
}
