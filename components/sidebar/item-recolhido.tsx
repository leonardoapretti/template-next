"use client";

import Link from "next/link";
import { memo, type RefObject } from "react";
import { type NavItem, subitensDaSecao } from "@/lib/dashboard/navegacao";
import { cn } from "@/lib/utils";

const CLASSE_TILE =
  "flex w-full flex-col items-center gap-1 rounded-md px-1 py-2 text-xs leading-tight font-medium tracking-tight text-sidebar-foreground outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-5 [&_svg]:shrink-0";

type ItemRecolhidoProps = {
  item: NavItem;
  // URL ativa, só quando pertence a esta seção (null nas demais: assim, ao
  // navegar, só as seções envolvidas renderizam de novo).
  ativa: string | null;
  flyoutAberto: boolean;
  onEntrar: (item: NavItem, elemento: HTMLElement) => void;
  onSair: () => void;
  onTeclado: (item: NavItem, elemento: HTMLElement) => void;
};

// Item da sidebar recolhida: ícone com o nome embaixo. Clicar vai direto para a
// seção; o flyout com os subitens é controlado pelo NavMain (um só para toda a
// sidebar, sem portal nem biblioteca de posicionamento).
export const ItemRecolhido = memo(function ItemRecolhido({
  item,
  ativa,
  flyoutAberto,
  onEntrar,
  onSair,
  onTeclado,
}: ItemRecolhidoProps) {
  const temSubitens = subitensDaSecao(item).length > 0;
  const secaoAtiva = ativa !== null;

  return (
    <Link
      aria-current={secaoAtiva ? "page" : undefined}
      aria-expanded={temSubitens ? flyoutAberto : undefined}
      className={cn(
        CLASSE_TILE,
        (secaoAtiva || flyoutAberto) && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
      href={item.url}
      onKeyDown={
        temSubitens
          ? (evento) => {
              if (evento.key === "ArrowRight") {
                evento.preventDefault();
                onTeclado(item, evento.currentTarget);
              }
            }
          : undefined
      }
      onMouseEnter={temSubitens ? (evento) => onEntrar(item, evento.currentTarget) : undefined}
      onMouseLeave={temSubitens ? onSair : undefined}
    >
      {item.icon}
      <span className="w-full truncate text-center">{item.title}</span>
    </Link>
  );
});

type FlyoutProps = {
  item: NavItem;
  ativa: string | null;
  topo: number;
  focarPrimeiro: boolean;
  gatilho: RefObject<HTMLElement | null>;
  onEntrar: () => void;
  onSair: () => void;
  onFechar: () => void;
};

// Lista dos subitens ao lado do ícone. Encostado na barra (o respiro é
// padding, não espaço vazio), então o mouse atravessa sem fechar.
export function FlyoutSubitens({
  item,
  ativa,
  topo,
  focarPrimeiro,
  gatilho,
  onEntrar,
  onSair,
  onFechar,
}: FlyoutProps) {
  return (
    <nav
      aria-label={item.title}
      className="fixed left-(--sidebar-width-icon) z-50 pl-2"
      onKeyDown={(evento) => {
        if (evento.key === "Escape") {
          onFechar();
          gatilho.current?.focus();
        }
      }}
      onMouseEnter={onEntrar}
      onMouseLeave={onSair}
      style={{ top: topo }}
    >
      <div className="flex w-56 flex-col gap-0.5 rounded-lg bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10">
        <p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">{item.title}</p>

        {subitensDaSecao(item).map((sub, indice) => (
          <Link
            aria-current={sub.url === ativa ? "page" : undefined}
            autoFocus={focarPrimeiro && indice === 0}
            className={cn(
              "flex h-9 items-center rounded-md px-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
              sub.url === ativa && "bg-accent font-medium text-accent-foreground",
            )}
            href={sub.url}
            key={sub.url}
            onClick={onFechar}
          >
            {sub.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
