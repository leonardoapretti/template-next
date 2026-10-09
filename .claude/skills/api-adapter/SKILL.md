---
name: api-adapter
description: Use ao fazer qualquer requisição HTTP (servidor ou navegador), ao integrar uma API externa ou ao mexer em lib/api-adapter. Toda chamada passa pelo adapter; nunca `fetch` direto.
---

# Requisições HTTP: sempre pelo adapter (`lib/api-adapter`)

Toda requisição HTTP da aplicação usa o `ApiAdapterClient` — nunca `fetch` direto. O adapter dá log padronizado, erro num formato único (`ApiResponse`), cabeçalhos consistentes e um lugar só para corrigir comportamento. O teste `tests/utils/sem-fetch-direto.test.ts` falha se aparecer `fetch(` em `app`, `components`, `hooks` ou `lib` (fora do adapter).

## Qual client usar

| Onde | Client | Import |
| --- | --- | --- |
| Servidor (services, actions, route handlers) | `apiClient` | `@/lib/api-adapter/src` (traz o logger pino) |
| Navegador (Client Components, hooks, utils de formulário) | `apiBrowserClient` | `@/lib/api-adapter/src/browser` (sem logger, para não pesar o bundle) |

Nunca importe `@/lib/api-adapter/src` (índice) em Client Component: ele puxa o logger do servidor. Use o `browser`.

## Resposta: `ApiResponse`, não exceção

Os métodos (`get`, `post`, `put`, `patch`, `delete`, `request`) **não lançam** em erro HTTP nem de rede: devolvem um `ApiResponse<T>`.

```ts
const resposta = await apiBrowserClient.get<Sugestoes>(url, { signal });

if (resposta.isSuccess()) usar(resposta.response.data);
else mostrar(resposta.getErrorMessage());
```

- Requisição abortada (`AbortController`) também volta como erro: confira `signal.aborted` antes de atualizar a tela.
- Arquivo/imagem: `apiBrowserClient.request<Blob>({ url, method: "GET", responseType: "blob" })`.
- Corpo é JSON por padrão (objeto em `post/put/patch`). GET e POST sem corpo **não** mandam `Content-Type` (evita preflight de CORS no navegador).
- Endpoint sem autenticação: `{ mutatorOptions: { isPublic: true } }` (não manda `Authorization`).
- `headers` passados na requisição se **somam** aos padrões do client.
- Resposta JSON vazia (204, DELETE) é sucesso com `data` indefinido.
- Rotas da própria aplicação (ex.: `routes.api.logout`) também passam pelo adapter; o cookie de sessão vai junto no navegador.

## Integrar uma API nova

Crie um client com o mesmo `ApiAdapterClient`, num módulo próprio do serviço:

```ts
export const apiXClient = new ApiAdapterClient({
  baseUrl: "https://api.x.com",
  getToken: () => obterToken(),          // omitir se a API é pública
  logger,                                // servidor: o logger da aplicação
  defaultHeaders: { Accept: "application/json", "User-Agent": "<app> (contato)" },
  parseErrorBody: (status, corpo) => mensagemLegivel,   // se o erro não é RFC 7807
});
```

- **`parseErrorBody(status, corpo)`**: o adapter só entende erro no formato RFC 7807. APIs com outro formato declaram como ler o corpo (JSON já lido, ou `{ rawText }` se não for JSON) e devolvem a mensagem; `null` cai no padrão.
- Token que expira: para repetir a chamada com token novo, passe `mutatorOptions: { getAuthToken }` só naquela requisição.
- Se o restante do código espera exceção, faça uma função fina por cima do client que converte `ApiResponse` de erro em exceção — o client em si segue devolvendo `ApiResponse`.
- URL e token da API vêm de variável de ambiente (`lib/env.ts`), nunca do código (skill `owasp-top10-2025`, A02/A10: cuidado com SSRF ao chamar URL vinda do usuário).

## Testes

Mocke o `fetch` global (`vi.stubGlobal("fetch", fetchMock)`) e devolva `Response` novos a cada chamada (`mockImplementation(async () => new Response(...))`; reutilizar o mesmo `Response` dá "Body already read"). Exemplo: `tests/api-adapter/adapter.test.ts`. Mocke também `@/lib/logger/src` (default com `info/error/warn`) para não poluir a saída.
