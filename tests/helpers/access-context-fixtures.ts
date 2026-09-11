import type { AccessContext, MembroEmpresaContexto } from "@/lib/access-control/context";
import { permissionKeys } from "@/lib/access-control/permission-registry";
import { NOME_ROLE_PROPRIETARIO } from "@/lib/access-control/policy";

type MembroEmpresaOverrides = Partial<MembroEmpresaContexto>;

// Por padrão, tudo liberado no plano — mesmo comportamento de uma empresa
// sem plano vinculado (`planoService.buscarMatriz(null)`), pra não exigir
// que todo teste de permissão já existente precise mockar a camada de
// plano explicitamente.
const PERMISSOES_PLANO_LIBERADAS = Object.fromEntries(permissionKeys.map((chave) => [chave, true]));

export function createMembroEmpresa(overrides: MembroEmpresaOverrides = {}): MembroEmpresaContexto {
  return {
    membroId: overrides.membroId ?? "membro-1",
    empresaId: overrides.empresaId ?? "empresa-1",
    roleId: overrides.roleId ?? "role-1",
    roleNome: overrides.roleNome ?? "Administrador",
    permissoes: overrides.permissoes ?? [],
    permissoesPlano: overrides.permissoesPlano ?? PERMISSOES_PLANO_LIBERADAS,
  };
}

type ContextOverrides = Partial<AccessContext>;

export function createContext(overrides: ContextOverrides = {}): AccessContext {
  return {
    usuarioId: overrides.usuarioId ?? "user-1",
    isAdmin: overrides.isAdmin ?? false,
    membroEmpresa: overrides.membroEmpresa ?? null,
  };
}

export const ctxAdmin = createContext({
  usuarioId: "user-admin",
  isAdmin: true,
});

export const ctxUsuario = createContext({
  usuarioId: "user-1",
});

export const ctxProprietarioEmpresa = createContext({
  usuarioId: "user-proprietario",
  membroEmpresa: createMembroEmpresa({
    roleId: "role-proprietario",
    roleNome: NOME_ROLE_PROPRIETARIO,
  }),
});

export const ctxAdministradorEmpresa = createContext({
  usuarioId: "user-administrador",
  membroEmpresa: createMembroEmpresa({
    roleId: "role-administrador",
    roleNome: "Administrador",
    permissoes: ["agenda:create"],
  }),
});
