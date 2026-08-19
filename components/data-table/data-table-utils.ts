import type { Table as TanstackTable } from "@tanstack/react-table";
// Helper function to find page index for a given row index
export function getPageIndex(rowIndex: number, pageSize: number): number {
  return Math.floor(rowIndex / pageSize);
}

// Helper function to navigate to the correct page if needed
export function navigateToPageIfNeeded<TData>(
  table: TanstackTable<TData>,
  pageIndex: number,
): void {
  if (pageIndex !== table.getState().pagination.pageIndex) {
    table.setPageIndex(pageIndex);
  }
}

// Helper function to find and navigate to highlighted row in row model
export function findInRowModel<TData>(table: TanstackTable<TData>, highlightedId: number): boolean {
  const allRows = table.getRowModel().rows;
  const rowIndex = allRows.findIndex((row) => hasHighlightedId(row.original, highlightedId));

  if (rowIndex >= 0) {
    const pageSize = table.getState().pagination.pageSize;
    const pageIndex = getPageIndex(rowIndex, pageSize);
    navigateToPageIfNeeded(table, pageIndex);
    return true;
  }
  return false;
}

// Helper function to find and navigate to highlighted row in original data
export function findInOriginalData<TData>(
  table: TanstackTable<TData>,
  highlightedId: number,
): void {
  const originalData = table.options.data;
  const dataIndex = originalData.findIndex((item: TData) => hasHighlightedId(item, highlightedId));

  if (dataIndex >= 0) {
    const pageSize = table.getState().pagination.pageSize;
    const pageIndex = getPageIndex(dataIndex, pageSize);
    navigateToPageIfNeeded(table, pageIndex);
  }
}

// Helper function to check if an item has the highlighted ID
export function hasHighlightedId<TData>(item: TData, highlightedId: number): boolean {
  return item && typeof item === "object" && "id" in item && item.id === highlightedId;
}
