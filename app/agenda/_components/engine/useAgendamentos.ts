"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarEventoAction,
  criarEventoAction,
  excluirEventoAction,
  getOcorrenciasAction,
} from "./agendamento.actions";
import type { JanelaAgenda, OcorrenciaAgendamento } from "./agendamento.types";
import { agruparPorData } from "./expandir-recorrencias";

type EventoInput = {
  titulo: string;
  data: string;
  dataFim: string;
  diaTodo: boolean;
  horaInicio?: string;
  horaFim?: string;
  recorrencia: "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL";
  recorrenciaAte?: string;
  observacao?: string;
  confirmarConflito?: boolean;
};

type EventoMutationResult =
  | { success: true }
  | { success: false; type: "validation_error" | "server_error"; message: string }
  | {
      success: false;
      type: "conflict";
      conflitos: Array<{
        id: string;
        titulo: string;
        data: string;
        horaInicio: string;
        horaFim: string;
      }>;
    };

type AtualizarEventoInput = EventoInput & {
  id: string;
  dataOriginal?: string;
  escopoRecorrencia?: "ESTE" | "DAQUI_PRA_FRENTE";
};

type ExcluirEventoInput = {
  id: string;
  dataOriginal?: string;
  escopoRecorrencia?: "ESTE" | "DAQUI_PRA_FRENTE";
};

type SerializedActionResult<T> = {
  success: boolean;
  data: T | null;
  errorMessage: string | null;
};

function unwrapActionData<T>(result: SerializedActionResult<T>): T {
  if (!result.success) {
    throw new Error(result.errorMessage ?? "Não foi possível concluir a operação.");
  }

  return result.data as T;
}

// ─────────────────────────────────────────────────────────────
// Query keys — centralizados para invalidação consistente
// ─────────────────────────────────────────────────────────────

export const agendamentoKeys = {
  all: ["agendamentos"] as const,
  janela: (janela: JanelaAgenda) => [...agendamentoKeys.all, janela] as const,
};

// ─────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────

export function useAgendamentos(janela: JanelaAgenda) {
  const query = useQuery<OcorrenciaAgendamento[]>({
    queryKey: agendamentoKeys.janela(janela),
    queryFn: async () => {
      const result = await getOcorrenciasAction(janela);
      return unwrapActionData(result);
    },
    // Mantém dados anteriores enquanto carrega nova janela (sem flash vazio)
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5, // 5 min — recorrências mudam pouco
  });

  const porData = agruparPorData(query.data ?? []);

  return {
    ocorrencias: query.data ?? [],
    porData,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}

export function useCriarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EventoInput) => {
      return criarEventoAction(input) as Promise<EventoMutationResult>;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: agendamentoKeys.all });
      }
    },
  });
}

export function useAtualizarEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AtualizarEventoInput) => {
      return atualizarEventoAction(input) as Promise<EventoMutationResult>;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: agendamentoKeys.all });
      }
    },
  });
}

export function useExcluirEvento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExcluirEventoInput) => {
      return excluirEventoAction(input) as Promise<SerializedActionResult<null>>;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: agendamentoKeys.all });
      }
    },
  });
}
