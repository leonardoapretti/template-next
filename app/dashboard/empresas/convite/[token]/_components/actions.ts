"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { EMPRESA_ATIVA_COOKIE } from "@/lib/access-control/context";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { empresaService } from "@/lib/services/empresa.service";

export async function aceitarConviteAction(token: string) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return DataBaseResponse.error({
      code: "AUTHENTICATION_REQUIRED",
      message: "Faça login para aceitar o convite.",
    }).serialize();
  }

  const response = await empresaService.aceitarConvite(
    { id: session.user.id, email: session.user.email },
    token,
  );

  if (response.isSuccess()) {
    const cookieStore = await cookies();
    cookieStore.set(EMPRESA_ATIVA_COOKIE, response.data.empresaId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response.serialize();
}
