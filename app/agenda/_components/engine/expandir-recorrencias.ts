import {
  criarDataLocal,
  diferencaEmDias,
  formatarDataIso,
  somarAnos,
  somarDias,
  somarMeses,
} from "@/lib/utils/data";
import type {
  EventoExcecaoRaw,
  EventoRaw,
  JanelaAgenda,
  OcorrenciaAgendamento,
} from "./agendamento.types";

function getNextOccurrence(date: Date, recurrence: EventoRaw["recorrencia"]) {
  if (recurrence === "DIARIA") return somarDias(date, 1);
  if (recurrence === "SEMANAL") return somarDias(date, 7);
  if (recurrence === "MENSAL") return somarMeses(date, 1);
  return somarAnos(date, 1);
}

function isDateInWindow(data: string, janela: JanelaAgenda) {
  return data >= janela.inicio && data <= janela.fim;
}

/**
 * Datas de início de cada ocorrência do evento cujo intervalo [data, dataFim]
 * cruza a janela — não apenas as que começam dentro dela, já que um evento de
 * vários dias pode ter começado antes da janela e ainda assim aparecer nela.
 */
function getEventDatesInWindow(evento: EventoRaw, janela: JanelaAgenda) {
  const duracaoDias = diferencaEmDias(evento.dataFim, evento.data);

  if (evento.recorrencia === "NENHUMA") {
    const cruzaJanela = evento.data <= janela.fim && evento.dataFim >= janela.inicio;
    return cruzaJanela ? [evento.data] : [];
  }

  const dates: string[] = [];
  const windowStart = criarDataLocal(janela.inicio);
  const windowEnd = criarDataLocal(janela.fim);
  const recurrenceEnd = evento.recorrenciaAte ? criarDataLocal(evento.recorrenciaAte) : windowEnd;
  const effectiveEnd = recurrenceEnd < windowEnd ? recurrenceEnd : windowEnd;

  let current = criarDataLocal(evento.data);

  while (somarDias(current, duracaoDias) < windowStart) {
    current = getNextOccurrence(current, evento.recorrencia);
  }

  while (current <= effectiveEnd) {
    dates.push(formatarDataIso(current));
    current = getNextOccurrence(current, evento.recorrencia);
  }

  return dates;
}

function getStatus(excecao?: EventoExcecaoRaw): OcorrenciaAgendamento["status"] {
  if (excecao?.status === "REMARCADO") return "remarcado";
  if (excecao?.status === "ALTERADO") return "alterado";
  return "confirmado";
}

function toOccurrence(
  evento: EventoRaw,
  dataOriginal: string,
  index: number,
  excecao?: EventoExcecaoRaw,
): OcorrenciaAgendamento | null {
  if (excecao?.status === "CANCELADO") {
    return null;
  }

  const duracaoDias = diferencaEmDias(evento.dataFim, evento.data);
  const data = excecao?.data ?? dataOriginal;
  const dataFimPadrao = formatarDataIso(somarDias(criarDataLocal(data), duracaoDias));

  return {
    id: `${evento.id}::${data}::${index}`,
    eventoId: evento.id,
    excecaoId: excecao?.id ?? null,
    titulo: excecao?.titulo ?? evento.titulo,
    tituloEvento: excecao?.titulo ?? evento.titulo,
    recorrenciaEvento: evento.recorrencia,
    recorrenciaAte: evento.recorrenciaAte,
    data,
    dataFim: excecao?.dataFim ?? dataFimPadrao,
    diaTodo: excecao?.diaTodo ?? evento.diaTodo,
    horaInicio: excecao?.horaInicio ?? evento.horaInicio,
    horaFim: excecao?.horaFim ?? evento.horaFim,
    dataOriginal,
    status: getStatus(excecao),
    motivo: excecao?.observacao ?? evento.observacao,
  };
}

export function expandirEventosNaJanela(
  eventos: EventoRaw[],
  janela: JanelaAgenda,
): OcorrenciaAgendamento[] {
  return eventos
    .flatMap((evento) => {
      const excecoes = new Map(
        (evento.excecoes ?? []).map((excecao) => [excecao.dataOriginal, excecao]),
      );
      const datasRenderizadas = new Set<string>();
      const ocorrencias = getEventDatesInWindow(evento, janela)
        .map((data, index) => {
          datasRenderizadas.add(data);
          return toOccurrence(evento, data, index, excecoes.get(data));
        })
        .filter((ocorrencia): ocorrencia is OcorrenciaAgendamento => {
          if (ocorrencia === null) return false;
          // Mantém a ocorrência se qualquer parte do seu intervalo cruzar a janela.
          return ocorrencia.data <= janela.fim && ocorrencia.dataFim >= janela.inicio;
        });

      for (const excecao of evento.excecoes ?? []) {
        const data = excecao.data ?? excecao.dataOriginal;

        if (datasRenderizadas.has(excecao.dataOriginal) || !isDateInWindow(data, janela)) {
          continue;
        }

        const ocorrencia = toOccurrence(evento, excecao.dataOriginal, ocorrencias.length, excecao);

        if (ocorrencia) {
          ocorrencias.push(ocorrencia);
        }
      }

      return ocorrencias;
    })
    .sort((a, b) => {
      const dateCompare = a.data.localeCompare(b.data);
      return dateCompare !== 0
        ? dateCompare
        : (a.horaInicio ?? "").localeCompare(b.horaInicio ?? "");
    });
}

export function agruparPorData(
  ocorrencias: OcorrenciaAgendamento[],
): Map<string, OcorrenciaAgendamento[]> {
  const map = new Map<string, OcorrenciaAgendamento[]>();

  for (const ocorrencia of ocorrencias) {
    const list = map.get(ocorrencia.data) ?? [];
    list.push(ocorrencia);
    map.set(ocorrencia.data, list);
  }

  return map;
}

/** Ocorrências que devem renderizar como barra (dia inteiro ou span de vários dias). */
export function ehOcorrenciaDeBarra(oc: OcorrenciaAgendamento): boolean {
  return oc.diaTodo || oc.dataFim !== oc.data;
}
