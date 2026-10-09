# Contraste, cores e temas claro/escuro

Meta do projeto: **WCAG 2.2 nível AA** nos dois temas. Os tokens vêm de `app/globals.css` (par claro/`.dark`). O template ainda **não tem teste automatizado de contraste** dos tokens: ao mudar ou criar um token de cor, calcule a razão dos pares afetados nos dois temas antes de usar (se um app derivado adotar um teste, registre-o aqui).

## Mínimos

| O quê | Razão mínima |
|---|---|
| Texto normal (< 18,66px em negrito / < 24px) | **4,5:1** |
| Texto grande (≥ 24px, ou ≥ 18,66px em negrito) | 3:1 |
| Ícone que carrega significado, borda de campo, anel de foco, estado de componente | **3:1** contra o fundo vizinho |
| Texto decorativo ou desabilitado | sem mínimo, mas nunca use pra informação necessária |

## Qual token usar em cada caso

| Uso | Token (Tailwind) | Nunca |
|---|---|---|
| Texto principal | `text-foreground` | — |
| Texto secundário | `text-muted-foreground` | reduzir com `opacity-*` ou `text-foreground/50` |
| Botão/selo de destaque | `bg-primary text-primary-foreground` | texto branco/preto solto |
| Sucesso / informação / aviso / erro | `success` · `info` · `warning` · `destructive` (+ `-foreground` sobre fundo cheio) | `text-white` / `text-black` soltos |
| Texto sobre fundo **translúcido** (`bg-success/10`, badge, alerta tingido) | confira o contraste real nos dois temas: o token de texto pensado para fundo liso pode cair abaixo de 4,5:1 sobre a própria tinta (principalmente no escuro) | assumir que passa |

Regra de bolso: **o par existe? use-o. Não existe? crie o par no `globals.css` (com o valor nos dois temas) e confira a razão** antes de usar.

## Cor nunca é o único sinal

Estado (erro, sucesso, pendente, selecionado) sempre tem **texto ou ícone** além da cor. Erro de campo: mensagem escrita ao lado (`FormErrorMessage`), não só borda vermelha. Status em tabela: `Badge` com o rótulo. Gráficos: rótulo/legenda direta, não só legenda de cor. Cerca de 1 em cada 12 homens tem alguma deficiência de visão de cor.

## Tema claro e escuro

- O tema escuro **não é o claro invertido**. Superfície base escura (não preto puro) e texto claro (não branco puro): preto e branco puros vibram e cansam.
- **Elevação por camada, não por sombra**: quanto mais "alto" o elemento (card, popover, dialog), mais claro o fundo (`background` → `card`/`popover`). Sombra some no escuro; use borda sutil (`border`) para separar.
- Cores saturadas ficam **mais claras e menos saturadas** no escuro (ver `--success`, `--destructive` em `.dark`) — é isso que mantém o contraste.
- Todo componente novo precisa ser conferido **nos dois temas**. Nunca fixe cor em hex/`rgb`/`bg-white`/`bg-black`/`text-gray-*`/`text-yellow-*`: use os tokens (eles trocam com o tema). Exceção legítima: superfícies que são sempre escuras por design — nelas o texto claro é fixo e deve ser conferido contra o fundo real.
- Respeitar `prefers-color-scheme` no primeiro acesso e permitir troca manual (já existe via `next-themes`, `components/theme-toggle.tsx`).

## Borda de campo e foco

`--input` (borda de campo) e `--ring` (anel de foco) devem ter ≥ 3:1 contra `background` e `card` nos dois temas (WCAG 1.4.11). `--border` é sutil (separadores decorativos): **não use `border-border` como única marca de um campo ou controle** — use `border-input`.
