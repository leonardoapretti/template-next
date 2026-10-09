---
name: owasp-top10-2025
description: Use ao escrever ou revisar qualquer código com impacto de segurança (autenticação, autorização, entrada do usuário, banco, e-mail, chamadas HTTP, dependências, Docker/CI, configuração, logs, tratamento de erro). Mapeia cada categoria do OWASP Top 10:2025 para o que o template já faz, como mitigar e as lacunas conhecidas.
---

# OWASP Top 10:2025 aplicado ao template

Em relação a 2021, SSRF foi incorporado ao A01 e entraram "Falhas na cadeia de suprimentos" (A03) e "Manuseio incorreto de condições excepcionais" (A10). Para cada item: o que já existe, o que fazer e a lacuna (não finja que ela não existe).

## A01 — Controle de Acesso Quebrado (inclui SSRF)

**Existe:** guards em toda action (`assertCurrentUserCan`, `assertAdminAction`, `assertEmpresaAction` — skill `controle-de-acesso`); dono/empresa vêm da sessão, nunca do formulário (skill `nunca-confiar-no-client`); `proxy.ts` separa rotas públicas × autenticadas; empresa ativa revalidada contra os vínculos no banco.
**Mitigar:** toda action/route handler confere permissão **e** pertencimento à empresa no servidor; buscar recurso por `id` + `empresaId` do contexto; esconder botão não é proteção. Route handler sem sessão autentica por token comparado em tempo constante (`timingSafeEqual`).
**SSRF:** nunca montar URL de saída com dado do usuário. Chamadas HTTP pelo `lib/api-adapter` com host fixo; se aceitar URL externa, allowlist de host e bloqueio de IP privado/loopback/metadata.
**Lacuna:** não há RLS no Postgres; o isolamento entre empresas depende do filtro de aplicação.

## A02 — Configuração Insegura

**Existe:** `lib/env.ts` valida variáveis com zod (inclui `ENCRYPTION_KEY`).
**Mitigar:** nunca `NEXT_PUBLIC_*` para segredo; sem credencial default em produção; stack/erro interno nunca vai ao usuário; mudou docker/CI/headers? Revisar o que fica exposto.
**Lacuna:** `next.config.ts` não define cabeçalhos de segurança (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`); avaliar ao publicar um app real.

## A03 — Falhas na Cadeia de Suprimentos

**Existe:** `pnpm install --frozen-lockfile` e `pnpm audit --prod` no CI (`.github/workflows/deploy.yml`); lockfile versionado.
**Mitigar:** dependência nova só se necessária e madura (AGENTS.md); conferir mantenedor e última publicação; nada de `curl | sh` em Dockerfile/CI; imagens e Actions fixadas por versão; revisar diff do lockfile; segredo de CI só em `secrets`.
**Lacuna:** sem SBOM nem verificação de proveniência; `audit` cobre só vulnerabilidade conhecida.

## A04 — Falhas Criptográficas

**Existe:** `lib/services/crypto` (AES-256-GCM, extensão de criptografia do Prisma, chave em `ENCRYPTION_KEY`); senha com `bcryptjs` custo 12; `ActionToken` guarda só `tokenHash`.
**Mitigar:** nunca inventar criptografia; chave só em env; tokens com `randomBytes`, guardados como hash, com expiração e uso único; `Math.random()` nunca para segredo; dado pessoal sensível novo entra na extensão de criptografia.
**Lacuna:** rotação de `ENCRYPTION_KEY` não é automática.

## A05 — Injeção

**Existe:** Prisma parametriza; zod na action e no service; React escapa saída; `escapeHtml` no template de e-mail.
**Mitigar:** SQL cru só com `$queryRaw`/`$executeRaw` em template tag, **nunca** `$queryRawUnsafe` ou concatenação; `dangerouslySetInnerHTML` só com conteúdo nosso; nada de entrada do usuário em shell, cabeçalho de e-mail ou URL sem `encodeURIComponent`; nunca redirecionar para URL do usuário sem allowlist (open redirect).
**Lacuna:** nenhum teste procura `Unsafe`/`dangerouslySetInnerHTML` novos; revisar em PR.

## A06 — Design Inseguro

**Existe:** regras no servidor; permissões em duas camadas (papel × plano).
**Mitigar:** antes de um fluxo novo, liste o que um mal-intencionado faria (repetir requisição, trocar id, pular etapa, corrida) e cubra com teste. Idempotência em toda operação com efeito externo.
**Lacuna:** sem threat model escrito por fluxo.

## A07 — Falhas de Autenticação

**Existe:** next-auth com sessão JWT (`auth/index.ts`); `verificarRateLimit` em login, cadastro, verificação de e-mail e troca de senha; verificação de e-mail; tokens de ação de uso único.
**Mitigar:** mensagem de login genérica; rate limit por IP **e** por conta; invalidar token anterior ao gerar novo; política mínima de senha; trocar senha/e-mail invalida tokens pendentes.
**Lacuna:** sem MFA; JWT não é revogável no servidor antes de expirar; rate limit em memória por processo (`lib/utils/rate-limit.ts`) — troque por contador compartilhado (Redis) se houver mais de uma instância.

## A08 — Falhas de Integridade de Software ou Dados

**Existe:** trilha de auditoria (`AuditLog`, `audit-log-extension.ts`).
**Mitigar:** nunca confiar em payload de terceiro sem autenticar **e** validar (zod); nunca `eval`/desserializar objeto arbitrário; migration aplicada nunca é editada (skill `prisma-services`); artefato de deploy vem do CI.
**Lacuna:** deploy por SSH sem verificação de assinatura do artefato.

## A09 — Falhas de Registro e Alerta

**Existe:** `lib/logger` (pino); auditoria de ações.
**Mitigar:** logar evento de segurança (login falho, permissão negada, token inválido) com correlação e **sem** dado sensível; erro ao usuário genérico, detalhe só no log; evento crítico gera alerta acionável.
**Lacuna:** sem alerta externo para picos de 401/403/429 nem log centralizado.

## A10 — Manuseio Incorreto de Condições Excepcionais

**Existe:** `DataBaseResponse` converte erro de banco em resposta tipada; o envio de e-mail falha com `EMAIL_DISABLED` em vez de lançar.
**Mitigar:** **falhar fechado**; nunca `catch {}` vazio; erro esperado vira resposta de negócio, inesperado sobe e é logado; chamada externa com timeout; transação falha → rollback completo; mensagem ao usuário sem stack/SQL/caminho.
**Lacuna:** poucos testes de "e se o serviço externo cair no meio".

## Como usar

1. Ache a(s) categoria(s) que a mudança toca.
2. Aplique a mitigação e cubra com teste do cenário de ataque (dado adulterado, id de outra empresa, evento repetido, serviço fora do ar).
3. Rode a checklist da skill `seguranca-revisao-de-mudanca`.
4. Achou ou fechou uma lacuna? Atualize esta skill.
