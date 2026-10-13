// Resumo dos filtros ativos de uma data-table (chips "Status: Enviado"), sem
// React: recebe o estado da tabela e as colunas e devolve o que mostrar.
import type { Option } from "./types/data-table-types";

export type ColunaFiltravel = {
  id: string;
  label?: string;
  variant?: string;
  options?: Option[];
  unit?: string;
};

export type FiltroDeColuna = { id: string; value: unknown };

export type ChipDeFiltro = {
  // "global" ou o id da coluna.
  chave: string;
  origem: "global" | "coluna";
  rotulo: string;
  valor: string;
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function formatarData(valor: unknown): string {
  const data = new Date(valor as number | string);

  return Number.isNaN(data.getTime()) ? String(valor) : formatoData.format(data);
}

function textoDoValor(coluna: ColunaFiltravel, valor: unknown): string {
  const lista = Array.isArray(valor) ? valor : null;
  const unidade = coluna.unit ? ` ${coluna.unit}` : "";

  switch (coluna.variant) {
    case "select":
    case "multiSelect": {
      const valores = lista ?? [valor];

      return valores
        .map((item) => coluna.options?.find((opcao) => opcao.value === item)?.label ?? String(item))
        .join(", ");
    }
    case "range":
      return lista ? `${lista[0]}${unidade} – ${lista[1]}${unidade}` : String(valor);
    case "date":
      return formatarData(valor);
    case "dateRange":
      return lista
        ? [lista[0], lista[1]]
            .map((item) =>
              item === undefined || item === null || item === "" ? "…" : formatarData(item),
            )
            .join(" – ")
        : formatarData(valor);
    default:
      return lista ? lista.join(", ") : `${valor}${coluna.variant === "number" ? unidade : ""}`;
  }
}

function vazio(valor: unknown): boolean {
  if (valor === undefined || valor === null || valor === "") return true;

  return (
    Array.isArray(valor) &&
    valor.every((item) => item === undefined || item === null || item === "")
  );
}

// Um chip por filtro ativo: a busca geral (se houver texto) e cada filtro de
// coluna com valor.
export function resumirFiltros(
  estado: { columnFilters: FiltroDeColuna[]; globalFilter?: string | null },
  colunas: ColunaFiltravel[],
): ChipDeFiltro[] {
  const chips: ChipDeFiltro[] = [];
  const busca = (estado.globalFilter ?? "").trim();

  if (busca) {
    chips.push({ chave: "global", origem: "global", rotulo: "Busca", valor: busca });
  }

  for (const filtro of estado.columnFilters) {
    if (vazio(filtro.value)) continue;

    const coluna = colunas.find((item) => item.id === filtro.id);
    const base: ColunaFiltravel = coluna ?? { id: filtro.id };

    chips.push({
      chave: filtro.id,
      origem: "coluna",
      rotulo: base.label ?? base.id,
      valor: textoDoValor(base, filtro.value),
    });
  }

  return chips;
}
