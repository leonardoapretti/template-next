// Leitura server-side dos searchParams de uma tabela paginada no servidor
// (mesmas chaves de URL que components/data-table/hooks/use-data-table.ts
// usa — PAGE_KEY, PER_PAGE_KEY, SORT_KEY) — usado pelos Server Components
// que paginam/ordenam/filtram no Prisma (produtos, estoque, vendas, clientes).

/** Ordenação enviada pela tabela como JSON `[{ id, desc }]` na URL. */
export function parseSortParam(raw: string | undefined): { id: string; desc: boolean } | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    const item = Array.isArray(parsed) ? parsed[0] : undefined;

    if (item && typeof item.id === "string" && typeof item.desc === "boolean") {
      return { id: item.id, desc: item.desc };
    }
  } catch {
    // ordenar inválido na URL — ignora e usa o default do service.
  }

  return undefined;
}

/** Filtro de um único valor entre um conjunto fixo (ex.: status). */
export function parseEnumParam<T extends string>(
  raw: string | undefined,
  valoresValidos: readonly T[],
): T | undefined {
  const primeiro = raw?.split(",")[0];
  return (valoresValidos as readonly string[]).includes(primeiro ?? "")
    ? (primeiro as T)
    : undefined;
}

/** Filtro de vários valores (multiSelect) entre um conjunto fixo: `a,b` na URL. Ignora valores inválidos e repetidos. */
export function parseEnumListParam<T extends string>(
  raw: string | undefined,
  valoresValidos: readonly T[],
): T[] | undefined {
  const validos = new Set<string>(valoresValidos);
  const lista = [...new Set(raw?.split(","))].filter((valor): valor is T => validos.has(valor));

  return lista.length > 0 ? lista : undefined;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Filtro `dateRange` da tabela: `inicio,fim` em timestamps (ms) do início de cada dia escolhido
 * no calendário (meia-noite no fuso do navegador). `ate` vai até o fim do dia final — senão as
 * vendas do próprio dia final ficariam de fora. Só uma data escolhida: filtra aquele dia.
 */
export function parseDateRangeParam(
  raw: string | undefined,
): { de?: Date; ate?: Date } | undefined {
  const [inicio, fim] = (raw ?? "").split(",").map((valor) => {
    const data = new Date(Number(valor));
    return valor && !Number.isNaN(data.getTime()) ? data : undefined;
  });
  const ultimoDia = fim ?? inicio;

  if (!inicio && !ultimoDia) return undefined;

  return {
    de: inicio,
    ate: ultimoDia ? new Date(ultimoDia.getTime() + UM_DIA_MS - 1) : undefined,
  };
}

/**
 * Teto de linhas por exportação (CSV) de uma data-table. As tabelas paginadas no servidor buscam
 * até este número de linhas com os filtros da URL; acima disso o arquivo sai cortado e a tela
 * avisa — protege a aplicação de montar uma resposta gigante num clique.
 */
export const LIMITE_EXPORTACAO = 5000;

/** Resposta das actions de exportação: as linhas (já no formato da tabela) e o total sem o teto. */
export type ResultadoExportacao<TLinha> =
  | { success: true; linhas: TLinha[]; total: number }
  | { success: false; errorMessage: string };

/** Query string da página (`window.location.search`) para o mesmo objeto que a page recebe. */
export function paramsDaBusca(busca: string): Record<string, string | undefined> {
  return Object.fromEntries(new URLSearchParams(busca));
}
