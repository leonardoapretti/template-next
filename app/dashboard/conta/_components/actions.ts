"use server";

import { auth } from "@/auth";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { alterarEmailSchema } from "./schema";

// Limite de solicitações de troca de senha/e-mail por usuário, para evitar
// spam de e-mails de confirmação.
const LIMITE_TENTATIVAS = 5;
const JANELA_MS = 15 * 60 * 1000; // 15 minutos

async function getUsuarioIdAutenticado() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Faça login para continuar.");
  }

  return session.user.id;
}

export async function solicitarAlteracaoSenhaAction() {
  const userId = await getUsuarioIdAutenticado();

  const rateLimit = verificarRateLimit(`alterar-senha:${userId}`, LIMITE_TENTATIVAS, JANELA_MS);

  if (!rateLimit.permitido) {
    return DataBaseResponse.error({
      code: "RATE_LIMIT_EXCEDIDO",
      message: "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
    }).serialize();
  }

  const response = await userService.enviarEmailAlteracaoSenha(userId);

  if (response.isError()) {
    return DataBaseResponse.error({
      code: response.getErrorCode() ?? "SOLICITAR_SENHA_ERROR",
      message: response.getErrorMessage() || "Não foi possível enviar o link de alteração.",
    }).serialize();
  }

  return DataBaseResponse.success({ enviado: true }).serialize();
}

export async function alterarEmailAction(input: unknown) {
  const parsed = alterarEmailSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const userId = await getUsuarioIdAutenticado();

  const rateLimit = verificarRateLimit(`alterar-email:${userId}`, LIMITE_TENTATIVAS, JANELA_MS);

  if (!rateLimit.permitido) {
    return DataBaseResponse.error({
      code: "RATE_LIMIT_EXCEDIDO",
      message: "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
    }).serialize();
  }

  const senhaResponse = await userService.verificarSenhaAtual(userId, parsed.data.senhaAtual);

  if (senhaResponse.isError()) {
    return DataBaseResponse.error({
      code: senhaResponse.getErrorCode() ?? "SENHA_INCORRETA",
      message: senhaResponse.getErrorMessage() || "Senha atual incorreta.",
    }).serialize();
  }

  const response = await userService.enviarEmailAlteracaoEmail(userId, parsed.data.novoEmail);

  if (response.isError()) {
    return DataBaseResponse.error({
      code: response.getErrorCode() ?? "ALTERAR_EMAIL_ERROR",
      message: response.getErrorMessage() || "Não foi possível enviar o link de confirmação.",
    }).serialize();
  }

  return DataBaseResponse.success({ enviado: true }).serialize();
}
