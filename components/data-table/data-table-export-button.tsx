"use client";

import type { Column, Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { LIMITE_EXPORTACAO } from "@/lib/utils/data-table-params";
import { Button } from "../ui/button";
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

const DATA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function valorDaCelula(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return formatoDataHora.format(valor);
  // Excel pt-BR lê vírgula como separador decimal.
  if (typeof valor === "number") return String(valor).replace(".", ",");
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "string" && DATA_ISO.test(valor)) {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? valor : formatoDataHora.format(data);
  }
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function convertToCSV<TData>(data: TData[], columns: Column<TData, unknown>[]): string {
  const separator = ";"; // Excel PT-BR espera ponto e vírgula
  const aspas = (texto: string) => `"${texto.replace(/"/g, '""')}"`;

  const header = columns
    .map((column) => {
      const columnDef = column.columnDef;
      const label =
        typeof columnDef.header === "string"
          ? columnDef.header
          : (columnDef.meta?.label ?? column.id);
      return aspas(label);
    })
    .join(separator);

  const rows = data.map((row, index) =>
    columns
      .map((column) => {
        const cellValue = column.accessorFn
          ? column.accessorFn(row, index)
          : (row as Record<string, unknown>)[column.id];
        return aspas(valorDaCelula(cellValue));
      })
      .join(separator),
  );

  return `${header}\n${rows.join("\n")}`;
}

interface DataTableDownloadCsvButtonProps<TData> {
  table: Table<TData>;
}

export function DataTableExportButton<TData>({ table }: DataTableDownloadCsvButtonProps<TData>) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [exportando, iniciar] = useTransition();
  const exportarNoServidor = table.options.meta?.exportar;
  const fileName = `${table.options.meta?.exportFileName ?? "tabela"}.csv`;

  const downloadData = useCallback(
    (dataToExport: TData[]) => {
      const visibleColumns = table
        .getAllLeafColumns()
        .filter((col) => col.getIsVisible() && typeof col.accessorFn !== "undefined");

      if (dataToExport.length === 0) {
        toast.info("Nenhuma linha para exportar.");
        return;
      }

      const csvData = convertToCSV(dataToExport, visibleColumns as Column<TData, unknown>[]);

      // BOM + UTF-8 para acentos + separador correto
      const blob = new Blob([`﻿${csvData}`], {
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

  const baixarComTeto = useCallback(
    (linhas: TData[], total: number) => {
      downloadData(linhas.slice(0, LIMITE_EXPORTACAO));
      if (total > LIMITE_EXPORTACAO) {
        toast.warning(
          `Exportadas as primeiras ${LIMITE_EXPORTACAO} de ${total} linhas. Use os filtros para reduzir o resultado.`,
        );
      }
    },
    [downloadData],
  );

  const handleDownloadFilteredData = useCallback(() => {
    setIsAlertOpen(false);

    // Tabela paginada no servidor: a tela só tem a página atual — busca todas as linhas que
    // passam pelos filtros da URL.
    if (exportarNoServidor) {
      iniciar(async () => {
        const resultado = await exportarNoServidor(window.location.search).catch(() => ({
          success: false as const,
          errorMessage: "Não foi possível exportar a tabela.",
        }));
        if (!resultado.success) {
          toast.error(resultado.errorMessage);
          return;
        }
        baixarComTeto(resultado.linhas, resultado.total);
      });
      return;
    }

    const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
    baixarComTeto(filteredRows, filteredRows.length);
  }, [table, exportarNoServidor, baixarComTeto]);

  const handleDownloadOriginalData = useCallback(() => {
    setIsAlertOpen(false);
    const originalRows = table.getCoreRowModel().rows.map((row) => row.original);
    baixarComTeto(originalRows, originalRows.length);
  }, [table, baixarComTeto]);

  const handleClickDownload = useCallback(() => {
    const { columnFilters, globalFilter } = table.getState();
    const isFiltered = columnFilters.length > 0 || !!globalFilter;

    // No servidor a exportação sempre segue os filtros da URL; não há "dados originais" na tela.
    if (isFiltered && !exportarNoServidor) {
      setIsAlertOpen(true);
    } else {
      handleDownloadFilteredData();
    }
  }, [table, exportarNoServidor, handleDownloadFilteredData]);

  return (
    <>
      <Button
        aria-label="Exportar CSV"
        className="ml-2"
        disabled={exportando}
        onClick={handleClickDownload}
        size={"icon"}
        title="Exportar CSV"
        variant={"outline"}
      >
        <Download aria-hidden className="size-4" />
      </Button>

      {isAlertOpen && (
        <AlertDialog onOpenChange={setIsAlertOpen} open={isAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exportar tabela</AlertDialogTitle>
              <AlertDialogDescription>
                A tabela tem filtros ativos. Exportar só as linhas filtradas ou todas?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDownloadOriginalData}>Todas</AlertDialogAction>
              <AlertDialogAction onClick={handleDownloadFilteredData}>Filtradas</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
