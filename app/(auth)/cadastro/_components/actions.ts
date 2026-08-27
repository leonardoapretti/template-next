"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auditLogService } from "@/lib/services/audit-log.service";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";

import { type CadastroFormSchema, cadastroSchema } from "./schema";

// Limite de cadastros por IP, para dificultar criação automatizada de contas.
const CADASTRO_LIMITE_TENTATIVAS = 5;
const CADASTRO_JANELA_MS = 60 * 60 * 1000; // 1 hora

export type CadastroActionState = {
  success: boolean;
  errorMessage: string;
  fieldErrors?: Partial<Record<keyof CadastroFormSchema, string[]>>;
} | null;

// Assinatura (prevState, formData) exigida pelo useActionState do React para
// que o form funcione via <form action={...}> nativo (progressive enhancement:
// sem JS, o browser faz um POST normal e esta action roda no servidor).
export async function cadastrarAction(
  _prevState: CadastroActionState,
  formData: FormData,
): Promise<CadastroActionState> {
  const parsed = cadastroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return {
      success: false,
      errorMessage: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
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

  const dadosUsuario = {
    nome: parsed.data.nome,
    email: parsed.data.email.trim().toLowerCase(),
    senha,
    emailVerificadoEm: isDevelopment ? new Date() : null,
  };

  let destino: string;

  if (isDevelopment) {
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

    destino = "/login";
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
