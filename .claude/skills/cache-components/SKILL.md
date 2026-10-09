---
name: cache-components
description: Use ao decidir se uma leitura de banco na camada de service deve ser cacheada, ao criar/alterar uma mutação que afeta dado cacheado, ou ao mexer em algo que lê cookies()/headers() perto de uma função que busca dado. Regras do Cache Components (cacheComponents true) deste template.
---

# Cache Components neste projeto

`cacheComponents: true` está ligado em `next.config.ts`. Histórico e raciocínio: `/docs/migracao-cache-components`. Antes de usar qualquer API de cache, confira o guia da versão instalada em `node_modules/next/dist/docs/`.

## Regras

1. **Toda leitura de service que alimenta página ou é reaproveitada entre requests** usa `"use cache"` + `cacheLife` + `cacheTag` (de `next/cache`).
2. **`DataBaseResponse` não é serializável** em `"use cache"`: a query crua vira função `"use cache"` module-level (não exportada); o método público chama `DataBaseResponse.fromPromise(() => funcaoCacheada(...))`.

```ts
async function buscarEventosCached(empresaId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(eventosAgendaTag(empresaId));
  return db.evento.findMany({ where: { empresaId } });
}
```

3. **Tags só de `lib/services/config/cache-tags.ts`.** Entidade nova → adicione a função lá primeiro.
4. **Invalidação: sempre `updateTag`** (imediata, read-your-own-writes), nunca `revalidateTag` para dado administrativo/de permissão. Fica no método do service, logo após a escrita — não nas actions. Mantenha o `revalidatePath` já existente nas actions.
5. **Nunca cacheie função que lê `cookies()`/`headers()`**: extraia o valor fora e passe como argumento.
6. **Dado agregado de várias entidades**: decomponha em funções cacheadas, cada uma com sua tag (ver `getAccessContext`).
7. **`BaseService` com `scope`** resolve o escopo por cookies: para cachear, o método precisa receber o escopo (ex.: `empresaId`) como argumento.
8. **Rotas 100% autenticadas** (dashboard, agenda, admin) mantêm `export const instant = false` de propósito. Não "conserte".

## Testes

Teste que exercita service real com `"use cache"` mocka `next/cache` com `cacheLife`, `cacheTag` e `updateTag` (ver `tests/services/plano-matriz.test.ts`).

## Erros frequentes

- `"use cache"` precisa ser a primeira instrução da função, antes de qualquer `await`.
- Passar o objeto `cookies()`/`headers()` (ou função que o lê) para dentro da função cacheada.
- Leitura e invalidação com tags diferentes (ex.: `papeisTag` vs `membrosTag`): o cache antigo nunca é limpo.
- Mutação nova sem `updateTag`: o dado fica velho até expirar pelo `cacheLife`.
- Um cache único para agregado de várias entidades: uma mutação pequena invalida tudo.
