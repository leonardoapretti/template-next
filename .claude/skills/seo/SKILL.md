---
name: seo
description: Use ao criar ou alterar qualquer página pública (home, institucional, conteúdo, docs públicas) ou ao mexer em metadata, Open Graph/preview de WhatsApp, dados estruturados (JSON-LD), sitemap, robots, canonical, slug/URL, filtros/paginação de listagem pública, ou em pedidos como "melhorar o SEO", "aparecer no Google", "o link no WhatsApp está sem imagem". Consolida as diretrizes do Google Search Central, Bing e Meta (Open Graph) aplicadas a este template.
---

# SEO

Complementa a skill global `technical-seo` (renderização, Core Web Vitals, semântica) com o que é específico **deste projeto** (Next.js App Router, pt-BR). Ao derivar um app (loja, site de serviço, blog), estenda este arquivo com as regras do domínio (ex.: dados estruturados de `Product`, `LocalBusiness`).

**Regra de ouro:** buscador e rede social só confiam no que está **no HTML do servidor e visível na página**. Dado estruturado ou metadata que diverge do que a pessoa vê é ignorado ou penalizado. Mesma fonte de dado para a tela e para o SEO, nunca um cálculo paralelo.

## Escopo: o que indexar e o que não

| Indexar (`index, follow`, no sitemap) | Não indexar |
| --- | --- |
| `/` (home), `/fale-conosco`, páginas institucionais/legais públicas, docs públicas (`/docs`) | `/login`, `/cadastro` e fluxos de verificação/redefinição → `noindex` |
| | `/dashboard/**`, `/admin/**`, `/agenda/**`, `/api/**` → fora do sitemap; `Disallow` no robots; protegidos por auth |

- `noindex` e `Disallow` **não se somam**: se o robots bloquear a URL, o crawler nunca lê o `noindex`. Para página que precisa sair do índice, use só `noindex` (`metadata.robots`); `Disallow` é para o que nunca deve ser rastreado (API, dashboard).
- Proteção de dado nunca depende de robots — área logada continua protegida por auth (skill `controle-de-acesso`).

## Metadata (App Router)

- `metadataBase` no `app/layout.tsx` a partir da URL pública (`getAppBaseUrl()` em `lib/utils/routes/auth-links.ts`); sem ele, URLs relativas de OG/canonical saem erradas.
- `title.template` (`"%s | Nome do app"`) no layout; cada página passa só o próprio título. Não repita o sufixo à mão.
- Toda página indexável define **title, description, canonical e openGraph** próprios. Página dinâmica usa `generateMetadata` reutilizando o mesmo service da página (o Next deduplica a leitura cacheada — skill `cache-components`).
- **Title** (≈50–60 caracteres): o que a pessoa busca primeiro, sem adjetivo vazio. **Description** (≈120–160): resumo útil e **único** por página, gerado do conteúdo real.
- **Canonical** autorreferente (`alternates.canonical`), absoluto e sem parâmetros de rastreio (`utm_*`, `gclid`, `fbclid`).
- Metadata sempre no servidor: não dependa de JS do cliente. (No Next 16, `generateMetadata` lento é enviado depois no `<body>` para o Googlebot; bots "HTML-limited" como WhatsApp recebem bloqueante no `<head>`.)
- Rotas só pelo registro `routes` (skill `rotas`).

## Open Graph e preview (WhatsApp, Instagram, Facebook)

- Mínimo por página: `og:title`, `og:description`, `og:image`, `og:url` (= canonical), `og:type`, `og:locale: pt_BR`, `og:site_name`. `twitter.card: "summary_large_image"`.
- Imagem 1200×630 (1.91:1), URL **absoluta e pública**, com `width`/`height`, < 1 MB (de preferência < 300 KB — WhatsApp descarta imagem pesada). Conteúdo importante no centro.
- Fallback: `app/opengraph-image` cobre o que não tiver imagem própria.
- Meta faz cache da imagem **pela URL**: para trocar o preview de um link já compartilhado, a URL da imagem precisa mudar. Teste no [Sharing Debugger](https://developers.facebook.com/tools/debug/).

## Dados estruturados (JSON-LD)

Gerado no servidor a partir do mesmo dado que a página renderiza, num componente que escape `<` (`JSON.stringify(...).replace(/</g, "\\u003c")`). Valide no [Rich Results Test](https://search.google.com/test/rich-results) e no [Schema Markup Validator](https://validator.schema.org/) — erro de schema é ignorado em silêncio.

- Home: `Organization` (ou subtipo) com `name`, `url`, `logo` (≥112×112, legível em fundo branco), `sameAs`, `contactPoint` + `WebSite`.
- Páginas com hierarquia: `BreadcrumbList` com os mesmos itens da migalha visível.
- Nunca marque avaliação, preço ou disponibilidade que a página não mostra.

## URLs, slugs e listagens públicas

- Slug descritivo, minúsculo, sem acento, hifenizado. **Slug publicado não muda sem redirect 301** do antigo para o novo.
- Uma página tem **uma** URL canônica. Parâmetros sempre `?chave=valor` com ordem estável; sem `#` para filtro/página (o Google ignora fragmento) e sem IDs de sessão.
- **Filtros e ordenação:** a página filtrada tem canonical para a versão sem filtro (mantendo `page`). **Paginação:** cada página com URL e canonical próprios, links sequenciais com `<Link>`; página além do fim → 404.
- Página inexistente ou combinação sem resultado → `notFound()` (404 real), nunca redirect para a home nem soft 404 com status 200. Conteúdo removido → 404 e sai do sitemap.

## Sitemap e robots

- `app/sitemap.ts` dinâmico, só com URLs indexáveis e canônicas; `lastModified` = `updatedAt` real, nunca `new Date()` em tudo. Passou de 50 mil URLs → `generateSitemaps`.
- `app/robots.ts`: `Allow` para o público, `Disallow` para `/dashboard`, `/admin`, `/agenda`, `/api`, e linha `Sitemap:` com URL absoluta. Nunca publique em produção um robots de bloqueio total de ambiente de teste.
- Crawlers de IA (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`, `Google-Extended`, `ClaudeBot`): abrir ou bloquear é decisão de negócio — pergunte antes de mudar.
- Cadastre e envie o sitemap no **Google Search Console** e no **Bing Webmaster Tools**. IndexNow é opcional; se implementar, a chamada vai pelo `api-adapter` e a chave fica em variável de ambiente.

## Imagens e conteúdo

- `next/image` com `alt` descritivo (o que a imagem mostra, não "foto 1"); a principal (LCP) com `priority`, as demais lazy; dimensões reservadas para evitar CLS.
- Um único `<h1>` por página, níveis de heading em ordem. Conteúdo textual no HTML do servidor (nunca só em imagem ou só no client). Texto original, não cópia.
- Busca por IA (AI Overviews, ChatGPT etc.): não há otimização especial; vale o mesmo — conteúdo textual no HTML e dado estruturado batendo com a tela.

## Checklist ao criar/alterar página pública

- [ ] É Server Component e o conteúdo principal está no HTML inicial (skill `nextjs-server-first`)?
- [ ] Indexável ou não está correto (tabela de escopo), via `metadata.robots`?
- [ ] Title, description, canonical e OG próprios, com URL absoluta?
- [ ] JSON-LD gerado do mesmo dado da tela e validado?
- [ ] URL/slug descritivo; mudança de slug com 301?
- [ ] Filtro/ordenação com canonical para a versão sem filtro; página vazia/inexistente com 404?
- [ ] Sitemap inclui (ou exclui) a rota corretamente?
- [ ] Preview testado no Sharing Debugger?
- [ ] PageSpeed Insights sem regressão de LCP/CLS/INP no mobile?
- [ ] Teste cobrindo a geração de metadata/JSON-LD quando a lógica não for trivial?

## Lacunas conhecidas do template

Não finja que já existe — implemente quando a tarefa tocar nessas áreas: `metadataBase`, `title.template`, `app/robots.ts`, `app/sitemap.ts`, imagem OG padrão, `noindex` nas rotas de auth e canonical por página. Hoje só `app/layout.tsx`, `app/page.tsx` e `app/fale-conosco/page.tsx` definem `metadata`, sem canonical nem OG.

## Fontes

- Google Search Central: [estrutura de URL](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites), [paginação](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [navegação facetada](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation), [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [recursos de IA](https://developers.google.com/search/docs/appearance/ai-features).
- Meta: [Open Graph para webmasters](https://developers.facebook.com/docs/sharing/webmasters).
- Bing: [Webmaster Tools](https://www.bing.com/webmasters/help), [IndexNow](https://www.indexnow.org/).
- Next.js local: `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, `03-api-reference/04-functions/generate-metadata.md`, `03-api-reference/03-file-conventions/01-metadata/{sitemap,robots,opengraph-image}.md`.
