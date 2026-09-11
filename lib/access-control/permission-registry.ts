// Catálogo de recursos e operações do motor de permissões multi-tenant.
// Cada operação tem uma `key` no formato "recurso:acao" — essa string é o
// que trafega em `Role.permissoes`, `canUseFeature`/`assertCurrentUserCan`
// e `PlanoPermissao.chave`. `kind` classifica a operação para a UI de
// administração (tela de papéis e tela de planos): as operações
// `create`/`read`/`update`/`delete` ficam atrás do checkbox mestre do
// recurso; `extra` só aparece ao abrir "+ opções". Ao estender o template
// pro seu domínio, adicione novos recursos aqui e proteja as actions
// correspondentes com `assertCurrentUserCan("recurso:acao")` — ver
// `lib/fumadocs/content/docs/controle-de-acesso.mdx`.
export type OperationKind = "create" | "read" | "update" | "delete" | "extra";

export type ResourceOperation<Key extends string = string> = {
  key: Key;
  kind: OperationKind;
  label: string;
};

export type ResourceDefinition = {
  key: string;
  label: string;
  operations: ResourceOperation[];
};

export const resourceRegistry = [
  {
    key: "empresa",
    label: "Empresa",
    operations: [
      { key: "empresa:convidar", kind: "extra", label: "Convidar e gerenciar membros" },
      { key: "empresa:configurar", kind: "extra", label: "Configurar dados da empresa" },
    ],
  },
  {
    key: "papeis",
    label: "Perfis e permissões",
    operations: [{ key: "papeis:gerenciar", kind: "extra", label: "Gerenciar perfis e permissões" }],
  },
  {
    key: "agenda",
    label: "Agenda",
    operations: [
      { key: "agenda:read", kind: "read", label: "Visualizar" },
      { key: "agenda:create", kind: "create", label: "Criar" },
      { key: "agenda:update", kind: "update", label: "Atualizar" },
      { key: "agenda:delete", kind: "delete", label: "Excluir" },
    ],
  },
] as const satisfies readonly ResourceDefinition[];

export type PermissionKey = (typeof resourceRegistry)[number]["operations"][number]["key"];

export const permissionKeys = resourceRegistry.flatMap((resource) =>
  resource.operations.map((operation) => operation.key),
) as PermissionKey[];

// Trava de leitura: nenhum recurso pode ter create/update/delete liberado
// sem read também liberado — não faz sentido editar algo que não se pode
// ver. Usado tanto na UI (PermissionMatrixField trava o checkbox de
// leitura) quanto no servidor (role.service/plano.service normalizam
// antes de gravar, então a trava vale mesmo se alguém contornar a UI).
const OPERACOES_DE_ESCRITA: OperationKind[] = ["create", "update", "delete"];

export function aplicarDependenciasDeLeitura(
  valores: Record<string, boolean>,
): Record<string, boolean> {
  const resultado = { ...valores };

  for (const resource of resourceRegistry) {
    const leitura = resource.operations.find((operacao) => operacao.kind === "read");

    if (!leitura) {
      continue;
    }

    const temEscritaLiberada = resource.operations.some(
      (operacao) => OPERACOES_DE_ESCRITA.includes(operacao.kind) && resultado[operacao.key],
    );

    if (temEscritaLiberada) {
      resultado[leitura.key] = true;
    }
  }

  return resultado;
}

// Todas as chaves do catálogo exceto as de um determinado `kind` — usado
// para montar o conjunto de permissões dos papéis padrão do sistema (ex.:
// Secretário/Profissional têm tudo menos exclusão, ver policy.ts).
export function permissionKeysExcludingKind(kind: OperationKind): PermissionKey[] {
  return resourceRegistry.flatMap((resource) =>
    resource.operations.filter((operation) => operation.kind !== kind).map((operation) => operation.key),
  ) as PermissionKey[];
}
