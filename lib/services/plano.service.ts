import { cache } from "react";
import { db } from "../db";
import { aplicarDependenciasDeLeitura, permissionKeys } from "../access-control/permission-registry";
import type { PermissionKey } from "../access-control/permission-registry";
import { DataBaseResponse } from "./config/database-response";

class PlanoService {
  listar() {
    return DataBaseResponse.fromPromise(() => db.plano.findMany({ orderBy: { nome: "asc" } }));
  }

  criar(codigo: string, nome: string) {
    return DataBaseResponse.fromPromise(() => db.plano.create({ data: { codigo, nome } }));
  }

  // Lê a matriz de permissões do plano (chave -> liberado). `planoId: null`
  // preserva o comportamento de "empresa sem plano vinculado = tudo
  // liberado", pra não regredir empresas já existentes. Memoizado por
  // request (React `cache()`).
  buscarMatriz = cache(async (planoId: string | null): Promise<Record<PermissionKey, boolean>> => {
    if (!planoId) {
      return Object.fromEntries(permissionKeys.map((chave) => [chave, true])) as Record<
        PermissionKey,
        boolean
      >;
    }

    const linhas = await db.planoPermissao.findMany({
      where: { planoId },
      select: { chave: true, permitido: true },
    });

    const permitidos = new Map(linhas.map((linha) => [linha.chave, linha.permitido]));

    return Object.fromEntries(
      permissionKeys.map((chave) => [chave, permitidos.get(chave) ?? false]),
    ) as Record<PermissionKey, boolean>;
  });

  salvarMatriz(planoId: string, permissoes: Record<string, boolean>) {
    const normalizado = aplicarDependenciasDeLeitura(permissoes);

    return DataBaseResponse.fromPromise(() =>
      db.$transaction(
        permissionKeys.map((chave) =>
          db.planoPermissao.upsert({
            where: { planoId_chave: { planoId, chave } },
            update: { permitido: Boolean(normalizado[chave]) },
            create: { planoId, chave, permitido: Boolean(normalizado[chave]) },
          }),
        ),
      ),
    );
  }
}

export const planoService = new PlanoService();
