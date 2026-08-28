export type FrequenciaEvento = "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL" | "ANUAL";
export type StatusExcecaoEvento = "ALTERADO" | "REMARCADO" | "CANCELADO";

export interface EventoExcecaoRaw {
  id: string;
  eventoId: string;
  dataOriginal: string;
  status: StatusExcecaoEvento;
  titulo: string | null;
  data: string | null;
  dataFim: string | null;
  diaTodo: boolean | null;
  horaInicio: string | null;
  horaFim: string | null;
  observacao: string | null;
}

export interface EventoRaw {
  id: string;
  titulo: string;
  data: string;
  dataFim: string;
  diaTodo: boolean;
  horaInicio: string | null;
  horaFim: string | null;
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

  /** Data de início efetiva de exibição no calendário ("YYYY-MM-DD") */
  data: string;
  /** Data de fim efetiva ("YYYY-MM-DD"); igual a `data` em eventos de um dia só */
  dataFim: string;
  /** Evento sem horário específico — pode abranger vários dias */
  diaTodo: boolean;
  /** Hora de início efetiva ("HH:mm"), ausente quando diaTodo */
  horaInicio: string | null;
  /** Hora de fim efetiva ("HH:mm"), ausente quando diaTodo */
  horaFim: string | null;

  dataOriginal: string;

  status: StatusOcorrencia;
  motivo: string | null;
}

export interface JanelaAgenda {
  inicio: string;
  fim: string;
}
