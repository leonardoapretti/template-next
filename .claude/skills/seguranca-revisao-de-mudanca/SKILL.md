---
name: seguranca-revisao-de-mudanca
description: Use antes de dar por concluída qualquer mudança que crie ou altere Server Action, route handler, autenticação/sessão, migration, upload, e-mail/link, dependência, Dockerfile/CI ou configuração. Checklist curta de segurança por tipo de mudança, ligada ao OWASP Top 10:2025.
---

# Checklist de segurança por tipo de mudança

Pergunta-base do AGENTS.md: **"isso é seguro?"** Responda item a item. Categorias A01–A10 estão na skill `owasp-top10-2025`.

## Server Action ou service que grava (A01, A06)

- Guard de permissão (`assertCurrentUserCan` / `assertAdminAction` / `assertEmpresaAction`) **depois** de validar a entrada e **antes** de tocar o banco?
- Recurso buscado por `id` **e** `empresaId` do contexto? (skill `nunca-confiar-no-client`)
- Entrada validada com zod na action **e** conferida no service?
- Corrida entre duas requisições? Condição no próprio `update`/transação.
- Teste com id de outra empresa, valor adulterado e usuário sem permissão?
- Botão/rota nova: permissão e plano revisados (skill `controle-de-acesso`)?

## Route handler (`app/api/**`) (A01, A10)

- Autenticado, ou deliberadamente público e com `verificarRateLimit`? Falha fechada se faltar segredo?
- Corpo validado com zod; erro nosso responde 5xx, nada vaza stack.

## Migration (A02, A04, A08)

- Migration nova; nunca editar uma já aplicada. Nada destrutivo, sem `migrate reset` em banco com dado.
- Coluna sensível nova é cifrada (`lib/services/crypto`) e não vai para log.

## Entrada, saída e links (A05)

- Nada de `$queryRawUnsafe`, concatenação em SQL, `eval`, shell com entrada do usuário.
- `dangerouslySetInnerHTML` só com conteúdo gerado por nós.
- Redirect nunca para URL vinda do usuário sem allowlist.
- Upload: validar tipo real, tamanho e nome.

## Autenticação e sessão (A07)

- Mensagem genérica (sem revelar se o e-mail existe); `verificarRateLimit` por IP e por conta.
- `ActionToken`: aleatório, guardado como hash, com expiração e uso único. Mudou senha/e-mail? Tokens pendentes revogados.

## E-mail (A02, A05)

- O envio está **travado** (`ENVIO_DE_EMAIL_HABILITADO = false` em `email.service.ts`). Não contorne chamando `resend` direto; só destrave com decisão explícita.
- Se destravado: conteúdo escapado (`escapeHtml`/`criarEmailHtml`), sem entrada do usuário em cabeçalhos, rate limit em formulário público.

## Logs e erros (A09, A10)

- Sem senha, token ou dado pessoal completo em log ou mensagem de erro (usar `lib/logger`).
- Erro inesperado nunca engolido (`catch {}`); falha fechada na dúvida.

## Dependência ou infraestrutura (A02, A03)

- Realmente necessária e madura? `pnpm audit --prod` limpo?
- Imagem/Action fixada por versão; nenhum `curl | sh`; segredo só em `secrets`/env, nunca `NEXT_PUBLIC_*`.

## Antes de encerrar

Diga só os riscos remanescentes ou lacunas que a mudança não fecha. Não declare "seguro" sem ter rodado o teste do cenário de ataque.
