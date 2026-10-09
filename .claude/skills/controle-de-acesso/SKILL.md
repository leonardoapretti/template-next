---
name: controle-de-acesso
description: Use ao proteger uma action, rota, página ou botão com permissões, ao criar/alterar uma permissão, papel ou plano, ao adicionar item ao menu lateral, ou ao mexer em getAccessContext. Cobre os guards, o registro de permissões e a composição cacheada do contexto de acesso.
---

# Controle de acesso (`lib/access-control`)

Detalhes de uso e exemplos: `lib/fumadocs/content/docs/controle-de-acesso.mdx`.

## Quem protege o quê

| Camada | Como | Onde |
|---|---|---|
| **Action** (a garantia real) | `await assertCurrentUserCan("recurso:acao")` (devolve o `AccessContext`); guards de área: `assertAdminAction`, `assertEmpresaAction`, `assertProprietarioEmpresa` | toda server action que lê/escreve algo restrito; **depois** de validar a entrada e **antes** de tocar o banco |
| **Página / Server Component** | `canUseFeature(ctx, "recurso:acao")` para esconder botão/seção; `redirect` para barrar a rota | `page.tsx` |
| **Layout de seção** | `canUseFeature` no `layout.tsx` da seção | `app/dashboard/<recurso>/layout.tsx` |
| **Menu lateral** | itens em `components/sidebar/sidebar-usuario` / `sidebar-admin` / `sidebar-agenda`; `NavMain` aceita `hrefsSemAcesso` para esconder destinos sem permissão | sidebars |

Regras:
- Nunca esconda só a UI sem o guard na action, nem proteja só a action deixando o botão visível.
- Permissão nova: registre em `lib/access-control/permission-registry.ts` **antes** de usar (matriz de papéis, tela de planos e testes dependem dela).
- `canUseFeature` exige duas camadas: permissão do **papel** e liberação do **plano** da empresa. Empresa sem plano = tudo liberado pelo plano.
- Guards de *área* não substituem a permissão granular.
- Item novo de menu ou botão de ação: revisar quem pode ver/usar (regra do AGENTS.md).

## `getAccessContext()` é composto de camadas cacheadas

`context.ts` lê o cookie da empresa ativa (`EMPRESA_ATIVA_COOKIE`, **sempre revalidado** contra os vínculos ativos no banco, nunca confiado) e compõe: usuário + vínculos (`userTag`), permissões do papel (`papeisTag`) e matriz do plano (`planoMatrizTag`). Cada camada é `"use cache"` com a própria tag para que editar um papel não invalide o cache de todos os usuários.

Ao escrever algo que muda o acesso, invalide a tag certa com `updateTag` **no service** (nunca em `actions.ts`):
- papel/status de vínculo, aceite de convite, virar admin → `userTag`
- permissões de um papel → `papeisTag`
- matriz do plano → `planoMatrizTag`

Nunca leia `cookies()`/`headers()` dentro de função `"use cache"`: extraia fora e passe como argumento (ver `getAccessContext`, skill `cache-components`).

## Testes

Mocke `getAccessContext`/`assertCurrentUserCan` como `tests/actions/*` e `tests/access-control/*`. Teste sempre o caso negado (sem permissão, plano sem a feature, outra empresa).
