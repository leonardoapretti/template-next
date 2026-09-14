import { cacheLife, cacheTag, updateTag } from "next/cache";
import type { EventoRaw } from "@/app/agenda/_components/engine/agendamento.types";
import { expandirEventosNaJanela } from "@/app/agenda/_components/engine/expandir-recorrencias";
import { db } from "../db";
import { eventosAgendaTag } from "./config/cache-tags";
import { diaAnterior } from "../utils/data";

type JanelaAgendamento = {
  inicio: string;
  fim: string;
};

type CriarEventoInput = {
  titulo: string;
  data: string;
  dataFim: string;
  diaTodo: boolean;
  horaInicio?: string;
  horaFim?: string;
  recorrencia: "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL";
  recorrenciaAte?: string;
  observacao?: string;
};

type AtualizarEventoInput = CriarEventoInput & {
  id: string;
  dataOriginal?: string;
  escopoRecorrencia?: "ESTE" | "DAQUI_PRA_FRENTE";
};

type ExcluirEventoInput = {
  id: string;
  dataOriginal?: string;
  escopoRecorrencia?: "ESTE" | "DAQUI_PRA_FRENTE";
};

type ConflitoEvento = {
  id: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
};

function horariosSeSobrepoem(
  horaInicioA: string,
  horaFimA: string,
  horaInicioB: string,
  horaFimB: string,
) {
  return horaInicioA < horaFimB && horaInicioB < horaFimA;
}

function normalizarEventoInput(input: CriarEventoInput) {
  return {
    titulo: input.titulo.trim(),
    data: input.data,
    dataFim: input.dataFim,
    diaTodo: input.diaTodo,
    horaInicio: input.diaTodo ? null : (input.horaInicio ?? null),
    horaFim: input.diaTodo ? null : (input.horaFim ?? null),
    recorrencia: input.recorrencia,
    recorrenciaAte: input.recorrenciaAte?.trim() ? input.recorrenciaAte.trim() : null,
    observacao: input.observacao?.trim() ? input.observacao.trim() : null,
  };
}

async function buscarEventosNaJanelaCached(empresaId: string, janela: JanelaAgendamento) {
  "use cache";
  cacheLife("minutes");
  cacheTag(eventosAgendaTag(empresaId));

  return db.evento.findMany({
    where: {
      empresaId,
      data: {
        lte: janela.fim,
      },
      OR: [
        {
          recorrencia: "NENHUMA",
        },
        {
          recorrenciaAte: null,
        },
        {
          recorrenciaAte: {
            gte: janela.inicio,
          },
        },
      ],
    },
    include: {
      excecoes: true,
    },
    orderBy: [
      {
        data: "asc",
      },
      {
        horaInicio: "asc",
      },
    ],
  });
}

class AgendamentoService {
  async buscarEventosNaJanela(empresaId: string, janela: JanelaAgendamento) {
    return buscarEventosNaJanelaCached(empresaId, janela);
  }

  async criarEvento(empresaId: string, input: CriarEventoInput) {
    const data = normalizarEventoInput(input);

    const evento = await db.evento.create({
      data: {
        ...data,
        empresaId,
      },
    });

    updateTag(eventosAgendaTag(empresaId));

    return evento;
  }

  async atualizarEvento(empresaId: string, input: AtualizarEventoInput) {
    const evento = await db.evento.findFirstOrThrow({
      where: { id: input.id, empresaId },
    });

    const data = normalizarEventoInput(input);

    const resultado =
      evento.recorrencia === "NENHUMA" || !input.escopoRecorrencia || !input.dataOriginal
        ? await db.evento.update({
            where: {
              id: input.id,
            },
            data,
          })
        : input.escopoRecorrencia === "ESTE"
          ? await this.atualizarSomenteOcorrencia(input)
          : await this.atualizarDaquiPraFrente(evento, input, empresaId);

    updateTag(eventosAgendaTag(empresaId));

    return resultado;
  }

  private atualizarSomenteOcorrencia(input: AtualizarEventoInput) {
    const dataOriginal = input.dataOriginal ?? input.data;
    const status = input.data !== dataOriginal ? "REMARCADO" : "ALTERADO";
    const data = normalizarEventoInput(input);

    return db.eventoExcecao.upsert({
      where: {
        eventoId_dataOriginal: {
          eventoId: input.id,
          dataOriginal,
        },
      },
      create: {
        eventoId: input.id,
        dataOriginal,
        status,
        titulo: data.titulo,
        data: data.data,
        dataFim: data.dataFim,
        diaTodo: data.diaTodo,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        observacao: data.observacao,
      },
      update: {
        status,
        titulo: data.titulo,
        data: data.data,
        dataFim: data.dataFim,
        diaTodo: data.diaTodo,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        observacao: data.observacao,
      },
    });
  }

  private atualizarDaquiPraFrente(
    evento: { id: string; data: string },
    input: AtualizarEventoInput,
    empresaId: string,
  ) {
    const dataOriginal = input.dataOriginal ?? input.data;
    const data = normalizarEventoInput(input);

    if (dataOriginal <= evento.data) {
      return db.$transaction([
        db.eventoExcecao.deleteMany({
          where: {
            eventoId: evento.id,
            dataOriginal: {
              gte: dataOriginal,
            },
          },
        }),

        db.evento.update({
          where: {
            id: evento.id,
          },
          data,
        }),
      ]);
    }

    return db.$transaction([
      db.evento.update({
        where: {
          id: evento.id,
        },
        data: {
          recorrenciaAte: diaAnterior(dataOriginal),
        },
      }),

      db.eventoExcecao.deleteMany({
        where: {
          eventoId: evento.id,
          dataOriginal: {
            gte: dataOriginal,
          },
        },
      }),

      db.evento.create({
        data: {
          ...data,
          empresaId,
        },
      }),
    ]);
  }

  async excluirEvento(empresaId: string, input: ExcluirEventoInput) {
    const resultado = await this.excluirEventoNoBanco(empresaId, input);

    updateTag(eventosAgendaTag(empresaId));

    return resultado;
  }

  private async excluirEventoNoBanco(empresaId: string, input: ExcluirEventoInput) {
    const evento = await db.evento.findFirstOrThrow({
      where: { id: input.id, empresaId },
    });

    if (evento.recorrencia === "NENHUMA" || !input.escopoRecorrencia || !input.dataOriginal) {
      return db.evento.delete({
        where: {
          id: input.id,
        },
      });
    }

    if (input.escopoRecorrencia === "ESTE") {
      return db.eventoExcecao.upsert({
        where: {
          eventoId_dataOriginal: {
            eventoId: input.id,
            dataOriginal: input.dataOriginal,
          },
        },
        create: {
          eventoId: input.id,
          dataOriginal: input.dataOriginal,
          status: "CANCELADO",
        },
        update: {
          status: "CANCELADO",
        },
      });
    }

    if (input.dataOriginal <= evento.data) {
      return db.evento.delete({
        where: {
          id: input.id,
        },
      });
    }

    return db.$transaction([
      db.evento.update({
        where: {
          id: input.id,
        },
        data: {
          recorrenciaAte: diaAnterior(input.dataOriginal),
        },
      }),

      db.eventoExcecao.deleteMany({
        where: {
          eventoId: input.id,
          dataOriginal: {
            gte: input.dataOriginal,
          },
        },
      }),
    ]);
  }

  /**
   * Conflito de horário só faz sentido pra eventos de um dia só, com horário
   * marcado — eventos de dia inteiro ou de vários dias não "conflitam" com
   * nada, na mesma lógica que o Google Calendar usa.
   */
  async listarConflitosNoHorario(
    empresaId: string,
    input: {
      eventoId?: string;
      data: string;
      dataFim: string;
      diaTodo: boolean;
      horaInicio?: string;
      horaFim?: string;
    },
  ): Promise<ConflitoEvento[]> {
    if (input.diaTodo || input.data !== input.dataFim || !input.horaInicio || !input.horaFim) {
      return [];
    }

    const horaInicio = input.horaInicio;
    const horaFim = input.horaFim;

    const eventos = await this.buscarEventosNaJanela(empresaId, {
      inicio: input.data,
      fim: input.data,
    });

    return expandirEventosNaJanela(eventos as unknown as EventoRaw[], {
      inicio: input.data,
      fim: input.data,
    })
      .filter((evento) => evento.eventoId !== input.eventoId)
      .filter(
        (evento): evento is typeof evento & { horaInicio: string; horaFim: string } =>
          !evento.diaTodo && Boolean(evento.horaInicio) && Boolean(evento.horaFim),
      )
      .filter((evento) =>
        horariosSeSobrepoem(horaInicio, horaFim, evento.horaInicio, evento.horaFim),
      )
      .map((evento) => ({
        id: evento.eventoId,
        titulo: evento.titulo,
        data: evento.data,
        horaInicio: evento.horaInicio,
        horaFim: evento.horaFim,
      }))
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }
}

export const agendamentoService = new AgendamentoService();
