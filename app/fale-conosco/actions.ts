"use server";

import { DataBaseResponse } from "@/lib/services/config/database-response";
import { criarEmailHtml, emailService } from "@/lib/services/email.service";
import { faleConoscoSchema } from "./schema";

export async function criarContatoAction(input: unknown) {
  const parsed = faleConoscoSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const { nome, email, mensagem } = parsed.data;

  const envioResponse = await emailService.enviarEmail({
    destinatario: process.env.EMAIL_DESTINATARIO_DEV,
    assunto: `Fale conosco: ${nome}`,
    replyTo: email,
    texto: `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`,
    html: criarEmailHtml({
      titulo: "Nova mensagem de contato",
      paragrafos: [mensagem],
      informacoes: [
        { label: "Nome", value: nome },
        { label: "E-mail", value: email },
      ],
    }),
  });

  if (envioResponse.isError()) {
    return DataBaseResponse.error({
      code: envioResponse.getErrorCode() ?? "CONTATO_ERROR",
      message: envioResponse.getErrorMessage() || "Não foi possível enviar sua mensagem.",
    }).serialize();
  }

  return DataBaseResponse.success({ enviado: true }).serialize();
}
