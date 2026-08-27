import type { AccessContext } from "./context";

export type AccessRole = "ADMIN";

export function canActAs(ctx: AccessContext, role: AccessRole) {
  if (role === "ADMIN") {
    return ctx.isAdmin;
  }

  return false;
}

// Permissão no formato "recurso:acao" (ex.: "usuarios:create"). Admin
// ignora o perfil de acesso e tem permissão irrestrita.
export function canUseFeature(ctx: AccessContext, permissao: string) {
  if (ctx.isAdmin) {
    return true;
  }

  return ctx.permissoes.includes(permissao);
}
