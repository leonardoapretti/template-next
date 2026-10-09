---
name: rls
description: Use ao desenhar, implementar ou revisar isolamento de dados entre empresas/usuários no Postgres (Row Level Security) — tabela nova com dado por empresa ou por usuário, roles de banco, withRlsContext, policies e GRANTs em migration. Aplicável a qualquer app multiusuário/multi-tenant derivado deste template.
---

# RLS — isolamento de dados no Postgres

⚠️ **Estado no template: RLS ainda não está implementada.** Hoje o isolamento entre empresas depende só do filtro de aplicação (`where: { empresaId }` + guards — skills `nunca-confiar-no-client` e `controle-de-acesso`), uma lacuna registrada no A01 da skill `owasp-top10-2025`. Esta skill é o guia para adotar RLS (nova tabela ou app derivado) sem repetir erros já vistos em produção em outro projeto. Antes de aplicar, confirme com o dono do projeto que a adoção foi decidida: ela muda roles do banco, `lib/db.ts` e o fluxo de todos os services.

## Ideia

Além do `where` da aplicação, o Postgres recusa linha de outro dono: mesmo que uma query esqueça o filtro, a role restrita não lê nem escreve dado alheio. É defesa em profundidade, **não substitui** o `where` nem os guards.

## Desenho recomendado (tenant = `empresaId`)

- **Duas roles de banco**: uma restrita (ex.: `app_tenant`), sujeita às policies e usada nas operações de usuário comum; uma ampla (`BYPASSRLS`, ex.: `app_admin`) para migrations, seeds, webhooks, jobs e ações administrativas. Dois Prisma clients em `lib/db.ts` (`db` amplo, `tenantDb` restrito), ambos com as mesmas extensões (criptografia, auditoria).
- **Contexto por transação**, nunca por conexão:

```ts
// lib/db/rls.ts
export async function withRlsContext<T>(
  empresaId: string,
  callback: (tx: TenantDbTransactionClient) => Promise<T>,
): Promise<T> {
  return tenantDb.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.empresa_id', ${empresaId}, true)`;
    return callback(tx);
  });
}
```

  O terceiro argumento `true` (equivale a `SET LOCAL`) limita o valor à transação — com pool de conexões, valor de sessão vazaria entre requisições.
- Função SQL `app_current_empresa_id()` lendo `current_setting('app.empresa_id', true)`, usada nas policies.

## Regras de uso

1. `empresaId` vem de `getAccessContext()` (já revalidado contra os vínculos), **nunca** de campo do client.
2. **Nunca use o client restrito fora de `withRlsContext`**: sem o `set_config` a policy nunca casa e toda query devolve vazio, em silêncio.
3. Mantenha `where: { empresaId }` mesmo sob RLS (índice + intenção legível).
4. **Nenhuma chamada externa (HTTP, e-mail, gateway) dentro do callback**: ele é uma transação; rede no meio prende conexão e lock.
5. Verificação **cross-tenant** (e-mail/CPF já em uso em outra empresa, convite por token sem sessão, login) não pode rodar sob RLS: a policy só libera linhas do contexto, então a checagem nunca acharia o outro dono. Fica na role ampla, e a escrita da própria linha vai pelo client restrito.
6. Webhook, cron, ação de admin da plataforma e confirmação de eventos externos usam a role ampla e são protegidos por token/guard, não por RLS. É decisão de desenho, não lacuna.

## Adicionando RLS numa tabela

1. Migration **nova** (nunca editar aplicada — skill `prisma-services`) com `ENABLE ROW LEVEL SECURITY` **e** `FORCE ROW LEVEL SECURITY`.
2. Tabela com `empresaId` direto: `USING ("empresaId" = app_current_empresa_id())` e `WITH CHECK` igual se aceitar escrita. Tabela de dono indireto: `EXISTS (SELECT 1 FROM pai WHERE pai.id = "paiId" AND pai."empresaId" = app_current_empresa_id())`.
3. `GRANT` explícito à role restrita na mesma migration — sem GRANT o Postgres nega antes de avaliar qualquer policy.
4. **`GRANT INSERT`/`UPDATE` sempre com `GRANT SELECT` junto.** `create()`/`update()` do Prisma usam `RETURNING`, que exige `SELECT`; SQL puro sem `RETURNING` esconde o erro e só um teste com o Prisma de verdade pega.
5. Tabela sem policy (catálogo, plano, permissões globais) que o fluxo toca dentro da transação também precisa de `GRANT SELECT` à role restrita (erro típico: `permission denied for table X` só em produção).
6. Nunca crie policy `USING (true)` para "destravar" a role ampla: ela já ignora RLS; se faltou acesso, é GRANT.
7. Ao adicionar `include`/`select` de relação ou nova escrita numa transação sob RLS, reconfira os GRANTs das tabelas envolvidas.

## Testes

RLS não se prova com mock. Escreva testes de integração contra um Postgres real (`tests/rls/*.test.ts`; o CI já sobe um Postgres de serviço): usuário da empresa B não lê nem escreve linha da empresa A **mesmo consultando por `id` puro, sem `where: empresaId`**; contexto ausente devolve vazio; e um teste do fluxo completo do service sem nenhum mock, para pegar GRANT faltando.

## Checklist de revisão

- Toda leitura/escrita de usuário comum passa por `withRlsContext`? Nenhuma chamada externa dentro?
- Policy + `FORCE` + GRANTs (com SELECT) na mesma migration?
- Fluxos cross-tenant e de sistema estão na role ampla, com guard/token?
- Há teste de isolamento real entre duas empresas?
