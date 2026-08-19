import type { ColumnSort, Row, RowData, Table as TanstackTable } from "@tanstack/react-table";

import type { DataTableConfig } from "../config/data-table-config";
import type { FilterItemSchema } from "../config/parsers";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
    hidden?: boolean;
    isAction?: boolean;
  }

  interface TableMeta<TData extends RowData> {
    entity?: {
      singular: string;
      plural: string;
    };
    renderExpandedContent?: (row: Row<TData>) => React.ReactNode;
    getRowHref?: (row: Row<TData>) => string | undefined;
    mobileSummaryColumnIds?: string[];

    //  Novo: suporte para filtros customizados
    renderFilters?: () => React.ReactNode;

    advancedFilterKeys?: string[];
    enableExportButton: boolean;
  }
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}

export interface DataTableServerProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  highlightedId?: number;
}

export interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
}
