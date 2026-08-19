"use client";

import { Clock3Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type HourPickerFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const ITEM_HEIGHT = 40;

function applyTimeMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

type WheelProps = {
  items: string[];
  value: string;
  onChange: (value: string) => void;
};

function Wheel({ items, value, onChange }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const snapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouching = useRef(false);

  const selectedIndex = useMemo(() => Math.max(items.indexOf(value), 0), [items, value]);

  // scroll externo (mudança de valor via input ou teclado)
  useEffect(() => {
    const container = ref.current;
    if (!container || isTouching.current) return;

    container.scrollTo({
      top: selectedIndex * ITEM_HEIGHT,
      behavior: "smooth",
    });
  }, [selectedIndex]);

  const snap = useCallback(() => {
    const container = ref.current;
    if (!container) return;

    const index = Math.round(container.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));

    container.scrollTo({
      top: clamped * ITEM_HEIGHT,
      behavior: "smooth",
    });

    onChange(items[clamped]);
  }, [items, onChange]);

  const handleScroll = useCallback(() => {
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    // debounce: snap 100ms após o scroll parar
    snapTimeout.current = setTimeout(snap, 100);
  }, [snap]);

  // touch events para detectar quando o dedo levanta
  const handleTouchStart = useCallback(() => {
    isTouching.current = true;
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isTouching.current = false;
    // aguarda a inércia do scroll antes de fazer snap
    snapTimeout.current = setTimeout(snap, 100);
  }, [snap]);

  return (
    <div className="relative h-50 w-18 overflow-hidden">
      {/* highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 rounded-md border bg-accent/60"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />

      {/* fade top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-linear-to-b from-popover to-transparent" />

      {/* fade bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-linear-to-t from-popover to-transparent" />

      <div
        ref={ref}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="scrollbar-none h-full overflow-y-auto overscroll-contain"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
      >
        {items.map((item) => {
          const selected = item === value;

          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                ref.current?.scrollTo({
                  top: items.indexOf(item) * ITEM_HEIGHT,
                  behavior: "smooth",
                });
              }}
              className="flex w-full items-center justify-center"
              style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
            >
              <span
                className={[
                  "font-mono text-base transition-all duration-150",
                  selected ? "scale-110 font-semibold text-foreground" : "text-muted-foreground/40",
                ].join(" ")}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HourPickerField({
  value,
  onChange,
  placeholder = "HH:mm",
  disabled,
}: HourPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const parsedValue = value && isValidTime(value) ? value : "00:00";
  const [hour, minute] = parsedValue.split(":");

  const [inputValue, setInputValue] = useState(value && isValidTime(value) ? value : "");

  useEffect(() => {
    setInputValue(value && isValidTime(value) ? value : "");
  }, [value]);

  const updateTime = useCallback((h: string, m: string) => onChange(`${h}:${m}`), [onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyTimeMask(e.target.value);
    setInputValue(masked);
    if (!masked) {
      onChange("");
      return;
    }
    if (masked.length === 5 && isValidTime(masked)) onChange(masked);
  };

  return (
    <div className="relative flex w-full items-center">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        inputMode="numeric"
        maxLength={5}
        className="w-full pr-9 font-mono"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label="Abrir seletor de horário"
              className="absolute right-0 h-full w-15 rounded-l-none rounded-r-md border-l bg-accent text-muted-foreground transition-colors hover:text-foreground"
            >
              <Clock3Icon className="h-4 w-4" />
            </Button>
          }
        />

        <PopoverContent align="end" className="w-auto rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Wheel items={HOURS} value={hour} onChange={(h) => updateTime(h, minute)} />
            <div className="font-mono text-2xl font-semibold text-muted-foreground">:</div>
            <Wheel items={MINUTES} value={minute} onChange={(m) => updateTime(hour, m)} />
          </div>

          <Button type="button" className="mt-4 w-full" onClick={() => setOpen(false)}>
            Confirmar
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
