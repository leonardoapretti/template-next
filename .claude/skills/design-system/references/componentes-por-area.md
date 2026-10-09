# O que usar em cada lugar

Complementa a seção de componentes de `geral.md`. Regra: **use o componente que já existe** em `components/ui/*` e `components/*`; esta página diz *onde* cada um cabe e onde não cabe.

## Navegação

| Componente | Onde | Onde NÃO |
|---|---|---|
| **Breadcrumb** (`components/app-breadcrumbs`, `ui/breadcrumb`) | Hierarquia com 3+ níveis: lista → detalhe de um recurso (ex.: `/dashboard/empresa/papeis`) | Home, listas de 1º nível, checkout, fluxos lineares (use passos), telas de formulário simples |
| **Sidebar** (dashboard) | Navegação global do admin, agrupada por área | Ações da tela atual |
| **Menu do header** (páginas públicas) | Navegação principal e entrar/cadastrar | Ações de conta escondidas em ícones sem rótulo |
| **Tabs** | Visões alternativas do **mesmo** recurso na mesma URL | Conteúdo com URL própria (use links) |
| **Botão "Voltar"** | Só com contexto de retorno provável (ex.: etapa de um fluxo → etapa anterior) | Toda página |
| **Paginação** | Lista grande no servidor (`DataTableServer`) | Lista curta |

**Regras do breadcrumb:**
- `nav` com rótulo em português (`aria-label="Trilha de navegação"`), `ol` de itens, **página atual sem link** e com `aria-current="page"`, separadores `aria-hidden`.
- Reflete a **hierarquia do site**, não o histórico do usuário; o primeiro item é a raiz (Início / Dashboard).
- Nunca substitui a navegação global; é um complemento de localização.
- Em telas estreitas trunca os níveis do meio (já existe menu "Ver níveis anteriores"), sempre mantendo raiz e página atual.

## Feedback

| Situação | Use | Detalhe |
|---|---|---|
| Confirmação de ação concluída ("Evento pausado") | **Toast** (`sonner`) | Curto, com ação opcional que leva ao resultado ("Ver carrinho"). Some sozinho **mas precisa dar tempo de ler** (≥ 5s) e pausar ao passar o mouse/foco |
| Erro de validação de campo | **Mensagem inline** (`FormErrorMessage`) | Junto ao campo, em texto, com `aria-describedby`; nunca só toast |
| Erro ou aviso que precisa de ação e deve permanecer | **Alerta inline** no topo do bloco (faixa tingida com ícone + texto) | Não some sozinho |
| Ação destrutiva ou irreversível | **AlertDialog** com o efeito descrito | Botão de confirmar diz o verbo ("Remover evento"), não "OK" |
| Formulário curto de criação/edição rápida | **Dialog** (drawer no mobile via `dialog-drawer`) | Sem `MultiStepForm` dentro |
| Formulário de página inteira | Página com `MultiStepForm` | Ver `admin.md` |
| Informação complementar | **Tooltip** | Nunca a única fonte de uma informação necessária; precisa abrir por teclado (foco) |
| Carregamento | **Skeleton** com a forma do conteúdo | Não use spinner solto em tela inteira |
| Lista/tabela sem dados | **EmptyState** com próxima ação | Diferencie "nada cadastrado" de "filtro sem resultado" |

## Dados e status

- Lista de banco → `DataTable` (com busca de texto + filtros de enum), ver `admin.md`.
- **Status** = `Badge` com texto + variante semântica (`success`, `warning`, `info`, `destructive`, `secondary`) (centralize o mapa status → variante/rótulo num módulo do domínio, não repita no componente); nunca ícone ou cor sozinhos.
- Número que a pessoa precisa agir em cima → `StatCard` que é link para a lista já filtrada.
- Preço/data/número: sempre por `lib/utils` (`formatarData` etc.), alinhado à direita em tabela e com `tabular-nums` em contador.

## Páginas públicas × Dashboard

- **Páginas públicas**: espaço, um CTA por tela; toque de 44px; sem "cara de painel".
- **Dashboard**: densidade alta aceita, `text-sm`, ações por ícone com tooltip, atalhos para o que exige atenção primeiro. Ver `admin.md`.
- Componente compartilhado (ex.: `Badge`, `Toaster`, `Button`) deve funcionar nos dois sem variante especial por área.
