import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface EntityLabels {
  singular: string;
  plural: string;
}

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const entity = (table.options.meta as { entity?: EntityLabels })?.entity ?? {
    singular: "linha",
    plural: "linhas",
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPageRows = table.getRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between gap-3 p-1 sm:flex-row sm:gap-8",
        className,
      )}
      {...props}
    >
      {/* Contagem de linhas */}
      <p className="w-full text-center text-muted-foreground text-sm sm:w-auto sm:text-left">
        {selectedRows > 0
          ? `${selectedRows} de ${totalRows} ${entity.plural} selecionadas.`
          : `Mostrando ${currentPageRows} de ${totalRows} ${entity.plural}`}
      </p>

      {/* Controles */}
      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6 lg:gap-8">
        {/* Linhas por página */}
        <div className="flex items-center gap-2">
          <p className="hidden whitespace-nowrap font-medium text-sm sm:block">Linhas por página</p>
          <Select
            onValueChange={(value) => table.setPageSize(Number(value))}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Página X de Y + botões de navegação agrupados */}
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap font-medium text-sm">
            {table.getState().pagination.pageIndex + 1}{" "}
            <span className="text-muted-foreground">/ {table.getPageCount()}</span>
          </span>

          <div className="flex items-center gap-1">
            <Button
              aria-label="Ir para a primeira página"
              className="size-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              size="icon"
              variant="outline"
            >
              <ChevronsLeft />
            </Button>
            <Button
              aria-label="Ir para a página anterior"
              className="size-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon"
              variant="outline"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Ir para a próxima página"
              className="size-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon"
              variant="outline"
            >
              <ChevronRight />
            </Button>
            <Button
              aria-label="Ir para a última página"
              className="size-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              size="icon"
              variant="outline"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
