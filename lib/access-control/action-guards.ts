import type { AccessContext } from "./context";
import { EmpresaRequiredError, ProfileRequiredError } from "./errors";
import { canActAs } from "./policy";

export async function assertAdminAction(ctx: AccessContext) {
  if (!ctx.isAdmin) {
    throw new ProfileRequiredError("Perfil administrativo obrigatório para esta ação.");
  }
}

// Guard de área/funcionalidade de empresa: exige apenas vínculo ativo com
// uma empresa (qualquer papel), análogo a assertAdminAction para a área
// global. Não confunda com permissão granular (assertCurrentUserCan).
export async function assertEmpresaAction(ctx: AccessContext) {
  if (!ctx.isAdmin && !ctx.membroEmpresa) {
    throw new EmpresaRequiredError();
  }
}

// Guard para as ações exclusivas do Proprietário da empresa (inativar a
// empresa, transferir titularidade).
export async function assertProprietarioEmpresa(ctx: AccessContext) {
  if (!canActAs(ctx, "PROPRIETARIO_EMPRESA")) {
    throw new ProfileRequiredError("Ação exclusiva do proprietário da empresa.");
  }
}
