import type { Column } from "@tanstack/react-table";
import type {
  ExtendedColumnFilter,
  FilterOperator,
  FilterVariant,
} from "../types/data-table-types";
import { dataTableConfig } from "./data-table-config";

const ACTION_COLUMN_SIZE = 56;

function getPinningBoxShadow<TData>(column: Column<TData>, withBorder: boolean) {
  if (!withBorder) {
    return undefined;
  }

  if (column.getIsPinned() === "left" && column.getIsLastColumn("left")) {
    return "-4px 0 4px -4px hsl(var(--border)) inset";
  }

  if (column.getIsPinned() === "right" && column.getIsFirstColumn("right")) {
    return "4px 0 4px -4px hsl(var(--border)) inset";
  }

  return undefined;
}

function getColumnWidth<TData>(column: Column<TData>) {
  const isActionColumn = Boolean(column.columnDef.meta?.isAction);
  const hasCustomSize = typeof column.columnDef.size === "number";

  if (isActionColumn && !hasCustomSize) {
    return ACTION_COLUMN_SIZE;
  }

  return column.getSize();
}

export function getCommonPinningStyles<TData>({
  column,
  withBorder = false,
}: {
  column: Column<TData>;
  withBorder?: boolean;
}): React.CSSProperties {
  const isPinned = column.getIsPinned();
  const isActionColumn = Boolean(column.columnDef.meta?.isAction);
  const hasCustomSize = typeof column.columnDef.size === "number";
  const resolvedWidth = getColumnWidth(column);
  const boxShadow = getPinningBoxShadow(column, withBorder);

  return {
    ...(boxShadow && { boxShadow }),
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? "hsl(var(--background))" : "hsl(var(--background))",
    maxWidth: isActionColumn && !hasCustomSize ? ACTION_COLUMN_SIZE : undefined,
    minWidth: resolvedWidth,
    width: resolvedWidth,
    zIndex: isPinned ? 1 : 0,
  };
}

export function getFilterOperators(filterVariant: FilterVariant) {
  const operatorMap: Record<FilterVariant, { label: string; value: FilterOperator }[]> = {
    text: dataTableConfig.textOperators,
    number: dataTableConfig.numericOperators,
    range: dataTableConfig.numericOperators,
    date: dataTableConfig.dateOperators,
    dateRange: dataTableConfig.dateOperators,
    boolean: dataTableConfig.booleanOperators,
    select: dataTableConfig.selectOperators,
    multiSelect: dataTableConfig.multiSelectOperators,
  };

  return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
  const operators = getFilterOperators(filterVariant);

  return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

export function getValidFilters<TData>(
  filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
  return filters.filter(
    (filter) =>
      filter.operator === "isEmpty" ||
      filter.operator === "isNotEmpty" ||
      (Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== "" && filter.value !== null && filter.value !== undefined),
  );
}
