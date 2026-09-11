"use server";

import { cookies } from "next/headers";
import { getAccessContext } from "@/lib/access-control";
import { EMPRESA_ATIVA_COOKIE } from "@/lib/access-control/context";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { empresaService } from "@/lib/services/empresa.service";
import { criarEmpresaSchema } from "./schema";

export async function criarEmpresaAction(input: unknown) {
  const parsed = criarEmpresaSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  // Qualquer usuário autenticado pode criar uma empresa — a única
  // exigência é ter sessão válida, garantida por getAccessContext().
  const ctx = await getAccessContext();

  const response = await empresaService.criarEmpresa(ctx.usuarioId, parsed.data);

  if (response.isSuccess()) {
    const cookieStore = await cookies();
    cookieStore.set(EMPRESA_ATIVA_COOKIE, response.data.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response.serialize();
}
