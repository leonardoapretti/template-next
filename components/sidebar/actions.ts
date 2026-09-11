"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { EMPRESA_ATIVA_COOKIE } from "@/lib/access-control/context";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { empresaService } from "@/lib/services/empresa.service";
import { getAccessContext } from "@/lib/access-control";

// Troca a empresa ativa da sessão (usuário vinculado a mais de uma) — grava
// a escolha num cookie próprio em vez de mexer na sessão do NextAuth.
// Nunca aceita o empresaId vindo do cliente sem confirmar o vínculo contra
// MembroEmpresa (empresaService.possuiVinculoAtivo).
export async function selecionarEmpresaAtivaAction(empresaId: string) {
  const ctx = await getAccessContext();

  const possuiVinculo = await empresaService.possuiVinculoAtivo(ctx.usuarioId, empresaId);

  if (!possuiVinculo) {
    return DataBaseResponse.error({
      code: "FORBIDDEN",
      message: "Você não tem vínculo com esta empresa.",
    }).serialize();
  }

  const cookieStore = await cookies();
  cookieStore.set(EMPRESA_ATIVA_COOKIE, empresaId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");

  return DataBaseResponse.success(null).serialize();
}
