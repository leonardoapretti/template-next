import type { OcorrenciaAgendamento } from "./engine/agendamento.types";

/** Rótulo do evento na timeline. */
export function rotuloEvento(oc: OcorrenciaAgendamento): string {
  return oc.tituloEvento || "Sem título";
}

/** Cor do bloco na timeline. */
export function corEvento(oc: OcorrenciaAgendamento): string {
  if (oc.status === "cancelado") {
    return "bg-muted text-muted-foreground line-through";
  }

  return "bg-primary text-primary-foreground";
}
