---
name: testes
description: Use ao escrever, revisar ou corrigir testes (Vitest) deste template — feature nova, correção de bug, Server Action, service, route handler, schema, utilitário puro, regra de controle de acesso ou isolamento entre empresas. Define onde cada teste mora, o que mockar e o que não mockar, os casos obrigatórios por tipo de código (permissão, tenant, cache, auditoria) e como rodar.
---

# Testes

Vitest 4 em `environment: "node"`, só `tests/**/*.test.ts` (ver `vitest.config.mts`, alias `@` na raiz). Não há DOM (sem Testing Library/jsdom): componente React não é testado renderizando; a regra de negócio dele é extraída para função pura e testada ali (ex.: `tests/utils/navegacao-sidebar.test.ts`). Guia complementar: `lib/fumadocs/content/docs/testes.mdx` e `como-adicionar-teste-controle-acesso.mdx`.

O objetivo do teste é **pegar o bug que quebraria o acesso, o isolamento entre empresas ou os dados**, não subir porcentagem. Um teste só vale se você consegue dizer qual mudança no código de produção o faria falhar.

## Quando escrever

- **Feature nova:** sempre, junto da implementação (regra do AGENTS.md).
- **Bug:** primeiro um teste que reproduz o bug e **falha**; depois a correção; o teste passa.
- **Alteração de regra existente:** ajuste o teste da regra junto. Teste que quebrou porque a regra mudou de propósito é atualizado; teste que quebrou sem você esperar é bug.
- Teste novo que passou de primeira, sem nunca ter falhado? Desconfie: inverta a asserção ou quebre o código por um instante para confirmar que ele pega o erro.

## Onde cada teste mora

| Código testado | Pasta | Estratégia |
|---|---|---|
| Função pura (`lib/utils`, cálculo, formatação) | `tests/utils/` | sem mock |
| Schema Zod | `tests/schemas/` | sem mock, `safeParse` com entrada válida e inválida |
| Server Action (`app/**/actions.ts`) | `tests/actions/` | mocka service, `@/lib/access-control` e `next/cache` |
| Service (`lib/services/**`) | `tests/services/` | mocka `@/lib/db` (e `tx` da transação), `next/cache` e clients externos |
| Policy, guards, registry de permissões | `tests/access-control/` | sem mock; fixtures de `tests/helpers/access-context-fixtures.ts` |
| Criptografia | `tests/crypto/` | motor real, sem banco |
| Adapter HTTP | `tests/api-adapter/` | mocka o transporte |
| Route handler (`app/api/**/route.ts`) | `tests/api/` | chama `POST(new Request(...))` direto |

Nome do arquivo descreve a regra, em português, como o resto: `agenda-empresa.test.ts`, `plano-matriz.test.ts`. `describe`/`it` também em português, dizendo o comportamento: `"bloqueia sem permissão, sem gravar"`.

## Fronteira de mock

Mocke **a fronteira**, nunca a unidade sob teste:

- **Sempre mockar:** `@/lib/db`, `@/lib/access-control` (`assertCurrentUserCan`, `getAccessContext`) nos testes de action, `next/cache` (`revalidatePath`), `next/headers`/cookies, `@/lib/logger/src`, e-mail (`email.service`) e qualquer client externo.
- **Service real com `"use cache"`:** mocke `next/cache` incluindo `cacheLife`, `cacheTag` e `updateTag` (lançam erro fora do runtime do Next com `cacheComponents`). Asserte o `updateTag` com a tag de `lib/services/config/cache-tags.ts` na mutação.
- **`next/server`:** mocke só o que precisa e preserve o resto com `vi.importActual`.
- **Nunca mockar:** a função/service sob teste, `policy.ts` (`canUseFeature`, `canActAs`) quando o assunto é permissão, `permission-registry`, schemas Zod. Se a decisão de acesso é mockada, o teste não prova nada sobre ela.
- **Auditoria:** mocke o `audit-log.service` e **asserte** a chamada quando a ação é auditável (skill `auditoria`).
- Precisou mockar meia aplicação para testar uma regra? A regra está no lugar errado: extraia para função pura e teste a função.

### Padrão do projeto (siga, não invente outro)

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const assertCurrentUserCanMock = vi.fn();
const criarPapelMock = vi.fn();

vi.mock("@/lib/access-control", () => ({ assertCurrentUserCan: assertCurrentUserCanMock }));
vi.mock("@/lib/services/role.service", () => ({ roleService: { criarPapel: criarPapelMock } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

it("...", async () => {
  const { criarPapelAction } = await import("@/app/dashboard/empresa/papeis/_components/actions");
  // ...
});
```

- Os `vi.fn()` ficam no topo e as factories de `vi.mock` só os referenciam; o módulo é carregado com **`await import(...)` dentro do teste**, nunca com `import` estático no topo — é isso que garante que a factory já enxerga os mocks.
- `vi.clearAllMocks()` no `beforeEach`; cada teste sobrescreve só o que muda (`mockResolvedValueOnce`, `mockRejectedValue`).
- Services devolvem `DataBaseResponse`: monte com `DataBaseResponse.success(...)`/`.error(...)` e asserte `isSuccess()`/`error`.
- Transação: mocke `$transaction: (cb) => cb(tx)` com um `tx` só com os delegates usados.
- Contexto de acesso: `tests/helpers/access-context-fixtures.ts` (`ctxAdmin`, `ctxUsuario`, `createContext`, `createMembroEmpresa`) — por padrão o plano libera tudo; passe `permissoesPlano` para testar o teto.
- Tempo: `vi.useFakeTimers()` + `vi.setSystemTime(...)` e `vi.useRealTimers()` ao final; nunca dependa do relógio real (expiração de convite/token, janelas da agenda).
- Variável de ambiente: `vi.stubEnv` (e `vi.unstubAllEnvs`), nunca `process.env` direto.
- Tabela de casos parecidos: `it.each`.

## Casos obrigatórios por tipo

### Server Action
1. **Permissão certa:** asserte a permissão exata (`toHaveBeenLastCalledWith("papeis:gerenciar")`).
2. **Sem permissão não grava:** `assertCurrentUserCan` rejeita `AccessDeniedError` → a action rejeita **e o service não foi chamado**.
3. **Entrada inválida:** schema reprova → nem o guard nem o service são chamados, erro útil sem detalhe interno.
4. **Tenant (skill `controle-de-acesso-multi-tenant`):** o service recebe o `empresaId` de `ctx.membroEmpresa`, não do input; `empresaId` forjado no input é ignorado; sem empresa ativa → `EmpresaRequiredError`.
5. **Servidor recalcula (skill `nunca-confiar-no-client`):** campo adulterado pelo client (papel, plano, status, `empresaId`) não chega ao banco como veio.
6. **Erro do service** vira resposta de erro tratada, sem `revalidatePath` e sem engolir a falha.
7. **Revalidação** das rotas certas no sucesso.

### Service
- Caminho feliz + cada ramo de regra (último Proprietário, perfil com membros ativos, duplicidade, estados proibidos).
- O que é gravado (`toHaveBeenCalledWith` no delegate do Prisma com o objeto esperado), não só "foi chamado".
- Todo `where` por `id` inclui `empresaId`; teste que outra empresa não lê/edita/exclui por `id`.
- Atomicidade em `$transaction`.
- Cache: leitura cacheada tem a tag certa; mutação chama `updateTag` com a mesma tag, da empresa certa.
- Auditoria registrada nas ações auditáveis, com snapshot certo e **sem** dado sensível.

### Controle de acesso (`tests/access-control/`)
- Sempre o caso **negado**: sem permissão no perfil, plano sem a feature (nega até o Proprietário), outra empresa, sem vínculo, admin da plataforma sem empresa ativa.
- Permissão nova no registry: teste de registry/dependência de leitura (`aplicarDependenciasDeLeitura`) e dos perfis padrão (`papeis-padrao.test.ts`).

### Route handler
- Autenticação/token ausente, errado, certo → 401/403 sem processar; corpo inválido → 4xx; erro nosso → 5xx; evento duplicado idempotente.

### Isolamento no banco (RLS)
A RLS ainda não está adotada neste template (skill `rls`). Quando for, o teste é de integração contra Postgres real em `tests/rls/`, sem mock; mock não prova RLS.

## Prioridade (o que testar primeiro)

Ordene por risco, não por linhas descobertas:
1. Acesso e tenant: `lib/access-control/*`, `role.service`, `empresa.service`, `plano.service`, actions de empresa/papéis/membros/convites, troca de empresa ativa.
2. Autenticação e tokens: `auth`, `user.service`, `actiontoken.service`, rate limit.
3. Lógica pura sem teste: `lib/utils`, engine da agenda, `lib/api-adapter`.
4. Dado sensível: criptografia, auditoria.

Fica de fora de propósito: `components/ui`, layout visual, páginas que só montam dados. Se tiverem regra, extraia e teste a função.

## Rodar

- Um arquivo: `pnpm test tests/actions/papeis.test.ts` (ou trecho do nome: `pnpm test papeis`).
- Um caso: `pnpm test papeis -t "bloqueia sem permissão"`.
- Tudo: `pnpm test` (é o que o CI roda). Watch: `pnpm test:watch`.
- Depois de mexer em teste, rode também `pnpm exec tsc --noEmit` e `pnpm lint` — teste também é código tipado; nada de `any`, `@ts-ignore` ou cast perigoso para fazer mock caber. Não rode `pnpm build`.
- Não há script de coverage configurado; se precisar, `pnpm exec vitest run --coverage` exige adicionar `@vitest/coverage-v8` (peça antes de instalar).

## Anti-padrões

- Testar o mock: asserir só que foi chamado, sem verificar **com o quê** nem o resultado.
- Mockar a decisão que se quer provar (permissão, escopo de empresa).
- Copiar a lógica de produção para dentro do teste para gerar o "esperado"; use valores literais.
- Snapshot de objeto grande no lugar de asserções da regra.
- Um `it` que testa cinco coisas; separe por comportamento.
- Teste que depende de ordem, relógio real, rede ou dado deixado por outro teste.
- `it.skip`/`it.only`/`console.log` esquecidos.
- Ajustar o teste para passar quando ele pegou um bug real.
- Adicionar método/flag em código de produção só para o teste usar.

## Checklist antes de concluir

- [ ] Cada regra nova ou bug corrigido tem teste, e vi o teste falhar sem a mudança.
- [ ] Actions: permissão exata, bloqueio sem gravar, entrada inválida, `empresaId` do contexto.
- [ ] Services: `where` com `empresaId`, tag/`updateTag` certos, auditoria quando aplicável.
- [ ] Mocks só na fronteira; policy, registry e schema reais.
- [ ] Bordas e casos negados, não só o caminho feliz.
- [ ] `pnpm test <arquivo>`, `tsc --noEmit` e `lint` passaram.
