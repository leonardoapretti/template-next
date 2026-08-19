"use client";

import { useEffect } from "react";
import { DataTableServer } from "./data-table-server-side";
import { findInOriginalData, findInRowModel } from "./data-table-utils";
import type { DataTableProps } from "./types/data-table-types";

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  ...props
}: DataTableProps<TData>) {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const highlightedId = Number(searchParams.get("highlighted"));

  // Effect to handle navigation to highlighted row
  useEffect(() => {
    if (highlightedId !== undefined && highlightedId !== null) {
      const foundInRowModel = findInRowModel(table, highlightedId);
      if (!foundInRowModel) {
        findInOriginalData(table, highlightedId);
      }
    }
  }, [highlightedId, table]);

  return (
    <DataTableServer
      actionBar={actionBar}
      className={className}
      highlightedId={highlightedId}
      table={table}
      {...props}
    >
      {children}
    </DataTableServer>
  );
}
