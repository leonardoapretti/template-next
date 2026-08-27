"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils/tailwind";

type BottomNavItem = {
  title: string;
  icon: ReactNode;
  highlight?: boolean;
} & (
  | { url: string; onClick?: never; menuTrigger?: never }
  | { url?: never; onClick: () => void; menuTrigger?: never }
  | { url?: never; onClick?: never; menuTrigger: true }
);

function urlMatchesPathname(pathname: string, url: string) {
  if (url === "/") {
    return pathname === "/";
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

// Entre itens cujo url dá match por prefixo (ex.: "/dashboard" e "/dashboard/pacientes"
// batem ambos em "/dashboard/pacientes"), só o mais específico deve ficar ativo.
function resolveActiveUrl(pathname: string, items: BottomNavItem[]) {
  let activeUrl: string | undefined;

  for (const item of items) {
    if (!item.url || !urlMatchesPathname(pathname, item.url)) {
      continue;
    }
    if (!activeUrl || item.url.length > activeUrl.length) {
      activeUrl = item.url;
    }
  }

  return activeUrl;
}

export function SidebarBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();
  const activeUrl = resolveActiveUrl(pathname, items);

  function handleClick(item: BottomNavItem) {
    if (item.menuTrigger) {
      setOpenMobile(!openMobile);
      return;
    }
    if (openMobile) {
      setOpenMobile(false);
    }
    item.onClick?.();
  }

  return (
    <nav
      data-slot="sidebar-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-[60] flex h-16 items-stretch justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      {items.map((item) => {
        const active =
          (Boolean(item.url) && item.url === activeUrl) || (item.menuTrigger && openMobile);

        const content = item.highlight ? (
          <>
            <span className="-mt-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md [&_svg]:size-6">
              {item.icon}
            </span>
            <span className="truncate">{item.title}</span>
          </>
        ) : (
          <>
            <span className="flex items-center justify-center [&_svg]:size-5">{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </>
        );

        const className = cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
          !item.highlight && active && "text-primary",
          item.highlight && "text-foreground",
        );

        if (item.url) {
          return (
            <Link
              key={item.title}
              href={item.url}
              className={className}
              onClick={() => handleClick(item)}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.title}
            type="button"
            onClick={() => handleClick(item)}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
