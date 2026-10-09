---
name: sem-rolagem-horizontal
description: Use ao criar ou alterar qualquer UI — página, layout, formulário, card, dialog, sidebar, barra de ações, data-table — para que nada gere rolagem horizontal em nenhuma largura de tela (mobile incluso). Cobre quebra de linha, empilhamento, grids responsivos, truncamento e o resumo do card mobile da data-table (components/data-table).
---

# Sem rolagem horizontal, em lugar nenhum

Rolagem horizontal esconde informação e é ruim no mobile. Regra: **a página e cada componente cabem na largura disponível a partir de ~360px**. Quebrar linha, empilhar ou truncar — nunca estourar a largura.

## Princípios (valem para qualquer parte)

- **Linhas de itens quebram**: `flex flex-wrap gap-*` em barras de filtros, ações, badges e botões; nunca `flex-nowrap`/`whitespace-nowrap` em conjunto que pode crescer.
- **Empilhe no mobile, lado a lado no desktop**: `flex-col sm:flex-row`, `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Larguras fixas (`w-[480px]`, `min-w-*` grandes) só com teto relativo (`w-full max-w-*`).
- **Filhos de flex/grid que contêm texto longo** precisam de `min-w-0` (e `truncate` ou `line-clamp-*`/`break-words`); sem isso o conteúdo empurra o contêiner para fora.
- **Texto sem espaço** (e-mail, URL, código): `break-words` / `break-all` no contêiner, ou `truncate` com `title`.
- **Mídia e embed**: `max-w-full h-auto`; `<pre>`/código e tabelas de documentação (MDX) com quebra ou card próprio, não larguras fixas.
- **Dialog, sheet, popover, dropdown**: `max-w-[calc(100vw-2rem)]`; formulário interno empilha campos no mobile.
- **Layout de página**: nada de `w-screen` (inclui a barra de rolagem vertical), `100vw` em elementos dentro do fluxo, nem margens negativas que passem da borda. Use `w-full`.
- **Sidebar/bottom nav**: itens com `min-w-0` e `truncate`; a barra fixa inferior limita a 5 itens.
- **Overflow escondido não resolve**: `overflow-x-hidden` no `body`/página só esconde conteúdo cortado. Corrija a causa. Única exceção aceitável: contêiner de conteúdo realmente bidimensional (ex.: grade de agenda, mapa) com rolagem **intencional e interna** ao componente, nunca na página.

## Data-table

Tabela larga vira rolagem horizontal; a regra é caber na largura empilhando dados que descrevem a mesma coisa. Toda lista do banco é data-table (AGENTS.md), com filtro de texto livre e filtros por enum.

### Desktop

- **Uma célula por conceito, não por campo.** Junte na mesma célula (`flex flex-col items-start gap-1`) o que se lê junto: nome + e-mail, papel + status, título + data (`text-xs text-muted-foreground`).
- Nada de coluna só para data ou badge quando cabe empilhada em outra.
- Coluna que existe só para filtro fica oculta via `columnVisibility` e `cell: () => null`; o dado aparece na célula empilhada.
- Coluna empilhada que ordena usa `accessorFn` + `sortingFn`; `meta.label` alimenta o filtro de texto livre.
- Textos longos: `line-clamp-2` e `max-w-*`; nunca `whitespace-nowrap` em texto livre.

### Mobile (card)

O data-table troca a tabela por cards em `useIsMobile()`. Defina `mobileSummaryColumnIds` no `useDataTable` com as colunas que precisam ficar visíveis sem expandir; sem isso só a primeira coluna aparece. Colunas ocultas não entram no card. Com mais de uma coluna, o resumo quebra linha (`flex-wrap`).

## Como verificar

1. Abra a tela em ~360px (e 768px) e confirme que a **página** não rola na horizontal.
2. Procure causa comum: `whitespace-nowrap`, `w-[Npx]`/`min-w-[Npx]` fixos, `flex` sem `flex-wrap`/`min-w-0`, `w-screen`.
3. Data-table: alguma coluna só badge/data/código curto? O card mobile mostra status e dado principal sem expandir? Continuam o filtro livre e os filtros enum?
4. Mudou a UI e não conseguiu validar no navegador? Diga isso na resposta final em vez de afirmar que cabe.
