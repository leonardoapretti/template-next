// biome-ignore-all lint/a11y/useSemanticElements: precisa de revisão para confirmar se realmente é um falso positivo

"use client";

import type { Column } from "@tanstack/react-table";
import { PlusCircle, XCircle } from "lucide-react";
import { type ChangeEvent, type MouseEvent, useCallback, useId, useMemo } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";

interface Range {
  min: number;
  max: number;
}

type RangeValue = [number, number];

function getIsValidRange(value: unknown): value is RangeValue {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

interface DataTableSliderFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
}

export function DataTableSliderFilter<TData>({ column, title }: DataTableSliderFilterProps<TData>) {
  const id = useId();

  const columnFilterValue = getIsValidRange(column.getFilterValue())
    ? (column.getFilterValue() as RangeValue)
    : undefined;

  const defaultRange = column.columnDef.meta?.range;
  const unit = column.columnDef.meta?.unit;

  const calculateStep = useCallback((rangeSize: number): number => {
    if (rangeSize <= 20) {
      return 1;
    }
    if (rangeSize <= 100) {
      return Math.ceil(rangeSize / 20);
    }
    return Math.ceil(rangeSize / 50);
  }, []);

  const { min, max, step } = useMemo<Range & { step: number }>(() => {
    let minValue = 0;
    let maxValue = 100;

    if (defaultRange && getIsValidRange(defaultRange)) {
      [minValue, maxValue] = defaultRange;
    } else {
      const values = column.getFacetedMinMaxValues();
      if (values && Array.isArray(values) && values.length === 2) {
        const [facetMinValue, facetMaxValue] = values;
        if (typeof facetMinValue === "number" && typeof facetMaxValue === "number") {
          minValue = facetMinValue;
          maxValue = facetMaxValue;
        }
      }
    }

    const rangeSize = maxValue - minValue;
    const stepValue = calculateStep(rangeSize);

    return { min: minValue, max: maxValue, step: stepValue };
  }, [column, defaultRange, calculateStep]);

  const range = useMemo((): RangeValue => {
    return columnFilterValue ?? [min, max];
  }, [columnFilterValue, min, max]);

  const formatValue = useCallback((value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, []);

  const onFromInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value);
      if (!Number.isNaN(numValue) && numValue >= min && numValue <= range[1]) {
        column.setFilterValue([numValue, range[1]]);
      }
    },
    [column, min, range],
  );

  const onToInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const numValue = Number(event.target.value);
      if (!Number.isNaN(numValue) && numValue <= max && numValue >= range[0]) {
        column.setFilterValue([range[0], numValue]);
      }
    },
    [column, max, range],
  );

  const onSliderValueChange = useCallback(
    (value: number | readonly number[]) => {
      if (Array.isArray(value) && getIsValidRange(value)) {
        column.setFilterValue([value[0], value[1]]);
      }
    },
    [column],
  );

  const onReset = useCallback(
    (event: MouseEvent) => {
      if (event.target instanceof HTMLDivElement) {
        event.stopPropagation();
      }
      column.setFilterValue(undefined);
    },
    [column],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button className="border-dashed" size="sm" variant="outline">
            {columnFilterValue ? (
              <span className="rounded-sm opacity-70 transition-opacity">
                <XCircle />
              </span>
            ) : (
              <PlusCircle />
            )}
            <span>{title}</span>
            {columnFilterValue ? (
              <>
                <Separator
                  className="mx-0.5 data-[orientation=vertical]:h-4"
                  orientation="vertical"
                />
                {formatValue(columnFilterValue[0])} - {formatValue(columnFilterValue[1])}
                {unit ? ` ${unit}` : ""}
              </>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="start" className="flex w-auto flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {title}
          </p>
          <div className="flex items-center gap-4">
            <Label className="sr-only" htmlFor={`${id}-from`}>
              From
            </Label>
            <div className="relative">
              <Input
                aria-valuemax={max}
                aria-valuemin={min}
                className={cn("h-8 w-24", unit && "pr-8")}
                id={`${id}-from`}
                inputMode="numeric"
                max={max}
                min={min}
                onChange={onFromInputChange}
                pattern="[0-9]*"
                placeholder={min.toString()}
                type="number"
                value={range[0]?.toString()}
              />
              {unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {unit}
                </span>
              )}
            </div>
            <Label className="sr-only" htmlFor={`${id}-to`}>
              to
            </Label>
            <div className="relative">
              <Input
                aria-valuemax={max}
                aria-valuemin={min}
                className={cn("h-8 w-24", unit && "pr-8")}
                id={`${id}-to`}
                inputMode="numeric"
                max={max}
                min={min}
                onChange={onToInputChange}
                pattern="[0-9]*"
                placeholder={max.toString()}
                type="number"
                value={range[1]?.toString()}
              />
              {unit && (
                <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                  {unit}
                </span>
              )}
            </div>
          </div>
          <Label className="sr-only" htmlFor={`${id}-slider`}>
            {title} slider
          </Label>
          <Slider
            id={`${id}-slider`}
            max={max}
            min={min}
            onValueChange={onSliderValueChange}
            step={step}
            value={range}
          />
        </div>
        <Button aria-label={`Clear ${title} filter`} onClick={onReset} size="sm" variant="outline">
          Clear
        </Button>
      </PopoverContent>
    </Popover>
  );
}
