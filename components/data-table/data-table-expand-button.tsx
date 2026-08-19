"use client";

import type { Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";

interface DataTableExpandButtonProps<TData> {
  row: Row<TData>;
}

export function DataTableExpandButton<TData>({ row }: DataTableExpandButtonProps<TData>) {
  if (!row.getCanExpand()) {
    return null;
  }

  return (
    <Button
      aria-expanded={row.getIsExpanded()}
      aria-label={row.getIsExpanded() ? "Encolher linha" : "Expandir linha"}
      className="size-7 text-muted-foreground shadow-none"
      onClick={row.getToggleExpandedHandler()}
      size="icon"
      variant="ghost"
    >
      {row.getIsExpanded() ? (
        <ChevronUp aria-hidden="true" className="opacity-60" size={16} strokeWidth={2} />
      ) : (
        <ChevronDown aria-hidden="true" className="opacity-60" size={16} strokeWidth={2} />
      )}
    </Button>
  );
}
