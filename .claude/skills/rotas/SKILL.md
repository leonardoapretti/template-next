---
name: rotas
description: Use sempre que for escrever um href, redirect, revalidatePath, router.push, ou montar um link de e-mail apontando pra uma rota interna deste projeto. Nunca escreva uma string de rota solta — use o registro em lib/utils/routes.
---

# Registro central de rotas (`lib/utils/routes`)

Toda rota interna do projeto vem de `routes.*`, importado de `@/lib/utils/routes` — nunca uma string `"/dashboard/algo"` escrita direto num `Link`, `redirect()`, `router.push()`, `revalidatePath()` ou link de e-mail.

## Estrutura

Um arquivo por segmento grande do App Router, cada um exportando uma `const` (rota estática como string, dinâmica como função `(param) => string`):

```
lib/utils/routes/
  public.ts         # "/", "/fale-conosco"
  auth.ts           # login, cadastro, verificar e-mail, redefinir senha
  dashboard.ts      # /dashboard e sub-rotas gerais (conta, emails, exemplos, docs, convite)
  empresa.ts        # /dashboard/empresa, membros, papéis
  agenda.ts         # /agenda
  admin.ts          # /admin, /admin/planos
  api.ts            # /api/logout
  index.ts          # combina tudo em `routes` + re-exporta cada um
  perfil-routes.ts  # helper que decide /admin vs /dashboard conforme o perfil
  auth-links.ts     # server-only: getAppBaseUrl() para link absoluto de e-mail
```

`index.ts` é o único import que o resto do código usa:

```ts
import { routes } from "@/lib/utils/routes";

routes.auth.login                       // "/login"
routes.dashboard.convite(token)         // `/dashboard/empresas/convite/${token}`
routes.empresa.papelSelecionado(id)     // `/dashboard/empresa/papeis?papelId=${id}`
```

## Como adicionar uma rota nova

1. Existe arquivo para o segmento? Adicione a chave no `const` dele (string, ou `(param: string) => \`...\`` para rota dinâmica).
2. Segmento novo (módulo novo, ex.: `produtos`)? Crie `lib/utils/routes/<segmento>.ts` no mesmo formato e registre em `index.ts` (import + objeto `routes` + `export`).
3. Nunca escreva o path no ponto de uso — nem "só desta vez". Mesmo uma URL com query string nasce como entrada em `routes.*`.

## Onde isso importa

- `proxy.ts` usa `routes.*` para decidir o que é rota pública; `auth/index.ts` (`pages.signIn`) e `app/manifest.ts` (`start_url`) também.
- Services que montam link de e-mail (convite, verificação, redefinição de senha) usam `getAppBaseUrl()` (`auth-links.ts`) + `routes.*`, nunca template string com o path escrito à mão.
- Toda `Link href`, `redirect()`, `router.push()`, `router.replace()` e `revalidatePath()` em `app/**`, `components/**` e `lib/**`.
- `lib/utils/routes/index.ts` é puro (sem `server-only`): pode ser importado por Client Component e pelo `proxy.ts`. Só `auth-links.ts` é server-only — não o reexporte no `index.ts`.

## Sinal de que algo está errado

Se você vai escrever `"/dashboard/..."`, `"/admin/..."` ou qualquer literal de rota em código de aplicação (fora de `lib/utils/routes/`), pare: a rota já deveria existir em `routes.*`, ou precisa ser adicionada lá primeiro. Ao tocar num arquivo que ainda tem literal de rota, migre-o para `routes.*` na mesma mudança.

Exceção: literais em testes (`tests/**`) que afirmam o valor concreto de uma URL podem ficar como string.
