"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";

type SidebarItem = {
  id: string;
  title: string;
  content: ReactNode;
};

// Cards abertos por página, guardados fora do React: se a árvore remontar (ex.:
// atualização dos dados do servidor depois de uma ação), o card continua aberto.
const cardsAbertos = new Map<string, boolean>();

function CardDaSidebar({ chave, item }: { chave: string; item: SidebarItem }) {
  const [aberto, setAberto] = useState(() => cardsAbertos.get(chave) ?? false);

  return (
    <Collapsible
      className="group/sidebar-card w-full min-w-0 max-w-full overflow-hidden rounded-lg border bg-card"
      onOpenChange={(open) => {
        cardsAbertos.set(chave, open);
        setAberto(open);
      }}
      open={aberto}
    >
      <CollapsibleTrigger className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left">
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open/sidebar-card:rotate-180" />
        <span className="min-w-0 flex-1 whitespace-normal break-normal text-sm font-medium text-foreground">
          {item.title}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "border-t",
          "[&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 [&>section]:shadow-none",
          "[&>section>div:first-child]:hidden",
          "[&>section>div:last-child]:p-3 [&>section>div:last-child]:sm:p-4",
          "[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none",
        )}
      >
        {item.content}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DetalhesSidebarMobile({ items }: { items: SidebarItem[] }) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (!isMobile) {
    return (
      // Rolagem própria: com sidebar mais alta que a tela, só o sticky deixava o fim dela
      // inacessível até o conteúdo principal acabar.
      <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start scrollbar-fina lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:pl-6 lg:pr-3 lg:pb-1">
        {items.map((item) => item.content)}
      </aside>
    );
  }

  return (
    <aside className="order-first w-full min-w-0 max-w-full space-y-2 overflow-x-clip">
      {items.map((item) => (
        <CardDaSidebar chave={`${pathname}:${item.id}`} item={item} key={item.id} />
      ))}
    </aside>
  );
}
