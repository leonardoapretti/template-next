"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCurrentUserCan } from "@/lib/access-control";
import { EmpresaRequiredError } from "@/lib/access-control/errors";
import { agendamentoService } from "@/lib/services/agendamento.service";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { getEventosNaJanela } from "./agendamento.queries";
import { expandirEventosNaJanela } from "./expandir-recorrencias";

const janelaAgendaSchema = z.object({
  inicio: z.string().min(1),
  fim: z.string().min(1),
});

const criarEventoSchema = z
  .object({
    titulo: z.string().trim().optional(),
    data: z.string().min(1),
    dataFim: z.string().min(1),
    diaTodo: z.boolean(),
    horaInicio: z.string().optional(),
    horaFim: z.string().optional(),
    recorrencia: z.enum(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL", "ANUAL"]),
    recorrenciaAte: z.string().optional(),
    observacao: z.string().optional(),
    confirmarConflito: z.boolean().optional(),
  })
  .refine((data) => data.dataFim >= data.data, {
    path: ["dataFim"],
    message: "A data final não pode ser anterior à inicial.",
  })
  .refine((data) => data.diaTodo || Boolean(data.horaInicio && data.horaFim), {
    path: ["horaFim"],
    message: "Preencha o horário ou marque como dia inteiro.",
  })
  .refine(
    (data) =>
      data.diaTodo || data.data !== data.dataFim || !data.horaInicio || !data.horaFim
        ? true
        : data.horaInicio < data.horaFim,
    {
      path: ["horaFim"],
      message: "O horário final deve ser maior que o inicial.",
    },
  );

function normalizarTituloEvento(input: z.infer<typeof criarEventoSchema>) {
  return input.titulo?.trim() || "Sem título";
}

const atualizarEventoSchema = criarEventoSchema.extend({
  id: z.string().min(1),
  dataOriginal: z.string().optional(),
  escopoRecorrencia: z.enum(["ESTE", "DAQUI_PRA_FRENTE"]).optional(),
});

const excluirEventoSchema = z.object({
  id: z.string().min(1),
  dataOriginal: z.string().optional(),
  escopoRecorrencia: z.enum(["ESTE", "DAQUI_PRA_FRENTE"]).optional(),
});

function revalidarAgenda() {
  revalidatePath("/dashboard");
  revalidatePath("/agenda");
}

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

export async function getOcorrenciasAction(input: unknown) {
  const parsed = janelaAgendaSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Janela do calendário inválida.",
    }).serialize();
  }

  const response = await DataBaseResponse.fromPromise(async () => {
    const eventos = await getEventosNaJanela(parsed.data);
    return expandirEventosNaJanela(eventos, parsed.data);
  });

  return response.serialize();
}

export async function criarEventoAction(input: unknown) {
  const ctx = await assertCurrentUserCan("agenda:create");

  const parsed = criarEventoSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      type: "validation_error" as const,
      message: "Dados do evento inválidos.",
    };
  }

  const data = {
    ...parsed.data,
    titulo: normalizarTituloEvento(parsed.data),
  };

  if (!ctx.membroEmpresa) {
    throw new EmpresaRequiredError();
  }

  const empresaId = ctx.membroEmpresa.empresaId;

  const conflitos = await agendamentoService.listarConflitosNoHorario(empresaId, data);

  if (conflitos.length > 0 && !data.confirmarConflito) {
    return {
      success: false as const,
      type: "conflict" as const,
      conflitos,
    };
  }

  const response = await DataBaseResponse.fromPromise(async () => {
    await agendamentoService.criarEvento(empresaId, data);
    return null;
  });

  if (!response.success) {
    return {
      success: false as const,
      type: "server_error" as const,
      message: response.getErrorMessage() || "Não foi possível criar o evento.",
    };
  }

  revalidarAgenda();

  return {
    success: true as const,
  };
}

export async function atualizarEventoAction(input: unknown) {
  const ctx = await assertCurrentUserCan("agenda:update");

  const parsed = atualizarEventoSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      type: "validation_error" as const,
      message: "Dados do evento inválidos.",
    };
  }

  const data = {
    ...parsed.data,
    titulo: normalizarTituloEvento(parsed.data),
  };

  if (!ctx.membroEmpresa) {
    throw new EmpresaRequiredError();
  }

  const empresaId = ctx.membroEmpresa.empresaId;

  const conflitos = await agendamentoService.listarConflitosNoHorario(empresaId, data);

  if (conflitos.length > 0 && !data.confirmarConflito) {
    return {
      success: false as const,
      type: "conflict" as const,
      conflitos,
    };
  }

  const response = await DataBaseResponse.fromPromise(async () => {
    await agendamentoService.atualizarEvento(empresaId, data);
    return null;
  });

  if (!response.success) {
    return {
      success: false as const,
      type: "server_error" as const,
      message: response.getErrorMessage() || "Não foi possível atualizar o evento.",
    };
  }

  revalidarAgenda();

  return {
    success: true as const,
  };
}

export async function excluirEventoAction(input: unknown) {
  const ctx = await assertCurrentUserCan("agenda:delete");

  const parsed = excluirEventoSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Evento inválido.",
    };
  }

  if (!ctx.membroEmpresa) {
    throw new EmpresaRequiredError();
  }

  const empresaId = ctx.membroEmpresa.empresaId;

  const response = await DataBaseResponse.fromPromise(async () => {
    await agendamentoService.excluirEvento(empresaId, parsed.data);
    return null;
  });

  if (response.success) {
    revalidarAgenda();
  }

  return response.serialize();
}
