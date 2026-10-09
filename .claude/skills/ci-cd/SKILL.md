---
name: ci-cd
description: Use ao criar ou alterar o pipeline (.github/workflows), Dockerfile, docker-compose*, scripts/deploy.sh, scripts/docker-entrypoint.sh, scripts/reset-db.sh, o cron da VPS, secrets/variáveis de build e deploy, ambientes (hmg/prod), ou ao decidir como uma mudança chega em produção com segurança (migrations, rollback, auditoria de dependências, hardening do runner e da VPS).
---

# CI/CD

Como o código sai do `git push` e chega na VPS, e como mantê-lo seguro. Segurança em geral: skills `owasp-top10-2025` (A02, A03, A08) e `seguranca-revisao-de-mudanca`.

## O que existe hoje (template-next)

```
push/PR em main ──► job quality (ubuntu-latest + Postgres 17 de serviço)
                      install --frozen-lockfile → pnpm audit --prod → prisma generate
                      → fumadocs-mdx → prisma migrate deploy → pnpm lint → tsc --noEmit → pnpm test
push em main/dispatch ──► job deploy (needs: quality)
                      SSH → rsync --delete (sem .git/.env/node_modules/.next/generated)
                      → ssh bash scripts/deploy.sh (flock, compose build app, up -d app, prune)
```

| Peça | Papel |
| --- | --- |
| `.github/workflows/deploy.yml` | Pipeline acima. `permissions: contents: read`, actions fixadas por SHA, SSH com `StrictHostKeyChecking=yes` e `known_hosts` vindo do secret `VPS_KNOWN_HOSTS`. `concurrency: deploy-template-next`, `cancel-in-progress: false` (nunca cancela deploy no meio). PR roda só `quality`. |
| `Dockerfile` | Multi-stage `base → deps → builder → runner`. No builder: `prisma generate`, `pnpm test`, `pnpm audit --prod`, `pnpm build`, com o `.env` montado como secret do BuildKit (sem `ARG`/`ENV`). Runner: usuário não-root `nextjs`, `node .next/standalone/server.js`. |
| `docker-compose.yml` + `docker-compose.prod.yml` | Base (dev local, com Postgres) + override de prod (sem porta publicada, redes externas `web` e `db`, Postgres compartilhado `shared-postgres`). `init: true`, log rotation, `restart: unless-stopped`, `healthcheck` do app (`/login`) e `secrets: env` para o build. |
| `scripts/docker-entrypoint.sh` | `prisma migrate deploy` e depois `exec node server.js` (migration roda no boot do container). |
| `scripts/deploy.sh` | `flock` (um deploy por vez), tag `:anterior` da imagem em produção, build, `up --wait` (espera o healthcheck), status, prune; se o container não ficar saudável, volta para `:anterior`; em erro imprime `ps` + logs. |
| `scripts/reset-db.sh` | Reset diário da demo pública (cron do root na VPS, `0 0 * * *`, log em `/var/log/template-next-reset.log`). Roda `pnpm db:reset-demo` **dentro** do container `app`, então depende de `tsconfig.json`, `lib`, `prisma` e `scripts` na imagem. |

Secrets do GitHub usados: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` (linha `host ssh-ed25519 ...` conferida uma vez), `CI_NEXTAUTH_URL`, `CI_NEXTAUTH_SECRET`, `CI_ENCRYPTION_KEY`. Os `.env` reais vivem só na VPS (`/var/www/template-next/.env`), nunca no repositório, e o rsync os exclui.

## Referência: padrão do gamehouse

O gamehouse (`~/dev/gamehouse-org`) tem a mesma base e vai além; traga o que fizer sentido ao template:

- **Dois ambientes** na mesma VPS: branch `hmg` → `gamehouse-hmg`, `main` → `gamehouse-prod`; diretório, `.env`, container, database, bucket e compose override (`docker-compose.hmg.yml`/`.prod.yml`) próprios. O workflow decide o ambiente pelo `github.ref_name` e passa `hmg|prod` ao `deploy.sh`, que valida o argumento (`case`) e deriva `PROJECT_DIR`, `LOCK_FILE` e `COMPOSE`. Hmg atrás de `basic_auth` no proxy.
- **`.env` entra no build como secret do BuildKit** (`RUN --mount=type=secret,id=env,target=/app/.env pnpm build` + `secrets: env: file: .env` no compose), em vez de `ARG`/`ENV`: não deixa segredo em camada nem no `docker history`.
- Infra em repositórios próprios (`postgres`, `minio`, `proxy`), cada um com workflow que valida (`docker compose config --quiet` com valores de fixture) antes de publicar. Rede `web` criada se não existir.
- CI cria as roles de aplicação do RLS antes de migrar e roda um seed mínimo (`prisma/seed-ci.ts`); `next typegen` antes do `tsc`.

## Princípios (valem para qualquer mudança)

1. **Tudo que chega em produção passou pelo pipeline.** Nada de editar arquivo na VPS à mão, nem `docker cp` em container de produção. Hotfix também é commit.
2. **Falhe cedo e barato:** lint/typecheck/testes/audit no job `quality` (rápido, em PR), antes de gastar build e SSH.
3. **Pipeline determinístico:** `pnpm install --frozen-lockfile`, versão do pnpm fixa (`pnpm@10.24.0` no Dockerfile; `packageManager` no `package.json`), imagem base com tag major (`node:22-alpine`), `postgres:17`. Lockfile sempre commitado.
4. **Mesmo artefato testado = artefato publicado.** O build roda na VPS a partir do código sincronizado; o `pnpm test` é repetido dentro do `Dockerfile`. Aceitável nesta escala; ao crescer, construa a imagem uma vez no CI, publique num registry privado (GHCR) e a VPS só faz `pull` + `up`.
5. **Deploy atômico e reversível:** um deploy por vez (`flock` + `concurrency`), `restart: unless-stopped`, e saber voltar (ver Rollback).
6. **Migrations são parte do deploy:** só expand/contract compatíveis com a versão anterior do app (adicionar coluna nullable antes de usar; remover só em deploy posterior). Nunca edite migration já aplicada, nunca `migrate reset` fora de dev/CI (skill `prisma-services`). O entrypoint aplica `migrate deploy` no boot: migration lenta atrasa o container ficar saudável.
7. **Observabilidade do deploy:** em erro o `deploy.sh` mostra `ps` e logs; mantenha isso. Healthcheck do container é o critério de "deploy deu certo", não o `up -d` ter retornado.

## Segurança do pipeline

**Workflow (GitHub Actions)**

- `permissions:` explícito e mínimo no topo (`contents: read`, já feito); só amplie num job que precise.
- **Actions fixadas por SHA do commit** (com comentário da versão), nunca por tag móvel (`@v4`); o Dependabot (`.github/dependabot.yml`: npm, github-actions, docker) abre os PRs de atualização.
- **Secrets só onde precisam.** O job `quality` não usa `VPS_*`; o `deploy` não usa `CI_*`. Secrets não existem em PR de fork (por isso `quality` roda sem eles em fork): nunca use `pull_request_target` com checkout do código do PR. Nunca imprima secret (`echo`, `set -x`, `env`); GitHub mascara, mas não confie em transformações (base64, split).
- **Valores de CI são fixture:** credenciais do Postgres de serviço (`postgres/postgres`) e `CI_*` são descartáveis e **nunca** iguais às de produção. Comente isso onde estão (já está no workflow).
- **Não interpole input não confiável em `run:`** (`${{ github.head_ref }}`, título de PR, nome de branch): passe por `env:` e use `"$VAR"`. Hoje `${{ github.ref_name }}` só entra via `env`.
- **Deploy só de branch protegida** (`main`, e `hmg` quando existir), com proteção de branch: PR obrigatório, `quality` obrigatório, sem force-push. `workflow_dispatch` de deploy só para quem tem permissão de escrita; considere *environment* `production` com revisor obrigatório.
- **SSH:** chave **dedicada ao deploy** (ed25519, só para este fim), usuário da VPS sem sudo, no grupo `docker`. Nada de `ssh-keyscan` no pipeline (confiança no primeiro uso, vulnerável a MITM): o host é verificado contra o secret `VPS_KNOWN_HOSTS` com `StrictHostKeyChecking=yes`. Se a VPS for reinstalada, atualize o secret. Remova a chave ao final (`if: always()`, já feito); restrinja a chave com `command=`/`from=` no `authorized_keys` se possível.
- **rsync `--delete`** apaga na VPS o que não está no repo: mantenha as exclusões (`.env`, `node_modules`, `.next`, `generated`, volumes) e revise ao criar pasta persistente nova no diretório do projeto.
- **Dependências:** `pnpm audit --prod` quebra o pipeline em vulnerabilidade conhecida (dois lugares: CI e Dockerfile). Corrija atualizando ou com `overrides` em `package.json` — nunca com `--ignore`/`audit-level` baixo para "passar". Habilite secret scanning/push protection no repositório. Scripts de build de dependências só com aprovação explícita (`allowBuilds` em `pnpm-workspace.yaml`).

**Imagem e container**

- **Segredo não vai em camada de imagem.** O `.env` entra no build só como secret do BuildKit (`RUN --mount=type=secret,id=env,target=/app/.env ...`, `secrets: env: file: .env` no compose); nunca volte a `ARG`/`ENV` para segredo, que fica no histórico do estágio de build na VPS. Segredos de **runtime** continuam em `env_file: .env` (só na VPS, permissão `600`, fora do git; `.dockerignore` já exclui `.env*`).
- Em produção o app roda com `no-new-privileges`, `cap_drop: [ALL]`, `mem_limit` e `pids_limit` (`docker-compose.prod.yml`). Runner enxuto e não-root (`USER nextjs`, já feito); copie só o necessário. Se o reset/cron ou scripts rodam `tsx` na imagem, o que eles importam (`lib`, `prisma`, `tsconfig.json`) tem de estar copiado — foi a causa do reset diário falhar desde 29/08.
- Sem porta publicada em produção: `expose` + rede `web` atrás do Caddy (TLS e headers no proxy). Banco só na rede interna `db`, nunca exposto na internet. Em dev, o Postgres publica `5435` só no host local.
- `HOSTNAME=0.0.0.0` no runner é necessário para o `server.js` standalone responder na rede do proxy.
- Limite o que o container pode: `init: true` (já), considere `read_only`, `cap_drop: [ALL]`, `no-new-privileges`, limites de memória/CPU quando houver mais serviços na VPS.
- Imagem base: atualize periodicamente (rebuild sem cache) para receber patches; considere scan (`docker scout`/Trivy) no CI.

**VPS**

- SSH só por chave, sem login de root por senha; firewall liberando apenas 22/80/443; fail2ban ou equivalente; atualizações de segurança automáticas.
- `.env` com `chmod 600`, dono do usuário de deploy. Rotacione `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` e senhas com plano (rotacionar `ENCRYPTION_KEY` exige recifrar dados: skill/doc de criptografia) e sempre que um acesso for revogado.
- Backups do Postgres compartilhado testados por restore, não só existentes. O reset diário da demo **não pode** rodar em banco com dado real: `prisma/reset-demo.ts` só executa com `ALLOW_DEMO_RESET=true` no `.env` (defina só na demo pública; em app derivado, não defina e remova o cron).
- Cron: um script versionado em `scripts/`, `flock`, log em arquivo com rotação e saída verificável. Cron sem alarme falha em silêncio — confira `grep finalizado` no log depois de mudar algo (a falha do reset ficou mais de um mês despercebida).

## Rollback

O `deploy.sh` marca a imagem atual como `:anterior` antes do build e, se `up --wait` não vir o healthcheck passar em 120s, reaponta `latest` para `anterior` e sobe de novo. Rollback manual: o mesmo `docker tag` + `compose up -d --no-build app`. Rollback de **código** não desfaz migration: por isso migrations expand/contract (princípio 6). Mudança destrutiva de schema = backup antes + deploy em duas etapas.

## Checklist ao mexer em CI/CD

- [ ] O pipeline continua falhando em lint, tipos, testes e `pnpm audit --prod`? (nada foi silenciado)
- [ ] `permissions:` mínimo; actions fixadas; nenhum input não confiável em `run:`?
- [ ] Segredo novo: está em GitHub Secrets (CI/deploy) ou no `.env` da VPS (runtime), nunca no código, em `ARG`/camada ou no log?
- [ ] Variável nova: entrou em `env.example`, em `lib/env.ts` e, se o build precisa, no `Dockerfile`/compose?
- [ ] Migration nova é compatível com a versão anterior do app?
- [ ] O que o container executa (entrypoint, cron, `tsx`) está copiado para a imagem do runner?
- [ ] `deploy.sh` segue com `flock`, `set -Eeuo pipefail`, trap de erro com logs; script de cron versionado e verificado depois do primeiro disparo?
- [ ] Mudou o fluxo? Atualize esta skill e `lib/fumadocs/content/docs` (deploy/infra) no mesmo commit.
- [ ] Não rodei `pnpm build` localmente sem ser pedido (AGENTS.md); a validação do build é do pipeline.
