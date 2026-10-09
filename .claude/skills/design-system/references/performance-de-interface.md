# Performance de interface

O painel roda em computadores modestos (CPU e GPU fracas, pouca RAM). Toda tela nova deve ser fluida ali, não só na máquina de desenvolvimento. Estas regras vêm de problemas encontrados na sidebar e no shell do dashboard.

## Animação e pintura

- **Nunca anime propriedade que muda o layout de uma área grande** (`width`, `height`, `margin`, `padding`, `top/left` de algo no fluxo). Cada quadro força o navegador a recalcular a página inteira. Foi o caso da transição de largura do espaço reservado à sidebar: removida. Anime `transform` e `opacity`; para painel fixo que desliza, transição curta (≤150ms) e só nele.
- Toda animação/transição nova leva `motion-reduce:transition-none` / `motion-reduce:animate-none` (ver `acessibilidade-e-inclusao.md`).
- **Sem `backdrop-blur`** (nem `blur`, `backdrop-filter`) em superfície grande, fixa ou sticky sobre conteúdo que rola: repinta a cada quadro de rolagem. Use fundo sólido (`bg-background`). Blur só em elemento pequeno e estático.
- Sombras grandes e gradientes em áreas amplas custam GPU: sombra só onde cria hierarquia real (popover, dialog), radius e bordas resolvem o resto.
- Animação contínua (`animate-pulse`, brilhos, carrossel automático) só onde há ganho claro, e sempre pausável. Vários ao mesmo tempo na mesma tela, não.

## Elementos que aparecem ao passar o mouse (flyout, tooltip, popover)

- **Uma instância compartilhada por área, não uma por item.** A sidebar recolhida tem um único flyout controlado pelo `NavMain`; antes eram vários `Popover` (cada um com seus observadores). Tooltip por item só quando o rótulo está escondido (sidebar recolhida), nunca em lista sempre visível.
- Abrir por hover com **atraso de intenção** (~60ms para abrir, ~150ms para fechar) via `setTimeout` — sem ouvir `mousemove`, sem biblioteca de posicionamento contínuo.
- **Posicione com aritmética**, não medindo o DOM enquanto abre (`topoDoFlyout` em `lib/dashboard/navegacao.ts`); no máximo uma leitura de `getBoundingClientRect` no evento de entrada.
- Sem espaço vazio entre gatilho e painel (o respiro é `padding` do painel), senão o mouse "cai" no vão e fecha.
- Monte o painel só enquanto aberto (`{aberto && <Painel />}`), sem portal quando não for necessário.
- **`Popover` do Base UI com `openOnHover` não serve para menu de hover**: um clique no gatilho "fixa" o popover aberto (`stickIfOpen`). Para hover puro use um flyout próprio ou `PreviewCard`.

## Re-render e estado

- Lista estática (itens de menu) é **constante no módulo**, não recriada no render; derivados caros (`filtrarPorAcesso`, URLs do menu) em `useMemo`.
- Componente de item de lista com `memo` recebe **só o que lhe diz respeito**: ao navegar, cada seção recebe a URL ativa apenas se pertencer a ela (`ativaDaSecao`), senão `null`; assim só as seções envolvidas renderizam de novo. Callbacks passados a itens memorizados são `useCallback` estáveis (funções inline anulam o `memo`).
- **Derive, não sincronize.** Não use `useEffect` para "fechar quando a rota muda": guarde a rota em que abriu e compare (`flyout.pathname === pathname`). Menos efeitos, menos renders.
- Contexto de UI (`SidebarProvider`) com valor em `useMemo`; não coloque no contexto o que muda a cada interação de um componente só.
- Evite estado em ancestral alto quando só um filho o usa.

## Servidor e navegação percebida

- **Uma consulta por requisição** para o contexto de acesso (`getAccessContext` com `cache` do React, invalidado automaticamente; ver skill `controle-de-acesso`). Layout, layout de seção e página pedem o mesmo dado; não repita consulta idêntica.
- Todo segmento do dashboard precisa de `loading.tsx` (hoje só existe o `app/loading.tsx` raiz; ao criar uma seção nova, adicione o `loading.tsx` dela): dá resposta imediata ao clicar num link e permite ao Next pré-carregar rotas dinâmicas até esse limite (sem `loading.js`, rota dinâmica não é pré-carregada e o clique parece travado).
- **Estado de UI que o servidor pode saber vai por cookie** e é lido no primeiro render (`sidebar_state` → `defaultOpen`), evitando piscar e re-layout depois da hidratação.
- Lista grande pagina no servidor (`admin.md`); imagem otimizada, com `width`/`height` explícitos (evita layout shift) e `loading="lazy"` abaixo da dobra.
- Lista que não pagina no servidor (ex.: itens de uma lista editável, resultado de um combobox) e ainda assim pode passar de ~50 itens: considere virtualização (o projeto não tem lib de virtualização instalada hoje — antes de adicionar uma, ver `AGENTS.md#Dependências`) em vez de renderizar tudo de uma vez.
- Prefetch de `Link` só existe em produção; não julgue o "instantâneo" de uma navegação pelo modo dev.

## Como conferir

1. Chrome DevTools → Performance com **CPU 4× slowdown** (e 6× para o pior caso): alternar sidebar, abrir flyouts, rolar uma tabela — sem quadros longos.
2. React DevTools Profiler: navegar entre páginas e ver quais componentes do menu renderizam (só os envolvidos).
3. Painel "Rendering" → *Paint flashing* e *Layout Shift Regions*: nada pintando a tela toda ao rolar; nenhum salto ao carregar.
4. Antes de dar uma tela como pronta, pergunte: "isso roda bem num notebook de 4 GB de RAM?"
