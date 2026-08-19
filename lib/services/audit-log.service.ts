import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db, type DbClient, type DbTransactionClient } from "@/lib/db";
import logger from "@/lib/logger/src";

type PrismaClientOuTx = DbClient | DbTransactionClient;

const LIMITE_LISTAGEM_RECENTES = 1000;

export type RegistrarAuditLogParams = {
  usuarioId?: string | null;
  usuarioEmail?: string | null;
  usuarioNome?: string | null;
  acao: string;
  entidade?: string | null;
  entidadeId?: string | null;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

function canonicalizar(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(canonicalizar);
  }

  if (valor instanceof Date) {
    return valor.toISOString();
  }

  if (valor !== null && typeof valor === "object") {
    return Object.keys(valor as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, chave) => {
        acc[chave] = canonicalizar((valor as Record<string, unknown>)[chave]);

        return acc;
      }, {});
  }

  return valor;
}

function hashConteudo(conteudo: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalizar(conteudo))).digest("hex");
}

function gerarHashAuditLog(
  params: RegistrarAuditLogParams & { createdAt: Date },
  hashAnterior: string | null,
) {
  return hashConteudo({
    hashAnterior,
    usuarioId: params.usuarioId ?? null,
    usuarioEmail: params.usuarioEmail ?? null,
    acao: params.acao,
    entidade: params.entidade ?? null,
    entidadeId: params.entidadeId ?? null,
    dadosAntes: params.dadosAntes ?? null,
    dadosDepois: params.dadosDepois ?? null,
    ip: params.ip ?? null,
    userAgent: params.userAgent ?? null,
    createdAt: params.createdAt,
  });
}

async function buscarUltimoHash(client: PrismaClientOuTx) {
  const ultimo = await client.auditLog.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      hash: true,
    },
  });

  return ultimo?.hash ?? null;
}

class AuditLogService {
  // Leitura do último hash + criação não são atômicas: duas chamadas
  // concorrentes podem ler o mesmo hashAnterior antes de qualquer uma
  // escrever. Para o volume de tráfego desta aplicação isso é aceitável;
  // se o volume crescer, considerar serializar via lock/fila.
  async registrar(params: RegistrarAuditLogParams, client: PrismaClientOuTx) {
    try {
      const createdAt = new Date();
      const hashAnterior = await buscarUltimoHash(client);
      const hash = gerarHashAuditLog({ ...params, createdAt }, hashAnterior);

      await client.auditLog.create({
        data: {
          createdAt,
          usuarioId: params.usuarioId ?? null,
          usuarioEmail: params.usuarioEmail ?? null,
          usuarioNome: params.usuarioNome ?? null,
          acao: params.acao,
          entidade: params.entidade ?? null,
          entidadeId: params.entidadeId ?? null,
          dadosAntes: params.dadosAntes as Prisma.InputJsonValue,
          dadosDepois: params.dadosDepois as Prisma.InputJsonValue,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
          hash,
          hashAnterior,
        },
      });
    } catch (error) {
      logger.error({ err: error, acao: params.acao }, "Falha ao registrar audit log");
    }
  }

  async verificarCadeia(client: PrismaClientOuTx) {
    const registros = await client.auditLog.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    let hashAnterior: string | null = null;

    for (const registro of registros) {
      if (registro.hashAnterior !== hashAnterior) {
        return { valida: false, quebradoEm: registro.id };
      }

      const hashEsperado = gerarHashAuditLog(
        {
          usuarioId: registro.usuarioId,
          usuarioEmail: registro.usuarioEmail,
          usuarioNome: registro.usuarioNome,
          acao: registro.acao,
          entidade: registro.entidade,
          entidadeId: registro.entidadeId,
          dadosAntes: registro.dadosAntes,
          dadosDepois: registro.dadosDepois,
          ip: registro.ip,
          userAgent: registro.userAgent,
          createdAt: registro.createdAt,
        },
        hashAnterior,
      );

      if (hashEsperado !== registro.hash) {
        return { valida: false, quebradoEm: registro.id };
      }

      hashAnterior = registro.hash;
    }

    return { valida: true, quebradoEm: null };
  }

  listarRecentes() {
    return db.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: LIMITE_LISTAGEM_RECENTES,
    });
  }
}

export const auditLogService = new AuditLogService();
