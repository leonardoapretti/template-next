import { type AccessContext, getAccessContext } from "./context";
import { AccessDeniedError } from "./errors";
import { canUseFeature } from "./policy";

// One-liner que server actions/route handlers chamam no topo para proteger
// uma mutação ou leitura sensível por permissão granular (recurso:acao).
// Ex.: `await assertCurrentUserCan("usuarios:delete")`.
export async function assertCurrentUserCan(permissao: string): Promise<AccessContext> {
  const ctx = await getAccessContext();

  if (!canUseFeature(ctx, permissao)) {
    throw new AccessDeniedError(`Você não tem permissão para "${permissao}".`);
  }

  return ctx;
}
