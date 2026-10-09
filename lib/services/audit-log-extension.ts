import type { Prisma } from "@/generated/prisma/client";
import { auditLogService } from "./audit-log.service";
import { autorDaRequisicao } from "./audit-log-autor";
import { auditTxContext } from "./audit-log-context";
import { recifrarParaAuditoria } from "./crypto/encryption-extension";

// Models sensíveis cobertos pela auditoria automática. Toda escrita
// (create/update/delete/upsert) nesses models gera um AuditLog.
export const AUDITADOS = new Set([
  "User",
  "Empresa",
  "MembroEmpresa",
  "Role",
  "Plano",
  "PlanoPermissao",
]);

// Segredos que nunca entram na auditoria, nem cifrados (o hash da senha não serve para auditar
// e só aumentaria o que vaza num vazamento do banco): o snapshot registra apenas que mudaram,
// em `segredosAlterados`.
const CAMPOS_SECRETOS = ["senha"] as const;

type Snapshot = Record<string, unknown>;

function ehSnapshot(valor: unknown): valor is Snapshot {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function semSegredos(snapshot: Snapshot): Snapshot {
  const copia = { ...snapshot };

  for (const campo of CAMPOS_SECRETOS) delete copia[campo];

  return copia;
}

// Snapshots de antes/depois prontos para gravar: sem segredos e com a PII cifrada nos dois lados
// (o resultado da query chega decifrado pela extensão de criptografia).
export function snapshotsParaAuditoria(model: string, antes: unknown, depois: unknown) {
  const segredosAlterados = CAMPOS_SECRETOS.filter(
    (campo) =>
      ehSnapshot(depois) &&
      campo in depois &&
      (!ehSnapshot(antes) || antes[campo] !== depois[campo]),
  );

  return {
    dadosAntes: ehSnapshot(antes) ? recifrarParaAuditoria(model, semSegredos(antes)) : antes,
    dadosDepois: ehSnapshot(depois)
      ? recifrarParaAuditoria(model, {
          ...semSegredos(depois),
          ...(segredosAlterados.length > 0 ? { segredosAlterados } : {}),
        })
      : depois,
  };
}

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

function extrairWhere(args: unknown): Record<string, unknown> | null {
  if (typeof args !== "object" || args === null) {
    return null;
  }

  const where = (args as { where?: unknown }).where;

  return ehSnapshot(where) ? where : null;
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
  where: Record<string, unknown> | null,
) {
  if (operation === "create" || !where) {
    return null;
  }

  // Busca pelo mesmo `where` único da escrita (id, e-mail...): o upsert também tem estado
  // anterior quando o registro já existia.
  try {
    const delegate = client[nomeDelegate(model)];

    return (await delegate?.findUnique({ where })) ?? null;
  } catch {
    // Se a busca do estado anterior falhar por qualquer motivo (ex: chave
    // composta, model sem findUnique padrão), segue sem dadosAntes em vez
    // de impedir a operação de negócio.
    return null;
  }
}

export async function montarAuditLog({ model, operation, args, query }: MontarAuditLogParams) {
  const where = extrairWhere(args);
  const entidadeId = typeof where?.id === "string" ? where.id : null;

  const txAtual = auditTxContext.getStore();

  // Fora de uma transação com contexto propagado (ex: chamada avulsa fora de
  // db.$transaction, ou transação em array-form sem callback), usa o client
  // base — best effort, fora da atomicidade da operação de negócio.
  const client = txAtual ?? (await import("@/lib/db")).db;

  const dadosAntesDecifrados = await buscarDadosAntes(
    client as unknown as Record<string, { findUnique: (args: unknown) => Promise<unknown> }>,
    model,
    operation,
    where,
  );

  const resultado = await query(args);

  const resultadoComId =
    typeof resultado === "object" && resultado !== null
      ? (resultado as { id?: unknown })
      : undefined;

  const idFinal = entidadeId ?? (typeof resultadoComId?.id === "string" ? resultadoComId.id : null);

  // Para delete, o Prisma retorna o próprio registro removido — guardamos
  // como snapshot para preservar o dado mesmo após a exclusão.
  const { dadosAntes, dadosDepois } = snapshotsParaAuditoria(
    model,
    dadosAntesDecifrados,
    resultado,
  );

  const autor = await autorDaRequisicao();

  await auditLogService.registrar(
    {
      ...autor,
      acao: montarAcao(model, operation),
      entidade: model,
      entidadeId: idFinal,
      dadosAntes: dadosAntes as Prisma.InputJsonValue | null,
      dadosDepois: dadosDepois as Prisma.InputJsonValue | null,
    },
    client,
  );

  return resultado;
}
