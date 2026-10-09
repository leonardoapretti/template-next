# Área administrativa — regras específicas

Aplica-se a `/dashboard`, `/admin` e `/agenda` (equipe, papéis, agenda, e-mails e qualquer módulo administrativo futuro). Pressupõe as regras gerais (`geral.md`) já lidas. Aqui o objetivo é dar a quem opera o sistema uma ferramenta eficiente. Densidade de informação (tabelas, badges de status, filtros) é a norma — isso não dispensa hierarquia e espaço: a tela ainda precisa deixar clara a ação principal e agrupar controles.

## Os dois padrões de página (`components/pages/`)

Toda página nova usa um destes dois — não crie um layout do zero:

- **`PageShell`** (`page-shell.tsx`): listagem, formulário ou painel simples. Composto por `PageHeader` (ícone + título + descrição + ação opcional), `PageSection`, `PageGrid` (cards responsivos, `columns={2|3|4}`), `PageColumns`/`PageMain`/`PageAside` (duas colunas com barra lateral), `StatCard` (métrica), `PageCardLink` (card de navegação) e `EmptyState`. Exemplos: `/dashboard`, `/admin`, `/dashboard/empresa`.
- **`PaginaDetalhes`** (`components/pages/detalhes/`): página de um recurso específico, com cabeçalho rico (`DetalhesHeader` + `DetalhesHeaderIdentidade`/`Icone`/`Conteudo`/`Titulo`/`Stats`) e corpo em `DetalhesBody` → `DetalhesMain` + `DetalhesSidebar` (a sidebar vira accordion no mobile sozinha — não trate responsividade à mão). Conteúdo em `DetalhesSection`, `DetalhesField`, `DetalhesInfoCard`, `DetalhesListGroup`. Exemplos completos em `lib/fumadocs/content/docs/paginas.mdx`.

Seções consecutivas dentro de `DetalhesMain`/sidebar usam só `space-y-6`; não adicione `border-t`/`divide-y` entre elas. Ação destrutiva ou que muda estado do recurso fica numa seção "Ações" da sidebar: botões `variant="outline"` com `className="w-full justify-start"` e ícone antes do texto; ação que navega usa `Link` (via `render`), não `onClick` + `router.push`. Esconda o botão que o usuário não pode usar (`canUseFeature`, ver RBAC abaixo).

## Listagens sempre em `DataTable`

Todo artefato do banco em forma de lista usa `components/data-table/*`, nunca tabela HTML manual nem lista de cards ad-hoc. Mínimo obrigatório:

- Filtro de texto livre — `data-table-toolbar.tsx` / `data-table-global-filter.tsx`.
- Filtro por campo enum/categórico — `data-table-faceted-filter.tsx` (status, papel, etc.).
- Ordenação (`data-table-column-header.tsx`) e paginação (`data-table-pagination.tsx`).
- Coluna de ações à direita (ícone + `Tooltip`), não botões de texto competindo com a linha.
- `data-table-skeleton.tsx` durante o carregamento.

`data-table-select-column.tsx` (`createSelectColumn`) só quando existir ação em lote real; `data-table-export-button.tsx` só quando exportar fizer sentido.

**Listagem que pode crescer sem limite pagina no servidor.** `use-data-table.ts` já suporta (`manualPagination`/`manualSorting`/`manualFiltering` + `pageCount`, estado na URL via `nuqs`) e a tabela renderiza com `DataTableServer` (`data-table-server-side.tsx`):

- O service recebe `page`, `pageSize`, `sort`, filtros e faz `skip`/`take`/`orderBy`/`where`, devolvendo `{ dados, total }`. O `page.tsx` (Server Component) lê `searchParams`, repassa ao service e passa `pageCount = Math.ceil(total / pageSize)`.
- **`shallow: false` é obrigatório em `useDataTable` nesse modo**: com o default a URL muda via History API, mas o Server Component não re-renderiza e nada pagina.
- **Toda coluna com `enableColumnFilter` precisa de `id` explícito**, mesmo com `accessorKey`: as chaves de filtro da URL leem `column.id` do `ColumnDef` bruto; sem ele a chave vira string vazia e o filtro nunca sincroniza.
- Listagem pequena e limitada por natureza (papéis, membros de uma empresa) pode ficar client-side.
- Parse de `searchParams` (ordenação em JSON, enum de filtro) valida contra um conjunto fixo e cai num default seguro; se mais de uma página precisar do mesmo parse, centralize num helper em `lib/utils/` em vez de colar a função em cada `page.tsx`.

**Ação em lote:** coluna de seleção (`createSelectColumn`) só quando o usuário pode executar a ação (calcule a permissão no `page.tsx` e passe como prop); botões no `primaryAction` do `DataTableToolbar`, desabilitados com `Tooltip` explicando o motivo (não somem); `getRowId: (row) => row.id` e `table.resetRowSelection()` quando os dados da página mudam; ação destrutiva/em massa com `AlertDialog` mostrando a quantidade. A action valida com `z.array(...).max(N)`, exige a permissão e processa item a item (retorna o que deu certo e o que falhou).

## Formulários: sempre form/schema/actions

Toda escrita segue o padrão de três arquivos (ver `lib/fumadocs/content/docs/formularios.mdx` e a skill `nextjs-server-first`): `schema.ts` (zod, reusado no client e no server), `actions.ts` (`"use server"`, revalida com o mesmo schema, nunca confia só no client) e o componente client (`react-hook-form` + `zodResolver`, `FormErrorMessage` por campo).

- Criação simples (poucos campos): `Dialog` disparado por um botão no `PageHeader`. Edição de um campo dentro da linha de tabela: o próprio controle na célula, sem modal. Ação destrutiva (remover membro, excluir papel): sempre `AlertDialog` de confirmação.
- **Formulário de página inteira usa `components/multi-step-form/*` (`MultiStepForm`, `createStepSchema`, `MultiStepFormStep`), mesmo com uma etapa só** — UI, navegação e schema por etapa ficam consistentes, e o formulário já nasce pronto para crescer. **Formulário dentro de `Dialog`/`AlertDialog` nunca usa `MultiStepForm`** (duplicaria borda e barra de navegação): `react-hook-form` + `zodResolver` direto.
- `MultiStepForm` é uma exceção legítima de card (`rounded-lg border bg-card`, sem sombra/blur, padding denso). Em `orientation="vertical"`, o painel de navegação fica sticky e os dois painéis dividem uma única borda externa — não reintroduza radius nos painéis internos.
- **Campo cujo nome não é autoexplicativo** (SKU, CNPJ, "Peso (g)") ganha ícone de informação com `Tooltip` ao lado do `Label` (`InfoIcon`, `size-3.5 text-muted-foreground`, uma frase que explica pra que serve). Campo óbvio ("Nome", "E-mail") não precisa.
- **Campo monetário usa `CurrencyInput` (`components/currency-input.tsx`)**, nunca `<Input type="number">`: digitação em centavos com máscara, valor interno em `number` (reais), controlado via `Controller` do react-hook-form.
- **Busca assíncrona usa `AsyncCombobox` (`components/async-combobox.tsx`)**, nunca `<Select>` com a lista inteira pré-carregada. Ele resolve debounce, loading e limpeza; só precisa de um `fetchFn` que chama uma server action dedicada (query pequena, com `take`, já filtrada para o caso de uso). `Decimal` do Prisma não atravessa a fronteira server action → client: converta para `string`. Ao usar para *adicionar a uma lista* (não selecionar um valor), passe `value={null}` e force remount trocando a `key` a cada item adicionado.
- O valor salvo de uma relação é sempre o id (`clienteId`), nunca um nome digitado à mão.

## Feedback

Toda action que retorna `DataBaseResponse` vira `toast.success`/`toast.error` (sonner) no client — nunca falha silenciosa. Curto, imediato, contextual.

## Sidebar

Variantes prontas em `components/sidebar/`: `sidebar-usuario` (perfil padrão logado), `sidebar-admin` (`/admin`) e `sidebar-agenda` (`/agenda`), cada uma com `navMain` (+ itens exclusivos de admin) consumido por `NavMain`, e `bottomNavItems` para o `SidebarBottomNav` (mobile). Para adicionar rota ao menu, edite o array da variante certa — não crie quarta variante nem navegação paralela. Toda `url` vem de `routes.*` (skill `rotas`). Calcule permissões no Server Component (`layout.tsx` da sidebar, via `canUseFeature`) e repasse como prop; nunca chame `canUseFeature` dentro de client component da sidebar.

## RBAC é parte do design

Toda ação sensível é protegida em duas camadas: `assertCurrentUserCan("recurso:acao")` na action (a garantia real) e `canUseFeature(ctx, "recurso:acao")` escondendo o botão/seção num Server Component. Nunca só uma das duas. Permissão nova é registrada em `lib/access-control/permission-registry.ts` antes de usar (skill `controle-de-acesso`).

**Todo `layout.tsx` de seção do dashboard barra o acesso pela permissão específica do recurso (`canUseFeature(ctx, "recurso:read")` ou equivalente), nunca só "tem algum papel ativo".** "Tem papel" é verdadeiro até para papel com zero permissões marcadas; esconder o item do menu não é proteção, é UI — sem o guard no `layout.tsx`, a rota responde por URL direta.

## Tom visual

**Nem todo conteúdo precisa de `Card`.** O alvo é um produto SaaS denso e profissional (Linear, Vercel, Stripe Dashboard, GitHub, Notion como referência de linguagem, nunca cópia visual), não uma pilha de caixas. Antes de envolver algo em card, pergunte se tipografia, espaçamento e um `border-b` discreto já resolvem. `PageHeader`, `PageSection` e `DetalhesHeader`/`DetalhesSection` já seguem isso (título + descrição + `border-b`, sem caixa). Superfície própria (borda, `bg-card`, radius) só para entidade independente, bloco de ação isolado ou destaque real (`StatCard`, `DetalhesInfoCard`, `EmptyState`) — nunca para título de seção, lista, filtro, sidebar ou grupo de campos.

- Radius pequeno (`rounded-md`/`rounded-lg`; nunca `rounded-2xl`/`rounded-3xl` em container de página). Sombra rara. Espaçamento denso (`p-3`/`p-4`, `gap-3`/`gap-4`). Evite `Page > Card > Card > Card`: uma superfície contínua (`bg-background`), com seções separadas por hierarquia tipográfica e `border-b`/`divide-y`.
- **`components/data-table/*` segue a mesma lógica:** sem card externo envolvendo toolbar + tabela + paginação; a tabela tem borda própria (`rounded-lg border`), cabeçalho `bg-muted/40` sem hover, paginação como rodapé simples (`border-t pt-2.5`), toolbar solto na linha (painel de filtros no mobile com `border-t pt-3`). Estado vazio/skeleton novo segue o mesmo radius, sem `shadow-sm`/`backdrop-blur`.

## Checklist específico da área administrativa

Além do checklist geral (`geral.md`): a listagem usa `DataTable` com filtro de texto + filtro por enum? Listagem que cresce sem limite pagina no servidor (`DataTableServer`, `shallow: false`, colunas filtráveis com `id`)? O formulário valida com o mesmo schema no client e no server? Campo monetário usa `CurrencyInput`, busca assíncrona usa `AsyncCombobox`? Ação destrutiva pede `AlertDialog`? O `layout.tsx` da seção barra pela permissão específica do recurso? A permissão nova está em `permission-registry.ts` e checada nos dois lugares? O link do menu usa `routes.*`?
