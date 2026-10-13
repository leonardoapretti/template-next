"use client";

import type { Column, Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { type ComponentProps, type ReactNode, useCallback, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DataTableActiveFilters } from "./data-table-active-filters";
import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableExportButton } from "./data-table-export-button";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableGlobalFilter } from "./data-table-global-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> extends ComponentProps<"div"> {
  table: Table<TData>;
  primaryAction?: ReactNode;
}

function getActiveAdvancedFilterCount(
  advancedFilterKeys: string[],
  advancedFiltersState: Record<string, string | null>,
) {
  return advancedFilterKeys.filter((key) => {
    const value = advancedFiltersState[key];
    return value !== null && value !== "" && value !== undefined;
  }).length;
}

function getAdvancedFilterParsers(advancedFilterKeys: string[]) {
  if (advancedFilterKeys.length === 0) return {};

  const parsers: Record<string, typeof parseAsString> = {};
  for (const key of advancedFilterKeys) {
    parsers[key] = parseAsString;
  }

  return parsers;
}

interface DataTableToolbarLayoutProps<TData> extends ComponentProps<"div"> {
  table: Table<TData>;
  columns: Column<TData>[];
  children?: ReactNode;
  enableExportButton: boolean;
  enableGlobalFilter: boolean;
  filtersOpen?: boolean;
  primaryAction?: ReactNode;
  renderFilters?: () => ReactNode;
  activeFilterCount?: number;
  onToggleFilters?: () => void;
}

function DataTableToolbarMobile<TData>({
  table,
  columns,
  children,
  className,
  enableExportButton,
  enableGlobalFilter,
  filtersOpen = false,
  primaryAction,
  renderFilters,
  activeFilterCount = 0,
  onToggleFilters,
  ...props
}: DataTableToolbarLayoutProps<TData>) {
  return (
    <div
      aria-orientation="horizontal"
      className={cn("flex w-full flex-col gap-3", className)}
      role="toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {enableGlobalFilter && (
          <div className="flex-1">
            <DataTableGlobalFilter table={table} />
          </div>
        )}

        <Button
          aria-expanded={filtersOpen}
          aria-label="Filtros e opções"
          className={cn(
            "relative shrink-0 border-dashed transition-colors",
            filtersOpen && "bg-muted",
          )}
          onClick={onToggleFilters}
          size="sm"
          variant="outline"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {primaryAction && <div className="*:w-full">{primaryAction}</div>}

      {filtersOpen && (
        <div className="flex flex-col gap-3 border-t pt-3">
          {(columns.length > 0 || renderFilters) && (
            <div className="flex flex-wrap gap-2">
              {columns.map((column) => (
                <DataTableToolbarFilter column={column} key={column.id} />
              ))}
              {renderFilters?.()}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {children}
              {enableExportButton && <DataTableExportButton table={table} />}
              <DataTableViewOptions table={table} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataTableToolbarDesktop<TData>({
  table,
  columns,
  children,
  className,
  enableExportButton,
  enableGlobalFilter,
  primaryAction,
  renderFilters,
  ...props
}: DataTableToolbarLayoutProps<TData>) {
  return (
    <div
      aria-orientation="horizontal"
      className={cn("flex w-full items-start justify-between gap-3", className)}
      role="toolbar"
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {enableGlobalFilter && <DataTableGlobalFilter className="max-w-sm" table={table} />}
        {columns.map((column) => (
          <DataTableToolbarFilter column={column} key={column.id} />
        ))}
        {renderFilters?.()}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {enableExportButton && <DataTableExportButton table={table} />}
        <DataTableViewOptions table={table} />
        {primaryAction}
      </div>
    </div>
  );
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  primaryAction,
  ...props
}: DataTableToolbarProps<TData>) {
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  const advancedFilterKeys = table.options.meta?.advancedFilterKeys ?? [];

  const advancedFilterParsers = useMemo(
    () => getAdvancedFilterParsers(advancedFilterKeys),
    [advancedFilterKeys],
  );

  const [advancedFiltersState, setAdvancedFilters] = useQueryStates(advancedFilterParsers);

  const hasAdvancedFilters = useMemo(() => {
    if (advancedFilterKeys.length === 0) return false;
    return getActiveAdvancedFilterCount(advancedFilterKeys, advancedFiltersState) > 0;
  }, [advancedFilterKeys, advancedFiltersState]);

  const onReset = useCallback(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    if (advancedFilterKeys.length > 0) {
      const resetValues: Record<string, null> = {};
      for (const key of advancedFilterKeys) resetValues[key] = null;
      void setAdvancedFilters(resetValues);
    }
  }, [table, advancedFilterKeys, setAdvancedFilters]);

  const enableExportButton = table.options.meta?.enableExportButton ?? true;
  const enableGlobalFilter = table.options.enableGlobalFilter ?? false;
  const renderFilters = table.options.meta?.renderFilters;

  const activeAdvancedFilterCount = getActiveAdvancedFilterCount(
    advancedFilterKeys,
    advancedFiltersState,
  );
  const activeFilterCount = table.getState().columnFilters.length + activeAdvancedFilterCount;

  const barra = isMobile ? (
    <DataTableToolbarMobile
      activeFilterCount={activeFilterCount}
      className={className}
      columns={columns}
      enableExportButton={enableExportButton}
      enableGlobalFilter={enableGlobalFilter}
      filtersOpen={filtersOpen}
      onToggleFilters={() => setFiltersOpen((prev) => !prev)}
      primaryAction={primaryAction}
      renderFilters={renderFilters}
      table={table}
      {...props}
    >
      {children}
    </DataTableToolbarMobile>
  ) : (
    <DataTableToolbarDesktop
      className={className}
      columns={columns}
      enableExportButton={enableExportButton}
      enableGlobalFilter={enableGlobalFilter}
      primaryAction={primaryAction}
      renderFilters={renderFilters}
      table={table}
      {...props}
    >
      {children}
    </DataTableToolbarDesktop>
  );

  return (
    <div className="flex w-full flex-col gap-3">
      {barra}
      <DataTableActiveFilters extraActive={hasAdvancedFilters} onReset={onReset} table={table} />
    </div>
  );
}

interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({ column }: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;

  const onFilterRender = useCallback(() => {
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case "text":
        return (
          <Input
            className="h-8 w-40 lg:w-56"
            onChange={(event) => column.setFilterValue(event.target.value)}
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ""}
          />
        );

      case "number":
        return (
          <div className="relative">
            <Input
              className={cn("h-8 w-30", columnMeta.unit && "pr-8")}
              inputMode="numeric"
              onChange={(event) => column.setFilterValue(event.target.value)}
              placeholder={columnMeta.placeholder ?? columnMeta.label}
              type="number"
              value={(column.getFilterValue() as string) ?? ""}
            />
            {columnMeta.unit && (
              <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
                {columnMeta.unit}
              </span>
            )}
          </div>
        );

      case "range":
        return <DataTableSliderFilter column={column} title={columnMeta.label ?? column.id} />;

      case "date":
      case "dateRange":
        return (
          <DataTableDateFilter
            column={column}
            multiple={columnMeta.variant === "dateRange"}
            title={columnMeta.label ?? column.id}
          />
        );

      case "select":
      case "multiSelect":
        return (
          <DataTableFacetedFilter
            column={column}
            multiple={columnMeta.variant === "multiSelect"}
            options={columnMeta.options ?? []}
            title={columnMeta.label ?? column.id}
          />
        );

      default:
        return null;
    }
  }, [column, columnMeta]);

  return onFilterRender();
}
