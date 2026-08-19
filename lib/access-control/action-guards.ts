import type { AccessContext } from "./context";
import { ProfileRequiredError } from "./errors";

export async function assertAdminAction(ctx: AccessContext) {
  if (!ctx.isAdmin) {
    throw new ProfileRequiredError("Perfil administrativo obrigatório para esta ação.");
  }
}
