"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import logger from "@/lib/logger/src";
import { userService } from "@/lib/services/user.service";
import { routes } from "@/lib/utils/routes";
import { getPerfilInicialPath } from "@/lib/utils/routes/perfil-routes";
import { loginSchema } from "./schema";

export type LoginActionState = {
  success: boolean;
  errorMessage: string;
} | null;

function getAuthErrorCode(error: AuthError) {
  const possibleCode = error.cause?.err?.message ?? error.message ?? "";

  if (possibleCode.includes("EMAIL_NAO_VERIFICADO")) {
    return "EMAIL_NAO_VERIFICADO";
  }

  if (possibleCode.includes("RATE_LIMIT_EXCEDIDO")) {
    return "RATE_LIMIT_EXCEDIDO";
  }

  return "CREDENTIALS_INVALID";
}

function getLoginErrorMessage(code: string) {
  if (code === "EMAIL_NAO_VERIFICADO") {
    return "Confirme seu e-mail antes de acessar o sistema.";
  }

  if (code === "RATE_LIMIT_EXCEDIDO") {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }

  return "Email ou senha incorretos";
}

export async function loginAction(input: unknown): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, errorMessage: "Dados inválidos" };
  }

  const retorno = (input as { retorno?: unknown })?.retorno;

  let destino: string;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const usuario = await userService.recuperarUsuarioLogin(parsed.data.email);

    destino =
      typeof retorno === "string" && retorno.startsWith("/")
        ? retorno
        : getPerfilInicialPath({ isAdmin: usuario?.isAdmin });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = getAuthErrorCode(error);
      const message = getLoginErrorMessage(code);

      if (code === "EMAIL_NAO_VERIFICADO") {
        redirect(routes.auth.verificarEmail);
      }

      return { success: false, errorMessage: message };
    }

    logger.error(error);

    return { success: false, errorMessage: "Erro ao realizar login" };
  }

  // Fora do try/catch: redirect() lança um erro especial que não pode ser
  // capturado pelo catch acima, senão o redirecionamento nunca acontece.
  redirect(destino);
}
