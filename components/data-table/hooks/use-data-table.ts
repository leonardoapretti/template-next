"use client";

import { type QueryKey, useQuery } from "@tanstack/react-query";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  type UseQueryStateOptions,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { getSortingStateParser } from "../config/parsers";
import type { ExtendedColumnSort } from "../types/data-table-types";
import { useDebouncedCallback } from "./use-debounced-callback";

export const PAGE_KEY = "pagina";
export const PER_PAGE_KEY = "porPagina";
export const SORT_KEY = "ordenar";
export const SEARCH_KEY = "busca";
export const COLUMN_VISIBILITY_KEY = "colunas";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
const NON_ALPHANUMERIC_REGEX = /[^a-zA-Z0-9]/;
const NON_ALPHANUMERIC_SPLIT_REGEX = /[^a-zA-Z0-9]+/;
const ACTION_COLUMN_SIZE = 56;

interface UseDataTableProps<TData>
  extends Omit<
    TableOptions<TData>,
    "state" | "getCoreRowModel" | "manualFiltering" | "manualPagination" | "manualSorting"
  > {
  pageCount?: number;
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  enableGlobalFilter?: boolean;
  enableExpanding?: boolean;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderExpandedContent?: (row: Row<TData>) => React.ReactNode;
  getRowHref?: (row: Row<TData>) => string | undefined;
  mobileSummaryColumnIds?: string[];
  entity?: {
    singular: string;
    plural: string;
  };

  /** Custom Props */
  // Filtros customizados (renderizados fora da tabela)
  renderFilters?: () => React.ReactNode;
  // Backend integration com Cache
  queryKey?: QueryKey;
  queryFn?: (filterValue: unknown) => Promise<TData[]>;
  filterKeyToWatch?: string;
  // biome-ignore lint/suspicious/noExplicitAny: nao da pra tipar
  filterParser?: Parser<any>;
  staleTime?: number;
  //Habilitar botão exportar
  enableExportButton?: boolean;
  // Informa se o usuário pode editar o projeto em questão
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount: initialPageCount,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    scroll = false,
    shallow = true,
    startTransition,
    manualPagination = false,
    manualFiltering = false,
    manualSorting = false,
    enableGlobalFilter = false,
    enableExpanding = false,
    getRowCanExpand,
    renderExpandedContent,
    getRowHref,
    mobileSummaryColumnIds,
    entity = { singular: "linha", plural: "linhas" },
    data: initialData = [],
    renderFilters,
    queryKey,
    queryFn,
    filterKeyToWatch,
    filterParser = parseAsString.withDefault(""),
    staleTime = 5 * 60 * 1000,
    enableExportButton = true,
    ...tableProps
  } = props;

  const queryStateOptions = useMemo<Omit<UseQueryStateOptions<string>, "parse">>(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [history, scroll, shallow, throttleMs, debounceMs, clearOnDefault, startTransition],
  );

  const [filterValue] = useQueryState(filterKeyToWatch ?? "", {
    ...queryStateOptions,
    ...filterParser,
  });

  const query = useQuery({
    queryKey: [queryKey, { [filterKeyToWatch ?? "filter"]: filterValue }],
    queryFn: () => (queryFn ? queryFn(filterValue) : Promise.resolve([])),
    staleTime,
    enabled: !!(queryKey && queryFn && filterKeyToWatch),
  });

  const data = query.data ?? initialData;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );

  const defaultColumnVisibility = useMemo<VisibilityState>(() => {
    const initialVisibility = initialState?.columnVisibility ?? {};
    const hiddenColumns = columns.reduce((acc, column) => {
      const columnId = column.id as string;
      if (column.meta?.hidden) {
        acc[columnId] = false;
      }
      return acc;
    }, {} as VisibilityState);
    return { ...initialVisibility, ...hiddenColumns };
  }, [columns, initialState?.columnVisibility]);

  const [columnVisibility, setColumnVisibility] = useQueryState(
    COLUMN_VISIBILITY_KEY,
    parseAsJson<VisibilityState>((v) => v as VisibilityState)
      .withOptions(queryStateOptions)
      .withDefault(defaultColumnVisibility),
  );

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );

  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: page - 1, pageSize: perPage }),
    [page, perPage],
  );

  const onPaginationChange = useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const newPagination =
        typeof updaterOrValue === "function" ? updaterOrValue(pagination) : updaterOrValue;
      if (page !== newPagination.pageIndex + 1) {
        setPage(newPagination.pageIndex + 1);
      }
      if (perPage !== newPagination.pageSize) {
        setPerPage(newPagination.pageSize);
      }
    },
    [pagination, setPage, setPerPage, page, perPage],
  );

  const columnIds = useMemo(
    () => new Set(columns.map((c) => c.id).filter(Boolean) as string[]),
    [columns],
  );

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault((initialState?.sorting ?? []) as ExtendedColumnSort<TData>[]),
  );

  const onSortingChange = useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting as SortingState)
          : updaterOrValue;
      if (JSON.stringify(sorting) !== JSON.stringify(newSorting)) {
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting],
  );

  const filterableColumns = useMemo(() => columns.filter((c) => c.enableColumnFilter), [columns]);

  const resolvedColumns = useMemo(() => {
    return columns.map((column) => {
      if (!column.meta?.isAction) {
        return column;
      }

      return {
        ...column,
        maxSize: ACTION_COLUMN_SIZE,
        minSize: ACTION_COLUMN_SIZE,
        size: ACTION_COLUMN_SIZE,
      };
    });
  }, [columns]);

  const filterParsers = useMemo(() => {
    return filterableColumns.reduce<Record<string, Parser<string> | Parser<string[]>>>(
      (acc, column) => {
        if (column.meta?.options || column.meta?.variant === "dateRange") {
          acc[column.id ?? ""] = parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
            queryStateOptions,
          );
        } else {
          acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
        }
        return acc;
      },
      {},
    );
  }, [filterableColumns, queryStateOptions]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback((values: typeof filterValues) => {
    setPage(1);
    setFilterValues(values);
  }, debounceMs + 100);

  const initialColumnFilters: ColumnFiltersState = useMemo(() => {
    return Object.entries(filterValues).reduce<ColumnFiltersState>((filters, [key, value]) => {
      if (value !== null) {
        let processedValue: string[] | unknown;
        if (Array.isArray(value)) {
          processedValue = value;
        } else if (typeof value === "string" && NON_ALPHANUMERIC_REGEX.test(value)) {
          processedValue = value.split(NON_ALPHANUMERIC_SPLIT_REGEX).filter(Boolean);
        } else {
          processedValue = [value];
        }
        filters.push({ id: key, value: processedValue });
      }
      return filters;
    }, []);
  }, [filterValues]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }

        const filterUpdates = next.reduce<Record<string, string | string[] | null>>(
          (acc, filter) => {
            if (filterableColumns.find((c) => c.id === filter.id)) {
              acc[filter.id] = filter.value as string | string[];
            }
            return acc;
          },
          {},
        );

        for (const prevFilter of prev) {
          if (!next.some((f) => f.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns],
  );

  const [globalFilter, setGlobalFilter] = useQueryState(
    SEARCH_KEY,
    parseAsString.withOptions(queryStateOptions).withDefault(""),
  );

  const debouncedSetGlobalFilter = useDebouncedCallback((value: string) => {
    setPage(1);
    setGlobalFilter(value || null);
  }, debounceMs);

  const onGlobalFilterChange = useCallback(
    (value: string) => {
      debouncedSetGlobalFilter(value);
    },
    [debouncedSetGlobalFilter],
  );

  let resolvedPageCount: number | undefined;
  if (manualPagination) {
    if (query.isSuccess) {
      resolvedPageCount = -1;
    } else {
      resolvedPageCount = initialPageCount;
    }
  } else {
    resolvedPageCount = undefined;
  }

  const advancedFilterKeys = useMemo(() => {
    const keys: string[] = [];
    if (filterKeyToWatch) {
      keys.push(filterKeyToWatch);
    }
    return keys;
  }, [filterKeyToWatch]);

  const table = useReactTable({
    ...tableProps,
    data,
    columns: resolvedColumns,
    pageCount: resolvedPageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter: globalFilter ?? "",
    },
    autoResetPageIndex: false,
    defaultColumn: { ...tableProps.defaultColumn, enableColumnFilter: false },
    enableRowSelection: true,
    enableExpanding,
    getRowCanExpand,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: "includesString",
    manualPagination,
    manualSorting,
    manualFiltering,
    enableGlobalFilter,
    meta: {
      ...tableProps.meta,
      entity,
      renderExpandedContent,
      getRowHref,
      mobileSummaryColumnIds,
      renderFilters,
      advancedFilterKeys,
      enableExportButton,
    },
  });

  return { table, shallow, debounceMs, throttleMs, isLoading: query.isLoading };
}
