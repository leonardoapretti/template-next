"use server";

import { getAccessContext } from "@/lib/access-control";
import { EmpresaRequiredError } from "@/lib/access-control/errors";
import { agendamentoService } from "@/lib/services/agendamento.service";
import type { EventoRaw, JanelaAgenda } from "./agendamento.types";

export async function getEventosNaJanela(janela: JanelaAgenda): Promise<EventoRaw[]> {
  const ctx = await getAccessContext();

  if (!ctx.membroEmpresa) {
    throw new EmpresaRequiredError();
  }

  const eventos = await agendamentoService.buscarEventosNaJanela(
    ctx.membroEmpresa.empresaId,
    janela,
  );

  return eventos as unknown as EventoRaw[];
}
