"use server";

import { signOut } from "@/auth";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { userService } from "@/lib/services/user.service";
import { redefinirSenhaSchema } from "./schema";

export async function redefinirSenhaAction(token: string, input: unknown) {
  const parsed = redefinirSenhaSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const response = await userService.alterarSenhaPorToken(token, parsed.data.senha);

  if (response.isError()) {
    return DataBaseResponse.error({
      code: response.getErrorCode() ?? "REDEFINIR_SENHA_ERROR",
      message: response.getErrorMessage() || "Não foi possível alterar sua senha.",
    }).serialize();
  }

  await signOut({ redirect: false });

  return DataBaseResponse.success({ senhaAlterada: true }).serialize({
    redirectTo: "/login",
  });
}
