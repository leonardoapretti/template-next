import type { EventoRaw } from "@/app/dashboard/agenda/_components/engine/agendamento.types";
import { expandirEventosNaJanela } from "@/app/dashboard/agenda/_components/engine/expandir-recorrencias";
import { db } from "../db";
import { diaAnterior } from "../utils/data";

type JanelaAgendamento = {
  inicio: string;
  fim: string;
};

type CriarEventoInput = {
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
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
    horaInicio: input.horaInicio,
    horaFim: input.horaFim,
    recorrencia: input.recorrencia,
    recorrenciaAte: input.recorrenciaAte?.trim() ? input.recorrenciaAte.trim() : null,
    observacao: input.observacao?.trim() ? input.observacao.trim() : null,
  };
}

class AgendamentoService {
  async buscarEventosNaJanela(userId: string, janela: JanelaAgendamento) {
    return db.evento.findMany({
      where: {
        userId,
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

  async criarEvento(userId: string, input: CriarEventoInput) {
    const data = normalizarEventoInput(input);

    return db.evento.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async atualizarEvento(userId: string, input: AtualizarEventoInput) {
    const evento = await db.evento.findFirstOrThrow({
      where: { id: input.id, userId },
    });

    const data = normalizarEventoInput(input);

    if (evento.recorrencia === "NENHUMA" || !input.escopoRecorrencia || !input.dataOriginal) {
      return db.evento.update({
        where: {
          id: input.id,
        },
        data,
      });
    }

    if (input.escopoRecorrencia === "ESTE") {
      return this.atualizarSomenteOcorrencia(input);
    }

    return this.atualizarDaquiPraFrente(evento, input, userId);
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
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        observacao: data.observacao,
      },
      update: {
        status,
        titulo: data.titulo,
        data: data.data,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        observacao: data.observacao,
      },
    });
  }

  private atualizarDaquiPraFrente(
    evento: { id: string; data: string },
    input: AtualizarEventoInput,
    userId: string,
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
          userId,
        },
      }),
    ]);
  }

  async excluirEvento(userId: string, input: ExcluirEventoInput) {
    const evento = await db.evento.findFirstOrThrow({
      where: { id: input.id, userId },
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

  async listarConflitosNoHorario(
    userId: string,
    input: {
      eventoId?: string;
      data: string;
      horaInicio: string;
      horaFim: string;
    },
  ): Promise<ConflitoEvento[]> {
    const eventos = await this.buscarEventosNaJanela(userId, {
      inicio: input.data,
      fim: input.data,
    });

    return expandirEventosNaJanela(eventos as unknown as EventoRaw[], {
      inicio: input.data,
      fim: input.data,
    })
      .filter((evento) => evento.eventoId !== input.eventoId)
      .filter((evento) =>
        horariosSeSobrepoem(input.horaInicio, input.horaFim, evento.horaInicio, evento.horaFim),
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
