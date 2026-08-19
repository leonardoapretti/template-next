"use server";

import { headers } from "next/headers";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { userService } from "@/lib/services/user.service";
import { verificarRateLimit } from "@/lib/utils/rate-limit";
import { getDadosAuditoriaAssinatura } from "@/lib/utils/request";

import { verificarEmailSchema } from "./schema";

const COOLDOWN_REENVIO_EMAIL_MS = 1000;

// Limite de reenvios por e-mail, para evitar spam de e-mails de confirmação.
const REENVIO_LIMITE_TENTATIVAS = 3;
const REENVIO_JANELA_MS = 15 * 60 * 1000; // 15 minutos

export default async function reenviarEmailConfirmacaoAction(input: unknown) {
  const parsed = verificarEmailSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Informe um e-mail válido.",
    }).serialize({
      reenviarDisponivelEm: new Date(Date.now() + COOLDOWN_REENVIO_EMAIL_MS).toISOString(),
    });
  }

  const { ip } = getDadosAuditoriaAssinatura(await headers());

  const rateLimit = verificarRateLimit(
    `reenvio-confirmacao:${ip}:${parsed.data.email}`,
    REENVIO_LIMITE_TENTATIVAS,
    REENVIO_JANELA_MS,
  );

  const reenviarDisponivelEmRateLimit = new Date(
    Date.now() + COOLDOWN_REENVIO_EMAIL_MS,
  ).toISOString();

  if (!rateLimit.permitido) {
    // Retorno genérico (mesmo formato de sucesso), consistente com o restante
    // do fluxo, que já evita confirmar por outros meios se o e-mail existe.
    return DataBaseResponse.success({
      enviado: true,
    }).serialize({
      reenviarDisponivelEm: reenviarDisponivelEmRateLimit,
    });
  }

  const response = await userService.reenviarEmailConfirmacaoConta(parsed.data.email);

  const reenviarDisponivelEm = new Date(Date.now() + COOLDOWN_REENVIO_EMAIL_MS).toISOString();

  if (response.isError()) {
    return DataBaseResponse.error({
      code: response.getErrorCode() ?? "REENVIO_EMAIL_ERROR",
      message: response.getErrorMessage() || "Não foi possível reenviar o link.",
    }).serialize({
      reenviarDisponivelEm,
    });
  }

  return DataBaseResponse.success({
    enviado: true,
  }).serialize({
    reenviarDisponivelEm,
  });
}
