"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ativaDaSecao,
  filtrarPorAcesso,
  type NavGroup,
  type NavItem,
  subitensDaSecao,
  topoDoFlyout,
  urlAtiva,
} from "@/lib/dashboard/navegacao";
import { cn } from "@/lib/utils";
import { FlyoutSubitens, ItemRecolhido } from "./item-recolhido";

export type { NavGroup, NavItem };

const CLASSE_ITEM = "h-10 gap-3 px-3 text-sm [&_svg]:size-5!";

type SecaoProps = {
  item: NavItem;
  ativa: string | null;
  isCollapsed: boolean;
  // undefined = segue a página atual; true/false = escolha manual do usuário.
  alternada: boolean | undefined;
  onAlternar: (title: string, aberta: boolean) => void;
  onNavegar: () => void;
};

const SecaoDoMenu = memo(function SecaoDoMenu({
  item,
  ativa,
  isCollapsed,
  alternada,
  onAlternar,
  onNavegar,
}: SecaoProps) {
  const subitens = subitensDaSecao(item);
  const secaoAtiva =
    ativa !== null && (item.url === ativa || subitens.some((sub) => sub.url === ativa));
  const aberta = alternada ?? secaoAtiva;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(CLASSE_ITEM, secaoAtiva && "font-semibold")}
        isActive={secaoAtiva && (subitens.length === 0 || ativa === item.url)}
        render={<Link href={item.url} onClick={onNavegar} />}
        // O tooltip só faz sentido com a sidebar recolhida: expandida, evita montar
        // um Tooltip por item.
        tooltip={isCollapsed ? item.title : undefined}
      >
        {item.icon}
        <span>{item.title}</span>
      </SidebarMenuButton>

      {subitens.length > 0 && !isCollapsed && (
        <SidebarMenuAction
          aria-expanded={aberta}
          aria-label={`${aberta ? "Recolher" : "Expandir"} ${item.title}`}
          className="top-2! right-2! size-6"
          onClick={() => onAlternar(item.title, !aberta)}
        >
          <ChevronRightIcon className={cn("size-4 transition-transform", aberta && "rotate-90")} />
        </SidebarMenuAction>
      )}

      {subitens.length > 0 && aberta && !isCollapsed && (
        <SidebarMenuSub className="mt-1 gap-1">
          {subitens.map((sub) => (
            <SidebarMenuSubItem key={sub.url}>
              <SidebarMenuSubButton
                className="h-9 text-sm"
                isActive={sub.url === ativa}
                render={
                  <Link href={sub.url} onClick={onNavegar}>
                    <span>{sub.title}</span>
                  </Link>
                }
              />
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
});

type FlyoutEstado = { item: NavItem; topo: number; pathname: string; porTeclado: boolean };

const ATRASO_PARA_ABRIR_MS = 60;
const ATRASO_PARA_FECHAR_MS = 150;

export function NavMain({
  groups,
  items,
  label = "Navegação",
  hrefsSemAcesso = [],
}: {
  groups?: NavGroup[];
  // Atalho para uma lista única (sidebars de admin e agenda).
  items?: NavItem[];
  label?: string;
  hrefsSemAcesso?: string[];
}) {
  const pathname = usePathname();
  const { setOpenMobile, state, isMobile } = useSidebar();
  // Aberto por padrão só na seção da página atual; o chevron abre ou fecha
  // qualquer uma sem navegar.
  const [alternados, setAlternados] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<FlyoutEstado | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gatilho = useRef<HTMLElement | null>(null);

  const isCollapsed = !isMobile && state === "collapsed";
  // A lista só muda com as permissões; a navegação só recalcula o item ativo.
  const visiveis = useMemo(
    () => filtrarPorAcesso(groups ?? [{ label, items: items ?? [] }], new Set(hrefsSemAcesso)),
    [groups, items, label, hrefsSemAcesso],
  );
  const urlsDoMenu = useMemo(
    () =>
      visiveis.flatMap((group) =>
        group.items.flatMap((item) => [item.url, ...subitensDaSecao(item).map((sub) => sub.url)]),
      ),
    [visiveis],
  );
  const ativa = urlAtiva(pathname, urlsDoMenu);

  const onAlternar = useCallback((title: string, aberta: boolean) => {
    setAlternados((atual) => ({ ...atual, [title]: aberta }));
  }, []);
  const onNavegar = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  // Flyout da sidebar recolhida: um só para toda a sidebar, aberto por hover
  // (com pequeno atraso, para não abrir enquanto o mouse só passa) ou pela seta
  // para a direita. Só mexe em temporizador e estado — sem biblioteca de
  // posicionamento, sem portal e sem ouvir movimento do mouse.
  const cancelar = useCallback(() => clearTimeout(temporizador.current), []);
  const agendar = useCallback((acao: () => void, atrasoMs: number) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(acao, atrasoMs);
  }, []);
  const abrir = useCallback(
    (item: NavItem, elemento: HTMLElement, porTeclado: boolean) => {
      gatilho.current = elemento;
      setFlyout({
        item,
        pathname,
        porTeclado,
        topo: topoDoFlyout(
          elemento.getBoundingClientRect().top,
          subitensDaSecao(item).length,
          window.innerHeight,
        ),
      });
    },
    [pathname],
  );
  const onEntrar = useCallback(
    (item: NavItem, elemento: HTMLElement) =>
      agendar(() => abrir(item, elemento, false), ATRASO_PARA_ABRIR_MS),
    [abrir, agendar],
  );
  const onTeclado = useCallback(
    (item: NavItem, elemento: HTMLElement) => {
      cancelar();
      abrir(item, elemento, true);
    },
    [abrir, cancelar],
  );
  const onSair = useCallback(
    () => agendar(() => setFlyout(null), ATRASO_PARA_FECHAR_MS),
    [agendar],
  );
  const onFechar = useCallback(() => {
    cancelar();
    setFlyout(null);
  }, [cancelar]);

  // Trocar de página fecha o flyout sem efeito: ele guarda a rota em que abriu.
  const flyoutVisivel = flyout?.pathname === pathname ? flyout : null;

  // Recolhida: ícone + nome, flyout com os subitens ao passar o mouse e uma
  // linha no lugar do rótulo de cada grupo.
  if (isCollapsed) {
    return (
      <>
        {visiveis.map((group, indice) => (
          <SidebarGroup className="gap-1 px-1 py-1" key={group.label ?? indice}>
            {indice > 0 && <SidebarSeparator className="mx-3 mb-1 w-auto" />}

            <SidebarMenu className="gap-1">
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <ItemRecolhido
                    ativa={ativaDaSecao(item, ativa)}
                    flyoutAberto={flyoutVisivel?.item === item}
                    item={item}
                    onEntrar={onEntrar}
                    onSair={onSair}
                    onTeclado={onTeclado}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        {flyoutVisivel && (
          <FlyoutSubitens
            ativa={ativa}
            focarPrimeiro={flyoutVisivel.porTeclado}
            gatilho={gatilho}
            item={flyoutVisivel.item}
            onEntrar={cancelar}
            onFechar={onFechar}
            onSair={onSair}
            topo={flyoutVisivel.topo}
          />
        )}
      </>
    );
  }

  return (
    <>
      {visiveis.map((group, indice) => (
        <SidebarGroup key={group.label ?? indice}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}

          <SidebarMenu className="gap-1">
            {group.items.map((item) => (
              <SecaoDoMenu
                alternada={alternados[item.title]}
                ativa={ativaDaSecao(item, ativa)}
                isCollapsed={isCollapsed}
                item={item}
                key={item.title}
                onAlternar={onAlternar}
                onNavegar={onNavegar}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
