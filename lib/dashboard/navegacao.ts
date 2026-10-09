// Regras puras do menu lateral (sem React): qual destino está ativo, o que
// esconder por permissão e quando uma seção é só um link. Usado por
// components/sidebar/nav-main.tsx e por testes.
import type { ReactNode } from "react";

export type NavSubItem = { title: string; url: string };

export type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
  // Legado: o item ativo agora vem da rota atual.
  isActive?: boolean;
  items?: NavSubItem[];
};

export type NavGroup = { label?: string; items: NavItem[] };

function casa(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

// O destino ativo é o de URL mais específica que casa com a rota — assim
// /dashboard/produtos/estoque marca "Estoque", e não "Produtos" nem "Início".
export function urlAtiva(pathname: string, urls: string[]): string | null {
  let melhor: string | null = null;

  for (const url of urls) {
    if (casa(pathname, url) && (melhor === null || url.length > melhor.length)) {
      melhor = url;
    }
  }

  return melhor;
}

// Tira o que o usuário não pode abrir. A seção que perde o próprio link
// aponta pro primeiro destino que sobrou; a que perde todos os subitens (ou o
// link sem ter subitens) some, assim como o grupo que fica vazio.
export function filtrarPorAcesso(groups: NavGroup[], semAcesso: ReadonlySet<string>): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item) => {
        const subitens = item.items?.filter((sub) => !semAcesso.has(sub.url));

        if (item.items?.length && !subitens?.length) return [];

        const url = semAcesso.has(item.url) ? subitens?.[0]?.url : item.url;

        return url ? [{ ...item, url, items: subitens }] : [];
      }),
    }))
    .filter((group) => group.items.length > 0);
}

// Seção com um único destino (ou só o próprio link repetido) é um link
// simples: sem chevron e sem clique extra.
export function subitensDaSecao(item: NavItem): NavSubItem[] {
  const subitens = item.items ?? [];

  return subitens.length === 1 && subitens[0].url === item.url ? [] : subitens;
}

// Medidas do flyout da sidebar recolhida (px): cabeçalho com o nome da seção,
// cada subitem (h-9) e o respiro interno.
const ALTURA_CABECALHO_FLYOUT = 32;
const ALTURA_SUBITEM_FLYOUT = 36;
const RESPIRO_FLYOUT = 16;
const MARGEM_DA_JANELA = 8;

// Alinha o flyout ao topo do ícone, mas o sobe o suficiente para não passar do
// fim da janela. Calculado só com números (sem medir o DOM), então abrir o
// flyout não força layout.
export function topoDoFlyout(
  topoDoIcone: number,
  subitens: number,
  alturaDaJanela: number,
): number {
  const altura = ALTURA_CABECALHO_FLYOUT + subitens * ALTURA_SUBITEM_FLYOUT + RESPIRO_FLYOUT;
  const maximo = alturaDaJanela - altura - MARGEM_DA_JANELA;

  return Math.max(MARGEM_DA_JANELA, Math.min(topoDoIcone, maximo));
}

// A URL ativa só quando pertence a esta seção; null nas demais. Cada seção
// recebe só o que lhe diz respeito, então trocar de página re-renderiza apenas
// a seção que saiu e a que entrou.
export function ativaDaSecao(item: NavItem, ativa: string | null): string | null {
  if (ativa === null) return null;

  return item.url === ativa || subitensDaSecao(item).some((sub) => sub.url === ativa)
    ? ativa
    : null;
}
