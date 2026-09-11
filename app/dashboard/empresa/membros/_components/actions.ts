"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { assertCurrentUserCan } from "@/lib/access-control";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { empresaService } from "@/lib/services/empresa.service";
import { convidarMembroSchema } from "./schema";

export async function convidarMembroAction(input: unknown) {
  const parsed = convidarMembroSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:convidar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa para convidar um membro.",
    }).serialize();
  }

  const session = await auth();

  const response = await empresaService.criarConviteEEnviar({
    empresaId: ctx.membroEmpresa.empresaId,
    roleId: parsed.data.roleId,
    email: parsed.data.email,
    convidadoPorNome: session?.user?.nome ?? "Um administrador",
  });

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/membros");
  }

  return response.serialize();
}

const alterarPapelSchema = z.object({
  membroId: z.string().min(1),
  roleId: z.string().min(1),
});

// Guardada pela mesma permissão de "empresa:convidar" — gerenciar
// membros (convidar, trocar papel, inativar) é uma única área de
// responsabilidade, não compensa uma permissão granular própria só pra
// isso.
export async function alterarPapelMembroAction(input: unknown) {
  const parsed = alterarPapelSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:convidar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  const response = await empresaService.alterarPapelMembro(
    ctx.membroEmpresa.empresaId,
    parsed.data.membroId,
    parsed.data.roleId,
  );

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/membros");
  }

  return response.serialize();
}

const inativarMembroSchema = z.object({ membroId: z.string().min(1) });

export async function inativarMembroAction(input: unknown) {
  const parsed = inativarMembroSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:convidar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  const response = await empresaService.inativarMembro(
    ctx.membroEmpresa.empresaId,
    parsed.data.membroId,
    ctx.usuarioId,
  );

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/membros");
  }

  return response.serialize();
}

const conviteSchema = z.object({ actionTokenId: z.string().min(1) });

export async function revogarConviteAction(input: unknown) {
  const parsed = conviteSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:convidar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  const response = await empresaService.revogarConvite(
    ctx.membroEmpresa.empresaId,
    parsed.data.actionTokenId,
  );

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/membros");
  }

  return response.serialize();
}

export async function reenviarConviteAction(input: unknown) {
  const parsed = conviteSchema.safeParse(input);

  if (!parsed.success) {
    return DataBaseResponse.error({
      code: "VALIDATION_ERROR",
      message: "Dados inválidos.",
    }).serialize();
  }

  const ctx = await assertCurrentUserCan("empresa:convidar");

  if (!ctx.membroEmpresa) {
    return DataBaseResponse.error({
      code: "EMPRESA_REQUIRED",
      message: "Nenhuma empresa ativa.",
    }).serialize();
  }

  const session = await auth();

  const response = await empresaService.reenviarConvite(
    ctx.membroEmpresa.empresaId,
    parsed.data.actionTokenId,
    session?.user?.nome ?? "Um administrador",
  );

  if (response.isSuccess()) {
    revalidatePath("/dashboard/empresa/membros");
  }

  return response.serialize();
}
