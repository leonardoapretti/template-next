"use server";

import { assertCurrentUserCan } from "@/lib/access-control";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { empresaService } from "@/lib/services/empresa.service";
import { atualizarConfiguracaoSchema } from "./schema";

export async function atualizarConfiguracaoAction(input: unknown) {
  const parsed = atualizarConfiguracaoSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:configurar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  const response = await empresaService.atualizarConfiguracao(
    ctx.membroEmpresa.empresaId,
    parsed.data,
  );

  return response.serialize();
}
