import { type Cell, flexRender, type Header, type Row } from "@tanstack/react-table";
import { ChevronDown, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils/tailwind";
import { Checkbox } from "../ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { getCommonPinningStyles } from "./config/data-table";
import { DataTableExpandButton } from "./data-table-expand-button";
import { DataTablePagination } from "./data-table-pagination";
import type { DataTableServerProps } from "./types/data-table-types";

function isRowHighlighted<TData>(
  row: Row<TData>,
  highlightedId: DataTableServerProps<TData>["highlightedId"],
) {
  return (
    highlightedId !== undefined &&
    highlightedId !== null &&
    row.original &&
    typeof row.original === "object" &&
    "id" in row.original &&
    row.original.id === highlightedId
  );
}

function isActionColumn<TData>(cell: Cell<TData, unknown> | Header<TData, unknown>) {
  return cell.column.columnDef.meta?.isAction;
}

function getActionColumnClassName<TData>(cell: Cell<TData, unknown> | Header<TData, unknown>) {
  if (!isActionColumn(cell)) {
    return undefined;
  }

  if (cell.column.id === "select") {
    return undefined;
  }

  return "pr-4 text-right last:pr-5 [&>*]:ml-auto";
}

function getRowNavigationHandler(href: string | undefined, navigate: (href: string) => void) {
  if (!href) {
    return undefined;
  }

  return () => {
    if (window.getSelection()?.toString()) return;
    navigate(href);
  };
}

function getCardHeaderClassName(hasHref: boolean, detailsOpen: boolean) {
  return cn(
    "flex flex-1 min-w-0 items-center gap-3 p-4 text-left",
    hasHref && "cursor-pointer",
    !detailsOpen ? "pb-4" : "pb-3",
  );
}

function getCellLabel<TData>(cell: Cell<TData, unknown>) {
  return (
    cell.column.columnDef.meta?.label ??
    (typeof cell.column.columnDef.header === "string"
      ? cell.column.columnDef.header
      : cell.column.id)
  );
}

function DataTableActionCells<TData>({ cells }: { cells: Cell<TData, unknown>[] }) {
  if (cells.length === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center self-stretch px-3 py-3"
      onClick={(e) => e.stopPropagation()}
    >
      {cells.map((cell) => (
        <div className="flex items-center justify-center" key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
      ))}
    </div>
  );
}

export function DataTableServer<TData>({
  table,
  actionBar,
  children,
  className,
  highlightedId,
  ...props
}: DataTableServerProps<TData>) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const renderExpandedContent = table.options.meta?.renderExpandedContent;
  const getRowHref = table.options.meta?.getRowHref;
  const canExpandRows = table.getCanSomeRowsExpand();

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-3xl border bg-card/90 p-3 shadow-sm backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}

      {isMobile ? (
        <DataTableCardList
          highlightedId={highlightedId}
          getRowHref={getRowHref}
          renderExpandedContent={renderExpandedContent}
          table={table}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-background/45">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="bg-muted/35 hover:bg-muted/45" key={headerGroup.id}>
                  {canExpandRows && <TableHead className="w-7" />}
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className={getActionColumnClassName(header)}
                      colSpan={header.colSpan}
                      key={header.id}
                      style={{
                        ...getCommonPinningStyles({ column: header.column }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getPaginationRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    {(() => {
                      const rowHref = getRowHref?.(row);

                      return (
                        <TableRow
                          className={cn(
                            isRowHighlighted(row, highlightedId) && "animate-table-row-highlight",
                            rowHref && "cursor-pointer",
                          )}
                          data-state={row.getIsSelected() && "selected"}
                          onClick={getRowNavigationHandler(rowHref, (href) => router.push(href))}
                        >
                          {canExpandRows && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {row.getCanExpand() && <DataTableExpandButton row={row} />}
                            </TableCell>
                          )}
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              className={getActionColumnClassName(cell)}
                              key={cell.id}
                              style={{
                                ...getCommonPinningStyles({ column: cell.column }),
                              }}
                              onClick={
                                cell.column.columnDef.meta?.isAction
                                  ? (e) => e.stopPropagation()
                                  : undefined
                              }
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })()}

                    {row.getIsExpanded() && renderExpandedContent && (
                      <TableRow className="w-full">
                        <TableCell
                          colSpan={row.getVisibleCells().length + (canExpandRows ? 1 : 0)}
                          className="w-full p-0"
                        >
                          <div className="w-full min-w-full">{renderExpandedContent(row)}</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-44 text-center" colSpan={table.getAllColumns().length}>
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <SearchX className="size-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Nenhum resultado</p>
                      <p className="text-xs">Ajuste os filtros ou cadastre um novo registro.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border bg-muted/25 px-3 py-2">
          <DataTablePagination table={table} />
        </div>
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card list — layout mobile
// ---------------------------------------------------------------------------

interface DataTableCardListProps<TData> {
  table: DataTableServerProps<TData>["table"];
  highlightedId?: DataTableServerProps<TData>["highlightedId"];
  renderExpandedContent?: (row: Row<TData>) => React.ReactNode;
  getRowHref?: (row: Row<TData>) => string | undefined;
}

function DataTableCardList<TData>({
  table,
  highlightedId,
  renderExpandedContent,
  getRowHref,
}: DataTableCardListProps<TData>) {
  const rows = table.getPaginationRowModel().rows;
  const canSelectRows = Boolean(table.getColumn("select"));

  if (!rows.length) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/35 px-4 py-12 text-center text-sm text-muted-foreground">
        <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="size-5" />
        </div>
        <p className="font-medium text-foreground">Nenhum resultado</p>
        <p className="mt-1 text-xs">Ajuste os filtros ou cadastre um novo registro.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {canSelectRows && (
        <div className="flex items-center gap-2 px-1 py-1 text-sm text-muted-foreground">
          <Checkbox
            aria-label="Selecionar todos os documentos desta página"
            checked={table.getIsAllPageRowsSelected()}
            id="data-table-card-select-all"
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
          <label htmlFor="data-table-card-select-all">Selecionar todos</label>
        </div>
      )}

      {rows.map((row) => (
        <DataTableCard
          highlightedId={highlightedId}
          getRowHref={getRowHref}
          key={row.id}
          renderExpandedContent={renderExpandedContent}
          row={row}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card individual
// ---------------------------------------------------------------------------

interface DataTableCardProps<TData> {
  row: Row<TData>;
  highlightedId?: DataTableServerProps<TData>["highlightedId"];
  renderExpandedContent?: (row: Row<TData>) => React.ReactNode;
  getRowHref?: (row: Row<TData>) => string | undefined;
}

function DataTableCard<TData>({
  row,
  highlightedId,
  renderExpandedContent,
  getRowHref,
}: DataTableCardProps<TData>) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const visibleCells = row.getVisibleCells();

  const actionCells = visibleCells.filter((cell) => cell.column.columnDef.meta?.isAction);
  const dataCells = visibleCells.filter((cell) => !cell.column.columnDef.meta?.isAction);
  const mobileSummaryColumnIds = row.getAllCells()[0]?.getContext().table.options
    .meta?.mobileSummaryColumnIds;
  const summaryCells = mobileSummaryColumnIds?.length
    ? mobileSummaryColumnIds
        .map((columnId) => dataCells.find((cell) => cell.column.id === columnId))
        .filter((cell): cell is Cell<TData, unknown> => Boolean(cell))
    : dataCells.slice(0, 1);
  const summaryCellIds = new Set(summaryCells.map((cell) => cell.id));

  const bodyCells = dataCells.filter((cell) => !summaryCellIds.has(cell.id));
  const isHighlighted = isRowHighlighted(row, highlightedId);
  const hasDetails = bodyCells.length > 0 || Boolean(renderExpandedContent);
  const rowHref = getRowHref?.(row);

  function handleToggleDetails() {
    if (window.getSelection()?.toString()) return;
    const next = !detailsOpen;
    setDetailsOpen(next);
    if (row.getCanExpand()) {
      row.toggleExpanded(next);
    }
  }

  function handleNavigate() {
    if (!rowHref || window.getSelection()?.toString()) return;
    router.push(rowHref);
  }

  return (
    <div
      className={cn(
        "border-border rounded-2xl border bg-card/90 shadow-sm transition-colors",
        row.getIsSelected() && "border-primary/50 bg-primary/5",
        isHighlighted && "animate-table-row-highlight",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={getCardHeaderClassName(Boolean(rowHref), detailsOpen)}>
          {hasDetails && (
            <button
              aria-expanded={detailsOpen}
              aria-label={detailsOpen ? "Encolher linha" : "Expandir linha"}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
              onClick={handleToggleDetails}
              type="button"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  detailsOpen && "rotate-180",
                )}
              />
            </button>
          )}
          <button
            className="wrap-break-word min-w-0 flex-1 text-left text-sm font-medium text-foreground disabled:cursor-default"
            disabled={!rowHref}
            onClick={handleNavigate}
            type="button"
          >
            {summaryCells.map((cell, index) => (
              <Fragment key={cell.id}>
                {index > 0 && <span className="px-1 text-muted-foreground">-</span>}
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Fragment>
            ))}
          </button>
        </div>

        <DataTableActionCells cells={actionCells} />
      </div>

      {/* Corpo colapsável */}
      {hasDetails && detailsOpen && (
        <div className="border-t border-border px-4 py-3">
          {bodyCells.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              {bodyCells.map((cell) => {
                return (
                  <Fragment key={cell.id}>
                    <dt className="self-center whitespace-nowrap text-xs text-muted-foreground">
                      {getCellLabel(cell)}
                    </dt>
                    <dd className="wrap-break-word text-sm text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </dd>
                  </Fragment>
                );
              })}
            </dl>
          )}

          {renderExpandedContent && (
            <div className={cn(bodyCells.length > 0 && "mt-3 border-t border-border pt-3")}>
              {renderExpandedContent(row)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
