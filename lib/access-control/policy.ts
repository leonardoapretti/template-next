import type { AccessContext } from "./context";

export type AccessRole = "ADMIN";

export function canActAs(ctx: AccessContext, role: AccessRole) {
  if (role === "ADMIN") {
    return ctx.isAdmin;
  }

  return false;
}
