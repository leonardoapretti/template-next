"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import logger from "@/lib/logger/src";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { userService } from "@/lib/services/user.service";
import { getPerfilInicialPath } from "@/lib/utils/routes/perfil-routes";

import { type LoginSchema, loginSchema } from "./schema";

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

export async function loginAction(data: LoginSchema) {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
    }).serialize();
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    const usuario = await userService.recuperarUsuarioLogin(parsed.data.email);

    return DataBaseResponse.success({
      success: true,
    }).serialize({
      redirectTo: getPerfilInicialPath({
        isAdmin: usuario?.isAdmin,
      }),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = getAuthErrorCode(error);
      const message = getLoginErrorMessage(code);

      if (code === "EMAIL_NAO_VERIFICADO") {
        return DataBaseResponse.error({
          code,
          message,
        }).serialize({
          redirectTo: "/login/verificar-email",
        });
      }

      return DataBaseResponse.error({
        code,
        message,
      }).serialize();
    }

    logger.error(error);

    return DataBaseResponse.error({
      code: "LOGIN_ERROR",
      message: "Erro ao realizar login",
    }).serialize();
  }
}
