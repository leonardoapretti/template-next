"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../ui/button";
import { type ChipDeFiltro, resumirFiltros } from "./data-table-filter-summary";

// Faixa de filtros ativos logo abaixo da barra de filtros: um chip por filtro
// (com "x" pra tirar só aquele) e o botão "Limpar filtros" que zera tudo. Só
// aparece quando há algum filtro ativo.
export function DataTableActiveFilters<TData>({
  table,
  onReset,
  extraActive = false,
}: Readonly<{
  table: Table<TData>;
  onReset: () => void;
  // Filtros que não estão no estado da tabela (ex.: avançados na URL).
  extraActive?: boolean;
}>) {
  const columnFilters = table.getState().columnFilters;
  const globalFilter = table.getState().globalFilter as string | undefined;

  const chips = useMemo(
    () =>
      resumirFiltros(
        { columnFilters, globalFilter },
        table.getAllColumns().map((coluna) => ({
          id: coluna.id,
          label: coluna.columnDef.meta?.label,
          variant: coluna.columnDef.meta?.variant,
          options: coluna.columnDef.meta?.options,
          unit: coluna.columnDef.meta?.unit,
        })),
      ),
    [columnFilters, globalFilter, table],
  );

  if (chips.length === 0 && !extraActive) return null;

  function remover(chip: ChipDeFiltro) {
    if (chip.origem === "global") {
      table.resetGlobalFilter();
      table.options.onGlobalFilterChange?.("");
      return;
    }

    table.getColumn(chip.chave)?.setFilterValue(undefined);
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-slot="data-table-active-filters">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>

      {chips.map((chip) => (
        <span
          className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2.5 text-xs"
          key={chip.chave}
        >
          <span className="truncate">
            <span className="text-muted-foreground">{chip.rotulo}:</span>{" "}
            <span className="font-medium">{chip.valor}</span>
          </span>
          <button
            aria-label={`Remover filtro ${chip.rotulo}`}
            className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            onClick={() => remover(chip)}
            type="button"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <Button
        aria-label="Limpar todos os filtros"
        className="h-7 border-dashed px-2 text-xs"
        onClick={onReset}
        size="sm"
        type="button"
        variant="outline"
      >
        <X className="mr-1 size-3" />
        Limpar filtros
      </Button>
    </div>
  );
}
