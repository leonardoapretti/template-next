import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { type DbClient, type DbTransactionClient, db } from "@/lib/db";
import logger from "@/lib/logger/src";
import { autorDaRequisicao } from "./audit-log-autor";

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

  // Date e Prisma.Decimal: hash sobre o mesmo valor que o JSON grava no banco ("10", não os
  // campos internos do Decimal), senão a verificação acusa adulteração em todo snapshot com Decimal.
  if (
    valor !== null &&
    typeof valor === "object" &&
    "toJSON" in valor &&
    typeof valor.toJSON === "function"
  ) {
    return canonicalizar(valor.toJSON());
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
  return createHash("sha256")
    .update(JSON.stringify(canonicalizar(conteudo)))
    .digest("hex");
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

// Chave do pg_advisory_xact_lock que serializa a gravação: sem ela, duas gravações concorrentes
// liam o mesmo último hash e a cadeia bifurcava.
const TRAVA_DA_CADEIA = 7310001;

type RegistroBruto = {
  id: string;
  createdAt: Date;
  usuarioId: string | null;
  usuarioEmail: string | null;
  acao: string;
  entidade: string | null;
  entidadeId: string | null;
  dadosAntes: unknown;
  dadosDepois: unknown;
  ip: string | null;
  userAgent: string | null;
  hash: string;
  hashAnterior: string | null;
};

export type VerificacaoDaCadeia = {
  valida: boolean;
  // Primeiro registro com conteúdo alterado, elo apagado ou segunda origem da cadeia.
  quebradoEm: string | null;
  total: number;
  // Elos com mais de um sucessor: gravações concorrentes anteriores à trava. Não é adulteração
  // (cada registro continua íntegro e ligado a um hash existente), mas fica reportado.
  bifurcacoes: number;
};

async function gravarNaCadeia(tx: DbTransactionClient, params: RegistrarAuditLogParams) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TRAVA_DA_CADEIA})`;

  const [ultimo] = await tx.$queryRaw<{ hash: string; createdAt: Date }[]>`
    SELECT "hash", "createdAt" FROM audit_logs ORDER BY "createdAt" DESC, "id" DESC LIMIT 1`;
  // createdAt estritamente crescente: a ordem da cadeia nunca depende de desempate.
  const agora = new Date();
  const createdAt =
    ultimo && agora.getTime() <= ultimo.createdAt.getTime()
      ? new Date(ultimo.createdAt.getTime() + 1)
      : agora;
  const hashAnterior = ultimo?.hash ?? null;
  const hash = gerarHashAuditLog({ ...params, createdAt }, hashAnterior);

  await tx.auditLog.create({
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
}

// Completa o registro com o autor da sessão e a origem de rede da requisição. Quem informou outro
// autor (e-mail digitado num login que falhou, por exemplo) fica com o que informou: a sessão
// aberta no navegador não é necessariamente quem fez a ação.
async function comAutor(params: RegistrarAuditLogParams): Promise<RegistrarAuditLogParams> {
  const autor = await autorDaRequisicao();
  const autorDaSessao =
    params.usuarioEmail === undefined &&
    params.usuarioNome === undefined &&
    (params.usuarioId === undefined || params.usuarioId === autor.usuarioId);

  return {
    ...(autorDaSessao
      ? {
          usuarioId: autor.usuarioId,
          usuarioEmail: autor.usuarioEmail,
          usuarioNome: autor.usuarioNome,
        }
      : {}),
    ...params,
    ip: params.ip ?? autor.ip,
    userAgent: params.userAgent ?? autor.userAgent,
  };
}

class AuditLogService {
  // Dentro de uma transação de negócio (`client` já é tx), a trava vale até o fim dela; fora,
  // abre uma transação só para a gravação.
  async registrar(dados: RegistrarAuditLogParams, client: PrismaClientOuTx) {
    const params = await comAutor(dados);

    try {
      if ("$transaction" in client) {
        await client.$transaction((tx) => gravarNaCadeia(tx, params));
      } else {
        await gravarNaCadeia(client, params);
      }
    } catch (error) {
      logger.error({ err: error, acao: params.acao }, "Falha ao registrar audit log");
    }
  }

  // Lê as linhas cruas ($queryRaw): pelo client com extensões, a extensão de criptografia
  // decifrava os campos de PII dentro do JSON (dadosAntes/dadosDepois) e o hash recalculado
  // nunca batia nos registros de User — falso alarme de adulteração.
  async verificarCadeia(client: PrismaClientOuTx): Promise<VerificacaoDaCadeia> {
    const registros = await client.$queryRaw<RegistroBruto[]>`
      SELECT * FROM audit_logs ORDER BY "createdAt" ASC, "id" ASC`;
    const hashes = new Set(registros.map((registro) => registro.hash));
    const sucessores = new Map<string, number>();
    let origens = 0;
    let quebradoEm: string | null = null;

    for (const registro of registros) {
      const hashEsperado = gerarHashAuditLog(
        {
          usuarioId: registro.usuarioId,
          usuarioEmail: registro.usuarioEmail,
          acao: registro.acao,
          entidade: registro.entidade,
          entidadeId: registro.entidadeId,
          dadosAntes: registro.dadosAntes,
          dadosDepois: registro.dadosDepois,
          ip: registro.ip,
          userAgent: registro.userAgent,
          createdAt: registro.createdAt,
        },
        registro.hashAnterior,
      );
      const eloApagado = registro.hashAnterior !== null && !hashes.has(registro.hashAnterior);
      const outraOrigem = registro.hashAnterior === null && ++origens > 1;

      if (quebradoEm === null && (hashEsperado !== registro.hash || eloApagado || outraOrigem)) {
        quebradoEm = registro.id;
      }

      if (registro.hashAnterior !== null) {
        sucessores.set(registro.hashAnterior, (sucessores.get(registro.hashAnterior) ?? 0) + 1);
      }
    }

    return {
      valida: quebradoEm === null,
      quebradoEm,
      total: registros.length,
      bifurcacoes: [...sucessores.values()].filter((quantidade) => quantidade > 1).length,
    };
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
