import type { EventoDialogDraft } from "@/components/sidebar/sidebar-agenda/agenda-context";
import type { OcorrenciaAgendamento } from "./agendamento.types";

export function montarDraftDetalhesEvento(oc: OcorrenciaAgendamento): EventoDialogDraft {
  return {
    modo: "detalhes",
    eventoId: oc.eventoId,
    titulo: oc.tituloEvento,
    data: oc.data,
    dataFim: oc.dataFim,
    diaTodo: oc.diaTodo,
    dataOriginal: oc.dataOriginal,
    horaInicio: oc.horaInicio ?? undefined,
    horaFim: oc.horaFim ?? undefined,
    recorrencia: oc.recorrenciaEvento ?? "NENHUMA",
    recorrenciaAte: oc.recorrenciaAte ?? "",
    observacao: oc.motivo ?? "",
  };
}
