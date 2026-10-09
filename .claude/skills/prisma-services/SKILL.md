---
name: prisma-services
description: Use ao criar ou editar um service em lib/services/**/*.service.ts, ou ao mexer numa migration/schema do Prisma. Cobre o padrão BaseService + DataBaseResponse e as regras de migration do projeto.
---

# Services e Prisma neste projeto

## Toda leitura/escrita de banco passa por um service

Nunca chame `db.<model>` direto de uma action ou Server Component — sempre por `lib/services/<nome>.service.ts`. Referências de estilo: `role.service.ts`, `empresa.service.ts`.

## `BaseService`

Services com CRUD genérico estendem `BaseService<typeof db.model>` (`lib/services/config/base-service.ts`): `recuperar`, `recuperarTodos`, `recuperarPorId`, `criar`, `atualizar`, `remover`, `upsert`.

- Use a opção `scope` só quando o model deve ser filtrado automaticamente pelo contexto do usuário (empresa ativa). Não adicione "por garantia" a dado global.
- Se o método precisa de `select`/relações no retorno, a tipagem genérica não propaga: escreva `db.model.findMany(...)` no service.
- Os genéricos do `BaseService` com `scope` resolvem o escopo sozinhos (cookies): não dá para pôr `"use cache"` neles sem passar o escopo como argumento (skill `cache-components`).

## `DataBaseResponse`

Todo método que pode falhar por regra de negócio retorna `DataBaseResponse`, não lança direto:

```ts
DataBaseResponse.fromPromise(async () => {
  if (condicaoInvalida) throw new Error("Mensagem clara pro usuário.");
  return resultado;
});
```

Na action (`"use server"`), serialize antes de voltar ao client: `return response.serialize();`.

`DataBaseResponse` **não é serializável** dentro de `"use cache"`: a query crua vira função cacheada separada, e o método público a envolve com `fromPromise`.

## Escritas que afetam o acesso invalidam cache por tag

`getAccessContext` é composto de camadas cacheadas (`"use cache"`), cada uma com sua tag (`userTag`, `papeisTag`, `planoMatrizTag`). Toda escrita em `User`, `MembroEmpresa`, `Role` ou plano precisa chamar `updateTag(...)` da tag certa **no próprio método do service** (skills `cache-components` e `controle-de-acesso`).

## Form/schema/actions

Escrita vinda de formulário: `schema.ts` (zod), `actions.ts` (`"use server"`, revalida com o mesmo schema, chama o service, devolve `DataBaseResponse` serializado) e o componente client (`react-hook-form` + `zodResolver`). Nunca valide só no client.

## Migrations

- Comece pelo gerador: `pnpm prisma migrate dev --create-only --name <nome>`; só depois acrescente SQL manual.
- Se o diff do schema mostrar mudanças pendentes, gere e aplique uma migration para elas; ao fim, `prisma generate` e confirme que `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` não mostra nada.
- Não altere o schema fora do escopo da tarefa. Nada destrutivo sem necessidade; nunca descarte dados para "resolver" migration; nunca `migrate reset` em banco com dado.
- **Nunca edite o SQL de migration já aplicada** (quebra o hash em `_prisma_migrations`): crie uma nova.
- Evite N+1; use `db.$transaction` quando a operação precisar ser atômica.
