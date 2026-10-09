---
name: design-system
description: Use ao implementar, revisar ou discutir UI/UX — layout, navegação, hierarquia de ações, escolha de componente ou fluxo de tela, contraste e cores (tema claro/escuro), tipografia, acessibilidade e inclusão, tanto nas páginas públicas quanto na área administrativa (dashboard). Carregue antes de escrever ou revisar qualquer componente/página nova.
---

# Design system

Duas áreas de UI, cada uma com suas regras:

- **Páginas públicas** (home, fale conosco, docs públicas, login/cadastro): um objetivo por tela, espaço e um CTA claro. Regras gerais em `references/geral.md` e escala de texto em `references/tipografia-e-espaco.md`.
- **Área administrativa** (`/dashboard`, `/admin`, `/agenda`): eficiência operacional, densidade alta aceita. Ver `references/admin.md`.

Ambas compartilham os mesmos princípios de UX e o catálogo de componentes (`components/ui/*` e `components/*`).

## Como usar esta skill

1. **Sempre leia `references/geral.md` primeiro** — hierarquia de ações, Button vs Link, estados, acessibilidade, consistência.
2. Rota começa com `/dashboard`, `/admin` ou `/agenda` → leia também `references/admin.md`.
3. Conforme o que a tarefa toca, leia também (vale para as duas áreas e os dois temas):
   - Cor, badge, alerta, fundo translúcido, tema claro/escuro, token novo → `references/contraste-e-cores.md`. Mudou token em `globals.css`? Rode `pnpm test tests/utils/contraste-tokens.test.ts`.
   - Tamanho de fonte, espaçamento, botão/ícone clicável, largura de leitura → `references/tipografia-e-espaco.md`.
   - Escolher entre breadcrumb, tabs, toast, alerta inline, dialog, tooltip, badge etc. → `references/componentes-por-area.md`.
   - Formulário, foco, teclado, animação, imagem, texto de interface → `references/acessibilidade-e-inclusao.md`.
   - Animação, blur/sombra, hover/flyout/tooltip, lista renderizada muitas vezes, menu, carregamento de página → `references/performance-de-interface.md`.
4. Nada de rolagem horizontal: skill `sem-rolagem-horizontal`.

## Regra de ouro para a IA

Antes de escrever código de interface, pense como **designer de produto**, não como implementador de componentes:

```
Quem está nesta tela?
        ↓
O que essa pessoa quer fazer?
        ↓
Qual é a próxima decisão dela?
        ↓
Qual informação ela precisa pra decidir?
        ↓
Qual ação deve ter mais destaque visual?
        ↓
Pra onde ela pode ir a seguir?
```

Não introduza cores, variantes de botão, padrões de navegação ou componentes novos sem necessidade real — reutilize o que já existe em `components/` antes de criar algo. Quando uma decisão de UX for tomada para uma funcionalidade (ex.: filtro abre em `Sheet` no mobile), aplique a mesma decisão em telas equivalentes.
