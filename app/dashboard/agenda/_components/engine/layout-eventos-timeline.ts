import type { OcorrenciaAgendamento } from "./agendamento.types";

/** Altura em px correspondente a 1 hora na timeline de dia/semana. */
export const ALTURA_HORA_PX = 56;

/** Duração mínima (em minutos) considerada para posicionar um evento — evita blocos ilegíveis. */
const DURACAO_MINIMA_MINUTOS = 20;

/** Nº máximo de eventos sobrepostos exibidos lado a lado antes de agrupar o resto em "+N". */
const MAX_COLUNAS_VISIVEIS = 2;

export interface EventoPosicionado {
  oc: OcorrenciaAgendamento;
  inicioMinutos: number;
  fimMinutos: number;
  coluna: number;
  totalColunas: number;
}

export interface OverflowPosicionado {
  ocorrencias: OcorrenciaAgendamento[];
  inicioMinutos: number;
  fimMinutos: number;
  coluna: number;
  totalColunas: number;
}

export interface LayoutDia {
  eventos: EventoPosicionado[];
  overflows: OverflowPosicionado[];
}

function paraMinutos(horario: string): number {
  const [hora, minuto] = horario.split(":").map(Number);
  return (hora ?? 0) * 60 + (minuto ?? 0);
}

/** Posição inicial de scroll (em px) para abrir a timeline já num horário útil, como o Google Calendar. */
export function calcularScrollInicialPx(isHoje: boolean): number {
  const horaBase = isHoje ? Math.max(0, new Date().getHours() - 2) : 7;
  return horaBase * ALTURA_HORA_PX;
}

/**
 * Posiciona as ocorrências de um dia em colunas lado a lado quando há sobreposição de
 * horário, no mesmo esquema usado por calendários como o Google Calendar.
 */
export function layoutEventosDoDia(ocorrencias: OcorrenciaAgendamento[]): LayoutDia {
  const eventos = ocorrencias
    .map((oc) => {
      const inicioMinutos = paraMinutos(oc.horaInicio);

      return {
        oc,
        inicioMinutos,
        fimMinutos: Math.max(paraMinutos(oc.horaFim), inicioMinutos + DURACAO_MINIMA_MINUTOS),
      };
    })
    .sort((a, b) => a.inicioMinutos - b.inicioMinutos || b.fimMinutos - a.fimMinutos);

  const eventosPosicionados: EventoPosicionado[] = [];
  const overflows: OverflowPosicionado[] = [];
  let cluster: typeof eventos = [];
  let clusterFim = -1;

  function fecharCluster() {
    if (cluster.length === 0) return;

    const fimPorColuna: number[] = [];
    const eventosPorColuna: (typeof eventos)[number][][] = [];

    for (const evento of cluster) {
      let coluna = fimPorColuna.findIndex((fim) => fim <= evento.inicioMinutos);

      if (coluna === -1) {
        coluna = fimPorColuna.length;
        fimPorColuna.push(evento.fimMinutos);
        eventosPorColuna.push([]);
      } else {
        fimPorColuna[coluna] = evento.fimMinutos;
      }

      eventosPorColuna[coluna]?.push(evento);
    }

    const totalColunas = fimPorColuna.length;

    if (totalColunas <= MAX_COLUNAS_VISIVEIS) {
      eventosPorColuna.forEach((eventosDaColuna, coluna) => {
        for (const evento of eventosDaColuna) {
          eventosPosicionados.push({ ...evento, coluna, totalColunas });
        }
      });
    } else {
      const totalColunasVisiveis = MAX_COLUNAS_VISIVEIS + 1;

      eventosPorColuna.slice(0, MAX_COLUNAS_VISIVEIS).forEach((eventosDaColuna, coluna) => {
        for (const evento of eventosDaColuna) {
          eventosPosicionados.push({ ...evento, coluna, totalColunas: totalColunasVisiveis });
        }
      });

      const excedentes = eventosPorColuna.slice(MAX_COLUNAS_VISIVEIS).flat();

      overflows.push({
        ocorrencias: excedentes.map((evento) => evento.oc),
        inicioMinutos: Math.min(...excedentes.map((evento) => evento.inicioMinutos)),
        fimMinutos: Math.max(...excedentes.map((evento) => evento.fimMinutos)),
        coluna: MAX_COLUNAS_VISIVEIS,
        totalColunas: totalColunasVisiveis,
      });
    }

    cluster = [];
    clusterFim = -1;
  }

  for (const evento of eventos) {
    if (cluster.length > 0 && evento.inicioMinutos >= clusterFim) {
      fecharCluster();
    }

    cluster.push(evento);
    clusterFim = Math.max(clusterFim, evento.fimMinutos);
  }

  fecharCluster();

  return { eventos: eventosPosicionados, overflows };
}
