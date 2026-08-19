import type { Prisma } from "@/generated/prisma/client";
import { auditLogService } from "./audit-log.service";
import { auditTxContext } from "./audit-log-context";
import { recifrarParaAuditoria } from "./crypto/encryption-extension";

// Models sensíveis cobertos pela auditoria automática. Toda escrita
// (create/update/delete/upsert) nesses models gera um AuditLog.
export const AUDITADOS = new Set(["User"]);

// Nome do delegate do Prisma Client para cada model (camelCase do nome do
// model), usado para buscar o estado anterior em update/delete.
function nomeDelegate(model: string) {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

type QueryFn = (args: unknown) => Promise<unknown>;

type MontarAuditLogParams = {
  model: string;
  operation: "create" | "update" | "delete" | "upsert";
  args: unknown;
  query: QueryFn;
};

function extrairWhereId(args: unknown): string | null {
  if (typeof args !== "object" || args === null) {
    return null;
  }

  const where = (args as { where?: { id?: unknown } }).where;

  return typeof where?.id === "string" ? where.id : null;
}

async function resolverUsuarioAtual() {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return {
      usuarioId: session.user.id,
      usuarioEmail: session.user.email ?? null,
      usuarioNome: session.user.nome ?? null,
    };
  } catch {
    // Fora de um request (ex: job/cron interno) auth() pode não resolver sessão.
    return null;
  }
}

function montarAcao(model: string, operation: MontarAuditLogParams["operation"]) {
  const sufixo =
    operation === "create"
      ? "CREATE"
      : operation === "update"
        ? "UPDATE"
        : operation === "delete"
          ? "DELETE"
          : "UPSERT";

  return `${model.toUpperCase()}_${sufixo}`;
}

async function buscarDadosAntes(
  client: Record<string, { findUnique: (args: unknown) => Promise<unknown> }>,
  model: string,
  operation: MontarAuditLogParams["operation"],
  entidadeId: string | null,
) {
  if ((operation !== "update" && operation !== "delete") || !entidadeId) {
    return null;
  }

  try {
    const delegate = client[nomeDelegate(model)];

    return (await delegate?.findUnique({ where: { id: entidadeId } })) ?? null;
  } catch {
    // Se a busca do estado anterior falhar por qualquer motivo (ex: chave
    // composta, model sem findUnique padrão), segue sem dadosAntes em vez
    // de impedir a operação de negócio.
    return null;
  }
}

export async function montarAuditLog({ model, operation, args, query }: MontarAuditLogParams) {
  const usuario = await resolverUsuarioAtual();

  const entidadeId = extrairWhereId(args);

  const txAtual = auditTxContext.getStore();

  // Fora de uma transação com contexto propagado (ex: chamada avulsa fora de
  // db.$transaction, ou transação em array-form sem callback), usa o client
  // base — best effort, fora da atomicidade da operação de negócio.
  const client = txAtual ?? (await import("@/lib/db")).db;

  const dadosAntesDecifrados = await buscarDadosAntes(
    client as unknown as Record<string, { findUnique: (args: unknown) => Promise<unknown> }>,
    model,
    operation,
    entidadeId,
  );

  const dadosAntes = recifrarParaAuditoria(model, dadosAntesDecifrados);

  const resultado = await query(args);

  const resultadoComId =
    typeof resultado === "object" && resultado !== null
      ? (resultado as { id?: unknown })
      : undefined;

  const idFinal = entidadeId ?? (typeof resultadoComId?.id === "string" ? resultadoComId.id : null);

  // Para delete, o Prisma retorna o próprio registro removido — guardamos
  // como snapshot para preservar o dado mesmo após a exclusão.
  const dadosDepois = resultado as Prisma.InputJsonValue;

  await auditLogService.registrar(
    {
      usuarioId: usuario?.usuarioId ?? null,
      usuarioEmail: usuario?.usuarioEmail ?? null,
      usuarioNome: usuario?.usuarioNome ?? null,
      acao: montarAcao(model, operation),
      entidade: model,
      entidadeId: idFinal,
      dadosAntes: dadosAntes as Prisma.InputJsonValue | null,
      dadosDepois,
    },
    client,
  );

  return resultado;
}
