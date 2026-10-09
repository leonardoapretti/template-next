"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdminAction, getAccessContext } from "@/lib/access-control";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { planoService } from "@/lib/services/plano.service";
import { routes } from "@/lib/utils/routes";

const criarPlanoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "Informe um código.")
    .regex(/^[A-Z0-9_]+$/, "Use apenas letras maiúsculas, números e underline."),
  nome: z.string().trim().min(2, "Informe o nome do plano."),
});

export async function criarPlanoAction(input: unknown) {
  const parsed = criarPlanoSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  await assertAdminAction(await getAccessContext());

  const response = await planoService.criar(parsed.data.codigo, parsed.data.nome);

  if (response.isSuccess()) {
    revalidatePath(routes.admin.planos);
  }

  return response.serialize();
}

const salvarMatrizSchema = z.object({
  planoId: z.string().min(1),
  permissoes: z.record(z.string(), z.boolean()),
});

export async function salvarMatrizPlanoAction(input: unknown) {
  const parsed = salvarMatrizSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  await assertAdminAction(await getAccessContext());

  const response = await planoService.salvarMatriz(parsed.data.planoId, parsed.data.permissoes);

  if (response.isSuccess()) {
    revalidatePath(routes.admin.planos);
  }

  return response.serialize();
}
