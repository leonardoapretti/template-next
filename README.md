# Template Next.js

Template Next.js **pronto para produção**, com a infraestrutura essencial de uma aplicação real já configurada: autenticação, controle de acesso, criptografia, e-mail transacional, banco de dados, testes e documentação. Feito para ser clonado e estendido — não para começar do zero.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-7C3AED?logo=auth0&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Índice

- [Por que este template](#por-que-este-template)
- [O que já vem pronto](#o-que-já-vem-pronto)
- [Páginas de exemplo](#páginas-de-exemplo)
- [Stack](#stack)
- [Começando](#começando)
- [Banco de dados](#banco-de-dados-mysql-via-docker)
- [Rodando a aplicação](#rodando-a-aplicação)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Documentação](#documentação)
- [Docker](#docker)
- [CI](#ci)
- [Licença](#licença)

## Por que este template

A maioria dos boilerplates de Next.js resolve só o "hello world". Este resolve os problemas que aparecem quando o projeto vira sério: como cifrar dados sensíveis, como auditar quem fez o quê, como estruturar controle de acesso por papéis, como validar responses do banco de forma consistente. Tudo isso já está implementado, testado e documentado — o suficiente para servir de referência viva ao estender o projeto para o seu domínio.

## O que já vem pronto

| Serviço | Descrição | Onde está |
| --- | --- | --- |
| 🔐 **Autenticação** | Login por credenciais via [Auth.js](https://authjs.dev) (NextAuth), sessão JWT, cadastro com verificação de e-mail, redefinição de senha e troca de e-mail (confirmadas por link tokenizado) | `auth/`, `app/(auth)/`, `app/dashboard/conta/` |
| 🚦 **Rate limiting** | Limite de tentativas em login, cadastro, reenvio de e-mail e troca de senha/e-mail | `lib/utils/rate-limit.ts` |
| 🛡️ **Controle de acesso (RBAC)** | Motor de permissões por papel (`isAdmin`), guards reutilizáveis para server actions e rotas | `lib/access-control/` |
| 🔑 **Criptografia** | Campos sensíveis cifrados em repouso (AES-256-GCM) de forma transparente, via extensão do Prisma Client | `lib/services/crypto/` |
| 📝 **Trilha de auditoria** | Log append-only com cadeia de hash, resistente a adulteração retroativa, captura automática de escritas sensíveis | `lib/services/audit-log*.ts` |
| ✉️ **E-mail transacional** | Envio de e-mails via [Resend](https://resend.com), com template HTML reutilizável | `lib/services/email.service.ts`, `lib/email/` |
| 🗄️ **Banco de dados** | [Prisma](https://www.prisma.io) + MySQL, `DataBaseResponse` para tratar erros de forma consistente, `BaseService` para services padronizados | `prisma/`, `lib/services/config/` |
| 📋 **Padrão de formulários** | Convenção `form / schema / actions` com [react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev), validada no client e no servidor | `app/(auth)/cadastro/`, `app/fale-conosco/` |
| 🧩 **Padrão de páginas** | `PageShell`/`PageHeader`/`PageSection` para páginas comuns e `PaginaDetalhes` para páginas de um recurso específico (header rico, sidebar responsiva) | `components/pages/` |
| 📊 **Logger estruturado** | Logs em JSON via [Pino](https://getpino.io), com redaction automática de dados sensíveis | `lib/logger/` |
| 📚 **Documentação viva** | Docs navegáveis servidas com [Fumadocs](https://fumadocs.dev), pública e também dentro da área logada | `lib/fumadocs/`, `app/docs/`, `app/(admin)/admin/docs/` |
| 🧪 **Testes** | Suíte com [Vitest](https://vitest.dev) cobrindo RBAC e criptografia | `tests/` |
| 📱 **PWA** | Instalável, com service worker via [Serwist](https://serwist.pages.dev), ícones gerados dinamicamente e prompt de instalação persistente | `app/sw.ts`, `app/manifest.ts`, `components/providers/pwa-provider.tsx` |
| 🐳 **Docker** | `docker-compose.yml` para dev (banco em container) e produção (app + banco + Caddy com HTTPS) | `Dockerfile`, `docker-compose*.yml` |
| ⚙️ **CI** | Workflow do GitHub Actions com audit de dependências, lint, typecheck, testes e build a cada push/PR | `.github/workflows/ci.yml` |
| 🚨 **Error boundaries** | Páginas de erro (`error.tsx`, `global-error.tsx`) integradas ao logger, além de 404 e loading padronizados | `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx` |

## Páginas de exemplo

O template inclui fluxos completos e funcionais que servem de referência para o padrão de código do projeto:

| Rota | O que demonstra |
| --- | --- |
| `/` | Página pública, com indicador de sessão logada no header |
| `/cadastro`, `/login` | Formulário de cadastro/login seguindo o padrão `form/schema/actions` |
| `/dashboard` | Rota protegida por **autenticação** — qualquer usuário logado acessa. Inclui sidebar própria, com opção de instalar o PWA e trocar de perfil |
| `/dashboard/conta` | Gestão da conta: trocar senha e trocar e-mail, ambos exigindo reautenticação e confirmação por link tokenizado enviado por e-mail |
| `/dashboard/produtos/exemplo` | Página de detalhes de um recurso mockado, exemplo do padrão `PaginaDetalhes` |
| `/admin` | Rota protegida por **RBAC** — exige papel `isAdmin`. A partir de `/dashboard` é possível promover o próprio usuário a admin, só para fins de demonstração |
| `/fale-conosco` | Formulário público de 3 campos que envia e-mail transacional via Resend |
| `/admin/emails` | Rota protegida por RBAC para enviar e-mails livres (destinatário, assunto, corpo) via Resend |
| `/docs` | Documentação pública dos serviços do template |
| `/admin/docs` | Mesma documentação, servida dentro da área autenticada |

## Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **Linguagem**: TypeScript
- **UI**: Tailwind CSS 4, [shadcn/base-ui](https://ui.shadcn.com), Radix primitives
- **Banco de dados**: MySQL 8.4 + Prisma 7
- **Autenticação**: Auth.js (NextAuth) v5
- **Formulários**: react-hook-form + zod
- **E-mail**: Resend
- **Logger**: Pino
- **Testes**: Vitest
- **Documentação**: Fumadocs
- **Lint/format**: Biome
- **Package manager**: pnpm

## Começando

### Requisitos

- Node.js 22+
- pnpm
- Docker (para o MySQL)

### Instalação

```bash
git clone <url-do-seu-fork>
cd template-next
pnpm install
cp env.example .env
```

Preencha as variáveis do `.env`. O `ENCRYPTION_KEY` (usado pela criptografia de campos sensíveis) pode ser gerado com:

```bash
openssl rand -base64 32
```

## Banco de dados (MySQL via Docker)

O MySQL roda em container mesmo em desenvolvimento; a aplicação roda local com `pnpm dev`.

```bash
docker compose up -d mysql
```

Isso sobe o container `template-next-mysql` na porta `3306`, usando as credenciais do `.env` (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MYSQL_ROOT_PASSWORD`). Para desenvolvimento local, `DB_HOST`/`DATABASE_URL` devem apontar para `localhost` — o hostname `mysql` só resolve dentro da rede interna do Docker, entre containers.

Aplique as migrations e popule dados de exemplo (cria um usuário admin):

```bash
pnpm db:migrate
pnpm db:seed
```

Comandos úteis:

```bash
docker compose logs -f mysql   # acompanhar logs do banco
docker compose down            # parar o container (mantém os dados)
docker compose down -v         # parar e apagar o volume de dados
pnpm db:studio                 # abrir o Prisma Studio
```

## Rodando a aplicação

Com o MySQL de pé:

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `pnpm dev` | Sobe o servidor de desenvolvimento (Turbopack) |
| `pnpm build` | Build de produção |
| `pnpm start` | Roda o build de produção |
| `pnpm test` | Roda a suíte de testes (Vitest) |
| `pnpm lint` | Lint com Biome |
| `pnpm check` | Lint + format com Biome (aplica correções) |
| `pnpm db:migrate` | Cria/aplica migrations em desenvolvimento |
| `pnpm db:seed` | Popula o banco com dados de exemplo |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm db:reset` | Reseta o banco (⚠️ apaga os dados) |

## Estrutura do projeto

```
app/                    Rotas (App Router)
├── (admin)/admin/       Área administrativa (RBAC)
├── (auth)/               Cadastro, login e redefinição de senha
├── dashboard/            Área autenticada, incluindo /dashboard/conta (gestão da conta)
├── docs/                 Documentação pública (Fumadocs)
└── fale-conosco/         Exemplo de e-mail transacional

auth/                    Configuração do Auth.js
components/              Componentes de UI, incluindo os primitivos shadcn (components/ui)
hooks/                   Hooks reutilizáveis (ex: instalação de PWA)
lib/
├── access-control/       Motor de RBAC
├── services/              Services de domínio (User, Email, Audit, Crypto...)
├── fumadocs/              Conteúdo e configuração da documentação
└── utils/                 Utilitários gerais

prisma/                  Schema, migrations e seed
tests/                   Suíte de testes (Vitest)
```

## Documentação

A documentação completa de cada serviço (autenticação, RBAC, criptografia, auditoria, e-mail, logger, banco de dados, padrão de formulários e testes) fica disponível em:

- **[`/docs`](http://localhost:3000/docs)** — pública, sem necessidade de login
- **`/admin/docs`** — mesmo conteúdo, dentro da área autenticada

## Docker

### Aplicação + banco (produção, sem HTTPS)

```bash
docker compose up -d
```

Ajuste `DB_HOST`/`DATABASE_URL` no `.env` para `mysql` (nome do serviço na rede Docker) antes de subir nesse modo.

### Produção com HTTPS (VPS)

Use o override `docker-compose.prod.yml`, que adiciona um reverse proxy [Caddy](https://caddyserver.com) com TLS automático:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

O container da aplicação aplica as migrations pendentes (`prisma migrate deploy`) automaticamente antes de iniciar — não é necessário rodar nenhum comando manual pós-deploy.

## CI

O workflow `.github/workflows/ci.yml` roda a cada push em `main` e a cada pull request: audit de dependências (`pnpm audit --prod`), lint, typecheck, testes e build. Nenhuma credencial fica hardcoded no arquivo — configure os seguintes **Repository Secrets** (Settings → Secrets and variables → Actions) no seu fork:

| Secret | Exemplo |
| --- | --- |
| `CI_DATABASE_URL` | `mysql://app:app@localhost:3306/template` |
| `CI_DB_HOST` | `localhost` |
| `CI_DB_PORT` | `3306` |
| `CI_DB_USER` | `app` |
| `CI_DB_PASSWORD` | `app` |
| `CI_DB_NAME` | `template` |
| `CI_NEXTAUTH_URL` | `http://localhost:3000` |
| `CI_NEXTAUTH_SECRET` | gerado com `openssl rand -base64 32` |
| `CI_ENCRYPTION_KEY` | gerado com `openssl rand -base64 32` |
| `CI_RESEND_API_KEY` | qualquer valor não vazio — o Resend não é chamado durante o build |

Nenhum desses valores precisa ser igual ao `.env` real do seu ambiente de produção — são usados apenas para satisfazer a validação de env vars e rodar os testes/build no CI.

Com a [GitHub CLI](https://cli.github.com) autenticada (`gh auth login`) e dentro do repositório, você pode criar todos de uma vez:

```bash
gh secret set CI_DATABASE_URL --body "mysql://app:app@localhost:3306/template"
gh secret set CI_DB_HOST --body "localhost"
gh secret set CI_DB_PORT --body "3306"
gh secret set CI_DB_USER --body "app"
gh secret set CI_DB_PASSWORD --body "app"
gh secret set CI_DB_NAME --body "template"
gh secret set CI_NEXTAUTH_URL --body "http://localhost:3000"
gh secret set CI_NEXTAUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set CI_ENCRYPTION_KEY --body "$(openssl rand -base64 32)"
gh secret set CI_RESEND_API_KEY --body "test-key-not-real"
```

## Licença

[MIT](./LICENCE)
