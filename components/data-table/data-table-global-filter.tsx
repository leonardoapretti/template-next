"use client";

import type { Table as TanstackTable } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface DataTableGlobalFilterProps<TData> {
  table: TanstackTable<TData>;
  className?: string;
}

export function DataTableGlobalFilter<TData>({
  table,
  className,
}: DataTableGlobalFilterProps<TData>) {
  const getFilterablePlaceholder = useCallback(() => {
    const filterableColumns = table
      .getAllColumns()
      .filter((column) => column.getCanGlobalFilter())
      .map((column) => column.columnDef.meta?.label);

    if (filterableColumns.length === 0) return "Buscar";

    if (filterableColumns.length === 1) return `Buscar por ${filterableColumns[0]?.toLowerCase()}`;

    const lastColumn = filterableColumns.pop();
    return `Buscar por ${filterableColumns
      .map((col) => col?.toLowerCase())
      .join(", ")} ou ${lastColumn?.toLowerCase()}`;
  }, [table]);

  const [inputValue, setInputValue] = useState(table.getState().globalFilter ?? "");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    table.options.onGlobalFilterChange?.(e.target.value);
  };

  useEffect(() => {
    setInputValue(table.getState().globalFilter ?? "");
  }, [table]);

  const onReset = useCallback(() => {
    setInputValue("");
    table.options.onGlobalFilterChange?.("");
  }, [table]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>

      <Input
        className={cn(
          "w-full min-w-40 pl-9",
          // Reserva espaço à direita quando o botão X está visível,
          // evitando que o texto do input sobreponha o botão
          inputValue && "pr-9",
        )}
        onChange={onChange}
        placeholder={getFilterablePlaceholder()}
        value={inputValue}
      />

      {inputValue && (
        <Button
          className="absolute inset-y-0 right-0 h-full px-3 py-0 hover:bg-transparent"
          onClick={onReset}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      )}
    </div>
  );
}
