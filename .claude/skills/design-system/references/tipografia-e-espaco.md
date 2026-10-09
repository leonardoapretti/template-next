# Tipografia, espaçamento e alvos de toque

## Tamanhos de texto

| Uso | Classe | Observação |
|---|---|---|
| Corpo (páginas públicas) | `text-base` (16px) | leitura confortável; nunca abaixo disso em texto corrido |
| Corpo (dashboard) | `text-sm` (14px) | densidade típica de admin |
| Texto auxiliar (legenda, data, dica) | `text-xs` (12px) | **piso do projeto** |
| Título de página | `text-2xl`–`text-3xl` `font-semibold` | um `h1` por página |
| Título de seção | `text-base`–`text-lg` `font-semibold` | `h2`, `h3` em ordem, sem pular nível |
| Campo de formulário no mobile | `text-base` | abaixo de 16px o iOS dá zoom ao focar |

- **Nunca abaixo de 12px** (`text-xs`) para conteúdo: sem `text-[9px]`, `text-[10px]` ou `text-[11px]`. Exceção: conteúdo impresso em tamanho fixo (ex.: etiqueta), quando existir.

### Páginas públicas

Nas páginas públicas (home, fale conosco, conteúdo para o visitante) o piso é mais alto que no dashboard: texto corrido em `text-base`, e `text-xs` só para selo/badge curto e nota legal — nunca para informação necessária para decidir ou agir.

- Escala do Tailwind (múltiplos de 4px). Mesma família de espaçamento dentro de um mesmo tipo de bloco: cards `p-4`, seções `space-y-6`, campos de formulário `space-y-4`.
- Agrupe por proximidade: itens relacionados mais juntos do que itens não relacionados.
- Não corte texto sem alternativa: `truncate` só com `title` ou o texto completo em outro lugar (ver `app-breadcrumbs`).

## Alvos de toque e clique

- **Mínimo 24×24px** (WCAG 2.5.8, AA) para qualquer alvo, exceto link dentro de texto.
- **Meta 44×44px** em controles de toque frequente no mobile (ação principal, filtros, menu) de páginas públicas. No admin, `h-8` (32px) é aceito no desktop, mas botões de ícone em linha de tabela devem ter espaço entre si (`gap-1` ou mais).
- Ícone sozinho é botão de ícone: precisa de `aria-label` e, no desktop, `Tooltip`.
- A área clicável é o alvo inteiro, não só o texto (card, linha de tabela).
