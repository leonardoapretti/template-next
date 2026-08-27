import { getDiasDaSemana } from "@/lib/utils/data";
import type { AgendaView } from "./agenda-context";

export function formatarTituloAgenda(date: Date, view: AgendaView): string {
  const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  const ano = date.getFullYear();
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  if (view === "mes") {
    return `${mesCapitalizado} ${ano}`;
  }

  if (view === "dia") {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const dias = getDiasDaSemana(date);
  const inicio = dias[0].date;
  const fim = dias[6].date;
  const fmtDia = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d);

  return `${fmtDia(inicio)} – ${fmtDia(fim)} ${ano}`;
}
