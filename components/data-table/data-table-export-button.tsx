"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/dialog-drawer";
import { Button } from "../ui/button";

// Helper function to convert data to CSV
function convertToCSV<TData>(data: TData[], columns: Column<TData, unknown>[]): string {
  const separator = ";"; // Excel PT-BR espera ponto e vírgula

  const header = columns
    .map((column) => {
      const columnDef = column.columnDef;
      let label: string;
      if (typeof columnDef.header === "string") {
        label = columnDef.header;
      } else {
        label = columnDef.meta?.label ?? column.id;
      }
      // Sempre coloca aspas no header também
      return `"${label.replace(/"/g, '""')}"`;
    })
    .join(separator);

  const rows = data.map((row) =>
    columns
      .map((column) => {
        const cellValue = column.accessorFn
          ? column.accessorFn(row, 0)
          : (row as Record<string, unknown>)[column.id];
        let value = cellValue;
        if (typeof value === "object" && value !== null) {
          value = JSON.stringify(value);
        }
        // Sempre retorna aspas
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
      })
      .join(separator),
  );

  return `${header}\n${rows.join("\n")}`;
}

interface DataTableDownloadCsvButtonProps<TData> {
  table: Table<TData>;
  fileName?: string;
}

export function DataTableExportButton<TData>({
  table,
  fileName = "table_data.csv",
}: DataTableDownloadCsvButtonProps<TData>) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const downloadData = useCallback(
    (dataToExport: TData[]) => {
      const visibleColumns = table
        .getAllLeafColumns()
        .filter((col) => col.getIsVisible() && typeof col.accessorFn !== "undefined");

      if (dataToExport.length === 0) {
        alert("No data to export.");
        return;
      }

      const csvData = convertToCSV(dataToExport, visibleColumns as Column<TData, unknown>[]);

      // BOM + UTF-8 para acentos + separador correto
      const blob = new Blob([`\uFEFF${csvData}`], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [table, fileName],
  );

  const handleDownloadFilteredData = useCallback(() => {
    const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
    downloadData(filteredRows);
    setIsAlertOpen(false);
  }, [table, downloadData]);

  const handleDownloadOriginalData = useCallback(() => {
    const originalRows = table.getCoreRowModel().rows.map((row) => row.original);
    downloadData(originalRows);
    setIsAlertOpen(false);
  }, [table, downloadData]);

  const handleClickDownload = useCallback(() => {
    const { columnFilters, globalFilter } = table.getState();
    const isFiltered = columnFilters.length > 0 || !!globalFilter;

    if (isFiltered) {
      setIsAlertOpen(true);
    } else {
      handleDownloadFilteredData();
    }
  }, [table, handleDownloadFilteredData]);

  return (
    <>
      <Button className="ml-2" onClick={handleClickDownload} size={"icon"} variant={"outline"}>
        <Download aria-hidden className="size-4" />
      </Button>

      {isAlertOpen && (
        <AlertDialog onOpenChange={setIsAlertOpen} open={isAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Download Options</AlertDialogTitle>
              <AlertDialogDescription>
                The table has active filters. Would you like to download the currently filtered data
                or the entire original dataset?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDownloadFilteredData}>
                Download Filtered
              </AlertDialogAction>
              <AlertDialogAction onClick={handleDownloadOriginalData}>
                Download Original
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
