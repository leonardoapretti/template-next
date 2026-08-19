import { AsyncLocalStorage } from "node:async_hooks";
import type { DbTransactionClient } from "@/lib/db";

// Propaga a transação atual para a Query Extension de auditoria (lib/db.ts),
// já que o callback de extensão do Prisma não recebe referência ao
// client/transação em uso. Sem isso, o AuditLog seria sempre gravado fora
// da transação de negócio, quebrando a garantia de atomicidade (rollback da
// operação de negócio não reverteria o log, e vice-versa).
export const auditTxContext = new AsyncLocalStorage<DbTransactionClient>();
