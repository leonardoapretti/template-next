"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { routes } from "@/lib/utils/routes";
import { cn } from "@/lib/utils/tailwind";

type BottomNavItem = {
  title: string;
  icon: ReactNode;
  highlight?: boolean;
} & (
  | { url: string; onClick?: never; menuTrigger?: never; renderTrigger?: never }
  | { url?: never; onClick: () => void; menuTrigger?: never; renderTrigger?: never }
  | { url?: never; onClick?: never; menuTrigger: true; renderTrigger?: never }
  | {
      url?: never;
      onClick?: never;
      menuTrigger?: never;
      // Delega o elemento clicável pro chamador (ex.: envolver num
      // DropdownMenuTrigger) — recebe o conteúdo interno já pronto
      // (ícone + label) e a className padrão do item.
      renderTrigger: (content: ReactNode, className: string) => ReactNode;
    }
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

function BottomNavItem({
  item,
  active,
  onClick,
}: {
  item: BottomNavItem;
  active: boolean;
  onClick: () => void;
}) {
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
    "flex h-16 min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
    !item.highlight && active && "text-primary-text",
    item.highlight && "text-foreground",
  );

  if (item.renderTrigger) {
    return <div className="contents">{item.renderTrigger(content, className)}</div>;
  }

  if (item.url) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        href={item.url}
        className={className}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-expanded={item.menuTrigger ? active : undefined}
      type="button"
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}

export function SidebarBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  const { openMobile, setOpenMobile } = useSidebar();
  const activeUrl = resolveActiveUrl(pathname, items);

  // Fumadocs (DocsLayout) já tem sua própria navegação mobile completa
  // (sidebar, busca, toggle) — a barra fixa da nossa sidebar sobrepõe a
  // dele se renderizada junto, então some aqui dentro.
  if (urlMatchesPathname(pathname, routes.dashboard.docs)) {
    return null;
  }

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
      aria-label="Navegação principal"
      data-slot="sidebar-bottom-nav"
      // Altura fixa de 4rem no navegador: a área segura varia com a barra de
      // endereço ao rolar e, somada aqui, empurrava os ícones e abria um vão
      // embaixo das páginas. Só no app instalado (standalone, onde o
      // indicador do sistema cobre a base) ela entra — na barra e no padding
      // do <main>, sempre juntos. transform-gpu mantém a barra na própria
      // camada e evita repintar a cada frame de rolagem.
      className="fixed inset-x-0 bottom-0 z-[60] flex h-16 transform-gpu items-stretch justify-around border-t bg-background md:hidden print:hidden [@media(display-mode:standalone)]:h-[calc(4rem+env(safe-area-inset-bottom))] [@media(display-mode:standalone)]:pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const active =
          (Boolean(item.url) && item.url === activeUrl) || (item.menuTrigger && openMobile);

        return (
          <BottomNavItem
            key={item.title}
            item={item}
            active={Boolean(active)}
            onClick={() => handleClick(item)}
          />
        );
      })}
    </nav>
  );
}
