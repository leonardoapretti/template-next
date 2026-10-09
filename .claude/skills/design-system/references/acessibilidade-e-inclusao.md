# Acessibilidade e inclusão

Alvo: WCAG 2.2 AA. Acessibilidade aqui não é uma etapa final: entra junto do componente. Para contraste e tamanhos, ver `contraste-e-cores.md` e `tipografia-e-espaco.md`.

## Teclado e foco

- Todo controle funciona só com teclado, na ordem visual. Nada de `div onClick`: use `Button`, `Link` ou o componente de `ui/*` (Base UI já cuida de papéis e teclado).
- **Foco sempre visível** (`focus-visible:ring-*`, não remova `outline` sem substituto). Anel com contraste ≥ 3:1 — hoje é pendência no tema claro (ver `contraste-e-cores.md`).
- **Foco não pode ficar escondido** por header/footer fixos ou pela bottom-nav do mobile (WCAG 2.4.11): use `scroll-margin`/`scroll-padding` compatível com a altura dessas barras.
- Modal/Dialog prende o foco, fecha com `Esc` e devolve o foco a quem abriu (já vem dos componentes).
- Ofereça "pular para o conteúdo" nos layouts com navegação longa.

## Semântica

- Um `h1` por página, títulos em ordem. Landmarks: `header`, `nav` (com rótulo quando houver mais de um), `main`, `footer`.
- `aria-*` só quando a semântica nativa não basta; `aria-label` em botão de ícone; `aria-current` na página atual; `aria-live="polite"` para resultado que muda sem ação direta (o Sonner já anuncia).
- Imagem de conteúdo tem `alt` descritivo; imagem decorativa, `alt=""`. Ícone decorativo, `aria-hidden="true"`.
- Tabela de dados com `th` de cabeçalho e legenda/`aria-label`.
- `lang="pt-BR"` no `html` (já está); trechos em outro idioma marcam `lang`.

## Formulários

- Todo campo tem `Label` visível (placeholder não substitui label). Campo obrigatório é indicado em texto, não só `*`.
- Erro: texto claro que diz **o que fazer** ("Informe uma data no futuro"), ligado ao campo com `aria-describedby`, e o foco vai para o primeiro erro ao enviar.
- Use `autocomplete` correto (`name`, `email`, `tel`, `postal-code`, `street-address`…) e `inputMode`/`type` adequados ao teclado do celular.
- **Não peça de novo o que já foi informado** no mesmo fluxo (WCAG 3.3.7) e **não bloqueie colar** em senha (3.3.8): permita gerenciador de senhas.
- Prazo/timeout só com aviso e como estender. Toast com ação precisa de tempo para ser lido e ficar disponível por teclado.
- Ação irreversível pede confirmação ou permite desfazer.

## Movimento e sensorial

- Animação decorativa (brilho da faixa do evento, pulso do menu, carrossel) tem `motion-reduce:` para parar/omitir — hoje só ~8 arquivos respeitam; **toda animação nova nasce com `motion-reduce:`**.
- Nada pisca mais de 3 vezes por segundo. Carrossel e auto-play têm botão de pausa e não avançam sozinhos sem controle.
- Nenhuma informação só por som, só por cor ou só por posição.
- Suporte a **alto contraste/forçar cores** do sistema: não dependa de `background-image` para conteúdo, e mantenha bordas em elementos interativos.

## Inclusão

- **Linguagem clara**, frases curtas, voz ativa, sem jargão ("Reenvie o convite para a pessoa criar a conta"). Mensagem de erro explica o que aconteceu e o próximo passo, sem culpar a pessoa e sem expor detalhes internos.
- **Texto neutro** quando não se sabe a identidade: evite supor gênero em saudações ou textos de e-mail; use pronome neutro ("eles/elas" só se informado; senão a pessoa/o cliente/a equipe). Formulário de cadastro não exige gênero; nome não é dividido à força em nome/sobrenome quando um campo único resolve; aceite acentos e nomes longos.
- **Sem depender de dispositivo ou conexão ideal**: página utilizável em celular pequeno, em conexão lenta (imagens otimizadas, `loading="lazy"` abaixo da dobra) e com JS lento (server-first).
- Ofereça mais de um caminho para a mesma tarefa (busca **e** menu; link **e** botão), e mantenha a navegação e a ordem dos elementos **consistentes** entre telas (WCAG 3.2.x).
- Ícones sempre acompanhados de rótulo quando o significado não é universal.
- Arrastar (drag-and-drop, slider, ordenar) sempre tem alternativa por clique/teclado (WCAG 2.5.7).
- Botão/link tocável sem `:active` de 300ms de atraso: `touch-action: manipulation` (já é o padrão dos componentes de `ui/*`, cheque ao estilizar do zero). `Dialog`/`Sheet`/`Drawer` sobre conteúdo rolável usam `overscroll-behavior: contain` pra rolagem dentro do modal não "vazar" e rolar a página por trás.
- Campo sensível (cupom, código, e-mail, senha) não corrige nem sugere: `spellCheck={false}` e `autoCapitalize="none"` quando aplicável.

## Como conferir

1. Navegue a tela só com `Tab`/`Shift+Tab`/`Enter`/`Esc`.
2. Aumente o zoom para 200% e reduza a janela a 320px.
3. Alterne claro/escuro e o `prefers-reduced-motion`.
4. Se mexeu em cor, confira a razão de contraste dos pares afetados nos dois temas (ver `contraste-e-cores.md`).
5. Leia a tela com um leitor de tela (VoiceOver/NVDA) quando criar um padrão novo.
