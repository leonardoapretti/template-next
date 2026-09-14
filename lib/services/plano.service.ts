import { cacheLife, cacheTag, updateTag } from "next/cache";
import { db } from "../db";
import { aplicarDependenciasDeLeitura, permissionKeys } from "../access-control/permission-registry";
import type { PermissionKey } from "../access-control/permission-registry";
import { planoMatrizTag } from "./config/cache-tags";
import { DataBaseResponse } from "./config/database-response";

// Lê a matriz de permissões do plano (chave -> liberado). `planoId: null`
// preserva o comportamento de "empresa sem plano vinculado = tudo
// liberado", pra não regredir empresas já existentes.
async function buscarMatrizCached(planoId: string | null): Promise<Record<PermissionKey, boolean>> {
  "use cache";
  cacheLife("hours");
  cacheTag(planoMatrizTag(planoId));

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
}

class PlanoService {
  listar() {
    return DataBaseResponse.fromPromise(() => db.plano.findMany({ orderBy: { nome: "asc" } }));
  }

  criar(codigo: string, nome: string) {
    return DataBaseResponse.fromPromise(() => db.plano.create({ data: { codigo, nome } }));
  }

  buscarMatriz(planoId: string | null) {
    return buscarMatrizCached(planoId);
  }

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
    ).then((response) => {
      if (response.isSuccess()) {
        updateTag(planoMatrizTag(planoId));
      }

      return response;
    });
  }
}

export const planoService = new PlanoService();
