---
name: controle-de-acesso-multi-tenant
description: Use ao criar ou alterar qualquer model, service, action ou página que pertença a uma empresa (tenant), ao mexer na empresa ativa da sessão (EMPRESA_ATIVA_COOKIE), em Empresa/MembroEmpresa/Role/Plano, ou ao revisar isolamento de dados entre empresas. Explica o modelo multi-tenant do template e como o controle de acesso o consome.
---

# Multi-tenant e controle de acesso

Visão geral e telas: `lib/fumadocs/content/docs/empresas.mdx` e `controle-de-acesso.mdx`. Para os guards e o registro de permissões, skill `controle-de-acesso`. Para isolamento no banco, skill `rls` (ainda **não** adotada: hoje o isolamento depende só do filtro de aplicação descrito aqui).

## Modelo

- **Tenant = `Empresa`**. Todo recurso de domínio tem `empresaId` + relação com `Empresa` (como `Evento`), **nunca** relação direta com `User`.
- **`MembroEmpresa`** (`@@unique([empresaId, usuarioId])`): vínculo usuário↔empresa com um `Role`. Um login pode ter vários vínculos (várias empresas); só um fica "ativo" na sessão.
- **`Role`**: sempre escopado à empresa (`@@unique([empresaId, nome])`), `permissoes String[]`. Os 4 perfis `padraoSistema` (Proprietário, Administrador, Secretário, Profissional) são semeados em `empresaService.criarEmpresa` e não podem ser renomeados nem excluídos.
- **`Plano`/`PlanoPermissao`**: teto de features da empresa (`Empresa.planoId`; `null` = tudo liberado), editado só por admin da plataforma em `/admin/planos`.
- **`User.isAdmin`**: admin da plataforma, fora de qualquer tenant (`/admin`). Passa em `canUseFeature`, mas **continua precisando de empresa ativa** para criar/ler dado de empresa.

Não existe perfil global de usuário: permissão sempre vem do vínculo com a empresa ativa.

## Empresa ativa da sessão

- Guardada no cookie httpOnly `EMPRESA_ATIVA_COOKIE` (`lib/access-control/context.ts`). O cookie é **só uma preferência**: `getAccessContext()` o revalida contra os `MembroEmpresa` ativos no banco; se não casar, cai no primeiro vínculo ativo (ou `membroEmpresa: null`).
- Trocar de empresa: `selecionarEmpresaAtivaAction` (`components/sidebar/actions.ts`) confirma o vínculo com `empresaService.possuiVinculoAtivo` **antes** de gravar o cookie e o client recarrega a página. Qualquer outra action que grave esse cookie (criar empresa, aceitar convite) faz o mesmo: só depois de o vínculo existir.
- Nunca leia `cookies()` em função `"use cache"`; o `empresaId` entra como argumento (skill `cache-components`).

## De onde vem o `empresaId` (regra central)

| Fonte | Confiável? |
|---|---|
| `ctx.membroEmpresa.empresaId` (de `getAccessContext()` / retorno de `assertCurrentUserCan`) | **Sim** |
| Campo de formulário, argumento de action, query string, body, cookie lido direto | **Não** |

Fluxo de toda action de recurso da empresa:
1. validar entrada (zod) — **sem** aceitar `empresaId` no schema, a menos que seja o alvo de uma troca/convite já validado contra vínculo;
2. `const ctx = await assertCurrentUserCan("recurso:acao")`;
3. `if (!ctx.membroEmpresa) throw new EmpresaRequiredError()` (inclusive para admin da plataforma);
4. chamar o service passando `ctx.membroEmpresa.empresaId`.

## Isolamento na camada de service

- Todo `where` de leitura/escrita de dado de empresa inclui `empresaId`, **inclusive busca/edição/exclusão por `id`**: `where: { id, empresaId }` (padrão de `agendamento.service.ts`). `id` sozinho permite IDOR entre empresas.
- Services que estendem `BaseService` (`role.service.ts`) usam a opção `scope: (contexto) => ({ empresaId: contexto.empresaId })`; `recuperar`/`recuperarTodos`/`atualizar`/`remover` aplicam o escopo sozinhos. Admin da plataforma tem `acessoGlobal`, então defina no `scope` o que ele enxerga.
- `criar` não escopa: o service define `empresaId` explicitamente no `data`, vindo do contexto.
- Dado relacionado (ex.: `roleId`, `membroId` recebidos do client) deve ser conferido como pertencente à mesma empresa antes de gravar. Receber só um ID e confiar nele é a falha mais comum.
- Query sem `empresaId` só em fluxo de plataforma (admin) ou cross-tenant legítimo (convite por token, e-mail já em uso), sempre atrás de guard ou token.

## Cache e tags por tenant

Tag sempre parametrizada por empresa (`papeisTag(empresaId)`, `membrosTag`, `eventosAgendaTag`…, em `lib/services/config/cache-tags.ts`), e o `empresaId` entra como argumento da função `"use cache"`. Sem isso, uma empresa serviria cache de outra. Mutação invalida a tag da **mesma empresa** com `updateTag` no service. Regras completas na skill `cache-components`.

## Invariantes de negócio

- Empresa nunca fica sem Proprietário (não inativar o único nem a si mesmo).
- Proprietário: bypass da camada de `Role` em `canUseFeature`, mas **sujeito ao teto do plano**; permissões dele não são editáveis.
- Perfil só é excluído sem membros ativos; padrão de sistema não é renomeado/excluído.
- Convite (`ActionToken` `CONVITE_MEMBRO_EMPRESA`) exige aceite explícito com a sessão batendo com o e-mail convidado.
- Trocar perfil / inativar membro / convidar usam `empresa:convidar`; gerir perfis usa `papeis:gerenciar`. Operações de escrita exigem a leitura do mesmo recurso (`aplicarDependenciasDeLeitura`).

## Adicionando recurso de domínio novo

1. Model com `empresaId String`, relação `Empresa` (`onDelete: Cascade`) e `@@index([empresaId])`; migration nova (skill `prisma-services`).
2. Service com `empresaId` como primeiro argumento nos métodos públicos; `where` sempre com `empresaId`; leituras em `"use cache"` com tag por empresa.
3. Permissões `recurso:acao` no `permission-registry.ts`, liberadas no plano e atribuídas aos perfis.
4. Actions pelo fluxo acima; página/botão com `canUseFeature`; item de menu revisado.
5. Se o recurso mexe em dinheiro, acesso ou configuração, registrar na auditoria (skill `auditoria`).

## Testes (sempre o caso negado)

- Usuário da empresa B não lê, edita nem exclui registro da empresa A **por `id`**.
- `empresaId` forjado no input é ignorado/rejeitado.
- Cookie de empresa sem vínculo ativo cai no primeiro vínculo / `null`.
- Sem empresa ativa: `EmpresaRequiredError` (admin da plataforma inclusive).
- Plano sem a feature nega até o Proprietário.
- Mocke `getAccessContext`/`assertCurrentUserCan` como em `tests/actions/*` e `tests/access-control/*`.

## Checklist de revisão

- Algum `empresaId` vem do client sem checagem de vínculo?
- Algum `findUnique/update/delete` por `id` sem `empresaId` no `where`?
- IDs relacionados recebidos do client pertencem à mesma empresa?
- Cache/tag inclui o `empresaId`? `updateTag` da empresa certa?
- Admin da plataforma sem empresa ativa é tratado?
- Há teste cross-tenant negado?
