"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";

type SidebarItem = {
  id: string;
  title: string;
  content: ReactNode;
};

export function DetalhesSidebarMobile({ items }: { items: SidebarItem[] }) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        {items.map((item) => item.content)}
      </aside>
    );
  }

  return (
    <aside className="order-first w-full min-w-0 max-w-full space-y-3 overflow-x-clip">
      {items.map((item) => (
        <Collapsible
          className="group/sidebar-card w-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-card/90 shadow-sm"
          key={item.id}
        >
          <CollapsibleTrigger className="flex w-full min-w-0 items-center gap-3 p-4 text-left">
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open/sidebar-card:rotate-180" />
            <span className="min-w-0 flex-1 whitespace-normal break-normal text-sm font-semibold uppercase text-muted-foreground sm:tracking-wide">
              {item.title}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent
            className={cn(
              "border-t",
              "[&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-4 [&>section]:shadow-none",
              "[&>section>div:first-child]:hidden",
              "[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-4 [&>div]:shadow-none",
            )}
          >
            {item.content}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </aside>
  );
}
