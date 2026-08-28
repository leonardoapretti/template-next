import type { DiaGrade } from "@/lib/utils/data";
import { diferencaEmDias } from "@/lib/utils/data";
import type { OcorrenciaAgendamento } from "./agendamento.types";
import { chaveData } from "./chave-data";
import { ehOcorrenciaDeBarra } from "./expandir-recorrencias";

/** Nº máximo de barras empilhadas visíveis por semana antes de agrupar em "+N". */
export const MAX_LINHAS_BARRA = 3;

export interface BarraPosicionada {
  oc: OcorrenciaAgendamento;
  /** Coluna inicial (0 = domingo) dentro da semana, já recortada nos limites da semana. */
  colInicio: number;
  /** Coluna final (inclusive), já recortada nos limites da semana. */
  colFim: number;
  /** Linha de empilhamento dentro da semana (0-based). */
  linha: number;
}

export interface LayoutFaixaDias {
  barras: BarraPosicionada[];
  /** Ocorrências que não couberam nas linhas visíveis, por dia (chave "YYYY-MM-DD"). */
  overflowPorDia: Map<string, OcorrenciaAgendamento[]>;
}

/**
 * Posiciona, para uma faixa de dias consecutivos (semana do mês, semana da
 * timeline, ou um único dia), as ocorrências "de barra" (dia inteiro ou que
 * abrangem mais de um dia) em linhas horizontais que cruzam as colunas dos
 * dias que tocam, no mesmo esquema do Google Calendar.
 */
export function layoutFaixaDias(
  dias: DiaGrade[],
  todasOcorrencias: OcorrenciaAgendamento[],
  maxLinhas: number = MAX_LINHAS_BARRA,
): LayoutFaixaDias {
  const ultimaColuna = dias.length - 1;
  const inicioFaixa = chaveData(dias[0].date);
  const fimFaixa = chaveData(dias[ultimaColuna].date);

  const segmentos = todasOcorrencias
    .filter(ehOcorrenciaDeBarra)
    .filter((oc) => oc.data <= fimFaixa && oc.dataFim >= inicioFaixa)
    .map((oc) => ({
      oc,
      colInicio: Math.max(0, diferencaEmDias(oc.data, inicioFaixa)),
      colFim: Math.min(ultimaColuna, diferencaEmDias(oc.dataFim, inicioFaixa)),
    }))
    .sort((a, b) => a.colInicio - b.colInicio || b.colFim - b.colInicio - (a.colFim - a.colInicio));

  const fimPorLinha: number[] = [];
  const barras: BarraPosicionada[] = [];
  const overflowPorDia = new Map<string, OcorrenciaAgendamento[]>();

  for (const segmento of segmentos) {
    let linha = fimPorLinha.findIndex((fim) => fim < segmento.colInicio);

    if (linha === -1) {
      linha = fimPorLinha.length;
      fimPorLinha.push(segmento.colFim);
    } else {
      fimPorLinha[linha] = segmento.colFim;
    }

    if (linha < maxLinhas) {
      barras.push({
        oc: segmento.oc,
        colInicio: segmento.colInicio,
        colFim: segmento.colFim,
        linha,
      });
      continue;
    }

    for (let coluna = segmento.colInicio; coluna <= segmento.colFim; coluna++) {
      const dia = dias[coluna];
      if (!dia) continue;

      const chave = chaveData(dia.date);
      const lista = overflowPorDia.get(chave) ?? [];
      lista.push(segmento.oc);
      overflowPorDia.set(chave, lista);
    }
  }

  return { barras, overflowPorDia };
}
