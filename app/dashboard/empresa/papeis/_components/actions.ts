"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertCurrentUserCan } from "@/lib/access-control";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { roleService } from "@/lib/services/role.service";

const criarPapelSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do perfil."),
  copiarDeId: z.string().min(1).optional(),
});

export async function criarPapelAction(input: unknown) {
  const parsed = criarPapelSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("papeis:gerenciar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  let permissoesIniciais: string[] = [];

  if (parsed.data.copiarDeId) {
    // recuperarComPermissoes já é escopado pela empresa do contexto atual
    // (BaseService), então não é possível copiar de um papel de outra
    // empresa passando um id arbitrário.
    const origemResponse = await roleService.recuperarComPermissoes(parsed.data.copiarDeId);

    if (origemResponse.isError()) {
      return origemResponse.serialize();
    }

    permissoesIniciais = origemResponse.data.permissoes;
  }

  const response = await roleService.criarPapel(
    ctx.membroEmpresa.empresaId,
    parsed.data.nome,
    permissoesIniciais,
  );

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/papeis");
  }

  return response.serialize();
}

const atualizarPermissoesSchema = z.object({
  id: z.string().min(1),
  permissoes: z.record(z.string(), z.boolean()),
});

export async function atualizarPermissoesPapelAction(input: unknown) {
  const parsed = atualizarPermissoesSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  await assertCurrentUserCan("papeis:gerenciar");

  const permissoesLiberadas = Object.entries(parsed.data.permissoes)
    .filter(([, permitido]) => permitido)
    .map(([chave]) => chave);

  const response = await roleService.atualizarPermissoes(parsed.data.id, permissoesLiberadas);

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/papeis");
  }

  return response.serialize();
}

const renomearSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(2, "Informe o nome do perfil."),
});

export async function renomearPapelAction(input: unknown) {
  const parsed = renomearSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  await assertCurrentUserCan("papeis:gerenciar");

  const response = await roleService.renomear(parsed.data.id, parsed.data.nome);

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/papeis");
  }

  return response.serialize();
}

const removerSchema = z.object({ id: z.string().min(1) });

export async function removerPapelAction(input: unknown) {
  const parsed = removerSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  await assertCurrentUserCan("papeis:gerenciar");

  const response = await roleService.removerPapel(parsed.data.id);

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/papeis");
  }

  return response.serialize();
}
