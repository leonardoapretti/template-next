import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";
import { AUDITADOS, montarAuditLog } from "./services/audit-log-extension";
import { encryptionExtension } from "./services/crypto/encryption-extension";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// O adapter só pode ser criado dentro do `??`: em dev, o HMR reavalia este
// módulo a cada hot-reload, e como globalForPrisma.prisma já existe nas
// reavaliações seguintes, criar o adapter fora do `??` abriria um pool novo
// de conexões (connectionLimit: 10) a cada reload sem nunca fechá-lo,
// vazando conexões até esgotar o max_connections do MySQL.
const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaMariaDb({
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: 10,
    }),
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

// Ordem importa: cada .$extends() empilha por fora do anterior, então
// encryptionExtension (declarada primeiro) fica mais externa e auditExtension
// mais perto do driver. Isso faz o `query()` que o audit log chama devolver o
// dado ainda cifrado (a decifragem só acontece depois, no retorno para a
// camada de encryption), então dadosAntes/dadosDepois ficam cifrados na
// tabela audit_logs, evitando duplicar PII em texto puro.
export const db = basePrisma.$extends(encryptionExtension).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!AUDITADOS.has(model) || !isOperacaoAuditavel(operation)) {
          return query(args);
        }

        return montarAuditLog({
          model,
          operation,
          args,
          query,
        });
      },
    },
  },
});

export type DbClient = typeof db;

// db.$extends() muda o tipo do client (e do `tx` recebido em $transaction),
// então Prisma.TransactionClient (gerado estaticamente) não é mais compatível.
// Services que recebem/repassam uma transação devem usar este tipo. Replica
// o Omit aplicado internamente pelo Prisma ao client de dentro de $transaction.
export type DbTransactionClient = Omit<
  DbClient,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

function isOperacaoAuditavel(
  operation: string,
): operation is "create" | "update" | "delete" | "upsert" {
  return (
    operation === "create" ||
    operation === "update" ||
    operation === "delete" ||
    operation === "upsert"
  );
}
