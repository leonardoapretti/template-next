// Estado aberto/recolhido da sidebar: o cliente grava o cookie ao alternar
// (components/ui/sidebar.tsx) e o servidor lê no primeiro render, para a
// página já nascer no estado certo — sem piscar aberta e depois recolher.
export const SIDEBAR_COOKIE_NAME = "sidebar_state";

// Sem cookie (primeira visita) a sidebar começa aberta.
export function sidebarAbertaPorPadrao(cookie: string | undefined): boolean {
  return cookie !== "false";
}
