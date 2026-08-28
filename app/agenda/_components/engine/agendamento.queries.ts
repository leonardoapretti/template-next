"use server";

import { getAccessContext } from "@/lib/access-control";
import { agendamentoService } from "@/lib/services/agendamento.service";
import type { EventoRaw, JanelaAgenda } from "./agendamento.types";

export async function getEventosNaJanela(janela: JanelaAgenda): Promise<EventoRaw[]> {
  const ctx = await getAccessContext();
  const eventos = await agendamentoService.buscarEventosNaJanela(ctx.usuarioId, janela);

  return eventos as unknown as EventoRaw[];
}
