# Regras gerais de UX e componentes

Válidas em qualquer parte do sistema — página pública ou área administrativa. Componentes citados aqui vêm de `components/ui/*` (shadcn/Base UI) e `components/*` (wrappers do projeto). Antes de criar um componente novo, verifique se um destes já resolve.

## Princípio central

Toda decisão de interface deve ser avaliada por:

> O usuário encontra rapidamente o que procura, entende o que encontrou, e consegue agir sem obstáculos?

Antes de adicionar um componente, pergunte: qual problema ele resolve, ele ajuda a navegar/encontrar informação/decidir/executar uma ação, e ele adiciona complexidade desnecessária? Sem função clara, reconsidere o uso.

## Hierarquia de ações

Toda tela tem no máximo uma ação **primária** (`Button` variant default/primary — maior destaque). Ações **secundárias** usam `variant="secondary"` ou `"outline"`. Ações **terciárias** (cancelar, voltar, fechar) usam `variant="ghost"`, link de texto, ou ícone com `Tooltip`.

Errado: todas as ações com o mesmo peso visual (`[COMPRAR] [FAVORITAR] [COMPARTILHAR] [VOLTAR]`).
Certo: uma ação em destaque, o resto subordinado (`[COMPRAR AGORA]` seguido de `Favoritar · Compartilhar` em texto).

## Button vs Link

- **`Link`** (`next/link`): o objetivo é navegar para outro recurso/URL (ex.: "Ver detalhes", "Minha conta", "Política de privacidade").
- **`Button`**: o objetivo é executar uma ação que muda estado (ex.: "Salvar", "Excluir", "Aplicar filtro").

Não simular um link com `Button` nem uma ação com `Link`. Regra prática: "se o objetivo é mudar de localização, é `Link`; se é executar algo, é `Button`."

Links secundários não usam a cor `primary` por padrão — reserve `primary` para links realmente relevantes. Use `foreground`/`muted-foreground` + underline no hover para o resto.

## Modal, Dialog, Sheet e Drawer

Use `Dialog`/`AlertDialog` para tarefas contextuais curtas: confirmação, pequena escolha, informação crítica — nunca para páginas complexas, fluxos longos ou grandes formulários (nesses casos, uma página própria). `Sheet`/`Drawer` (`dialog-drawer.tsx` já escolhe automaticamente entre os dois conforme o viewport) servem para filtros, menus, ações auxiliares e conteúdo temporário — especialmente no mobile.

## Dropdown/Select, Tabs, Accordion, Tooltip, Toast

- `Select`/`Combobox`/`DropdownMenu`: escolha entre opções conhecidas. Não esconda navegação essencial atrás de um dropdown.
- `Tabs`: grupos alternativos de conteúdo no **mesmo contexto**. Se o conteúdo precisa de URL própria ou tem significado independente, use páginas/links separados, não tabs.
- `Accordion`/`Collapsible`: informação secundária, expandida sob demanda. Não esconda informação essencial dentro de um accordion.
- `Tooltip`: informação complementar, nunca informação essencial pra executar uma tarefa.
- `Sonner` (toast): feedback breve de uma ação já executada ("Membro convidado", "Perfil atualizado"). Nunca para mensagens longas, erros críticos ou instruções que precisam permanecer na tela.

## Loading, erro e estados vazios

- Loading localizado (`Skeleton`, spinner no próprio botão) é preferível a bloquear a tela inteira.
- Botão em ação assíncrona: desabilitar contra duplo clique, indicar processamento ("Salvando..."), preservar a posição do componente, voltar ao normal após sucesso/erro.
- Erros aparecem no contexto onde ocorreram (mensagem abaixo do campo, ou um bloco com "Tentar novamente" na seção que falhou) — não uma mensagem genérica solta no topo.
- Estado vazio (`EmptyState` em `components/pages/page-shell.tsx`) sempre orienta o próximo passo, não só informa "nada encontrado".

## Confirmações e fricção

Peça confirmação (`AlertDialog`) só para ações destrutivas, difíceis de desfazer ou financeiramente relevantes. Uma ação de baixo risco (ex.: favoritar, atualizar um filtro) não precisa de confirmação. A quantidade de etapas deve ser proporcional ao risco/complexidade da operação — não adicione passos artificiais.

## Estados dos componentes

Todo componente interativo deve considerar: `default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error`, `selected`. Implementar só o estado visual "normal" é insuficiente.

## Acessibilidade

Detalhes em `acessibilidade-e-inclusao.md`, `contraste-e-cores.md` e `tipografia-e-espaco.md`. Todo elemento interativo funciona com teclado, com foco visível. Garanta contraste, labels, semântica HTML correta, `aria-*` só quando necessário, área de clique adequada, e nunca dependa só de cor para indicar um estado (ex.: erro não pode ser só "borda vermelha" sem texto).

## Cores semânticas

`primary` (ação principal/identidade), `success` (operação concluída), `warning` (atenção necessária), `destructive` (ação destrutiva/erro relevante — usar em ações como excluir/remover/cancelar), `muted` (informação secundária), `accent` (destaques pontuais). Pares de token permitidos (texto sobre fundo translúcido, sobre fundo cheio, tema escuro) estão em `contraste-e-cores.md`. Não escolha cor "porque combina" — cada uma tem um significado fixo. Não use vermelho pra qualquer erro pequeno; reserve `destructive` pra ações realmente destrutivas.

## Espaço, densidade e progressive disclosure

Espaço em branco separa grupos e dá importância a uma ação — não preencha espaço só por preencher. Quando uma tela ficar visualmente carregada: agrupe, priorize, esconda informação secundária (accordion/collapsible), ou divida em etapas — não resolva densidade só diminuindo fonte/espaçamento. Mostre primeiro o que o usuário precisa pra decidir o próximo passo; revele detalhes depois (progressive disclosure).

## Consistência e simplicidade

O mesmo componente se comporta do mesmo jeito em todo o sistema (se `primary` é ação principal numa tela, não vira secundária em outra sem motivo). Quando uma decisão de UX for tomada pra uma funcionalidade, replique em telas equivalentes. Entre duas soluções equivalentes, prefira a com menos etapas, menos elementos, menos decisões, e que reutiliza componente existente.

## Formatação sempre via `lib/utils`, nunca ad-hoc no componente

**Nunca declare um `new Intl.NumberFormat(...)` (ou qualquer outra formatação) direto num componente.** Formatação idêntica duplicada em várias telas é a armadilha padrão desse tipo de helper: parece pequeno demais pra abstrair na primeira vez. Data: `formatarData`/`formatarDataDocumentoLegal` (`@/lib/utils/data`), nunca monte a formatação à mão com `getDate()`/`getMonth()`. Moeda e número: o template ainda não tem helper — ao precisar do primeiro, crie-o em `lib/utils/` e reutilize nos seguintes. Se uma formatação ou parsing novo se repetir em mais de um lugar, abstraia.

## Responsividade

Mobile não é só uma versão menor do desktop — reavalie quais controles aparecem, ordem da informação e navegação. Componentes se adaptam ao viewport (ex.: filtros laterais no desktop viram `Sheet` no mobile) — nunca simplesmente esconda uma funcionalidade essencial no mobile.

## Antes de criar um componente ou uma tela nova

O painel roda em computadores modestos: leia `performance-de-interface.md` ao mexer em animação, hover, listas de itens ou no shell (sidebar/header).

Componente: (1) existe algo em `components/ui`/`components/` que resolve via composição? (2) representa uma necessidade real, não só estética (evite `BeautifulSection`, `FancyContainer` sem semântica própria)? (3) tem responsabilidade clara, estados definidos, acessibilidade e responsividade?

Tela: qual o objetivo, a entrada principal, a informação necessária, a ação principal e o próximo destino? Uma tela sem função clara no fluxo não deveria existir.

## Checklist final (comum às duas áreas)

- **Navegação**: o usuário sabe onde está, como chegou, pra onde pode ir, e consegue voltar ao contexto anterior?
- **Hierarquia**: existe uma ação principal clara? As secundárias estão subordinadas?
- **Componentes**: `Button` só para ação, `Link` só para navegação, modal só quando realmente necessário?
- **Espaço**: a página respira? Há informação demais de uma vez?
- **Responsividade**: o fluxo funciona no mobile sem perder funcionalidade importante?
- **Acessibilidade**: navega por teclado, foco visível, semântica correta, estados não dependem só de cor?
