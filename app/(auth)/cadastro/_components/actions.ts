"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { actionTokenService } from "@/lib/services/actiontoken.service";
import { auditLogService } from "@/lib/services/audit-log.service";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";

import { cadastroSchema } from "./schema";

// Limite de cadastros por IP, para dificultar criação automatizada de contas.
const CADASTRO_LIMITE_TENTATIVAS = 5;
const CADASTRO_JANELA_MS = 60 * 60 * 1000; // 1 hora

export type CadastroActionState = {
  success: boolean;
  errorMessage: string;
} | null;

export async function cadastrarAction(input: unknown): Promise<CadastroActionState> {
  const parsed = cadastroSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, errorMessage: "Dados inválidos." };
  }

  const { ip, userAgent } = getDadosAuditoriaAssinatura(await headers());

  const rateLimit = verificarRateLimit(
    `cadastro:${ip}`,
    CADASTRO_LIMITE_TENTATIVAS,
    CADASTRO_JANELA_MS,
  );

  if (!rateLimit.permitido) {
    return {
      success: false,
      errorMessage: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
    };
  }

  const senha = await bcrypt.hash(parsed.data.senha, 12);
  const isDevelopment = process.env.NODE_ENV === "development";
  const extras = input as { retorno?: unknown; conviteToken?: unknown };
  const retorno = extras.retorno;
  const retornoQuery =
    typeof retorno === "string" && retorno.startsWith("/")
      ? `?retorno=${encodeURIComponent(retorno)}`
      : "";

  const emailCadastro = parsed.data.email.trim().toLowerCase();

  // Clicar no link do convite já prova posse do e-mail (só chega na caixa
  // de entrada de quem foi convidado) — equivalente à confirmação por
  // e-mail, então dispensa pedir de novo. Revalida o token no servidor
  // (hash, validade, não usado/revogado) e confere que o e-mail do
  // cadastro bate exatamente com o do convite; nunca confia só no
  // parâmetro vindo do client.
  const conviteToken = extras.conviteToken;
  const convite =
    typeof conviteToken === "string" && conviteToken.length > 0
      ? await actionTokenService.buscarValido({
          token: conviteToken,
          tipo: "CONVITE_MEMBRO_EMPRESA",
        })
      : null;
  const emailConfirmadoPeloConvite = convite?.email?.toLowerCase() === emailCadastro;

  const dadosUsuario = {
    nome: parsed.data.nome,
    email: emailCadastro,
    senha,
    emailVerificadoEm: isDevelopment || emailConfirmadoPeloConvite ? new Date() : null,
  };

  let destino: string;

  if (isDevelopment || emailConfirmadoPeloConvite) {
    const response = await userService.criarUsuario(dadosUsuario);

    if (!response.isSuccess()) {
      if (response.getErrorCode() === "P2002") {
        return { success: false, errorMessage: "Já existe uma conta com este e-mail." };
      }

      return {
        success: false,
        errorMessage: response.getErrorMessage() || "Não foi possível criar sua conta.",
      };
    }

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

    destino = `/login${retornoQuery}`;
  } else {
    const response = await userService.criarUsuarioComConfirmacaoEmail(dadosUsuario);

    if (!response.isSuccess()) {
      if (response.getErrorCode() === "P2002") {
        return { success: false, errorMessage: "Já existe uma conta com este e-mail." };
      }

      return {
        success: false,
        errorMessage: response.getErrorMessage() || "Não foi possível criar sua conta.",
      };
    }

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

    destino = "/login/verificar-email";
  }

  // Fora do bloco anterior: redirect() lança um erro especial que não pode
  // ser tratado como falha de cadastro, senão o redirecionamento não acontece.
  redirect(destino);
}
