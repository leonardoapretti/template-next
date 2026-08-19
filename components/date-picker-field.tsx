"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

type DatePickerFieldProps = {
  value?: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

type DateRangePickerFieldProps = {
  value?: {
    from?: string;
    to?: string;
  };
  onChange: (value: { from: string; to: string }) => void;
  placeholder?: string;
  disabled?: boolean;
};

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseInputDate(value?: string) {
  if (!value) return undefined;

  const parsed = parse(value, "yyyy-MM-dd", new Date());

  return isValid(parsed) ? parsed : undefined;
}

function formatDisplayDate(value?: string) {
  const parsed = parseInputDate(value);

  return parsed ? format(parsed, "dd/MM/yyyy") : "";
}

function formatInputDate(date?: Date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled,
}: DatePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const selectedDate = useMemo(() => {
    return parseInputDate(value);
  }, [value]);

  useEffect(() => {
    if (!value) {
      setInputValue("");
      return;
    }

    if (selectedDate) {
      setInputValue(format(selectedDate, "dd/MM/yyyy"));
    }
  }, [value, selectedDate]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateMask(e.target.value);

    setInputValue(masked);

    // Sempre notifica o formulário sobre a alteração
    if (masked.length !== 10) {
      onChange("");
      return;
    }

    const parsed = parse(masked, "dd/MM/yyyy", new Date());

    if (!isValid(parsed)) {
      onChange("");
      return;
    }

    onChange(format(parsed, "yyyy-MM-dd"));
  }

  function handleCalendarSelect(date: Date | undefined) {
    if (!date) {
      onChange("");
      return;
    }

    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex w-full items-center">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="numeric"
        maxLength={10}
        className="w-full pr-9"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Abrir calendário"
              className="absolute right-0 h-full w-15 rounded-l-none rounded-r-md border-l bg-accent text-muted-foreground transition-colors hover:text-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          }
        />

        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            captionLayout="dropdown"
            defaultMonth={selectedDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DateRangePickerField({
  value,
  onChange,
  placeholder = "Selecionar período",
  disabled,
}: DateRangePickerFieldProps) {
  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = parseInputDate(value?.from);
    const to = parseInputDate(value?.to);

    if (!(from || to)) return undefined;

    return { from, to };
  }, [value]);

  const displayValue =
    value?.from && value?.to
      ? `${formatDisplayDate(value.from)} à ${formatDisplayDate(value.to)}`
      : value?.from
        ? `${formatDisplayDate(value.from)} à ...`
        : placeholder;

  function handleCalendarSelect(range: DateRange | undefined) {
    onChange({
      from: formatInputDate(range?.from),
      to: formatInputDate(range?.to),
    });
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start gap-2 border-dashed font-normal"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className={value?.from ? "truncate" : "truncate text-muted-foreground"}>
              {displayValue}
            </span>
          </Button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={handleCalendarSelect}
          captionLayout="dropdown"
          defaultMonth={selectedRange?.from}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
