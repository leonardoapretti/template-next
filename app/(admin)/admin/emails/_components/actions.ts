"use server";

import { assertAdminAction, getAccessContext } from "@/lib/access-control";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { criarEmailHtml, emailService } from "@/lib/services/email.service";
import { enviarEmailSchema } from "./schema";

export async function enviarEmailAction(input: unknown) {
  const parsed = enviarEmailSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await getAccessContext();
  await assertAdminAction(ctx);

  const { destinatario, assunto, corpo } = parsed.data;

  const envioResponse = await emailService.enviarEmail({
    destinatario,
    assunto,
    usarEmailUsuarioComoReplyTo: true,
    texto: corpo,
    html: criarEmailHtml({
      titulo: assunto,
      paragrafos: corpo.split("\n").filter(Boolean),
    }),
  });

  if (envioResponse.isError()) {
    return DataBaseResponse.error({
      code: envioResponse.getErrorCode() ?? "EMAIL_SEND_ERROR",
      message: envioResponse.getErrorMessage() || "Não foi possível enviar o e-mail.",
    }).serialize();
  }

  return DataBaseResponse.success({ enviado: true }).serialize();
}
