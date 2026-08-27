import {
  criarDataLocal,
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

function getEventDatesInWindow(evento: EventoRaw, janela: JanelaAgenda) {
  if (evento.recorrencia === "NENHUMA") {
    return evento.data >= janela.inicio && evento.data <= janela.fim ? [evento.data] : [];
  }

  const dates: string[] = [];
  const windowStart = criarDataLocal(janela.inicio);
  const windowEnd = criarDataLocal(janela.fim);
  const recurrenceEnd = evento.recorrenciaAte ? criarDataLocal(evento.recorrenciaAte) : windowEnd;
  const effectiveEnd = recurrenceEnd < windowEnd ? recurrenceEnd : windowEnd;

  let current = criarDataLocal(evento.data);

  while (current < windowStart) {
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

  const data = excecao?.data ?? dataOriginal;

  return {
    id: `${evento.id}::${data}::${index}`,
    eventoId: evento.id,
    excecaoId: excecao?.id ?? null,
    titulo: excecao?.titulo ?? evento.titulo,
    tituloEvento: excecao?.titulo ?? evento.titulo,
    recorrenciaEvento: evento.recorrencia,
    recorrenciaAte: evento.recorrenciaAte,
    data,
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
          return ocorrencia !== null && isDateInWindow(ocorrencia.data, janela);
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
      return dateCompare !== 0 ? dateCompare : a.horaInicio.localeCompare(b.horaInicio);
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
