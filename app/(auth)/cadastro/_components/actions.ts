"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auditLogService } from "@/lib/services/audit-log.service";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";

import { cadastroSchema } from "./schema";

// Limite de cadastros por IP, para dificultar criação automatizada de contas.
const CADASTRO_LIMITE_TENTATIVAS = 5;
const CADASTRO_JANELA_MS = 60 * 60 * 1000; // 1 hora

export async function cadastrarAction(input: unknown) {
  const parsed = cadastroSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const { ip, userAgent } = getDadosAuditoriaAssinatura(await headers());

  const rateLimit = verificarRateLimit(
    `cadastro:${ip}`,
    CADASTRO_LIMITE_TENTATIVAS,
    CADASTRO_JANELA_MS,
  );

  if (!rateLimit.permitido) {
    return DataBaseResponse.error({
      code: "RATE_LIMIT_EXCEDIDO",
      message: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
    }).serialize();
  }

  const senha = await bcrypt.hash(parsed.data.senha, 12);
  const isDevelopment = process.env.NODE_ENV === "development";

  const dadosUsuario = {
    nome: parsed.data.nome,
    email: parsed.data.email.trim().toLowerCase(),
    senha,
    emailVerificadoEm: isDevelopment ? new Date() : null,
  };

  if (isDevelopment) {
    const response = await userService.criarUsuario(dadosUsuario);

    if (response.isSuccess()) {
      await auditLogService.registrar(
        {
          usuarioId: response.data.id,
          usuarioEmail: response.data.email,
          usuarioNome: response.data.nome,
          acao: "CADASTRO_REALIZADO",
          ip,
          userAgent,
        },
        db,
      );

      return DataBaseResponse.success({
        usuario: response.data,
        confirmacaoEmail: null,
      }).serialize({
        redirectTo: "/login",
      });
    }

    if (response.getErrorCode() === "P2002") {
      return DataBaseResponse.error({
        code: "P2002",
        message: "Já existe uma conta com este e-mail.",
      }).serialize();
    }

    return DataBaseResponse.error({
      code: response.getErrorCode() ?? "CADASTRO_ERROR",
      message: response.getErrorMessage() || "Não foi possível criar sua conta.",
    }).serialize();
  }

  const response = await userService.criarUsuarioComConfirmacaoEmail(dadosUsuario);

  if (response.isSuccess()) {
    await auditLogService.registrar(
      {
        usuarioId: response.data.usuario.id,
        usuarioEmail: response.data.usuario.email,
        usuarioNome: response.data.usuario.nome,
        acao: "CADASTRO_REALIZADO",
        ip,
        userAgent,
      },
      db,
    );

    return DataBaseResponse.success({
      usuario: response.data.usuario,
      confirmacaoEmail: response.data.confirmacaoEmail,
    }).serialize({
      redirectTo: "/login/verificar-email",
    });
  }

  if (response.getErrorCode() === "P2002") {
    return DataBaseResponse.error({
      code: "P2002",
      message: "Já existe uma conta com este e-mail.",
    }).serialize();
  }

  return DataBaseResponse.error({
    code: response.getErrorCode() ?? "CADASTRO_ERROR",
    message: response.getErrorMessage() || "Não foi possível criar sua conta.",
  }).serialize();
}
