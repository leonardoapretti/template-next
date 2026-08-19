import type { AccessContext } from "@/lib/access-control/context";

type ContextOverrides = Partial<AccessContext>;

export function createContext(overrides: ContextOverrides = {}): AccessContext {
  return {
    usuarioId: overrides.usuarioId ?? "user-1",
    isAdmin: overrides.isAdmin ?? false,
  };
}

export const ctxAdmin = createContext({
  usuarioId: "user-admin",
  isAdmin: true,
});

export const ctxUsuario = createContext({
  usuarioId: "user-1",
});
