export type FrequenciaEvento = "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL";
export type StatusExcecaoEvento = "ALTERADO" | "REMARCADO" | "CANCELADO";

export interface EventoExcecaoRaw {
  id: string;
  eventoId: string;
  dataOriginal: string;
  status: StatusExcecaoEvento;
  titulo: string | null;
  data: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  observacao: string | null;
}

export interface EventoRaw {
  id: string;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  recorrencia: FrequenciaEvento;
  recorrenciaAte: string | null;
  observacao: string | null;
  excecoes?: EventoExcecaoRaw[];
}

export type StatusOcorrencia = "confirmado" | "cancelado" | "remarcado" | "alterado";

export interface OcorrenciaAgendamento {
  id: string;
  eventoId: string;
  excecaoId: string | null;

  titulo: string;
  tituloEvento: string;
  recorrenciaEvento: FrequenciaEvento | null;
  recorrenciaAte: string | null;

  /** Data efetiva de exibição no calendário ("YYYY-MM-DD") */
  data: string;
  /** Hora de início efetiva ("HH:mm") */
  horaInicio: string;
  /** Hora de fim efetiva ("HH:mm") */
  horaFim: string;

  dataOriginal: string;

  status: StatusOcorrencia;
  motivo: string | null;
}

export interface JanelaAgenda {
  inicio: string;
  fim: string;
}
