"use client";

import type { Row, Table } from "@tanstack/react-table";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

// Lista em cards para as telas do cliente da loja (pedidos, etc.): nada de tabela.
// Reaproveita busca, filtros e paginação do `useDataTable`; as colunas só declaram
// filtros e busca (o que cada card mostra vem de `renderCard`). Ver a skill
// `lista-de-cards-do-cliente`.
export function DataTableCards<TData>({
  table,
  renderCard,
  mensagemVazia = "Nada encontrado com esses filtros.",
}: Readonly<{
  table: Table<TData>;
  renderCard: (row: Row<TData>) => ReactNode;
  mensagemVazia?: string;
}>) {
  const linhas = table.getPaginationRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar table={table} />

      {linhas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <SearchX aria-hidden="true" className="size-5" />
          {mensagemVazia}
        </div>
      ) : (
        <ul className="grid gap-3">
          {linhas.map((linha) => (
            <li key={linha.id}>{renderCard(linha)}</li>
          ))}
        </ul>
      )}

      <div className="border-t pt-2.5">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
